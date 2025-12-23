# RuralBowl Backend API

Node.js + Express + PostgreSQL backend for the RuralBowl e-commerce application.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Create a database named `ruralbowl`

## Setup Instructions

### 1. Install PostgreSQL (if not already installed)

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Run the installer and follow the prompts
- Remember your postgres user password

**Using psql to create database:**
```sql
psql -U postgres
CREATE DATABASE ruralbowl;
\q
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ruralbowl
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Run Database Migrations

This creates all the necessary tables:

```bash
npm run db:migrate
```

### 5. Seed Initial Data

This populates the database with sample data (categories, products, subscription plans):

```bash
npm run db:seed
```

### 6. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The API will be available at `http://localhost:5000/api`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)
- `PUT /api/auth/profile` - Update profile (requires auth)

### Products
- `GET /api/products` - List all products (supports `?category=`, `?search=`, `?featured=true`)
- `GET /api/products/:id` - Get single product
- `GET /api/products/categories` - Get all categories

### Cart (requires auth)
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Orders (requires auth)
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order

### Subscriptions
- `GET /api/subscriptions/plans` - Get all subscription plans (public)
- `GET /api/subscriptions` - Get user's active subscription (requires auth)
- `POST /api/subscriptions/purchase` - Subscribe to a plan (requires auth)
- `POST /api/subscriptions/:id/cancel` - Cancel subscription (requires auth)
- `POST /api/subscriptions/:id/pause` - Pause subscription (requires auth)
- `POST /api/subscriptions/:id/resume` - Resume subscription (requires auth)

### Dashboard (requires auth)
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/calendar` - Get delivery calendar

### Admin (requires admin auth)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET/POST/PUT/DELETE /api/admin/products` - Product management
- `GET/POST/PUT/DELETE /api/admin/categories` - Category management
- `GET/PATCH /api/admin/orders` - Order management
- `GET/POST/PUT/DELETE /api/admin/subscription-plans` - Plan management
- `GET /api/admin/users` - User management

## Database Reset

To completely reset the database (drop all tables and data):

```bash
npm run db:reset
npm run db:migrate
npm run db:seed
```

## Default Admin Credentials

- Username: `admin`
- Password: `admin123`

**⚠️ Change these in production!**

## Adding New Subscription Plans

You can add new subscription plans via:

1. **Admin API:**
```bash
POST /api/admin/subscription-plans
{
  "name": "Quarterly Plan",
  "description": "3-month vegetable subscription",
  "price": 2499,
  "original_price": 2999,
  "interval": "3 months",
  "duration": "3 months",
  "features": ["Feature 1", "Feature 2"],
  "items": ["Item 1", "Item 2"],
  "is_popular": false
}
```

2. **Direct SQL:**
```sql
INSERT INTO subscription_plans (name, slug, description, price, original_price, interval, duration, features, items, is_popular)
VALUES ('Quarterly Plan', 'quarterly', 'Description here', 2499, 2999, '3 months', '3 months', 
        ARRAY['Feature 1', 'Feature 2'], ARRAY['Item 1', 'Item 2'], false);
```

3. **Seed file:** Edit `src/db/seed.js` and add to the `plans` array, then run `npm run db:seed`
