import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../config/db';
import { ApiError } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';

export const deliverySchemas = {
  updateStatus: z.object({
    status: z.enum(['in_transit', 'near_doorstep', 'delivered']),
  }),
  updateLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
};

// Status labels sent as push notifications to the customer
const statusMessages: Record<string, { title: string; message: string }> = {
  in_transit: {
    title: '🛵 Order In Transit',
    message: 'Your TRIMAKI order is on its way! Our delivery partner has picked up your order.',
  },
  near_doorstep: {
    title: '📍 Almost There!',
    message: 'Your TRIMAKI order is just around the corner. Please be ready to receive it.',
  },
  delivered: {
    title: '✅ Order Delivered',
    message: 'Your TRIMAKI order has been delivered. Enjoy your meal! Please leave a review.',
  },
};

export const deliveryController = {
  /**
   * GET /api/delivery/orders
   * Delivery partner sees ONLY their currently active assigned orders.
   * Never returns delivered or cancelled orders (privacy).
   */
  getMyActiveOrders: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const partnerId = req.user!.id;

      const result = await db.query(
        `SELECT
           o.id,
           o.order_status,
           o.total,
           o.delivery_lat,
           o.delivery_lng,
           o.created_at,
           -- Only expose first name + last initial for customer privacy
           SPLIT_PART(u.full_name, ' ', 1) || ' ' || LEFT(SPLIT_PART(u.full_name, ' ', 2), 1) || '.' AS customer_display,
           a.address_line,
           a.apartment,
           a.landmark,
           a.city,
           a.pincode,
           a.latitude  AS dest_lat,
           a.longitude AS dest_lng
         FROM orders o
         JOIN users u ON o.user_id = u.id
         LEFT JOIN addresses a ON o.address_id = a.id
         WHERE o.delivery_partner_id = $1
           AND o.order_status NOT IN ('delivered', 'cancelled')
         ORDER BY o.created_at DESC`,
        [partnerId]
      );

      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },

  /**
   * POST /api/delivery/orders/:id/status
   * Delivery partner updates status: in_transit | near_doorstep | delivered
   */
  updateDeliveryStatus: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const partnerId = req.user!.id;

      // Verify this order is actually assigned to this delivery partner
      const orderRes = await db.query(
        'SELECT o.id, o.user_id, o.order_status, o.delivery_partner_id FROM orders o WHERE o.id = $1',
        [id]
      );
      if (orderRes.rows.length === 0) throw new ApiError(404, 'Order not found.');

      const order = orderRes.rows[0];
      if (order.delivery_partner_id !== partnerId) {
        throw new ApiError(403, 'This order is not assigned to you.');
      }
      if (['delivered', 'cancelled'].includes(order.order_status)) {
        throw new ApiError(400, `Order is already ${order.order_status}.`);
      }

      // Update order status
      await db.query('UPDATE orders SET order_status = $1 WHERE id = $2', [status, id]);

      // Push in-app notification to the customer
      const notif = statusMessages[status];
      if (notif) {
        await db.query(
          'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
          [order.user_id, notif.title, `${notif.message} (Order #${id.slice(0, 8)})`]
        );
      }

      res.status(200).json({ status: 'success', message: `Status updated to ${status}.` });
    } catch (e) {
      next(e);
    }
  },

  /**
   * POST /api/delivery/orders/:id/location
   * Delivery partner pushes their current GPS coordinates.
   * Stored on the active order row for polling by customer/admin.
   */
  updateLocation: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { lat, lng } = req.body;
      const partnerId = req.user!.id;

      const orderRes = await db.query(
        'SELECT id, delivery_partner_id, order_status FROM orders WHERE id = $1',
        [id]
      );
      if (orderRes.rows.length === 0) throw new ApiError(404, 'Order not found.');

      const order = orderRes.rows[0];
      if (order.delivery_partner_id !== partnerId) {
        throw new ApiError(403, 'This order is not assigned to you.');
      }
      if (['delivered', 'cancelled'].includes(order.order_status)) {
        throw new ApiError(400, 'Cannot update location for a completed order.');
      }

      await db.query(
        'UPDATE orders SET delivery_lat = $1, delivery_lng = $2 WHERE id = $3',
        [lat, lng, id]
      );

      res.status(200).json({ status: 'success' });
    } catch (e) {
      next(e);
    }
  },

  /**
   * GET /api/delivery/orders/:id/location
   * Returns the delivery partner's last known GPS location.
   * Accessible by: assigned delivery partner, order's customer, any admin.
   */
  getOrderLocation: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const requesterId = req.user!.id;
      const requesterRole = req.user!.role;

      const orderRes = await db.query(
        `SELECT o.id, o.user_id, o.delivery_partner_id, o.delivery_lat, o.delivery_lng,
                o.order_status, a.latitude as dest_lat, a.longitude as dest_lng,
                u.full_name as partner_name
         FROM orders o
         LEFT JOIN addresses a ON o.address_id = a.id
         LEFT JOIN users u ON o.delivery_partner_id = u.id
         WHERE o.id = $1`,
        [id]
      );
      if (orderRes.rows.length === 0) throw new ApiError(404, 'Order not found.');

      const order = orderRes.rows[0];

      // Access control: only the customer who owns it, the assigned delivery partner, or admin
      const isOwner = order.user_id === requesterId;
      const isAssignedPartner = order.delivery_partner_id === requesterId;
      const isAdmin = requesterRole === 'admin';

      if (!isOwner && !isAssignedPartner && !isAdmin) {
        throw new ApiError(403, 'Access denied.');
      }

      res.status(200).json({
        status: 'success',
        data: {
          orderId: order.id,
          orderStatus: order.order_status,
          partnerName: order.partner_name,
          deliveryLat: order.delivery_lat ? parseFloat(order.delivery_lat) : null,
          deliveryLng: order.delivery_lng ? parseFloat(order.delivery_lng) : null,
          destLat: order.dest_lat ? parseFloat(order.dest_lat) : null,
          destLng: order.dest_lng ? parseFloat(order.dest_lng) : null,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  /**
   * POST /api/delivery/orders/:id/assign
   * Admin assigns a delivery partner (user with role='delivery') to an order.
   */
  assignPartner: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { deliveryPartnerId } = req.body;

      // Verify the partner exists and has delivery role
      const partnerRes = await db.query(
        "SELECT id, full_name, role FROM users WHERE id = $1 AND role = 'delivery'",
        [deliveryPartnerId]
      );
      if (partnerRes.rows.length === 0) {
        throw new ApiError(404, 'Delivery partner not found or does not have delivery role.');
      }

      const orderRes = await db.query('SELECT id, order_status FROM orders WHERE id = $1', [id]);
      if (orderRes.rows.length === 0) throw new ApiError(404, 'Order not found.');

      if (!['packed', 'out_for_delivery'].includes(orderRes.rows[0].order_status)) {
        throw new ApiError(400, 'Order must be packed before assigning a delivery partner.');
      }

      await db.query(
        "UPDATE orders SET delivery_partner_id = $1, order_status = 'out_for_delivery' WHERE id = $2",
        [deliveryPartnerId, id]
      );

      // Notify the customer
      const fullOrder = await db.query(
        'SELECT user_id FROM orders WHERE id = $1', [id]
      );
      await db.query(
        'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
        [
          fullOrder.rows[0].user_id,
          '🚀 Order Dispatched!',
          `Your order #${id.slice(0, 8)} has been dispatched and is heading your way with ${partnerRes.rows[0].full_name}.`,
        ]
      );

      res.status(200).json({
        status: 'success',
        message: `Order assigned to ${partnerRes.rows[0].full_name}.`,
      });
    } catch (e) {
      next(e);
    }
  },

  /**
   * GET /api/delivery/partners
   * Admin fetches all users with role='delivery' and their active assignment count.
   */
  getDeliveryPartners: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.query(
        `SELECT u.id, u.full_name, u.email, u.phone, u.created_at,
                COUNT(o.id) FILTER (WHERE o.order_status NOT IN ('delivered','cancelled')) AS active_orders
         FROM users u
         LEFT JOIN orders o ON o.delivery_partner_id = u.id
         WHERE u.role = 'delivery'
         GROUP BY u.id
         ORDER BY u.full_name ASC`
      );
      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },
};

export default deliveryController;
