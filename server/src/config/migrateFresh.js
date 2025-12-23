const db = require('./database');

async function migrateFresh() {
  try {
    console.log('🔄 Starting fresh migration...\n');
    
    // Drop old tables that will be recreated with new structure
    console.log('📦 Dropping old subscription tables...');
    await db.query(`
      DROP TABLE IF EXISTS delivery_calendar CASCADE;
      DROP TABLE IF EXISTS user_subscriptions CASCADE;
      DROP TABLE IF EXISTS subscription_plans CASCADE;
    `);
    console.log('✅ Old tables dropped\n');
    
    // Now create new structure
    console.log('📝 Creating new subscription & wallet tables...\n');
    
    await db.query(`
      -- Subscription Plans (Admin-created plans)
      CREATE TABLE subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        validity_days INT DEFAULT 90 NOT NULL,
        total_deliveries INT NOT NULL,
        delivery_frequency VARCHAR(20) CHECK (delivery_frequency IN ('weekly', 'biweekly', 'custom')),
        default_delivery_days TEXT[],
        default_time_slot VARCHAR(50),
        items JSONB,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        max_reschedules_per_delivery INT DEFAULT 2,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- User Plans (Purchased subscriptions)
      CREATE TABLE user_plans (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id INT NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
        activation_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        total_deliveries INT NOT NULL,
        deliveries_used INT DEFAULT 0,
        deliveries_remaining INT NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'cancelled')),
        pause_start_date DATE,
        pause_end_date DATE,
        payment_id VARCHAR(255),
        payment_amount DECIMAL(10,2) NOT NULL,
        wallet_amount_used DECIMAL(10,2) DEFAULT 0,
        last_activity_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Plan Deliveries (Individual delivery slots)
      CREATE TABLE plan_deliveries (
        id SERIAL PRIMARY KEY,
        user_plan_id INT NOT NULL REFERENCES user_plans(id) ON DELETE CASCADE,
        order_id INT REFERENCES orders(id) ON DELETE SET NULL,
        scheduled_date DATE NOT NULL,
        original_date DATE,
        delivery_time_slot VARCHAR(50),
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'order_created', 'completed', 'skipped', 'rescheduled', 'paused')),
        can_modify BOOLEAN DEFAULT true,
        can_modify_until TIMESTAMP,
        cutoff_time TIME DEFAULT '20:00:00',
        locked_items JSONB,
        custom_items JSONB,
        substitutions JSONB,
        notes TEXT,
        reschedule_count INT DEFAULT 0,
        combined_with_delivery_id INT REFERENCES plan_deliveries(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Plan Modifications (Audit trail)
      CREATE TABLE plan_modifications (
        id SERIAL PRIMARY KEY,
        user_plan_id INT NOT NULL REFERENCES user_plans(id) ON DELETE CASCADE,
        plan_delivery_id INT REFERENCES plan_deliveries(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        old_value JSONB,
        new_value JSONB,
        reason TEXT,
        ip_address VARCHAR(45),
        modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Wallets
      CREATE TABLE wallets (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0),
        currency VARCHAR(3) DEFAULT 'INR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Wallet Transactions
      CREATE TABLE wallet_transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'bonus', 'plan_conversion')),
        amount DECIMAL(10,2) NOT NULL,
        balance_before DECIMAL(10,2),
        balance_after DECIMAL(10,2),
        order_id INT REFERENCES orders(id) ON DELETE SET NULL,
        user_plan_id INT REFERENCES user_plans(id) ON DELETE SET NULL,
        payment_id VARCHAR(255),
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Reviews table
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
      
      -- Coupons table
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
      
      -- Coupon Usage
      CREATE TABLE IF NOT EXISTS coupon_usage (
        id SERIAL PRIMARY KEY,
        coupon_id INT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id INT REFERENCES orders(id) ON DELETE SET NULL,
        discount_amount DECIMAL(10,2) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Wishlist
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      );
      
      -- Activity Logs
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
      
      -- Order Tracking
      CREATE TABLE IF NOT EXISTS order_tracking (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tables created successfully!\n');
    
    // Add indexes
    console.log('📑 Creating indexes...');
    await db.query(`
      CREATE INDEX idx_user_plans_user_status ON user_plans(user_id, status);
      CREATE INDEX idx_user_plans_expiry ON user_plans(expiry_date, status);
      CREATE INDEX idx_plan_deliveries_date_status ON plan_deliveries(scheduled_date, status);
      CREATE INDEX idx_plan_deliveries_user_plan ON plan_deliveries(user_plan_id);
      CREATE INDEX idx_wallet_user ON wallets(user_id);
      CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
      CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at DESC);
      CREATE INDEX idx_reviews_product ON reviews(product_id);
      CREATE INDEX idx_reviews_approved ON reviews(approved);
      CREATE INDEX idx_wishlist_user ON wishlist(user_id);
      CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
    `);
    console.log('✅ Indexes created\n');
    
    // Alter orders table
    console.log('🔧 Updating orders table...');
    await db.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'regular' CHECK (order_type IN ('regular', 'subscription')),
      ADD COLUMN IF NOT EXISTS user_plan_id INT REFERENCES user_plans(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS plan_delivery_id INT REFERENCES plan_deliveries(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS coupon_id INT REFERENCES coupons(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS wallet_amount_used DECIMAL(10,2) DEFAULT 0;
    `);
    console.log('✅ Orders table updated\n');
    
    // Alter products table
    console.log('🔧 Updating products table...');
    await db.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
    `);
    console.log('✅ Products table updated\n');
    
    console.log('🎉 Migration completed successfully!\n');
    
    // Verify
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'subscription_plans', 'user_plans', 'plan_deliveries', 'plan_modifications',
        'wallets', 'wallet_transactions', 'reviews', 'coupons', 'wishlist', 'activity_logs'
      )
      ORDER BY table_name
    `);
    
    console.log('📊 Verified tables:');
    tables.rows.forEach(row => console.log(`   ✅ ${row.table_name}`));
    
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await db.pool.end();
    process.exit(1);
  }
}

migrateFresh();
