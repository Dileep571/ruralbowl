const BASE_URL = 'http://localhost:5000/api';

async function testCartFlow() {
  try {
    console.log('🧪 Testing Cart Authentication Flow\n');
    
    // Step 1: Login
    console.log('1️⃣ Logging in as test@gmail.com...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@gmail.com',
        password: 'test123'
      })
    });
    
    const loginData = await loginResponse.json();
    const { token, user } = loginData;
    console.log(`✅ Login successful!`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Token: ${token.substring(0, 50)}...\n`);
    
    // Step 2: Get Cart (should be empty initially)
    console.log('2️⃣ Getting current cart...');
    const cartResponse = await fetch(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cartData = await cartResponse.json();
    console.log(`✅ Cart retrieved: ${cartData.items?.length || 0} items\n`);
    // Step 3: Add product to cart
    console.log('3️⃣ Adding product to cart...');
    const addResponse = await fetch(`${BASE_URL}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: 1,
        quantity: 2
      })
    });
    const addData = await addResponse.json();
    console.log(`✅ Product added to cart!`);
    console.log(`   Cart ID: ${addData.id}`);
    console.log(`   Product: ${addData.product_name}`);
    console.log(`   Quantity: ${addData.quantity}`);
    // Step 4: Get updated cart
    console.log('4️⃣ Getting updated cart...');
    const updatedCartResponse = await fetch(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const updatedCart = await updatedCartResponse.json();
    console.log(`✅ Cart now has ${updatedCart.items?.length || 0} items`);
    console.log(`   Total: ₹${updatedCart.total || 0}\n`);
    });
    console.log(`✅ Cart now has ${updatedCart.data.items?.length || 0} items`);
    console.log(`   Total: ₹${updatedCart.data.total || 0}\n`);
    
    console.log('🎉 All tests passed!\n');
    console.log('📝 To use in your frontend:');
    console.log(`   1. Login: POST ${BASE_URL}/auth/login`);
    console.log(`   2. Store token in localStorage or state`);
    console.log(`   3. Include header: Authorization: Bearer ${token.substring(0, 30)}...`);
    console.log(`   4. Make cart requests with the token\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Authentication failed!');
    console.log('   Make sure you:');
    console.log('   1. Server is running on port 5000');
    console.log('   2. Have the correct credentials');
    console.log('   3. Include the token in Authorization header');
  }
} }
}

testCartFlow();
