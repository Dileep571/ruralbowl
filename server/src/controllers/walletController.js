const db = require('../config/database');

// Get or Create Wallet for User
const getOrCreateWallet = async (userId, client = null) => {
  const dbClient = client || db;
  
  let walletResult = await dbClient.query(
    'SELECT * FROM wallets WHERE user_id = $1',
    [userId]
  );

  if (walletResult.rows.length === 0) {
    // Create wallet if doesn't exist
    walletResult = await dbClient.query(
      'INSERT INTO wallets (user_id, balance) VALUES ($1, 0) RETURNING *',
      [userId]
    );
  }

  return walletResult.rows[0];
};

// Get Wallet Balance
const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await getOrCreateWallet(userId);

    res.json({
      balance: parseFloat(wallet.balance),
      currency: wallet.currency,
      is_active: wallet.is_active,
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Wallet with Recent Transactions
const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await getOrCreateWallet(userId);

    // Get recent transactions (last 10)
    const transactionsResult = await db.query(
      `SELECT * FROM wallet_transactions 
       WHERE wallet_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [wallet.id]
    );

    res.json({
      balance: parseFloat(wallet.balance),
      currency: wallet.currency,
      is_active: wallet.is_active,
      recent_transactions: transactionsResult.rows.map(t => ({
        ...t,
        amount: parseFloat(t.amount),
        balance_before: parseFloat(t.balance_before),
        balance_after: parseFloat(t.balance_after),
      })),
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Wallet Transactions (Paginated)
const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    const wallet = await getOrCreateWallet(userId);

    let query = `
      SELECT * FROM wallet_transactions 
      WHERE wallet_id = $1
    `;
    const params = [wallet.id];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    const countQuery = type 
      ? 'SELECT COUNT(*) FROM wallet_transactions WHERE wallet_id = $1 AND type = $2'
      : 'SELECT COUNT(*) FROM wallet_transactions WHERE wallet_id = $1';
    const countParams = type ? [wallet.id, type] : [wallet.id];
    const countResult = await db.query(countQuery, countParams);

    res.json({
      transactions: result.rows.map(t => ({
        ...t,
        amount: parseFloat(t.amount),
        balance_before: parseFloat(t.balance_before),
        balance_after: parseFloat(t.balance_after),
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add Money to Wallet
const addMoneyToWallet = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const userId = req.user.id;
    const { amount, payment_id, payment_method = 'razorpay' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    await client.query('BEGIN');

    const wallet = await getOrCreateWallet(userId, client);
    const balanceBefore = parseFloat(wallet.balance);
    const balanceAfter = balanceBefore + parseFloat(amount);

    // Update wallet balance
    await client.query(
      'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [balanceAfter, wallet.id]
    );

    // Record transaction
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount, balance_before, balance_after, description, reference_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        wallet.id,
        'credit',
        amount,
        balanceBefore,
        balanceAfter,
        'Money added to wallet',
        payment_id,
        JSON.stringify({ payment_method }),
      ]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Money added successfully',
      balance: balanceAfter,
      transaction: {
        type: 'credit',
        amount: parseFloat(amount),
        balance_after: balanceAfter,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add money to wallet error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// Internal: Credit Wallet (used by other controllers)
const creditWallet = async (userId, amount, description, metadata = {}, client = null) => {
  const dbClient = client || db;
  const useTransaction = !client;

  try {
    if (useTransaction && dbClient.query) {
      await dbClient.query('BEGIN');
    }

    const wallet = await getOrCreateWallet(userId, dbClient);
    const balanceBefore = parseFloat(wallet.balance);
    const balanceAfter = balanceBefore + parseFloat(amount);

    // Update wallet balance
    await dbClient.query(
      'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [balanceAfter, wallet.id]
    );

    // Record transaction
    const result = await dbClient.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount, balance_before, balance_after, description, metadata, order_id, user_plan_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        wallet.id,
        'credit',
        amount,
        balanceBefore,
        balanceAfter,
        description,
        JSON.stringify(metadata),
        metadata.order_id || null,
        metadata.user_plan_id || null,
      ]
    );

    if (useTransaction && dbClient.query) {
      await dbClient.query('COMMIT');
    }

    return {
      success: true,
      balance: balanceAfter,
      transaction: result.rows[0],
    };
  } catch (error) {
    if (useTransaction && dbClient.query) {
      await dbClient.query('ROLLBACK');
    }
    console.error('Credit wallet error:', error);
    throw error;
  }
};

// Internal: Debit Wallet (used during checkout)
const debitWallet = async (userId, amount, description, metadata = {}, client = null) => {
  const dbClient = client || db;
  const useTransaction = !client;

  try {
    if (useTransaction && dbClient.query) {
      await dbClient.query('BEGIN');
    }

    const wallet = await getOrCreateWallet(userId, dbClient);
    const balanceBefore = parseFloat(wallet.balance);

    if (balanceBefore < parseFloat(amount)) {
      throw new Error('Insufficient wallet balance');
    }

    const balanceAfter = balanceBefore - parseFloat(amount);

    // Update wallet balance
    await dbClient.query(
      'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [balanceAfter, wallet.id]
    );

    // Record transaction
    const result = await dbClient.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount, balance_before, balance_after, description, metadata, order_id, user_plan_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        wallet.id,
        'debit',
        amount,
        balanceBefore,
        balanceAfter,
        description,
        JSON.stringify(metadata),
        metadata.order_id || null,
        metadata.user_plan_id || null,
      ]
    );

    if (useTransaction && dbClient.query) {
      await dbClient.query('COMMIT');
    }

    return {
      success: true,
      balance: balanceAfter,
      transaction: result.rows[0],
    };
  } catch (error) {
    if (useTransaction && dbClient.query) {
      await dbClient.query('ROLLBACK');
    }
    console.error('Debit wallet error:', error);
    throw error;
  }
};

// Check if user has sufficient wallet balance
const checkWalletBalance = async (userId, requiredAmount) => {
  try {
    const wallet = await getOrCreateWallet(userId);
    return parseFloat(wallet.balance) >= parseFloat(requiredAmount);
  } catch (error) {
    console.error('Check wallet balance error:', error);
    return false;
  }
};

module.exports = {
  getWalletBalance,
  getWallet,
  getWalletTransactions,
  addMoneyToWallet,
  creditWallet,
  debitWallet,
  checkWalletBalance,
  getOrCreateWallet,
};
