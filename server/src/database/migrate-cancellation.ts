import { db } from '../config/db';

const migrate = async () => {
  console.log('🔄 Running database schema migration for Order Cancellation Reason...');
  try {
    await db.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
    `);
    console.log('✅ Added cancellation_reason column to orders table successfully.');
  } catch (e) {
    console.error('❌ Migration failed:', e);
  } finally {
    await db.pool.end();
  }
};

migrate();
