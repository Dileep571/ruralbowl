const db = require('./database');

/**
 * Migration: Add unit_value to products table
 * This allows products without variants to have a numeric value (e.g., 500 in "500gm", 1 in "1kg")
 */
const addUnitValue = async () => {
  try {
    console.log('Adding unit_value column to products table...');

    // Add unit_value column (numeric value like 500, 1, 2, etc.)
    await db.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS unit_value DECIMAL(10, 3) DEFAULT 1;
    `);

    console.log('✓ unit_value column added successfully');
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  addUnitValue()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = addUnitValue;
