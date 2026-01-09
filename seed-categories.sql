-- SQL Script to fix and seed categories
-- Run this directly in your PostgreSQL database

-- Step 1: Add is_active and updated_at columns if they don't exist
DO $$ 
BEGIN
    -- Add is_active column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to categories table';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to categories table';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Step 2: Update any existing categories to be active
UPDATE categories SET is_active = true WHERE is_active IS NULL;

-- Step 3: Insert default categories (will not duplicate if slug exists)
INSERT INTO categories (name, slug, description, image_url, is_active) 
VALUES
  ('Vegetables', 'vegetables', 'Fresh organic vegetables from local farms', '/images/vegetables-category.jpeg', true),
  ('Rice', 'rice', 'Premium quality rice varieties', '/images/rice-category.jpg', true)
ON CONFLICT (slug) 
DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_active = true;

-- Step 4: Verify categories
SELECT id, name, slug, description, image_url, is_active, created_at FROM categories ORDER BY id;

-- Step 5: Count categories
SELECT COUNT(*) as total_categories FROM categories WHERE is_active = true;

-- Step 6: Check products per category
SELECT 
  c.name as category_name,
  c.slug,
  c.is_active,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.name, c.slug, c.is_active
ORDER BY c.name;
