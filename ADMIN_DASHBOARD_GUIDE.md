# Admin Dashboard - RuralBowl

## 🎉 Complete Admin Management System

A comprehensive admin dashboard has been created for managing all aspects of your RuralBowl e-commerce platform.

## 🔐 Admin Access

### Default Credentials
- **Username:** `admin`
- **Password:** `admin123`
- **Login URL:** http://localhost:3000/admin/login

The admin account is automatically created on first login if it doesn't exist.

## 📊 Features Implemented

### 1. **Dashboard Overview** (`/admin/dashboard`)
- Total revenue, orders, users statistics
- Pending orders count
- Low stock product alerts
- Recent orders list
- Top selling products
- Quick action buttons for common tasks

### 2. **Products Management** (`/admin/products`)
- View all products with pagination
- Search products by name
- Filter by category and availability (available/out of stock/low stock)
- Add new products with complete form
- Edit existing products
- Delete products with confirmation
- Quick stock update (click on stock number)
- Real-time stock alerts

### 3. **Orders Management** (`/admin/orders`)
- View all orders with pagination
- Search by order ID, customer name, or email
- Filter by order status
- Update order status (pending → processing → shipped → delivered)
- View complete order details
- Status color coding for quick identification
- Payment method display

### 4. **Users Management** (`/admin/users`)
- View all users (customers and admins)
- Search by name or email
- Filter by role (customer/admin)
- View user details and order history
- Pagination for large user lists

### 5. **Inventory Management**
- Real-time stock tracking
- Low stock alerts (< 10 units)
- Out of stock indicators
- Quick stock updates

## 🗂️ File Structure

### Backend Files Created:
```
server/src/
├── controllers/
│   └── adminController.js      # All admin API logic
├── middleware/
│   └── adminAuth.js            # Admin authentication middleware
└── routes/
    └── adminRoutes.js          # Admin API routes
```

### Frontend Files Created:
```
web/src/app/admin/
├── login/
│   └── page.js                 # Admin login page
├── dashboard/
│   ├── layout.js               # Admin layout with sidebar
│   └── page.js                 # Dashboard overview
├── products/
│   ├── page.js                 # Products list & management
│   └── new/
│       └── page.js             # Add new product form
├── orders/
│   └── page.js                 # Orders management
└── users/
    └── page.js                 # Users management
```

### Updated Files:
- `server/src/server.js` - Added admin routes
- `web/src/lib/api.js` - Added admin API client methods

## 🚀 API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login

### Dashboard
- `GET /api/admin/dashboard/stats` - Dashboard statistics

### Products
- `GET /api/admin/products` - Get all products (with filters)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `PATCH /api/admin/products/:id/stock` - Update stock

### Orders
- `GET /api/admin/orders` - Get all orders (with filters)
- `PATCH /api/admin/orders/:id/status` - Update order status

### Users
- `GET /api/admin/users` - Get all users (with filters)
- `GET /api/admin/users/:id` - Get user details

## 🔒 Security Features

1. **JWT Authentication** - Separate admin tokens
2. **Role-Based Access** - Only users with 'admin' role can access
3. **Rate Limiting** - 5 login attempts per 15 minutes
4. **Password Hashing** - Bcrypt encryption
5. **Token Expiry** - 24-hour session timeout

## 🎨 UI Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Sidebar Navigation** - Easy access to all sections
- **Search & Filters** - Quick data filtering
- **Pagination** - Handle large datasets efficiently
- **Color-Coded Status** - Visual indicators for order/product status
- **Confirmation Modals** - Prevent accidental deletions
- **Real-time Updates** - Refresh data easily

## 📝 How to Use

### 1. Start the Application
```bash
# Backend (in server directory)
node src/server.js

# Frontend (in web directory)
npm run dev
```

### 2. Access Admin Panel
1. Navigate to: http://localhost:3000/admin/login
2. Enter credentials: `admin` / `admin123`
3. You'll be redirected to the dashboard

### 3. Manage Products
- Click "Products" in sidebar
- Use search/filters to find products
- Click "Add Product" to create new
- Click "Edit" to modify existing
- Click stock number to quickly update inventory
- Click "Delete" to remove (with confirmation)

### 4. Process Orders
- Click "Orders" in sidebar
- View all orders with status
- Change status dropdown to update order
- Click order ID to view details
- Filter by status (pending, processing, shipped, delivered, cancelled)

### 5. View Users
- Click "Users" in sidebar
- Search for specific customers
- Click "View Details" to see user profile and orders
- Filter by role (customer/admin)

## 🔧 Customization

### Change Default Admin Credentials
Edit `server/src/controllers/adminController.js`:
```javascript
const DEFAULT_ADMIN = {
  username: 'your_username',
  password: 'your_password',
  email: 'admin@yourdomain.com',
  role: 'admin'
};
```

### Add More Product Units
Edit `web/src/app/admin/products/new/page.js` in the unit dropdown.

### Customize Order Statuses
Edit `web/src/app/admin/orders/page.js` in the statusOptions array.

## ⚡ Quick Tips

1. **Low Stock Alerts** - Products with < 10 units show in yellow
2. **Quick Stock Update** - Click on stock number in products table
3. **Bulk Filtering** - Combine search with category/status filters
4. **Status Shortcuts** - Use dropdown in orders table for quick updates
5. **Dashboard Analytics** - Click on stat cards to filter respective pages

## 🆘 Troubleshooting

### Can't Login?
- Check that backend server is running
- Verify database connection
- Check browser console for errors

### Products Not Showing?
- Run the seed script: `node src/config/seedDb.js`
- Check products table in database
- Verify category associations

### Orders Not Updating?
- Check adminToken in localStorage
- Verify admin role in JWT token
- Check browser network tab for API errors

## 📈 Future Enhancements (Optional)

- Bulk product import/export (CSV/Excel)
- Advanced analytics with charts
- Email notifications for orders
- Product categories management
- Subscription plans management
- Customer support/messaging system
- Sales reports and export

## ✅ Testing Checklist

- [x] Admin login with default credentials
- [x] Dashboard statistics display
- [x] View all products
- [x] Add new product
- [x] Edit product
- [x] Delete product
- [x] Update stock
- [x] View orders
- [x] Update order status
- [x] View users
- [x] Search and filter functionality
- [x] Pagination works
- [x] Responsive design
- [x] Logout functionality

---

**Your admin dashboard is ready to use! 🎉**

Access it at: http://localhost:3000/admin/login
