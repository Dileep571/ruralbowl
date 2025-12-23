const fs = require('fs');
const path = require('path');
const db = require('./database');

/**
 * Run database migrations
 * This script reads migrations.sql and executes it against the database
 */
async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and filter empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        await db.query(statement);
        successCount++;
        
        // Log progress for major operations
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i)?.[1];
          console.log(`✅ Created table: ${tableName}`);
        } else if (statement.includes('ALTER TABLE')) {
          const tableName = statement.match(/ALTER TABLE (\w+)/i)?.[1];
          console.log(`✅ Altered table: ${tableName}`);
        } else if (statement.includes('CREATE INDEX')) {
          const indexName = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/i)?.[1];
          console.log(`✅ Created index: ${indexName}`);
        } else if (statement.includes('CREATE VIEW')) {
          const viewName = statement.match(/CREATE(?:\s+OR\s+REPLACE)?\s+VIEW\s+(\w+)/i)?.[1];
          console.log(`✅ Created view: ${viewName}`);
        } else if (statement.includes('CREATE TRIGGER')) {
          const triggerName = statement.match(/CREATE TRIGGER (\w+)/i)?.[1];
          console.log(`✅ Created trigger: ${triggerName}`);
        }
      } catch (error) {
        errorCount++;
        
        // Some errors are acceptable (e.g., "already exists")
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Skipped (already exists): ${error.message.split('\n')[0]}`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...\n');
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n✅ All migrations completed successfully!');
    } else {
      console.log('\n⚠️  Some migrations failed. Check errors above.');
    }

    // Close database connection
    await db.pool.end();
    process.exit(errorCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Fatal error running migrations:', error);
    await db.pool.end();
    process.exit(1);
  }
}

// Run migrations
runMigrations();
