# RuralBowl - Farm Fresh E-Commerce Platform

A full-stack e-commerce application for delivering fresh farm produce directly to customers, built with Next.js and Node.js/Express.

## Features

### Customer Features
- 🛒 Browse and purchase fresh farm products
- 📦 Order tracking and management
- 🔐 Secure authentication (JWT with refresh tokens)
- 💳 Shopping cart with session persistence
- 📧 Email notifications at every order stage
- 📱 Responsive design for all devices
- 🔍 Product search and category filtering
- 📋 User dashboard with order history

### Admin Features
- 📊 Comprehensive admin dashboard
- 📦 Order management with status updates
- 🛍️ Product management (CRUD operations)
- 👥 User management
- 📑 Category management
- 📧 Automated email notifications to customers

### Email Notifications
- Welcome email on registration
- Order confirmation
- Payment confirmation
- Shipping notification
- Delivery confirmation
- Order cancellation
- Order status updates
- Low stock alerts (admin)
- New order alerts (admin)

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT with refresh tokens
- **Email**: Nodemailer with Gmail SMTP

## Project Structure

```
ruralbowl_app/
├── server/              # Backend API
│   ├── src/
│   │   ├── config/      # Database and initialization
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Email and other services
│   │   └── server.js    # Entry point
│   └── package.json
│
└── web/                 # Frontend application
    ├── public/          # Static assets
    ├── src/
    │   ├── app/         # Next.js pages (App Router)
    │   ├── components/  # Reusable components
    │   ├── lib/         # API clients and utilities
    │   └── styles/      # Global styles
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Gmail account (for email service)

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE ruralbowldb;
```

2. Update database configuration in `server/src/config/database.js`

3. Initialize the database:
```bash
cd server
node src/config/initDb.js
```

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ruralbowldb
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

4. Start the server:
```bash
npm run dev
```

The API will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will run on `http://localhost:3000`

## Email Configuration

To enable email notifications:

1. Generate a Gmail App Password:
   - Go to Google Account settings
   - Enable 2-Factor Authentication
   - Generate an App Password
   - Use this password in the `EMAIL_PASSWORD` environment variable

2. The email service will automatically send notifications for:
   - User registration
   - Order placement
   - Payment confirmation
   - Shipping updates
   - Delivery confirmation
   - Order status changes

## Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

**Note**: Change these credentials after first login!

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/refresh` - Refresh access token
- POST `/api/auth/logout` - Logout

### Products
- GET `/api/products` - Get all products
- GET `/api/products/:slug` - Get product by slug
- POST `/api/products` - Create product (admin)
- PUT `/api/products/:id` - Update product (admin)
- DELETE `/api/products/:id` - Delete product (admin)

### Cart
- GET `/api/cart` - Get user cart
- POST `/api/cart` - Add to cart
- PUT `/api/cart/:productId` - Update cart item
- DELETE `/api/cart/:productId` - Remove from cart

### Orders
- GET `/api/orders` - Get user orders
- GET `/api/orders/:id` - Get order by ID
- POST `/api/orders` - Create order

### Admin
- POST `/api/admin/login` - Admin login
- GET `/api/admin/dashboard/stats` - Dashboard statistics
- GET `/api/admin/orders` - Get all orders
- GET `/api/admin/orders/:id` - Get order details
- PATCH `/api/admin/orders/:id/status` - Update order status
- GET `/api/admin/users` - Get all users
- GET `/api/admin/products` - Get all products

## Categories

Currently configured with 2 main categories:
- **Vegetables** - Fresh farm vegetables
- **Rice** - Premium quality rice varieties

## Features in Detail

### Order Flow with Email Notifications
1. Customer places order → Order confirmation email sent
2. Payment processed → Payment confirmation email sent
3. Order status updated → Status update email sent
4. Order shipped → Shipping notification with tracking
5. Order delivered → Delivery confirmation email
6. Order cancelled (if applicable) → Cancellation email

### Admin Dashboard
- Real-time statistics
- Order management with bulk actions
- Product inventory management
- User management
- Email notification tracking

## Development

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd web
npm test
```

### Building for Production

#### Backend
```bash
cd server
npm start
```

#### Frontend
```bash
cd web
npm run build
npm start
```

## Security Features

- JWT-based authentication
- HTTP-only cookies for refresh tokens
- Password hashing with bcrypt
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting (recommended for production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary and confidential.

## Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ for connecting farmers with customers**
