import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import apiRouter from './routes';
import { errorHandler, ApiError } from './middleware/error';
import { db } from './config/db';

const app = express();

// Trust Render's reverse proxy so rate-limiter uses real client IPs
// Render IP ranges: 74.220.48.0/24 and 74.220.56.0/24
app.set('trust proxy', 1);

// Helper to convert snake_case to camelCase
const toCamel = (str: string) => {
  return str.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

const keysToCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v));
  } else if (
    obj !== null &&
    obj !== undefined &&
    (obj.constructor === Object || (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof RegExp)))
  ) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toCamel(key)]: keysToCamel(obj[key]),
      }),
      {}
    );
  }
  return obj;
};

// Middleware to intercept JSON responses and map keys to camelCase for the frontend
app.use((_req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (body && typeof body === 'object') {
      body = keysToCamel(body);
    }
    return originalJson.call(this, body);
  };
  next();
});

// 1. Security Headers
app.use(helmet());

// 2. CORS setup
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow configured origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any Vercel preview deployment for the trimaki project
      if (/^https:\/\/trimaki[\w-]*\.vercel\.app$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// 3. Request Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'development' ? 10000 : 100, // Limit each IP to 100 requests per window (10000 in dev)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use('/api/', limiter);

// 5. Compression
app.use(compression());

// 6. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    env: env.NODE_ENV,
  });
});

// Diagnostic DB Route
app.get('/api/debug-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'success',
      data: result.rows,
      env: env.NODE_ENV,
      dbUrlDefined: !!env.DATABASE_URL,
      dbUrlPrefix: env.DATABASE_URL?.substring(0, 40) + '...',
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      env: env.NODE_ENV,
      dbUrlDefined: !!env.DATABASE_URL,
      dbUrlPrefix: env.DATABASE_URL?.substring(0, 40) + '...',
    });
  }
});

// API Routes
app.use('/api', apiRouter);

// 404 handler
app.use((req, _res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.path} not found`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start server (only if not running on Vercel)
if (!process.env.VERCEL) {
  const PORT = env.PORT;
  app.listen(PORT, () => {
    console.log(`🚀 TRIMAKI Backend Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
}

export default app;
