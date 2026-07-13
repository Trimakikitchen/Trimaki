import { db } from '../config/db';

const migrate = async () => {
  console.log('🔄 Running database schema migration for Google Sign-In...');
  try {
    // Drop NOT NULL constraints from phone and password_hash
    await db.query(`
      ALTER TABLE users 
      ALTER COLUMN phone DROP NOT NULL,
      ALTER COLUMN password_hash DROP NOT NULL;
    `);
    console.log('✅ Users table successfully altered. "phone" and "password_hash" are now nullable.');
  } catch (e) {
    console.error('❌ Migration failed:', e);
  } finally {
    await db.pool.end();
  }
};

migrate();
