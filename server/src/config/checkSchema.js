const db = require('./database');

async function checkSchema() {
  const result = await db.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    ORDER BY ordinal_position
  `);
  console.log('Current subscription_plans columns:');
  console.table(result.rows);
  
  await db.pool.end();
}

checkSchema();
