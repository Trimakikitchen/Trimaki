import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,                        // max connections (Render free = limited RAM)
  idleTimeoutMillis: 30000,      // close idle connections after 30s
  connectionTimeoutMillis: 5000, // fail fast if can't connect in 5s
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = {
  query: async <T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> => {
    const start = Date.now();
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (env.NODE_ENV === 'development') {
      console.log(`Executed query: ${text.slice(0, 50)}... [${duration}ms]`);
    }
    return res;
  },
  transaction: async <T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
  pool,
};
