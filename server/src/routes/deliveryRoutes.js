const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const adminAuth = require('../middleware/adminAuth');

// Public routes
// Get all active delivery areas
router.get('/areas', deliveryController.getDeliveryAreas);

// Check delivery availability for specific area
router.get('/areas/:areaId/check', deliveryController.checkDeliveryAvailability);

// Admin routes - using same adminAuth middleware as other admin routes
// Get all delivery areas (including inactive)
router.get('/admin/areas', adminAuth, deliveryController.getAllDeliveryAreas);

// Create new delivery area
router.post('/admin/areas', adminAuth, deliveryController.createDeliveryArea);

// Update delivery area
router.put('/admin/areas/:id', adminAuth, deliveryController.updateDeliveryArea);

// Delete delivery area
router.delete('/admin/areas/:id', adminAuth, deliveryController.deleteDeliveryArea);

// Toggle area active status
router.patch('/admin/areas/:id/toggle', adminAuth, deliveryController.toggleAreaStatus);

// Get delivery statistics
router.get('/admin/stats', adminAuth, deliveryController.getDeliveryStats);

module.exports = router;
