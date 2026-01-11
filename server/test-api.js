const fetch = require('node-fetch');

const testAPI = async () => {
  console.log('🧪 Testing API with Neon Database...\n');
  
  const tests = [
    { name: 'Categories', url: 'http://localhost:5000/api/products/categories' },
    { name: 'Products', url: 'http://localhost:5000/api/products?limit=5' },
    { name: 'Subscription Plans', url: 'http://localhost:5000/api/subscriptions/plans' },
    { name: 'Delivery Areas', url: 'http://localhost:5000/api/delivery/areas' },
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await fetch(test.url);
      const data = await response.json();
      
      if (response.ok) {
        const count = Array.isArray(data) ? data.length : (data.data?.length || 0);
        console.log(`  ✅ ${test.name}: ${count} items\n`);
      } else {
        console.log(`  ❌ ${test.name}: ${response.status} - ${data.message}\n`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.name}: ${error.message}\n`);
    }
  }
  
  console.log('🎉 API testing complete!\n');
};

testAPI();
