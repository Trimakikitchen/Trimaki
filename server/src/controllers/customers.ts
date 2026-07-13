import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../config/db';
import { ApiError } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';

export const customerSchemas = {
  createAddress: z.object({
    label: z.enum(['Home', 'Office', 'Other']),
    addressLine: z.string().min(5),
    apartment: z.string().optional(),
    landmark: z.string().optional(),
    city: z.string().default('Mumbai'),
    state: z.string().default('Maharashtra'),
    pincode: z.string().min(6).max(10),
    latitude: z.number(),
    longitude: z.number(),
    isDefault: z.boolean().default(false),
  }),
  createReview: z.object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    images: z.array(z.string().url()).default([]),
  }),
  createCoupon: z.object({
    code: z.string().min(3),
    description: z.string(),
    percentage: z.number().min(0).max(100),
    maxDiscount: z.number().positive(),
    expiryDate: z.string(), // Date string
    minimumOrder: z.number().nonnegative().default(0),
    active: z.boolean().default(true),
  }),
  createOffer: z.object({
    title: z.string().min(2),
    subtitle: z.string().optional(),
    bannerImage: z.string().url(),
    startDate: z.string(),
    endDate: z.string(),
    active: z.boolean().default(true),
  }),
};

export const customersController = {
  // Saved Addresses CRUD
  createAddress: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { label, addressLine, apartment, landmark, city, state, pincode, latitude, longitude, isDefault } = req.body;

      // If isDefault is true, unset default on other addresses
      if (isDefault) {
        await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
      }

      const result = await db.query(
        `INSERT INTO addresses (
          user_id, label, address_line, apartment, landmark, city, state, pincode,
          latitude, longitude, is_default
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [userId, label, addressLine, apartment, landmark, city, state, pincode, latitude, longitude, isDefault]
      );

      res.status(211).json({ status: 'success', data: result.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  getAddresses: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const result = await db.query('SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },

  deleteAddress: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = await db.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
      if (result.rows.length === 0) {
        throw new ApiError(404, 'Address not found.');
      }
      res.status(200).json({ status: 'success', message: 'Address deleted successfully.' });
    } catch (e) {
      next(e);
    }
  },

  // Reviews CRUD
  createReview: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { productId, rating, comment, images } = req.body;

      // Insert Review
      const reviewRes = await db.query(
        `INSERT INTO reviews (product_id, user_id, rating, comment, images)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [productId, userId, rating, comment, images]
      );

      // Dynamically recalculate product rating average
      const ratingRes = await db.query('SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = $1', [productId]);
      const avg = Number(ratingRes.rows[0].avg_rating).toFixed(2);
      await db.query('UPDATE products SET rating = $1 WHERE id = $2', [avg, productId]);

      res.status(201).json({ status: 'success', data: reviewRes.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  getProductReviews: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const result = await db.query(
        `SELECT r.*, u.full_name as user_name, u.profile_image as user_avatar
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.product_id = $1
         ORDER BY r.created_at DESC`,
        [productId]
      );
      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },

  // Wishlist CRUD
  addToWishlist: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { productId } = req.body;

      const result = await db.query(
        `INSERT INTO wishlists (user_id, product_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, product_id) DO NOTHING
         RETURNING *`,
        [userId, productId]
      );

      res.status(200).json({ status: 'success', message: 'Product added to wishlist.', data: result.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  getWishlist: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const result = await db.query(
        `SELECT w.id as wishlist_id, p.*
         FROM wishlists w
         JOIN products p ON w.product_id = p.id
         WHERE w.user_id = $1`,
        [userId]
      );
      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },

  removeFromWishlist: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params; // Wishlist ID

      const result = await db.query('DELETE FROM wishlists WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
      if (result.rows.length === 0) {
        throw new ApiError(404, 'Wishlist item not found.');
      }
      res.status(200).json({ status: 'success', message: 'Product removed from wishlist.' });
    } catch (e) {
      next(e);
    }
  },

  // Coupons CRUD
  createCoupon: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, description, percentage, maxDiscount, expiryDate, minimumOrder, active } = req.body;
      const result = await db.query(
        `INSERT INTO coupons (code, description, percentage, max_discount, expiry_date, minimum_order, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [code.toUpperCase(), description, percentage, maxDiscount, expiryDate, minimumOrder, active]
      );
      res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  getAllCoupons: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.query('SELECT * FROM coupons ORDER BY expiry_date DESC');
      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },

  // Offers CRUD
  createOffer: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, subtitle, bannerImage, startDate, endDate, active } = req.body;
      const result = await db.query(
        `INSERT INTO offers (title, subtitle, banner_image, start_date, end_date, active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [title, subtitle, bannerImage, startDate, endDate, active]
      );
      res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  getAllOffers: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.query('SELECT * FROM offers WHERE active = true AND end_date > NOW()');
      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },

  // Notifications
  getNotifications: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const result = await db.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [userId]
      );
      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },

  markAsRead: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await db.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [id, userId]);
      res.status(200).json({ status: 'success', message: 'Notification marked as read.' });
    } catch (e) {
      next(e);
    }
  },
};
export default customersController;
