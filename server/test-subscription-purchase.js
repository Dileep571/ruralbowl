// Quick test for subscription purchase endpoint
// Using native fetch (Node 18+)

const API_URL = 'http://localhost:5000/api';

async function testSubscriptionPurchase() {
  console.log('🧪 Testing Subscription Purchase API\n');

  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
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

    const token = loginData.token;
    console.log('✅ Login successful, got token\n');

    // Step 2: Get subscription plans
    console.log('2️⃣ Fetching subscription plans...');
    const plansResponse = await fetch(`${API_URL}/subscriptions/plans`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const plansData = await plansResponse.json();
    console.log(`✅ Got ${plansData.plans?.length || 0} plans\n`);

    if (!plansData.plans || plansData.plans.length === 0) {
      console.log('⚠️  No plans available for testing');
      return;
    }

    const planId = plansData.plans[0].id;
    console.log(`📦 Testing with plan: ${plansData.plans[0].name} (ID: ${planId})\n`);

    // Step 3: Purchase subscription
    console.log('3️⃣ Attempting to purchase subscription...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const purchaseData = {
      plan_id: planId,
      activation_date: tomorrow.toISOString().split('T')[0],
      delivery_frequency: 'weekly',
      time_slot: '10am-12pm',
      use_wallet: false,
      payment_id: 'TEST_PAYMENT_' + Date.now()
    };

    console.log('Purchase data:', JSON.stringify(purchaseData, null, 2));

    const purchaseResponse = await fetch(`${API_URL}/subscriptions/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(purchaseData)
    });

    const purchaseResult = await purchaseResponse.json();
    
    console.log('\n📋 Purchase Response:');
    console.log('Status:', purchaseResponse.status);
    console.log('Data:', JSON.stringify(purchaseResult, null, 2));

    if (purchaseResponse.ok) {
      console.log('\n✅ Subscription purchased successfully!');
    } else {
      console.log('\n❌ Purchase failed:', purchaseResult.message);
    }

  } catch (error) {
    console.error('\n💥 Test error:', error.message);
    console.error('Make sure the backend server is running on port 5000');
  }
}

// Run the test
testSubscriptionPurchase();
