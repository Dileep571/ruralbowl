// Clean up duplicate delivery areas
const db = require('./src/config/database');

async function cleanupDuplicates() {
  const client = await db.pool.connect();
  
  try {
    console.log('🧹 Cleaning up duplicate delivery areas...\n');
    
    await client.query('BEGIN');
    
    // Find duplicates
    const duplicates = await client.query(`
      SELECT area_name, array_agg(id ORDER BY created_at) as ids
      FROM delivery_areas
      GROUP BY area_name
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length === 0) {
      console.log('✅ No duplicates found!');
      await client.query('ROLLBACK');
      return;
    }
    
    console.log(`Found ${duplicates.rows.length} duplicate area name(s):\n`);
    
    let totalDeleted = 0;
    
    for (const dup of duplicates.rows) {
      const idsToDelete = dup.ids.slice(1); // Keep first, delete rest
      const keepId = dup.ids[0];
      
      console.log(`📍 "${dup.area_name}"`);
      console.log(`   Keeping ID: ${keepId}`);
      console.log(`   Deleting IDs: ${idsToDelete.join(', ')}`);
      
      // Check if any of these areas have orders
      const ordersCheck = await client.query(
        'SELECT COUNT(*) as count FROM orders WHERE delivery_area_id = ANY($1)',
        [idsToDelete]
      );
      
      if (parseInt(ordersCheck.rows[0].count) > 0) {
        console.log(`   ⚠️  Cannot delete - has ${ordersCheck.rows[0].count} orders`);
        console.log(`   💡 Recommendation: Manually merge or deactivate\n`);
        continue;
      }
      
      // Safe to delete
      const result = await client.query(
        'DELETE FROM delivery_areas WHERE id = ANY($1)',
        [idsToDelete]
      );
      
      totalDeleted += result.rowCount;
      console.log(`   ✅ Deleted ${result.rowCount} duplicate(s)\n`);
    }
    
    await client.query('COMMIT');
    
    console.log('='.repeat(60));
    console.log(`\n✅ Cleanup complete! Removed ${totalDeleted} duplicate area(s)\n`);
    
    // Show remaining areas
    const remaining = await client.query(
      'SELECT id, area_name, city, is_active FROM delivery_areas ORDER BY area_name'
    );
    
    console.log('Current delivery areas:');
    remaining.rows.forEach(area => {
      const status = area.is_active ? '✓ Active' : '✗ Inactive';
      console.log(`  • ${area.area_name}, ${area.city} (ID: ${area.id}) - ${status}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    process.exit();
  }
}

cleanupDuplicates();
