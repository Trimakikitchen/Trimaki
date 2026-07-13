import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../config/db';
import { ApiError } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';

export const inventorySchemas = {
  createIngredient: z.object({
    ingredientName: z.string().min(2),
    availableQuantity: z.number().nonnegative(),
    unit: z.string().min(1),
    minimumQuantity: z.number().nonnegative().default(0),
    reorderLevel: z.number().nonnegative().default(0),
    supplier: z.string().optional(),
  }),
  adjustStock: z.object({
    quantityChanged: z.number(),
    action: z.enum(['addition', 'deduction', 'correction']),
    reason: z.string().min(3),
  }),
  createRecipe: z.object({
    inventoryId: z.string().uuid(),
    quantityRequired: z.number().positive(),
    unit: z.string().min(1),
    costPerUnit: z.number().nonnegative().default(0.00),
  }),
};

export const inventoryController = {
  // Ingredients CRUD
  createIngredient: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ingredientName, availableQuantity, unit, minimumQuantity, reorderLevel, supplier } = req.body;

      const existing = await db.query('SELECT id FROM inventory WHERE ingredient_name = $1', [ingredientName]);
      if (existing.rows.length > 0) {
        throw new ApiError(409, 'Ingredient with this name already exists.');
      }

      const result = await db.query(
        `INSERT INTO inventory (ingredient_name, available_quantity, unit, minimum_quantity, reorder_level, supplier)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [ingredientName, availableQuantity, unit, minimumQuantity, reorderLevel, supplier]
      );

      res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  getAllIngredients: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.query('SELECT * FROM inventory ORDER BY ingredient_name ASC');
      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },

  adjustStock: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // Ingredient ID
      const { quantityChanged, action, reason } = req.body;
      const adminId = req.user!.id;

      const ingredientResult = await db.query('SELECT * FROM inventory WHERE id = $1', [id]);
      if (ingredientResult.rows.length === 0) {
        throw new ApiError(404, 'Ingredient not found.');
      }

      const existing = ingredientResult.rows[0];
      let newQty = Number(existing.available_quantity);

      if (action === 'addition') {
        newQty += quantityChanged;
      } else if (action === 'deduction') {
        newQty = Math.max(0, newQty - quantityChanged);
      } else if (action === 'correction') {
        newQty = quantityChanged;
      }

      // Use a transaction to perform update & write log
      const updated = await db.transaction(async (client) => {
        const updateRes = await client.query(
          'UPDATE inventory SET available_quantity = $1 WHERE id = $2 RETURNING *',
          [newQty, id]
        );

        await client.query(
          `INSERT INTO inventory_logs (inventory_id, quantity_changed, action, reason, admin_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, quantityChanged, action, reason, adminId]
        );

        return updateRes.rows[0];
      });

      res.status(200).json({ status: 'success', data: updated });
    } catch (e) {
      next(e);
    }
  },

  getInventoryLogs: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.query(
        `SELECT l.*, i.ingredient_name, u.full_name as admin_name
         FROM inventory_logs l
         LEFT JOIN inventory i ON l.inventory_id = i.id
         LEFT JOIN users u ON l.admin_id = u.id
         ORDER BY l.timestamp DESC`
      );
      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },

  // Recipes management
  addRecipeItem: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const { inventoryId, quantityRequired, unit, costPerUnit } = req.body;

      const result = await db.query(
        `INSERT INTO product_recipes (product_id, inventory_id, quantity_required, unit, cost_per_unit)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (product_id, inventory_id)
         DO UPDATE SET quantity_required = $3, unit = $4, cost_per_unit = $5
         RETURNING *`,
        [productId, inventoryId, quantityRequired, unit, costPerUnit]
      );

      res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  getProductRecipe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;

      const items = await db.query(
        `SELECT r.*, i.ingredient_name, i.available_quantity, i.unit as inventory_unit
         FROM product_recipes r
         JOIN inventory i ON r.inventory_id = i.id
         WHERE r.product_id = $1`,
        [productId]
      );

      // Calculate cost summary
      const foodCost = items.rows.reduce((sum, row) => {
        return sum + Number(row.quantity_required) * Number(row.cost_per_unit);
      }, 0);

      const productResult = await db.query('SELECT price, name FROM products WHERE id = $1', [productId]);
      const price = productResult.rows[0] ? Number(productResult.rows[0].price) : 0;
      const profit = price - foodCost;
      const marginPercent = price > 0 ? (profit / price) * 100 : 0;

      res.status(200).json({
        status: 'success',
        data: {
          ingredients: items.rows,
          foodCost,
          estimatedProfit: profit,
          profitMarginPercentage: marginPercent,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  deleteRecipeItem: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId, recipeItemId } = req.params;
      const result = await db.query(
        'DELETE FROM product_recipes WHERE product_id = $1 AND id = $2 RETURNING id',
        [productId, recipeItemId]
      );
      if (result.rows.length === 0) {
        throw new ApiError(404, 'Recipe mapping item not found.');
      }
      res.status(200).json({ status: 'success', message: 'Recipe item deleted successfully.' });
    } catch (e) {
      next(e);
    }
  },
};
export default inventoryController;
