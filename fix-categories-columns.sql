-- Quick fix for categories table
-- Run this in your PostgreSQL database to add missing columns

-- Add is_active column
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add updated_at column  
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing categories to be active
UPDATE categories SET is_active = true WHERE is_active IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

-- Show all categories
SELECT * FROM categories;
