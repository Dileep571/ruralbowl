const { Pool } = require('pg');

const neonPool = new Pool({
  host: 'ep-lively-flower-a18w6w64-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_j6BbU0FHJhKL',
  ssl: { rejectUnauthorized: false }
});

const checkSchema = async () => {
  const client = await neonPool.connect();
  
  try {
    console.log('📋 Neon Database Schema:\n');
    
    // Products table
    console.log('PRODUCTS Table:');
    const productsSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    productsSchema.rows.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    
    console.log('\nSUBSCRIPTION_PLANS Table:');
    const plansSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subscription_plans' 
      ORDER BY ordinal_position
    `);
    plansSchema.rows.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    
    console.log('\nPRODUCT_VARIANTS Table:');
    const variantsSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_variants' 
      ORDER BY ordinal_position
    `);
    variantsSchema.rows.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await neonPool.end();
  }
};

checkSchema();
