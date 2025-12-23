const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    // Provide clearer error messages for easier debugging
    if (error && error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Fallback - log in development to assist troubleshooting
    if (process.env.NODE_ENV !== 'production') {
      console.error('Auth middleware error:', error && error.stack ? error.stack : error);
    }

    return res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

module.exports = { authMiddleware, adminMiddleware };
