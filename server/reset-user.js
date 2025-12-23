const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function resetTestUser() {
  try {
    console.log('🔧 Resetting test user password...\n');
    
    // Check if user exists
    const checkUser = await db.query('SELECT id, email FROM users WHERE email = $1', ['test@gmail.com']);
    
    if (checkUser.rows.length === 0) {
      console.log('📝 User does not exist. Creating new test user...');
      const hashedPassword = await bcrypt.hash('test123', 10);
      const result = await db.query(
        'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email',
        ['Test User', 'test@gmail.com', hashedPassword, '9876543210', 'customer']
      );
      console.log('✅ Test user created!');
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Password: test123\n`);
    } else {
      console.log('📝 User exists. Updating password...');
      const hashedPassword = await bcrypt.hash('test123', 10);
      await db.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, 'test@gmail.com']
      );
      console.log('✅ Password updated!');
      console.log(`   Email: test@gmail.com`);
      console.log(`   Password: test123\n`);
    }
    
    // Show all users
    const users = await db.query('SELECT id, name, email, role FROM users ORDER BY id');
    console.log('👥 All users in database:');
    console.table(users.rows);
    
    await db.pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await db.pool.end();
  }
}

resetTestUser();
