import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { db } from './db';

let io: SocketServer | null = null;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin === env.CLIENT_URL ||
          origin === 'http://localhost:5173' ||
          /^https:\/\/trimaki[\w-]*\.vercel\.app$/.test(origin)
        ) {
          return callback(null, true);
        }
        callback(new Error(`Socket CORS: ${origin} not allowed`));
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── JWT Authentication Middleware ────────────────────────────────────────
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
        role: string;
      };
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection Handler ───────────────────────────────────────────────────
  io.on('connection', (socket: AuthenticatedSocket) => {
    const { userId, userRole } = socket;
    console.log(`[WS] Connected: ${userId} (${userRole}) — socket ${socket.id}`);

    // ── Admin: joins global admin room to receive all delivery events ──────
    if (userRole === 'admin') {
      socket.join('admin');
    }

    // ── Customer: subscribe to a specific order's live updates ────────────
    socket.on('join:order', async (orderId: string) => {
      if (!orderId || typeof orderId !== 'string') return;
      // Verify customer owns this order (or is admin)
      if (userRole === 'admin') {
        socket.join(`order:${orderId}`);
        return;
      }
      try {
        const res = await db.query(
          'SELECT id FROM orders WHERE id = $1 AND user_id = $2',
          [orderId, userId]
        );
        if (res.rows.length > 0) {
          socket.join(`order:${orderId}`);
          console.log(`[WS] Customer ${userId} joined room order:${orderId}`);
        }
      } catch (err) {
        console.error('[WS] join:order error', err);
      }
    });

    // ── Delivery partner: join their own room ─────────────────────────────
    if (userRole === 'delivery' || userRole === 'admin') {
      socket.join(`delivery:${userId}`);
    }

    // ── Delivery partner: push GPS location ──────────────────────────────
    socket.on(
      'location:update',
      async (data: { orderId: string; lat: number; lng: number }) => {
        if (!data?.orderId || data.lat == null || data.lng == null) return;
        if (userRole !== 'delivery' && userRole !== 'admin') return;

        // Verify the order is assigned to this delivery partner
        try {
          const orderRes = await db.query(
            `SELECT o.id, u.full_name as partner_name
             FROM orders o
             JOIN users u ON u.id = o.delivery_partner_id
             WHERE o.id = $1 AND o.delivery_partner_id = $2
               AND o.order_status NOT IN ('delivered','cancelled')`,
            [data.orderId, userId]
          );
          if (orderRes.rows.length === 0) return;

          // Save to DB (persistent last-known location)
          await db.query(
            'UPDATE orders SET delivery_lat = $1, delivery_lng = $2 WHERE id = $3',
            [data.lat, data.lng, data.orderId]
          );

          const payload = {
            orderId: data.orderId,
            lat: data.lat,
            lng: data.lng,
            partnerName: orderRes.rows[0].partner_name,
          };

          // Broadcast to customer's order room and admin room
          io!.to(`order:${data.orderId}`).emit('location:changed', payload);
          io!.to('admin').emit('location:changed', payload);
        } catch (err) {
          console.error('[WS] location:update error', err);
        }
      }
    );

    // ── Delivery partner: update order status ─────────────────────────────
    socket.on(
      'status:update',
      async (data: { orderId: string; status: string }) => {
        if (!data?.orderId || !data.status) return;
        if (userRole !== 'delivery' && userRole !== 'admin') return;

        const allowed = ['in_transit', 'near_doorstep', 'delivered'];
        if (!allowed.includes(data.status)) return;

        try {
          const orderRes = await db.query(
            'SELECT id, user_id, delivery_partner_id FROM orders WHERE id = $1',
            [data.orderId]
          );
          if (orderRes.rows.length === 0) return;
          const order = orderRes.rows[0];

          // Only assigned partner (or admin) can update
          if (userRole !== 'admin' && order.delivery_partner_id !== userId) return;

          await db.query(
            'UPDATE orders SET order_status = $1 WHERE id = $2',
            [data.status, data.orderId]
          );

          // In-app notification to customer
          const messages: Record<string, { title: string; message: string }> = {
            in_transit: { title: '🛵 Order In Transit', message: 'Your TRIMAKI order is on its way!' },
            near_doorstep: { title: '📍 Almost There!', message: 'Your delivery partner is just around the corner!' },
            delivered: { title: '✅ Order Delivered', message: 'Your TRIMAKI order has been delivered. Enjoy!' },
          };
          const notif = messages[data.status];
          if (notif) {
            await db.query(
              'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
              [order.user_id, notif.title, `${notif.message} (Order #${data.orderId.slice(0, 8)})`]
            );
          }

          const payload = { orderId: data.orderId, status: data.status };
          io!.to(`order:${data.orderId}`).emit('status:changed', payload);
          io!.to('admin').emit('status:changed', payload);
        } catch (err) {
          console.error('[WS] status:update error', err);
        }
      }
    );

    socket.on('disconnect', (reason) => {
      console.log(`[WS] Disconnected: ${userId} — ${reason}`);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
};

/** Get the active Socket.io instance (after initSocket is called) */
export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket() first.');
  return io;
};
