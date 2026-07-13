import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';

export const analyticsController = {
  getDashboardStats: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Today's Revenue and Orders
      const todayStats = await db.query(`
        SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as count
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '1 day' AND payment_status = 'success'
      `);

      // 2. Active Orders counts by Status
      const orderStates = await db.query(`
        SELECT order_status, COUNT(*) as count
        FROM orders
        WHERE order_status NOT IN ('delivered', 'cancelled')
        GROUP BY order_status
      `);

      // 3. Low stock count
      const lowStock = await db.query(`
        SELECT COUNT(*) as count
        FROM inventory
        WHERE available_quantity < reorder_level
      `);

      // 4. Sales by category distribution
      const categorySales = await db.query(`
        SELECT c.name as category_name, SUM(oi.quantity * oi.price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.payment_status = 'success'
        GROUP BY c.name
      `);

      // 5. Monthly Sales chart aggregates
      const monthlySales = await db.query(`
        SELECT TO_CHAR(created_at, 'Mon YYYY') as month, SUM(total) as revenue, COUNT(*) as orders_count
        FROM orders
        WHERE payment_status = 'success' AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `);

      res.status(200).json({
        status: 'success',
        data: {
          today: {
            revenue: Number(todayStats.rows[0].revenue),
            ordersCount: Number(todayStats.rows[0].count),
          },
          activeStates: orderStates.rows.reduce((acc, row) => {
            acc[row.order_status] = Number(row.count);
            return acc;
          }, {} as Record<string, number>),
          lowStockCount: Number(lowStock.rows[0].count),
          categoryDistribution: categorySales.rows,
          monthlyTrends: monthlySales.rows,
        },
      });
    } catch (e) {
      next(e);
    }
  },
};
export default analyticsController;
