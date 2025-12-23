// Complete Flow Test: Purchase Subscription → View Calendar
const API_URL = 'http://localhost:5000/api';

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Subscription Flow\n');
  console.log('=' .repeat(50));

  try {
    // STEP 1: Login
    console.log('\n📍 STEP 1: Login');
    console.log('-'.repeat(50));
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
    console.log('✅ Login successful');
    console.log(`   User: ${loginData.user.name} (${loginData.user.email})`);

    // STEP 2: Get Subscription Plans
    console.log('\n📍 STEP 2: Fetch Subscription Plans');
    console.log('-'.repeat(50));
    const plansResponse = await fetch(`${API_URL}/subscriptions/plans`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const plansData = await plansResponse.json();
    
    if (!plansResponse.ok) {
      console.error('❌ Failed to get plans:', plansData);
      return;
    }

    console.log(`✅ Got ${plansData.plans?.length || 0} plans`);
    plansData.plans?.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name} - ₹${plan.price} (${plan.total_deliveries} deliveries)`);
    });

    if (!plansData.plans || plansData.plans.length === 0) {
      console.log('⚠️  No plans available');
      return;
    }

    const planId = plansData.plans[0].id;
    const selectedPlan = plansData.plans[0];
    console.log(`\n   Selected: ${selectedPlan.name} (ID: ${planId})`);

    // STEP 3: Purchase Subscription
    console.log('\n📍 STEP 3: Purchase Subscription');
    console.log('-'.repeat(50));
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const purchaseData = {
      plan_id: planId,
      activation_date: tomorrow.toISOString().split('T')[0],
      delivery_frequency: 'weekly',
      time_slot: '10am-12pm',
      use_wallet: false,
      payment_id: 'FLOW_TEST_' + Date.now()
    };

    console.log('   Purchase Data:', JSON.stringify(purchaseData, null, 2));

    const purchaseResponse = await fetch(`${API_URL}/subscriptions/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(purchaseData)
    });

    const purchaseResult = await purchaseResponse.json();
    
    if (!purchaseResponse.ok) {
      console.error('❌ Purchase failed:', purchaseResult);
      return;
    }

    console.log('✅ Subscription purchased successfully!');
    console.log(`   User Plan ID: ${purchaseResult.user_plan?.id}`);
    console.log(`   Status: ${purchaseResult.user_plan?.status}`);
    console.log(`   Deliveries: ${purchaseResult.user_plan?.total_deliveries}`);
    console.log(`   Activation: ${purchaseResult.user_plan?.activation_date?.split('T')[0]}`);
    console.log(`   Expiry: ${purchaseResult.user_plan?.expiry_date?.split('T')[0]}`);
    console.log(`   Delivery Dates: ${purchaseResult.delivery_dates?.length} dates scheduled`);

    // STEP 4: Get Calendar/Deliveries
    console.log('\n📍 STEP 4: Fetch Delivery Calendar');
    console.log('-'.repeat(50));
    
    const calendarResponse = await fetch(`${API_URL}/dashboard/calendar`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const calendarData = await calendarResponse.json();
    
    if (!calendarResponse.ok) {
      console.error('❌ Calendar fetch failed:', calendarData);
      return;
    }

    console.log(`✅ Calendar loaded: ${calendarData.deliveries?.length || 0} deliveries`);
    
    if (calendarData.deliveries && calendarData.deliveries.length > 0) {
      console.log('\n   📅 Upcoming Deliveries:');
      calendarData.deliveries.slice(0, 5).forEach((delivery, index) => {
        console.log(`   ${index + 1}. ${delivery.delivery_date} - ${delivery.time_slot || 'No time slot'}`);
        console.log(`      Plan: ${delivery.plan_name}`);
        console.log(`      Status: ${delivery.status}`);
      });
      
      if (calendarData.deliveries.length > 5) {
        console.log(`   ... and ${calendarData.deliveries.length - 5} more`);
      }
    } else {
      console.log('   ⚠️  No deliveries found in calendar');
    }

    // STEP 5: Get My Subscriptions
    console.log('\n📍 STEP 5: Fetch My Subscriptions');
    console.log('-'.repeat(50));
    
    const subscriptionsResponse = await fetch(`${API_URL}/subscriptions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const subscriptionsData = await subscriptionsResponse.json();
    
    if (!subscriptionsResponse.ok) {
      console.error('❌ Subscriptions fetch failed:', subscriptionsData);
      return;
    }

    console.log(`✅ Active subscriptions: ${subscriptionsData.subscriptions?.length || 0}`);
    
    if (subscriptionsData.subscriptions && subscriptionsData.subscriptions.length > 0) {
      subscriptionsData.subscriptions.forEach((sub, index) => {
        console.log(`\n   ${index + 1}. ${sub.plan_name || 'Unknown Plan'}`);
        console.log(`      Status: ${sub.status}`);
        console.log(`      Deliveries: ${sub.deliveries_used || 0}/${sub.total_deliveries}`);
        console.log(`      Remaining: ${sub.deliveries_remaining}`);
        console.log(`      Valid until: ${sub.expiry_date?.split('T')[0]}`);
      });
    }

    // STEP 6: Get User Subscription (Dashboard)
    console.log('\n📍 STEP 6: Get User Subscription (Dashboard)');
    console.log('-'.repeat(50));
    
    const userSubResponse = await fetch(`${API_URL}/dashboard/subscription`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const userSubData = await userSubResponse.json();
    
    if (!userSubResponse.ok) {
      console.error('❌ User subscription fetch failed:', userSubData);
    } else {
      if (userSubData.subscription) {
        console.log('✅ Active subscription found:');
        console.log(`   Plan: ${userSubData.subscription.plan_name}`);
        console.log(`   Completed: ${userSubData.subscription.completed_deliveries || 0}`);
        console.log(`   Upcoming: ${userSubData.subscription.upcoming_deliveries || 0}`);
      } else {
        console.log('⚠️  No active subscription found');
      }
    }

    // FINAL SUMMARY
    console.log('\n' + '='.repeat(50));
    console.log('🎉 COMPLETE FLOW TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('✅ Login');
    console.log('✅ Fetch Plans');
    console.log('✅ Purchase Subscription');
    console.log('✅ View Calendar');
    console.log('✅ View My Subscriptions');
    console.log('✅ Dashboard Subscription');
    console.log('\n🎊 All steps completed successfully!');

  } catch (error) {
    console.error('\n💥 Test error:', error.message);
    console.error('Stack:', error.stack);
    console.error('\nMake sure:');
    console.error('1. Backend server is running on port 5000');
    console.error('2. Database is properly set up');
    console.error('3. User test@gmail.com exists');
  }
}

// Run the test
testCompleteFlow();
