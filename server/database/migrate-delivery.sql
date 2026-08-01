-- ============================================================
-- TRIMAKI: Delivery Partner Feature Migration
-- Run this in Supabase SQL Editor (Project > SQL Editor > New Query)
-- ============================================================

-- 1. Add delivery_partner_id to orders (links to users table, role='delivery')
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_partner_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Add GPS tracking columns to orders (last known delivery partner location)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_lat  DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS delivery_lng  DECIMAL(11, 8);

-- 3. Add cancellation_reason if not exists (used by existing updateStatus code)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 4. Drop old order_status CHECK and recreate with new statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN (
    'received','accepted','preparing','packed',
    'out_for_delivery','in_transit','near_doorstep',
    'delivered','cancelled'
  ));

-- 5. Index for fast delivery partner order lookups
CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner ON orders(delivery_partner_id);
