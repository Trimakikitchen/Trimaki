import bcrypt from 'bcrypt';
import { db } from '../config/db';

const seed = async () => {
  console.log('🌱 Starting database seeding for TRIMAKI...');

  try {
    // 1. Clean existing tables (in order of dependencies)
    console.log('🧹 Cleaning old records...');
    await db.query('DELETE FROM product_recipes');
    await db.query('DELETE FROM inventory_logs');
    await db.query('DELETE FROM inventory');
    await db.query('DELETE FROM wishlists');
    await db.query('DELETE FROM reviews');
    await db.query('DELETE FROM order_items');
    await db.query('DELETE FROM orders');
    await db.query('DELETE FROM payments');
    await db.query('DELETE FROM coupons');
    await db.query('DELETE FROM offers');
    await db.query('DELETE FROM addresses');
    await db.query('DELETE FROM notifications');
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM products');
    await db.query('DELETE FROM categories');

    // 2. Insert Admin & Customer users
    console.log('👤 Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('Admin123', salt);
    const customerPass = await bcrypt.hash('customer123', salt);
    const kitchenPass = await bcrypt.hash('kitchen123', salt);

    const adminUser = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ('Trimaki Kitchen', 'trimaki.kitchen@gmail.com', '+91 99999 11111', $1, 'admin')
       RETURNING id`,
      [adminPass]
    );

    const customerUser = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ('Siddhant Rangole', 'customer@trimaki.com', '+91 99999 22222', $1, 'customer')
       RETURNING id`,
      [customerPass]
    );

    const kitchenUser = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ('Chef Tanaka', 'kitchen@trimaki.com', '+91 99999 33333', $1, 'kitchen')
       RETURNING id`,
      [kitchenPass]
    );

    // 3. Insert Categories
    console.log('📁 Seeding categories...');
    const rollsCat = await db.query(
      `INSERT INTO categories (name, slug, image, display_order, active)
       VALUES ('Signature Rolls', 'rolls', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c', 1, true)
       RETURNING id`
    );

    const nigiriCat = await db.query(
      `INSERT INTO categories (name, slug, image, display_order, active)
       VALUES ('Classic Nigiri', 'nigiri', 'https://images.unsplash.com/photo-1611143669185-af224c5e3252', 2, true)
       RETURNING id`
    );

    const sashimiCat = await db.query(
      `INSERT INTO categories (name, slug, image, display_order, active)
       VALUES ('Chilled Sashimi', 'sashimi', 'https://images.unsplash.com/photo-1534482421-64566f976cfa', 3, true)
       RETURNING id`
    );

    // 4. Insert Products
    console.log('🍣 Seeding products...');
    const rainbowRoll = await db.query(
      `INSERT INTO products (category_id, name, slug, description, ingredients, price, discounted_price, preparation_time, spicy_level, veg_or_nonveg, bestseller, featured, image, rating)
       VALUES ($1, 'TRIMAKI Signature Rainbow Roll', 'trimaki-signature-rainbow-roll', 'Luxury roll with crab salad, cucumber inside, wrapped with premium salmon, yellowtail tuna, and fresh sliced avocado.', '{"Salmon", "Tuna", "Avocado", "Crab Salad", "Rice", "Seaweed"}', 999, 899, 18, 1, 'non-veg', true, true, '🍣', 4.9),
       ($1, 'Premium California Roll', 'premium-california-roll', 'Crabstick, fresh avocado, cucumber coated with toasted sesame & tobiko.', '{"Crabstick", "Avocado", "Cucumber", "Rice", "Tobiko"}', 699, NULL, 12, 0, 'non-veg', true, false, '🍣', 4.8),
       ($2, 'Truffle Shiitake Nigiri', 'truffle-shiitake-nigiri', 'Blanched shiitake mushrooms with a warm luxury truffle glaze oil over sticky sushi rice.', '{"Shiitake Mushrooms", "Truffle Oil", "Rice"}', 599, NULL, 10, 0, 'veg', false, true, '🍙', 4.7),
       ($3, 'Spicy Salmon Sashimi Duo', 'spicy-salmon-sashimi-duo', 'Slices of ultra-fresh chilled salmon dressed with a light yuzu chili oil dressing.', '{"Salmon", "Yuzu Sauce", "Chili Oil"}', 899, NULL, 8, 2, 'non-veg', false, false, '🐟', 4.8)
       RETURNING id, name`,
      [rollsCat.rows[0].id, nigiriCat.rows[0].id, sashimiCat.rows[0].id]
    );

    const prodMap = rainbowRoll.rows.reduce((acc, row) => {
      acc[row.name] = row.id;
      return acc;
    }, {} as Record<string, string>);

    // 5. Insert Raw Materials (Inventory)
    console.log('📦 Seeding raw materials inventory...');
    const riceInv = await db.query(
      `INSERT INTO inventory (ingredient_name, available_quantity, unit, minimum_quantity, reorder_level, supplier)
       VALUES ('Sushi Rice', 50.0, 'kg', 10.0, 15.0, 'Indo-Japan Foods'),
              ('Sushi Seaweed Sheets', 300.0, 'pcs', 50.0, 75.0, 'Nori Corp'),
              ('Fresh Salmon', 10.0, 'kg', 2.0, 3.5, 'Tokyo Chilled Imports'),
              ('Avocado', 40.0, 'pcs', 10.0, 15.0, 'Local Premium Greens'),
              ('Crab Salad Mix', 5.0, 'kg', 1.0, 1.5, 'Indo-Japan Foods'),
              ('Shiitake Mushrooms', 4.0, 'kg', 0.5, 1.0, 'Truffle & Fungi Ltd')
       RETURNING id, ingredient_name`
    );

    const invMap = riceInv.rows.reduce((acc, row) => {
      acc[row.ingredient_name] = row.id;
      return acc;
    }, {} as Record<string, string>);

    // 6. Insert Recipes (Deduction mappings)
    console.log('📜 Seeding recipes...');
    // California Roll: Rice (0.1kg), Nori (1pc), Crab Salad (0.05kg), Avocado (0.5pc)
    const calId = prodMap['Premium California Roll'];
    if (calId) {
      await db.query(
        `INSERT INTO product_recipes (product_id, inventory_id, quantity_required, unit, cost_per_unit)
         VALUES ($1, $2, 0.100, 'kg', 120.00), -- Rice
                ($1, $3, 1.000, 'pcs', 15.00), -- Nori
                ($1, $4, 0.050, 'kg', 450.00), -- Crab Salad
                ($1, $5, 0.500, 'pcs', 30.00) -- Avocado`,
        [calId, invMap['Sushi Rice'], invMap['Sushi Seaweed Sheets'], invMap['Crab Salad Mix'], invMap['Avocado']]
      );
    }

    // Rainbow Roll: Rice (0.1kg), Nori (1pc), Salmon (0.08kg), Avocado (0.5pc)
    const rainId = prodMap['TRIMAKI Signature Rainbow Roll'];
    if (rainId) {
      await db.query(
        `INSERT INTO product_recipes (product_id, inventory_id, quantity_required, unit, cost_per_unit)
         VALUES ($1, $2, 0.100, 'kg', 120.00), -- Rice
                ($1, $3, 1.000, 'pcs', 15.00), -- Nori
                ($1, $4, 0.080, 'kg', 1800.00), -- Salmon
                ($1, $5, 0.500, 'pcs', 30.00)`,
        [rainId, invMap['Sushi Rice'], invMap['Sushi Seaweed Sheets'], invMap['Fresh Salmon'], invMap['Avocado']]
      );
    }

    // 7. Insert Coupon and Banners
    console.log('🏷️ Seeding coupons and banners...');
    await db.query(
      `INSERT INTO coupons (code, description, percentage, max_discount, expiry_date, minimum_order, active)
       VALUES ('TRIMAKI50', '50% off up to ₹150 on orders above ₹500', 50, 150, NOW() + INTERVAL '30 days', 500, true)`
    );

    await db.query(
      `INSERT INTO offers (title, subtitle, banner_image, start_date, end_date, active)
       VALUES ('First Order Premium Delight', 'Enjoy free cold-chain delivery on purchases above ₹1,000 using code WELCOMEFRESH', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c', NOW(), NOW() + INTERVAL '90 days', true)`
    );

    console.log('🎉 Seeding successfully completed!');
  } catch (e) {
    console.error('❌ Seeding failed:', e);
  } finally {
    await db.pool.end();
  }
};

// Execute if run directly
if (require.main === module) {
  seed();
}
