import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../config/db';
import { ApiError } from '../middleware/error';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

export const productSchemas = {
  createCategory: z.object({
    name: z.string().min(2),
    image: z.string().url().optional(),
    displayOrder: z.number().int().default(0),
    active: z.boolean().default(true),
  }),
  createProduct: z.object({
    categoryId: z.string().uuid(),
    name: z.string().min(2),
    description: z.string(),
    ingredients: z.array(z.string()).default([]),
    price: z.number().positive(),
    discountedPrice: z.number().nonnegative().optional(),
    preparationTime: z.number().int().positive(),
    calories: z.number().int().positive().optional(),
    spicyLevel: z.number().int().min(0).max(3).default(0),
    vegOrNonveg: z.enum(['veg', 'non-veg']),
    bestseller: z.boolean().default(false),
    featured: z.boolean().default(false),
    image: z.string().url(),
    galleryImages: z.array(z.string()).default([]),
    active: z.boolean().default(true),
  }),
};

export const productsController = {
  // Categories CRUD
  createCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, image, displayOrder, active } = req.body;
      const slug = slugify(name);

      const existing = await db.query('SELECT id FROM categories WHERE slug = $1', [slug]);
      if (existing.rows.length > 0) {
        throw new ApiError(409, 'Category with this name already exists.');
      }

      const result = await db.query(
        `INSERT INTO categories (name, slug, image, display_order, active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, slug, image, displayOrder, active]
      );

      res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  getAllCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.query('SELECT * FROM categories ORDER BY display_order ASC');
      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },

  updateCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, image, displayOrder, active } = req.body;

      const categoryResult = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
      if (categoryResult.rows.length === 0) {
        throw new ApiError(404, 'Category not found.');
      }

      const existing = categoryResult.rows[0];
      const newName = name ?? existing.name;
      const newSlug = name ? slugify(name) : existing.slug;
      const newImg = image ?? existing.image;
      const newOrder = displayOrder ?? existing.display_order;
      const newActive = active ?? existing.active;

      const result = await db.query(
        `UPDATE categories
         SET name = $1, slug = $2, image = $3, display_order = $4, active = $5
         WHERE id = $6
         RETURNING *`,
        [newName, newSlug, newImg, newOrder, newActive, id]
      );

      res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  deleteCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        throw new ApiError(404, 'Category not found.');
      }
      res.status(200).json({ status: 'success', message: 'Category deleted successfully.' });
    } catch (e) {
      next(e);
    }
  },

  // Products CRUD
  createProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        categoryId,
        name,
        description,
        ingredients,
        price,
        discountedPrice,
        preparationTime,
        calories,
        spicyLevel,
        vegOrNonveg,
        bestseller,
        featured,
        image,
        galleryImages,
        active,
      } = req.body;

      const slug = slugify(name);
      const existing = await db.query('SELECT id FROM products WHERE slug = $1', [slug]);
      if (existing.rows.length > 0) {
        throw new ApiError(409, 'Product with this name already exists.');
      }

      const result = await db.query(
        `INSERT INTO products (
          category_id, name, slug, description, ingredients, price, discounted_price,
          preparation_time, calories, spicy_level, veg_or_nonveg, bestseller, featured,
          image, gallery_images, active
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING *`,
        [
          categoryId,
          name,
          slug,
          description,
          ingredients,
          price,
          discountedPrice,
          preparationTime,
          calories,
          spicyLevel,
          vegOrNonveg,
          bestseller,
          featured,
          image,
          galleryImages,
          active,
        ]
      );

      res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  getAllProducts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, category, veg, bestseller, featured, sortBy } = req.query;

      let queryText = `
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.active = true
      `;
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (search) {
        queryText += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (category) {
        queryText += ` AND c.slug = $${paramIndex}`;
        queryParams.push(category);
        paramIndex++;
      }

      if (veg) {
        queryText += ` AND p.veg_or_nonveg = $${paramIndex}`;
        queryParams.push(veg);
        paramIndex++;
      }

      if (bestseller === 'true') {
        queryText += ` AND p.bestseller = true`;
      }

      if (featured === 'true') {
        queryText += ` AND p.featured = true`;
      }

      // Sorting
      if (sortBy === 'price-low') {
        queryText += ` ORDER BY COALESCE(p.discounted_price, p.price) ASC`;
      } else if (sortBy === 'price-high') {
        queryText += ` ORDER BY COALESCE(p.discounted_price, p.price) DESC`;
      } else {
        queryText += ` ORDER BY p.rating DESC, p.created_at DESC`; // Popular default
      }

      const result = await db.query(queryText, queryParams);
      res.status(200).json({ status: 'success', data: result.rows });
    } catch (e) {
      next(e);
    }
  },

  getProductBySlug: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const result = await db.query(
        `SELECT p.*, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.slug = $1`,
        [slug]
      );

      if (result.rows.length === 0) {
        throw new ApiError(404, 'Product not found.');
      }
      res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  updateProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const productResult = await db.query('SELECT * FROM products WHERE id = $1', [id]);
      if (productResult.rows.length === 0) {
        throw new ApiError(404, 'Product not found.');
      }

      const existing = productResult.rows[0];
      const fields = [
        'category_id',
        'name',
        'description',
        'ingredients',
        'price',
        'discounted_price',
        'preparation_time',
        'calories',
        'spicy_level',
        'veg_or_nonveg',
        'bestseller',
        'featured',
        'image',
        'gallery_images',
        'active',
      ];

      const updateValues: any[] = [];
      const setClauses: string[] = [];
      let index = 1;

      fields.forEach((field) => {
        // Map camelCase from body to snake_case in db
        const camelKey = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        const bodyValue = req.body[camelKey] !== undefined ? req.body[camelKey] : req.body[field];

        if (bodyValue !== undefined) {
          setClauses.push(`${field} = $${index}`);
          updateValues.push(bodyValue);
          index++;
        }
      });

      if (req.body.name) {
        setClauses.push(`slug = $${index}`);
        updateValues.push(slugify(req.body.name));
        index++;
      }

      if (setClauses.length === 0) {
        res.status(200).json({ status: 'success', data: existing });
        return;
      }

      updateValues.push(id);
      const queryText = `
        UPDATE products
        SET ${setClauses.join(', ')}
        WHERE id = $${index}
        RETURNING *
      `;

      const result = await db.query(queryText, updateValues);
      res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (e) {
      next(e);
    }
  },

  deleteProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        throw new ApiError(404, 'Product not found.');
      }
      res.status(200).json({ status: 'success', message: 'Product deleted successfully.' });
    } catch (e) {
      next(e);
    }
  },
};
export default productsController;
