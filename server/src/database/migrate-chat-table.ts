import { db } from '../config/db';

const migrate = async () => {
  console.log('🔄 Running database schema migration for Chat Messages...');
  try {
    // Create chat_messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on user_id for faster retrieval
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
    `);

    console.log('✅ chat_messages table and indexes successfully verified/created.');
  } catch (e) {
    console.error('❌ Migration failed:', e);
  } finally {
    await db.pool.end();
  }
};

migrate();
