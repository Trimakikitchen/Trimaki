import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../config/db';
import { env } from '../config/env';
import { ApiError } from '../middleware/error';
import { emailService } from '../services/email';
import { AuthenticatedRequest } from '../middleware/auth';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY as any }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY as any }
  );

  return { accessToken, refreshToken };
};

export const authSchemas = {
  register: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
  forgotPassword: z.object({
    email: z.string().email(),
  }),
  resetPassword: z.object({
    email: z.string().email(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6),
  }),
  updateProfile: z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    profileImage: z.string().url().optional(),
  }),
};

// Store OTPs temporarily in memory for verification (in production, use Redis or database table)
const otpCache = new Map<string, { otp: string; expires: number }>();

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fullName, email, phone, password } = req.body;

      // 1. Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 OR phone = $2',
        [email, phone]
      );
      if (existingUser.rows.length > 0) {
        throw new ApiError(409, 'User with this email or phone already exists.');
      }

      // 2. Hash Password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // 3. Insert User
      const newUser = await db.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, 'customer')
         RETURNING id, full_name, email, phone, role, created_at`,
        [fullName, email, phone, passwordHash]
      );

      const user = newUser.rows[0];

      // 4. Generate Tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // 5. Send Welcome Email
      emailService.sendWelcomeEmail(user.email, user.full_name).catch((err) => {
        console.error('Failed to send welcome email', err);
      });

      res.status(210).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // 1. Find user
      const userResult = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      if (userResult.rows.length === 0) {
        throw new ApiError(401, 'Invalid email or password.');
      }

      const user = userResult.rows[0];

      // 2. Verify password
      if (!user.password_hash) {
        throw new ApiError(401, 'This account is linked with Google Sign-In. Please sign in using Google.');
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new ApiError(401, 'Invalid email or password.');
      }

      // 3. Tokens
      const { accessToken, refreshToken } = generateTokens(user);

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profileImage: user.profile_image,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  refreshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      if (!token) {
        throw new ApiError(400, 'Refresh token is required.');
      }

      jwt.verify(token, env.JWT_REFRESH_SECRET, (err: any, decoded: any) => {
        if (err) {
          throw new ApiError(403, 'Invalid or expired refresh token.');
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded);
        res.status(200).json({
          status: 'success',
          data: {
            accessToken,
            refreshToken: newRefreshToken,
          },
        });
      });
    } catch (e) {
      next(e);
    }
  },

  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (userResult.rows.length === 0) {
        throw new ApiError(404, 'No account registered with this email.');
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      otpCache.set(email, { otp, expires });

      // Send Reset Email
      await emailService.sendPasswordResetOTP(email, otp);

      res.status(200).json({
        status: 'success',
        message: 'Password reset OTP has been sent to your email.',
      });
    } catch (e) {
      next(e);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp, newPassword } = req.body;

      const cached = otpCache.get(email);
      if (!cached || cached.otp !== otp || Date.now() > cached.expires) {
        throw new ApiError(400, 'Invalid or expired verification OTP.');
      }

      // Clean cache
      otpCache.delete(email);

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);

      await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, email]);

      res.status(200).json({
        status: 'success',
        message: 'Password has been updated successfully. Please log in.',
      });
    } catch (e) {
      next(e);
    }
  },

  getProfile: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const userResult = await db.query(
        'SELECT id, full_name, email, phone, role, profile_image, created_at FROM users WHERE id = $1',
        [userId]
      );
      if (userResult.rows.length === 0) {
        throw new ApiError(404, 'User not found.');
      }

      res.status(200).json({
        status: 'success',
        data: userResult.rows[0],
      });
    } catch (e) {
      next(e);
    }
  },

  updateProfile: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { fullName, phone, profileImage } = req.body;

      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        throw new ApiError(404, 'User not found.');
      }

      const existing = userResult.rows[0];
      const newName = fullName ?? existing.full_name;
      const newPhone = phone ?? existing.phone;
      const newImg = profileImage ?? existing.profile_image;

      const updated = await db.query(
        `UPDATE users
         SET full_name = $1, phone = $2, profile_image = $3
         WHERE id = $4
         RETURNING id, full_name, email, phone, role, profile_image`,
        [newName, newPhone, newImg, userId]
      );

      res.status(200).json({
        status: 'success',
        data: updated.rows[0],
      });
    } catch (e) {
      next(e);
    }
  },

  googleSignIn: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        throw new ApiError(400, 'Google ID Token is required.');
      }

      // Verify Google ID Token
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new ApiError(400, 'Invalid Google ID Token payload.');
      }

      const { email, name, picture } = payload;

      // 1. Check if user already exists
      let user;
      const userResult = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
      } else {
        // 2. Create new user
        const newUser = await db.query(
          `INSERT INTO users (full_name, email, role, profile_image)
           VALUES ($1, $2, 'customer', $3)
           RETURNING id, full_name, email, role, created_at, profile_image`,
          [name || email.split('@')[0], email, picture || null]
        );
        user = newUser.rows[0];

        // Send Welcome Email
        emailService.sendWelcomeEmail(user.email, user.full_name).catch((err) => {
          console.error('Failed to send welcome email', err);
        });
      }

      // 3. Generate Tokens
      const { accessToken, refreshToken } = generateTokens(user);

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone || null,
            role: user.role,
            profileImage: user.profile_image,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (e) {
      next(e);
    }
  },
};
export default authController;
