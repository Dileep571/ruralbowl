// Test delivery date calculation
const calculateDeliveryDate = (orderTime = new Date()) => {
  const order = new Date(orderTime);
  const hour = order.getHours();
  
  const daysToAdd = hour < 18 ? 1 : 2;
  
  const deliveryDate = new Date(order);
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
  
  // Format date in local timezone (YYYY-MM-DD)
  const year = deliveryDate.getFullYear();
  const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
  const day = String(deliveryDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

const now = new Date();
console.log('Current Time:', now.toString());
console.log('Current Hour:', now.getHours());
console.log('');
console.log('✅ Expected Delivery (FIXED):', calculateDeliveryDate());
console.log('');
console.log('Test scenarios:');
console.log('  - Order at 5 PM (17:00):', calculateDeliveryDate(new Date('2026-01-03T17:00:00')));
console.log('  - Order at 7 PM (19:00):', calculateDeliveryDate(new Date('2026-01-03T19:00:00')));
console.log('  - Order at 11 AM (11:00):', calculateDeliveryDate(new Date('2026-01-03T11:00:00')));
