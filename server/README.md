# RuralBowl Backend API

Node.js backend API for the RuralBowl e-commerce application with PostgreSQL database.

## Features

- User authentication (JWT-based)
- Product management with categories
- Shopping cart functionality
- Order processing and management
- Delivery calendar scheduling
- Subscription plans management
- Admin panel support

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator

## Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database:
```sql
CREATE DATABASE ruralbowl_db;
```

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials and other settings:
```
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ruralbowl_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:3000
```

5. Initialize the database (create tables):
```bash
npm run init-db
```

## Running the Application

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Products
- `GET /api/products` - Get all products (supports filtering)
- `GET /api/products/:id` - Get single product
- `GET /api/products/categories` - Get all categories
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Cart
- `GET /api/cart` - Get user cart (protected)
- `POST /api/cart` - Add item to cart (protected)
- `PUT /api/cart/:id` - Update cart item (protected)
- `DELETE /api/cart/:id` - Remove item from cart (protected)
- `DELETE /api/cart` - Clear cart (protected)

### Orders
- `POST /api/orders` - Create order (protected)
- `GET /api/orders` - Get user orders (protected)
- `GET /api/orders/:id` - Get single order (protected)
- `GET /api/orders/all` - Get all orders (admin only)
- `PUT /api/orders/:id` - Update order status (admin only)

### Dashboard
- `GET /api/dashboard/calendar` - Get delivery calendar (protected)
- `POST /api/dashboard/calendar` - Add delivery schedule (protected)
- `PUT /api/dashboard/calendar/:id` - Update delivery status (protected)
- `GET /api/dashboard/subscription/plans` - Get subscription plans (protected)
- `GET /api/dashboard/subscription` - Get user subscription (protected)
- `POST /api/dashboard/subscription` - Subscribe to plan (protected)

### Health Check
- `GET /api/health` - Check API status

## Database Schema

### Tables:
- **users** - User accounts
- **categories** - Product categories
- **products** - Product catalog
- **cart** - Shopping cart items
- **orders** - Customer orders
- **order_items** - Order line items
- **subscription_plans** - Available subscription plans
- **user_subscriptions** - User subscription records
- **delivery_calendar** - Scheduled deliveries

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- CORS configuration
- Input validation
- SQL injection prevention (parameterized queries)
- Role-based access control (Admin/User)

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── database.js        # Database connection
│   │   └── initDb.js          # Database initialization
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   └── dashboardRoutes.js
│   └── server.js              # Main application file
├── .env.example
├── .gitignore
└── package.json
```

## Development Tips

1. Use Postman or similar tool to test API endpoints
2. Check logs for debugging information
3. Use `npm run dev` for development with auto-reload
4. Keep your `.env` file secure and never commit it to version control

## License

ISC
