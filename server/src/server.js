const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Validate required environment variables
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const walletRoutes = require('./routes/walletRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const otpRoutes = require('./routes/otpRoutes');

// Initialize app
const app = express();

// Security middleware - add helmet for production
if (isProduction) {
  app.use(helmet());
}

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || allowed.startsWith(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Trust proxy in production (for rate limiting behind reverse proxy)
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging - less verbose in production
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Rate limiting for auth routes (prevent brute force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Higher limit in development
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Much higher limit in development
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/login', authLimiter); // Only apply strict rate limit to admin login
app.use('/api/admin', adminRoutes);
app.use('/api', reviewRoutes);
app.use('/api', couponRoutes);
app.use('/api', wishlistRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/otp', authLimiter, otpRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RuralBowl API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start subscription scheduler
const { startScheduler } = require('./services/subscriptionScheduler');

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${isProduction ? 'PRODUCTION' : 'development'} mode`);
  if (!isProduction) {
    console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  }
  
  // Start cron jobs
  startScheduler();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
