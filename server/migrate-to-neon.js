const { Pool } = require('pg');

// Neon database connection
const pool = new Pool({
  host: 'ep-lively-flower-a18w6w64-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_j6BbU0FHJhKL',
  ssl: { rejectUnauthorized: false }
});

const runMigrations = async () => {
  console.log('🔧 Running migrations on Neon database...\n');

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // 2. Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        coming_soon BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Categories table created');

    // 3. Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        unit VARCHAR(50) DEFAULT 'kg',
        unit_value DECIMAL(10, 2),
        stock_quantity INTEGER DEFAULT 0,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        image_url VARCHAR(500),
        images TEXT[], 
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products table created');

    // 4. Product Variants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        unit VARCHAR(50) NOT NULL,
        unit_value DECIMAL(10, 2),
        stock_quantity INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Product Variants table created');

    // 5. Cart table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255),
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Cart table created');

    // 6. Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(255),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        subtotal DECIMAL(10, 2) NOT NULL,
        delivery_fee DECIMAL(10, 2) DEFAULT 0,
        discount DECIMAL(10, 2) DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'pending',
        delivery_address TEXT,
        delivery_city VARCHAR(100),
        delivery_state VARCHAR(100),
        delivery_pincode VARCHAR(10),
        delivery_phone VARCHAR(20),
        delivery_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Orders table created');

    // 7. Order Items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        variant_name VARCHAR(255),
        product_image VARCHAR(500),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Order Items table created');

    // 8. Subscription Plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        interval VARCHAR(50) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        features TEXT[],
        items JSONB,
        is_popular BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Subscription Plans table created');

    // 9. User Plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'active',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        amount_paid DECIMAL(10, 2),
        delivery_address TEXT,
        delivery_city VARCHAR(100),
        delivery_state VARCHAR(100),
        delivery_pincode VARCHAR(10),
        delivery_phone VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ User Plans table created');

    // 10. User Subscriptions table (legacy)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'active',
        start_date DATE NOT NULL,
        end_date DATE,
        next_delivery DATE,
        delivery_address TEXT,
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ User Subscriptions table created');

    // 11. Plan Deliveries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_deliveries (
        id SERIAL PRIMARY KEY,
        user_plan_id INTEGER REFERENCES user_plans(id) ON DELETE CASCADE,
        delivery_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        skipped BOOLEAN DEFAULT false,
        skip_reason TEXT,
        delivered_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Plan Deliveries table created');

    // 12. Plan Modifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_modifications (
        id SERIAL PRIMARY KEY,
        user_plan_id INTEGER REFERENCES user_plans(id) ON DELETE CASCADE,
        modification_type VARCHAR(50) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        effective_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Plan Modifications table created');

    // 13. Delivery Calendar table
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_calendar (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        delivery_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Delivery Calendar table created');

    // 14. Delivery Areas table
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_areas (
        id SERIAL PRIMARY KEY,
        area_name VARCHAR(255) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        city VARCHAR(100),
        state VARCHAR(100),
        delivery_fee DECIMAL(10, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Delivery Areas table created');

    // 15. Wallets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Wallets table created');

    // 16. Wallet Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        balance_after DECIMAL(10, 2) NOT NULL,
        reference_type VARCHAR(50),
        reference_id INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Wallet Transactions table created');

    // 17. Reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(255),
        comment TEXT,
        images JSON DEFAULT '[]',
        verified_purchase BOOLEAN DEFAULT false,
        approved BOOLEAN DEFAULT true,
        helpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);
    console.log('✅ Reviews table created');

    // 18. Coupons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
        value DECIMAL(10,2) NOT NULL CHECK (value > 0),
        min_order_value DECIMAL(10,2) DEFAULT 0,
        max_discount DECIMAL(10,2),
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Coupons table created');

    // 19. Coupon Usage table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupon_usage (
        id SERIAL PRIMARY KEY,
        coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        discount_amount DECIMAL(10,2) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Coupon Usage table created');

    // 20. Wishlist table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);
    console.log('✅ Wishlist table created');

    // 21. Activity Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_type VARCHAR(20) CHECK (user_type IN ('admin', 'customer')),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        old_value JSON,
        new_value JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Activity Logs table created');

    // 22. Order Tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_tracking (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Order Tracking table created');

    // 23. Email OTP table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_otp (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Email OTP table created');

    // 24. Password Reset Tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Password Reset Tokens table created');

    // 25. Refresh Tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Refresh Tokens table created');

    // Create indexes for better performance
    console.log('\n📊 Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cart_session ON cart(session_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_plans_user ON user_plans(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_plan_deliveries_user_plan ON plan_deliveries(user_plan_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC)`);
    console.log('✅ Indexes created');

    await client.query('COMMIT');
    console.log('\n🎉 All migrations completed successfully on Neon!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations().catch(console.error);
