-- RuralBowl Database Migrations
-- Run these SQL commands to add all new features

-- ============================================
-- 1. PRODUCT REVIEWS & RATINGS
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  images JSON DEFAULT '[]',
  verified_purchase BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT true,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_approved ON reviews(approved);

-- ============================================
-- 2. COUPON & DISCOUNT SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10,2) NOT NULL CHECK (value > 0),
  min_order_value DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INT,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_usage (
  id SERIAL PRIMARY KEY,
  coupon_id INT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INT REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);

-- ============================================
-- 3. WISHLIST FEATURE
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user ON wishlist(user_id);

-- ============================================
-- 4. ACTIVITY LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  user_type VARCHAR(20) CHECK (user_type IN ('admin', 'customer')),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- ============================================
-- 5. ORDER TRACKING ENHANCEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS order_tracking (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add tracking fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

CREATE INDEX idx_order_tracking_order ON order_tracking(order_id);

-- ============================================
-- 6. PRODUCT ENHANCEMENTS
-- ============================================
-- Add fields for reviews and images
ALTER TABLE products
ADD COLUMN IF NOT EXISTS images JSON DEFAULT '[]',
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- ============================================
-- 7. ORDER ENHANCEMENTS
-- ============================================
-- Add coupon support
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS coupon_id INT REFERENCES coupons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Sample Coupons
INSERT INTO coupons (code, description, type, value, min_order_value, max_discount, usage_limit, expires_at) 
VALUES 
  ('WELCOME10', 'Welcome discount for new users', 'percentage', 10.00, 500.00, 100.00, 100, NOW() + INTERVAL '30 days'),
  ('SAVE50', 'Flat ₹50 off on orders above ₹300', 'fixed', 50.00, 300.00, 50.00, 200, NOW() + INTERVAL '60 days'),
  ('MEGA20', 'Mega sale - 20% off', 'percentage', 20.00, 1000.00, 500.00, 50, NOW() + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update product average rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM reviews 
      WHERE product_id = NEW.product_id AND approved = true
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM reviews 
      WHERE product_id = NEW.product_id AND approved = true
    )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update ratings
DROP TRIGGER IF EXISTS trigger_update_product_rating ON reviews;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Top Rated Products
CREATE OR REPLACE VIEW top_rated_products AS
SELECT 
  p.id,
  p.name,
  p.average_rating,
  p.review_count,
  p.price,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.review_count > 0
ORDER BY p.average_rating DESC, p.review_count DESC
LIMIT 10;

-- Popular Products (by views and orders)
CREATE OR REPLACE VIEW popular_products AS
SELECT 
  p.id,
  p.name,
  p.view_count,
  COUNT(DISTINCT oi.order_id) as order_count,
  SUM(oi.quantity) as total_sold,
  p.average_rating
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id
ORDER BY total_sold DESC, p.view_count DESC
LIMIT 10;

-- Sales Analytics
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as order_count,
  SUM(total_amount) as revenue,
  AVG(total_amount) as avg_order_value,
  SUM(discount_amount) as total_discounts
FROM orders
WHERE status != 'cancelled'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_orders_coupon ON orders(coupon_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ============================================
-- PERMISSIONS (Optional)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ruralbowl_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ruralbowl_user;

COMMENT ON TABLE reviews IS 'Customer reviews and ratings for products';
COMMENT ON TABLE coupons IS 'Discount coupons and promo codes';
COMMENT ON TABLE wishlist IS 'User wishlist items';
COMMENT ON TABLE activity_logs IS 'System activity and audit trail';
COMMENT ON TABLE order_tracking IS 'Detailed order tracking history';

-- ============================================
-- 7. SUBSCRIPTION SYSTEM
-- ============================================

-- Subscription Plans (Admin creates these)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  validity_days INT NOT NULL DEFAULT 90,
  total_deliveries INT NOT NULL CHECK (total_deliveries > 0),
  delivery_frequency VARCHAR(50), -- 'weekly', 'biweekly', 'custom'
  default_delivery_days JSONB, -- ['monday', 'wednesday', 'friday']
  items JSONB NOT NULL, -- [{"product_id": 1, "quantity": 2, "locked_price": 100}, ...]
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  max_reschedules_per_delivery INT DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User's Purchased Subscription Plans
CREATE TABLE IF NOT EXISTS user_plans (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INT NOT NULL REFERENCES subscription_plans(id),
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activation_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  total_deliveries INT NOT NULL,
  deliveries_used INT DEFAULT 0,
  deliveries_remaining INT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'cancelled')),
  pause_start_date DATE,
  pause_end_date DATE,
  payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'refunded')),
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_id VARCHAR(100),
  locked_items JSONB NOT NULL, -- Snapshot of items with locked prices
  last_activity_date DATE,
  wallet_credit_converted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_deliveries_remaining CHECK (deliveries_remaining >= 0),
  CONSTRAINT chk_deliveries_used CHECK (deliveries_used >= 0)
);

-- Individual Delivery Slots
CREATE TABLE IF NOT EXISTS plan_deliveries (
  id SERIAL PRIMARY KEY,
  user_plan_id INT NOT NULL REFERENCES user_plans(id) ON DELETE CASCADE,
  order_id INT REFERENCES orders(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  original_date DATE, -- Track original date if rescheduled
  time_slot VARCHAR(20), -- '10am-12pm', '2pm-4pm', '6pm-8pm'
  delivery_address TEXT,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'order_created', 'completed', 'skipped', 'rescheduled', 'paused', 'cancelled', 'expired')),
  can_modify BOOLEAN DEFAULT true,
  cutoff_time TIME DEFAULT '20:00:00',
  can_modify_until TIMESTAMP,
  custom_items JSONB, -- If user customized this specific delivery
  skip_reason TEXT,
  reschedule_count INT DEFAULT 0,
  combined_with_delivery_id INT REFERENCES plan_deliveries(id), -- For merged deliveries
  substitutions JSONB, -- [{"original_product": "Tomatoes", "substitute": "Cherry Tomatoes", "reason": "Out of stock"}]
  delivery_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Modification History (Audit Trail)
CREATE TABLE IF NOT EXISTS plan_modifications (
  id SERIAL PRIMARY KEY,
  user_plan_id INT NOT NULL REFERENCES user_plans(id) ON DELETE CASCADE,
  plan_delivery_id INT REFERENCES plan_deliveries(id) ON DELETE SET NULL,
  action VARCHAR(30) NOT NULL, -- 'skip', 'reschedule', 'pause', 'resume', 'customize', 'cancel'
  old_value JSONB,
  new_value JSONB,
  modified_by INT REFERENCES users(id),
  ip_address VARCHAR(45),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Subscription System
CREATE INDEX idx_user_plans_user_status ON user_plans(user_id, status);
CREATE INDEX idx_user_plans_expiry ON user_plans(expiry_date, status);
CREATE INDEX idx_plan_deliveries_date_status ON plan_deliveries(scheduled_date, status);
CREATE INDEX idx_plan_deliveries_user_plan ON plan_deliveries(user_plan_id);
CREATE INDEX idx_plan_deliveries_can_modify ON plan_deliveries(can_modify_until) WHERE can_modify = true;

-- ============================================
-- 8. WALLET SYSTEM
-- ============================================

-- User Wallets
CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0),
  currency VARCHAR(3) DEFAULT 'INR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  wallet_id INT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'bonus', 'conversion')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  order_id INT REFERENCES orders(id) ON DELETE SET NULL,
  user_plan_id INT REFERENCES user_plans(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  reference_id VARCHAR(100), -- Payment gateway reference
  metadata JSONB, -- Additional context
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Wallet System
CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_order ON wallet_transactions(order_id);
CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

-- ============================================
-- 9. ENHANCEMENTS TO EXISTING TABLES
-- ============================================

-- Add subscription support to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'regular' CHECK (order_type IN ('regular', 'subscription'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_plan_id INT REFERENCES user_plans(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS plan_delivery_id INT REFERENCES plan_deliveries(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wallet_amount_used DECIMAL(10,2) DEFAULT 0;

-- Add wallet payment tracking
CREATE INDEX idx_orders_user_plan ON orders(user_plan_id);
CREATE INDEX idx_orders_plan_delivery ON orders(plan_delivery_id);
CREATE INDEX idx_orders_type ON orders(order_type);

-- ============================================
-- 10. SAMPLE DATA FOR TESTING
-- ============================================

-- Sample Subscription Plans
INSERT INTO subscription_plans (name, description, price, validity_days, total_deliveries, delivery_frequency, default_delivery_days, items, discount_percentage) 
VALUES 
  ('Weekly Veggie Plan', 'Fresh vegetables delivered every week', 2400, 90, 12, 'weekly', '["monday"]', '[{"product_id": 1, "quantity": 2, "locked_price": 100}, {"product_id": 2, "quantity": 1, "locked_price": 50}]', 10),
  ('Bi-Weekly Fresh Box', 'Fresh produce twice a week', 3600, 90, 24, 'biweekly', '["monday", "thursday"]', '[{"product_id": 1, "quantity": 1, "locked_price": 100}, {"product_id": 3, "quantity": 2, "locked_price": 75}]', 15),
  ('Monthly Premium Plan', 'Premium selection delivered monthly', 1800, 120, 4, 'monthly', '["monday"]', '[{"product_id": 1, "quantity": 3, "locked_price": 100}, {"product_id": 2, "quantity": 2, "locked_price": 50}, {"product_id": 3, "quantity": 2, "locked_price": 75}]', 20)
ON CONFLICT DO NOTHING;

-- ============================================
-- 11. TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update wallet balance timestamp
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wallet_timestamp
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallet_timestamp();

-- Auto-calculate can_modify_until timestamp
CREATE OR REPLACE FUNCTION set_delivery_cutoff()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scheduled_date IS NOT NULL AND NEW.cutoff_time IS NOT NULL THEN
    NEW.can_modify_until = (NEW.scheduled_date - INTERVAL '1 day') + NEW.cutoff_time;
    NEW.can_modify = (CURRENT_TIMESTAMP < NEW.can_modify_until);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_delivery_cutoff
BEFORE INSERT OR UPDATE ON plan_deliveries
FOR EACH ROW
EXECUTE FUNCTION set_delivery_cutoff();

-- Update last_activity_date on user_plans when delivery is modified
CREATE OR REPLACE FUNCTION update_plan_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_plans 
  SET last_activity_date = CURRENT_DATE,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.user_plan_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plan_activity
AFTER INSERT OR UPDATE ON plan_deliveries
FOR EACH ROW
EXECUTE FUNCTION update_plan_activity();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
SELECT 'All tables created successfully! Subscription & Wallet systems added.' as status;
