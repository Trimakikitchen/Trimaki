import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../config/db';
import { ApiError } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';
import { mapsService } from '../services/maps';
import { razorpayService } from '../services/razorpay';
import { emailService } from '../services/email';
import { smsService } from '../services/sms';

export const orderSchemas = {
  createOrder: z.object({
    addressId: z.string().uuid(),
    paymentMethod: z.enum(['upi', 'card', 'net_banking', 'wallet', 'cod']),
    couponCode: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    ).min(1, 'Cart cannot be empty'),
  }),
  verifyPayment: z.object({
    orderId: z.string().uuid(),
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    signature: z.string(),
  }),
  updateStatus: z.object({
    status: z.enum(['accepted', 'preparing', 'packed', 'out_for_delivery', 'delivered', 'cancelled']),
    riderId: z.string().uuid().optional(),
  }),
  verifyOTP: z.object({
    otp: z.string().length(4, 'OTP must be 4 digits'),
  }),
};

/**
 * Deduct inventory based on recipes mapped to items.
 * Generates low stock warning alerts if threshold crossed.
 */
const deductInventoryForOrder = async (orderId: string, client: any) => {
  // 1. Get all items for the order and their associated ingredients recipes
  const recipeItems = await client.query(
    `SELECT oi.quantity as order_qty, r.inventory_id, r.quantity_required, i.ingredient_name, i.available_quantity, i.minimum_quantity, i.reorder_level
     FROM order_items oi
     JOIN product_recipes r ON oi.product_id = r.product_id
     JOIN inventory i ON r.inventory_id = i.id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  for (const item of recipeItems.rows) {
    const deduction = Number(item.order_qty) * Number(item.quantity_required);
    const newQty = Math.max(0, Number(item.available_quantity) - deduction);

    // Update stock level
    await client.query(
      `UPDATE inventory
       SET available_quantity = $1
       WHERE id = $2`,
      [newQty, item.inventory_id]
    );

    // Write audit log
    await client.query(
      `INSERT INTO inventory_logs (inventory_id, quantity_changed, action, reason, timestamp)
       VALUES ($1, $2, 'deduction', $3, NOW())`,
      [item.inventory_id, deduction, `Auto-deducted for order #${orderId}`]
    );

    // Check if stock crosses reorder level -> generate low stock alert notification
    if (newQty < Number(item.reorder_level)) {
      console.warn(`⚠️ LOW STOCK WARNING: ${item.ingredient_name} is running low (Current: ${newQty} ${item.unit})`);
      // Insert notifications for administrators
      await client.query(
        `INSERT INTO notifications (user_id, title, message)
         SELECT id, 'Low Stock Alert', $1 FROM users WHERE role = 'admin'`,
        [`Ingredient "${item.ingredient_name}" is below minimum reorder level. Current Stock: ${newQty.toFixed(2)}.`]
      );
    }
  }
};

export const ordersController = {
  createOrder: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { addressId, paymentMethod, couponCode, notes, items } = req.body;

      // 1. Get customer and address info to calculate distance fees
      const userRes = await db.query('SELECT full_name, email, phone FROM users WHERE id = $1', [userId]);
      const customer = userRes.rows[0];

      const addressRes = await db.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
      if (addressRes.rows.length === 0) {
        throw new ApiError(404, 'Address not found.');
      }
      const address = addressRes.rows[0];

      // 2. Validate Google Maps coordinates and delivery boundaries
      const locationCheck = mapsService.validateDeliveryRadius(
        Number(address.latitude),
        Number(address.longitude)
      );
      if (!locationCheck.allowed) {
        throw new ApiError(400, `Address is outside our 8km operational radius. Distance: ${locationCheck.distance.toFixed(2)}km`);
      }

      // 3. Compile pricing of items
      let subtotal = 0;
      const verifiedItems: any[] = [];
      const itemSummaries: string[] = [];

      for (const item of items) {
        const prodRes = await db.query('SELECT name, price, discounted_price FROM products WHERE id = $1 AND active = true', [item.productId]);
        if (prodRes.rows.length === 0) {
          throw new ApiError(404, `Product ID ${item.productId} not found or inactive.`);
        }
        const product = prodRes.rows[0];
        const price = product.discounted_price ? Number(product.discounted_price) : Number(product.price);
        subtotal += price * item.quantity;
        verifiedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price,
        });
        itemSummaries.push(`${product.name} (x${item.quantity})`);
      }

      // 4. Calculate delivery fee and GST tax (5%)
      const deliveryFee = mapsService.calculateDeliveryFee(locationCheck.distance, subtotal);
      const tax = subtotal * 0.05;

      // 5. Check coupon validation
      let discount = 0;
      let couponId: string | null = null;
      if (couponCode) {
        const couponRes = await db.query('SELECT * FROM coupons WHERE code = $1 AND active = true AND expiry_date > NOW()', [couponCode]);
        if (couponRes.rows.length > 0) {
          const coupon = couponRes.rows[0];
          if (subtotal >= Number(coupon.minimum_order)) {
            discount = Math.min((subtotal * Number(coupon.percentage)) / 100, Number(coupon.max_discount));
            couponId = coupon.id;
          }
        }
      }

      const total = Math.max(0, subtotal + deliveryFee + tax - discount);
      const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit verification OTP

      // 6. Create order records inside database transaction
      const order = await db.transaction(async (client) => {
        const insertOrderRes = await client.query(
          `INSERT INTO orders (
            user_id, address_id, subtotal, delivery_fee, discount, tax, total, coupon_id,
            payment_status, payment_method, order_status, otp, notes
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING *`,
          [
            userId,
            addressId,
            subtotal,
            deliveryFee,
            discount,
            tax,
            total,
            couponId,
            paymentMethod === 'cod' ? 'pending' : 'pending',
            paymentMethod,
            paymentMethod === 'cod' ? 'received' : 'received', // Wait for payment confirmation if online
            otp,
            notes,
          ]
        );

        const newOrder = insertOrderRes.rows[0];

        // Insert order items
        for (const vItem of verifiedItems) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, price)
             VALUES ($1, $2, $3, $4)`,
            [newOrder.id, vItem.productId, vItem.quantity, vItem.price]
          );
        }

        // Deduct inventory immediately if payment method is Cash on Delivery
        if (paymentMethod === 'cod') {
          await deductInventoryForOrder(newOrder.id, client);
        }

        return newOrder;
      });

      // 7. Handle Razorpay order creation for online payments
      let paymentPayload: any = null;
      if (paymentMethod !== 'cod') {
        const rzpOrder = await razorpayService.createOrder(total, order.id);
        paymentPayload = {
          razorpayOrderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
        };

        // Insert pending payment log
        await db.query(
          `INSERT INTO payments (order_id, razorpay_order_id, payment_status, amount, method)
           VALUES ($1, $2, 'pending', $3, $4)`,
          [order.id, rzpOrder.id, total, paymentMethod]
        );
      }

      // 8. Notifications & Alerts
      emailService.sendOrderConfirmation(customer.email, customer.full_name, order.id, itemSummaries.join(', '), total).catch((err) => {
        console.error('Order email notification failed', err);
      });

      smsService.sendSMS(customer.phone, `Your TRIMAKI order has been placed! Total amount: ₹${total.toFixed(2)}.`).catch((err) => {
        console.error('Order SMS notification failed', err);
      });

      res.status(201).json({
        status: 'success',
        data: {
          order,
          payment: paymentPayload,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  verifyPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId, razorpayOrderId, razorpayPaymentId, signature } = req.body;

      const isValid = razorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, signature);
      if (!isValid) {
        throw new ApiError(400, 'Invalid payment signature. Transaction compromised.');
      }

      // Perform payment status updates and inventory deduction in transaction
      await db.transaction(async (client) => {
        // Update order status
        await client.query(
          `UPDATE orders
           SET payment_status = 'success', order_status = 'accepted'
           WHERE id = $1`,
          [orderId]
        );

        // Update payment record
        await client.query(
          `UPDATE payments
           SET payment_status = 'success', razorpay_payment_id = $1
           WHERE razorpay_order_id = $2`,
          [razorpayPaymentId, razorpayOrderId]
        );

        // Deduct quantities automatically
        await deductInventoryForOrder(orderId, client);
      });

      // Send status SMS
      const orderRes = await db.query(
        'SELECT o.*, u.phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1',
        [orderId]
      );
      if (orderRes.rows.length > 0) {
        const order = orderRes.rows[0];
        smsService.sendOrderUpdate(order.phone, orderId, 'accepted').catch((err) => {
          console.error('Twilio KDS accept SMS failed', err);
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Payment verified and order accepted successfully.',
      });
    } catch (e) {
      next(e);
    }
  },

  getAllOrders: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;

      let rows: any[] = [];
      if (role === 'admin' || role === 'kitchen') {
        // Admins see all orders
        const result = await db.query(
          `SELECT o.*, u.full_name as customer_name, u.phone as customer_phone, a.address_line, a.apartment, a.pincode
           FROM orders o
           JOIN users u ON o.user_id = u.id
           LEFT JOIN addresses a ON o.address_id = a.id
           ORDER BY o.created_at DESC`
        );
        rows = result.rows;
      } else {
        // Customers see only their orders
        const result = await db.query(
          `SELECT o.*, a.address_line, a.apartment, a.pincode
           FROM orders o
           LEFT JOIN addresses a ON o.address_id = a.id
           WHERE o.user_id = $1
           ORDER BY o.created_at DESC`,
          [userId]
        );
        rows = result.rows;
      }

      // If there are orders, fetch all items in one batch query and append them
      if (rows.length > 0) {
        const orderIds = rows.map((o) => o.id);
        const itemsResult = await db.query(
          `SELECT oi.*, p.name as product_name
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ANY($1)`,
          [orderIds]
        );

        rows.forEach((order) => {
          order.items = itemsResult.rows
            .filter((item) => item.order_id === order.id)
            .map((item) => ({
              id: item.id,
              productId: item.product_id,
              quantity: item.quantity,
              price: item.price,
              productName: item.product_name,
            }));
        });
      }

      res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
      next(e);
    }
  },

  getOrderById: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const role = req.user!.role;

      const orderResult = await db.query(
        `SELECT o.*, u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone,
                a.address_line, a.apartment, a.landmark, a.city, a.pincode, a.latitude, a.longitude
         FROM orders o
         JOIN users u ON o.user_id = u.id
         LEFT JOIN addresses a ON o.address_id = a.id
         WHERE o.id = $1`,
        [id]
      );

      if (orderResult.rows.length === 0) {
        throw new ApiError(404, 'Order not found.');
      }

      const order = orderResult.rows[0];
      if (role === 'customer' && order.user_id !== userId) {
        throw new ApiError(403, 'Forbidden. You do not own this order.');
      }

      // Fetch items
      const items = await db.query(
        `SELECT oi.*, p.name as product_name, p.image as product_image
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [id]
      );

      res.status(200).json({
        status: 'success',
        data: {
          ...order,
          items: items.rows,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  updateStatus: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const orderResult = await db.query(
        'SELECT o.*, u.phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1',
        [id]
      );
      if (orderResult.rows.length === 0) {
        throw new ApiError(404, 'Order not found.');
      }
      const order = orderResult.rows[0];

      if (status === 'cancelled') {
        const cancellationMsg = reason ? `Reason: ${reason}` : 'No reason provided.';

        // 1. Update order status and save cancellation reason
        await db.query(
          'UPDATE orders SET order_status = $1, cancellation_reason = $2 WHERE id = $3',
          [status, reason || 'No reason provided.', id]
        );

        // 2. Insert notification for the user
        await db.query(
          `INSERT INTO notifications (user_id, title, message)
           VALUES ($1, \'Order Cancelled\', $2)`,
          [
            order.user_id,
            `Your order #${id.slice(0, 8)} has been cancelled. ${cancellationMsg}`,
          ]
        );
      } else {
        await db.query('UPDATE orders SET order_status = $1 WHERE id = $2', [status, id]);
      }

      // Trigger status notifications via Twilio SMS
      smsService.sendOrderUpdate(order.phone, id, status).catch((err) => {
        console.error('SMS notification state update failed', err);
      });

      // Special notification trigger on rider dispatch
      if (status === 'out_for_delivery') {
        smsService.sendDeliveryOTP(order.phone, order.otp).catch((err) => {
          console.error('OTP SMS delivery failed', err);
        });
      }

      res.status(200).json({
        status: 'success',
        message: `Order status updated to ${status}.`,
      });
    } catch (e) {
      next(e);
    }
  },

  verifyOTP: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { otp } = req.body;

      const orderResult = await db.query('SELECT otp, order_status FROM orders WHERE id = $1', [id]);
      if (orderResult.rows.length === 0) {
        throw new ApiError(404, 'Order not found.');
      }

      const order = orderResult.rows[0];
      if (order.otp !== otp) {
        throw new ApiError(400, 'Invalid verification OTP code. Cannot complete handover.');
      }

      // Mark order as delivered and success
      await db.query(
        `UPDATE orders
         SET order_status = 'delivered', payment_status = 'success'
         WHERE id = $1`,
        [id]
      );

      res.status(200).json({
        status: 'success',
        message: 'OTP verified successfully. Order marked as Delivered.',
      });
    } catch (e) {
      next(e);
    }
  },
};
export default ordersController;
