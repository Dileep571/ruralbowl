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
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    const { token, user } = loginData;
    console.log(`✅ Login successful!`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Token: ${token.substring(0, 50)}...\n`);
    
    // Step 2: Get Cart
    console.log('2️⃣ Getting current cart...');
    const cartResponse = await fetch(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cartData = await cartResponse.json();
    console.log(`✅ Cart retrieved: ${cartData.items?.length || 0} items\n`);
    
    // Step 3: Add product to cart
    console.log('3️⃣ Adding product to cart (Product ID: 1, Qty: 2)...');
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
    
    if (!addResponse.ok) {
      console.error('❌ Failed to add to cart:', addData);
      return;
    }
    
    console.log(`✅ Product added to cart!`);
    console.log(`   Message: ${addData.message || 'Added successfully'}\n`);
    
    // Step 4: Get updated cart
    console.log('4️⃣ Getting updated cart...');
    const updatedCartResponse = await fetch(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const updatedCart = await updatedCartResponse.json();
    
    if (updatedCart.items && updatedCart.items.length > 0) {
      console.log(`✅ Cart now has ${updatedCart.items.length} item(s):`);
      updatedCart.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product_name} x ${item.quantity} = ₹${item.subtotal}`);
      });
      console.log(`   Total: ₹${updatedCart.total}\n`);
    } else {
      console.log(`✅ Cart retrieved but empty\n`);
    }
    
    console.log('🎉 All tests passed!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 How to use in your frontend:\n');
    console.log('1. Login first:');
    console.log(`   POST ${BASE_URL}/auth/login`);
    console.log('   Body: { "email": "test@gmail.com", "password": "test123" }\n');
    console.log('2. Store the token:');
    console.log('   localStorage.setItem("token", data.token)\n');
    console.log('3. Use token in cart requests:');
    console.log('   headers: { "Authorization": "Bearer YOUR_TOKEN" }\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n⚠️  Possible issues:');
    console.log('   1. Server not running on port 5000');
    console.log('   2. Incorrect credentials');
    console.log('   3. Network/connection error');
    console.log('\n💡 Check: http://localhost:5000/api/health');
  }
}

testCartFlow();
