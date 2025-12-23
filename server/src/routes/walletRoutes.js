const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authMiddleware } = require('../middleware/auth');

// All wallet routes require authentication
router.use(authMiddleware);

// Get wallet balance
router.get('/balance', walletController.getWalletBalance);

// Get wallet with recent transactions
router.get('/', walletController.getWallet);

// Get all transactions (paginated)
router.get('/transactions', walletController.getWalletTransactions);

// Add money to wallet
router.post('/add', walletController.addMoneyToWallet);

module.exports = router;
