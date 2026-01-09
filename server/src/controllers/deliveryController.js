const db = require('../config/database');

// Helper function to calculate expected delivery date
const calculateDeliveryDate = (orderTime = new Date()) => {
  const order = new Date(orderTime);
  const hour = order.getHours();
  
  // If order placed before 6 PM (18:00), deliver next day
  // If order placed after 6 PM, deliver day after tomorrow
  const daysToAdd = hour < 18 ? 1 : 2;
  
  const deliveryDate = new Date(order);
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
  
  // Format date in local timezone (YYYY-MM-DD)
  const year = deliveryDate.getFullYear();
  const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
  const day = String(deliveryDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Get all active delivery areas (Public)
const getDeliveryAreas = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, area_name, city, state, pincode 
       FROM delivery_areas 
       WHERE is_active = TRUE 
       ORDER BY area_name ASC`
    );

    res.json({
      success: true,
      areas: result.rows,
      message: `Currently serving ${result.rows.length} areas in Chittoor, Andhra Pradesh`
    });
  } catch (error) {
    console.error('Get delivery areas error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch delivery areas' });
  }
};

// Check if delivery is available for an area (Public)
const checkDeliveryAvailability = async (req, res) => {
  try {
    const { areaId } = req.params;

    const result = await db.query(
      'SELECT * FROM delivery_areas WHERE id = $1 AND is_active = TRUE',
      [areaId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        available: false,
        message: 'Delivery not available in this area'
      });
    }

    const expectedDelivery = calculateDeliveryDate();
    const currentHour = new Date().getHours();
    const deliveryMessage = currentHour < 18 
      ? 'Order before 6 PM for next-day delivery'
      : 'Orders after 6 PM will be delivered day after tomorrow';

    res.json({
      success: true,
      available: true,
      area: result.rows[0],
      expectedDelivery,
      deliveryMessage
    });
  } catch (error) {
    console.error('Check delivery availability error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all delivery areas (Admin)
const getAllDeliveryAreas = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, area_name, city, state, pincode, is_active, 
              created_at, updated_at
       FROM delivery_areas 
       ORDER BY is_active DESC, area_name ASC`
    );

    res.json({
      success: true,
      areas: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get all delivery areas error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch delivery areas' });
  }
};

// Create new delivery area (Admin)
const createDeliveryArea = async (req, res) => {
  try {
    const { area_name, city, state, pincode } = req.body;

    if (!area_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Area name is required' 
      });
    }

    // Check if area already exists
    const existing = await db.query(
      'SELECT * FROM delivery_areas WHERE LOWER(area_name) = LOWER($1)',
      [area_name]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This area already exists' 
      });
    }

    const result = await db.query(
      `INSERT INTO delivery_areas (area_name, city, state, pincode, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING *`,
      [area_name, city || 'Chittoor', state || 'Andhra Pradesh', pincode]
    );

    res.status(201).json({
      success: true,
      message: 'Delivery area added successfully',
      area: result.rows[0]
    });
  } catch (error) {
    console.error('Create delivery area error:', error);
    res.status(500).json({ success: false, message: 'Failed to create delivery area' });
  }
};

// Update delivery area (Admin)
const updateDeliveryArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { area_name, city, state, pincode, is_active } = req.body;

    const result = await db.query(
      `UPDATE delivery_areas 
       SET area_name = COALESCE($1, area_name),
           city = COALESCE($2, city),
           state = COALESCE($3, state),
           pincode = COALESCE($4, pincode),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [area_name, city, state, pincode, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery area not found' 
      });
    }

    res.json({
      success: true,
      message: 'Delivery area updated successfully',
      area: result.rows[0]
    });
  } catch (error) {
    console.error('Update delivery area error:', error);
    res.status(500).json({ success: false, message: 'Failed to update delivery area' });
  }
};

// Delete delivery area (Admin)
const deleteDeliveryArea = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any orders exist for this area
    const ordersCheck = await db.query(
      'SELECT COUNT(*) as count FROM orders WHERE delivery_area_id = $1',
      [id]
    );

    if (parseInt(ordersCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete area with existing orders. Deactivate instead.' 
      });
    }

    const result = await db.query(
      'DELETE FROM delivery_areas WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery area not found' 
      });
    }

    res.json({
      success: true,
      message: 'Delivery area deleted successfully'
    });
  } catch (error) {
    console.error('Delete delivery area error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete delivery area' });
  }
};

// Toggle area status (Admin)
const toggleAreaStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE delivery_areas 
       SET is_active = NOT is_active,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery area not found' 
      });
    }

    res.json({
      success: true,
      message: `Area ${result.rows[0].is_active ? 'activated' : 'deactivated'} successfully`,
      area: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle area status error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle area status' });
  }
};

// Get delivery statistics (Admin)
const getDeliveryStats = async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        da.id,
        da.area_name,
        da.city,
        COUNT(o.id) as total_orders,
        COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders
      FROM delivery_areas da
      LEFT JOIN orders o ON da.id = o.delivery_area_id
      WHERE da.is_active = TRUE
      GROUP BY da.id, da.area_name, da.city
      ORDER BY total_orders DESC
    `);

    res.json({
      success: true,
      stats: stats.rows
    });
  } catch (error) {
    console.error('Get delivery stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch delivery statistics' });
  }
};

module.exports = {
  getDeliveryAreas,
  checkDeliveryAvailability,
  getAllDeliveryAreas,
  createDeliveryArea,
  updateDeliveryArea,
  deleteDeliveryArea,
  toggleAreaStatus,
  getDeliveryStats,
  calculateDeliveryDate
};
