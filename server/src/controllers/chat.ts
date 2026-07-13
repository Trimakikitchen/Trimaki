import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../config/db';
import { ApiError } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';

export const chatSchemas = {
  sendMessage: z.object({
    message: z.string().min(1, 'Message cannot be empty'),
    userId: z.string().uuid().optional(),
  }),
};

export const chatController = {
  getConversation: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const currentUser = req.user!;
      let targetUserId = currentUser.id;

      // Admin can view any user's conversation by providing a userId query param
      if (currentUser.role === 'admin' && req.query.userId) {
        targetUserId = req.query.userId as string;
      }

      const messages = await db.query(
        `SELECT cm.id, cm.user_id, cm.sender_id, cm.message, cm.created_at, u.full_name as sender_name
         FROM chat_messages cm
         JOIN users u ON cm.sender_id = u.id
         WHERE cm.user_id = $1
         ORDER BY cm.created_at ASC`,
        [targetUserId]
      );

      res.status(200).json({
        status: 'success',
        data: messages.rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          senderId: row.sender_id,
          message: row.message,
          createdAt: row.created_at,
          senderName: row.sender_name,
        })),
      });
    } catch (e) {
      next(e);
    }
  },

  sendMessage: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const currentUser = req.user!;
      const { message, userId } = req.body;

      let conversationUserId = currentUser.id;

      // Admin requires a target user ID to send a reply in a specific conversation
      if (currentUser.role === 'admin') {
        if (!userId) {
          throw new ApiError(400, 'userId is required for admin replies.');
        }
        conversationUserId = userId;
      }

      const newMessage = await db.query(
        `INSERT INTO chat_messages (user_id, sender_id, message)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, sender_id, message, created_at`,
        [conversationUserId, currentUser.id, message]
      );

      const result = newMessage.rows[0];

      res.status(201).json({
        status: 'success',
        data: {
          id: result.id,
          userId: result.user_id,
          senderId: result.sender_id,
          message: result.message,
          createdAt: result.created_at,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  getConversations: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const conversations = await db.query(
        `SELECT * FROM (
           SELECT DISTINCT ON (cm.user_id) 
             cm.user_id, 
             u.full_name as user_name, 
             u.email as user_email, 
             cm.message as last_message, 
             cm.created_at as last_message_at
           FROM chat_messages cm
           JOIN users u ON cm.user_id = u.id
           ORDER BY cm.user_id, cm.created_at DESC
         ) sub
         ORDER BY last_message_at DESC`
      );

      res.status(200).json({
        status: 'success',
        data: conversations.rows.map((row) => ({
          userId: row.user_id,
          userName: row.user_name,
          userEmail: row.user_email,
          lastMessage: row.last_message,
          lastMessageAt: row.last_message_at,
        })),
      });
    } catch (e) {
      next(e);
    }
  },
};
export default chatController;
