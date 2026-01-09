-- Create delivery_areas table
CREATE TABLE IF NOT EXISTS delivery_areas (
  id SERIAL PRIMARY KEY,
  area_name VARCHAR(255) NOT NULL,
  city VARCHAR(255) DEFAULT 'Chittoor',
  state VARCHAR(255) DEFAULT 'Andhra Pradesh',
  pincode VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_areas_active ON delivery_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_areas_name ON delivery_areas(area_name);

-- Insert default delivery areas
INSERT INTO delivery_areas (area_name, city, state, is_active) VALUES
  ('KR Palli', 'Chittoor', 'Andhra Pradesh', TRUE),
  ('Kattamanchi', 'Chittoor', 'Andhra Pradesh', TRUE),
  ('Mittoor', 'Chittoor', 'Andhra Pradesh', TRUE)
ON CONFLICT DO NOTHING;

-- Add delivery_area_id to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_area_id INTEGER REFERENCES delivery_areas(id),
ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
ADD COLUMN IF NOT EXISTS order_time TIME DEFAULT CURRENT_TIME;

-- Create index on delivery_area_id
CREATE INDEX IF NOT EXISTS idx_orders_delivery_area ON orders(delivery_area_id);

COMMENT ON TABLE delivery_areas IS 'Stores available delivery areas for order fulfillment';
COMMENT ON COLUMN orders.delivery_area_id IS 'Reference to the delivery area for this order';
COMMENT ON COLUMN orders.expected_delivery_date IS 'Expected delivery date based on order time (before/after 6 PM)';
COMMENT ON COLUMN orders.order_time IS 'Time when order was placed to calculate delivery date';
