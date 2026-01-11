// Email Service Configuration
const nodemailer = require('nodemailer');

// Create reusable transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use Gmail App Password (16 chars)
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

// Verify transporter configuration
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && 
                          process.env.EMAIL_USER !== 'your-email@gmail.com';

if (isEmailConfigured) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration error:', error.message);
      console.log('💡 To configure Gmail:');
      console.log('   1. Enable 2FA: https://myaccount.google.com/security');
      console.log('   2. Create App Password: https://myaccount.google.com/apppasswords');
      console.log('   3. Update .env: EMAIL_USER and EMAIL_PASSWORD');
    } else {
      console.log('✅ Email server ready (Gmail SMTP)');
      console.log(`📧 Sending from: ${process.env.EMAIL_USER}`);
    }
  });
} else {
  console.log('⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
}

// Email templates
const templates = {
  // OTP verification email for signup
  otpVerification: (otp) => ({
    subject: 'Verify Your Email - RuralBowl 🔐',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #22c55e; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .otp-code { font-size: 36px; font-weight: bold; color: #22c55e; letter-spacing: 8px; font-family: monospace; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Email Verification</h1>
            <p>RuralBowl - Fresh from Farm</p>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up with RuralBowl! Please use the following OTP to complete your registration:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Valid for 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Note:</strong> Never share this OTP with anyone. RuralBowl will never ask for your OTP via phone or email.
            </div>
            
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} RuralBowl. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Your RuralBowl verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
  }),

  // Welcome email for new users
  welcome: (user) => ({
    subject: 'Welcome to RuralBowl! 🌾',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .welcome-icon { font-size: 60px; margin-bottom: 10px; }
          .button { display: inline-block; padding: 14px 28px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .features { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .feature { background: white; padding: 15px; border-radius: 5px; text-align: center; }
          .feature-icon { font-size: 30px; margin-bottom: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="welcome-icon">🌾</div>
            <h1>Welcome to RuralBowl!</h1>
            <p>Fresh from farm to your doorstep</p>
          </div>
          <div class="content">
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Thank you for joining RuralBowl! We're excited to help you discover fresh, organic produce directly from local farmers.</p>
            
            <div class="features">
              <div class="feature">
                <div class="feature-icon">🥬</div>
                <strong>Fresh Vegetables</strong>
                <p style="font-size: 12px; color: #666;">Direct from farms</p>
              </div>
              <div class="feature">
                <div class="feature-icon">🍚</div>
                <strong>Organic Rice</strong>
                <p style="font-size: 12px; color: #666;">Premium quality</p>
              </div>
              <div class="feature">
                <div class="feature-icon">🥭</div>
                <strong>Seasonal Fruits</strong>
                <p style="font-size: 12px; color: #666;">Hand-picked fresh</p>
              </div>
              <div class="feature">
                <div class="feature-icon">🚚</div>
                <strong>Fast Delivery</strong>
                <p style="font-size: 12px; color: #666;">Within 24 hours</p>
              </div>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/products" class="button">
                Start Shopping
              </a>
            </center>
            
            <p style="margin-top: 30px; padding: 15px; background: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 5px;">
              <strong>💡 Pro Tip:</strong> Subscribe to our weekly plans for the freshest produce delivered automatically!
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2024 RuralBowl. All rights reserved.</p>
            <p>For support, contact us at support@ruralbowl.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  orderConfirmation: (order, user) => ({
    subject: `Order Confirmation - #${order.order_number}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; margin-top: 15px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
            <p>Thank you for your purchase</p>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Your order has been confirmed and will be delivered soon.</p>
            
            <div class="order-details">
              <h3>Order #${order.order_number}</h3>
              <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Delivery Address:</strong><br>${order.delivery_address}</p>
              
              <h4>Items:</h4>
              ${order.items.map(item => `
                <div class="item">
                  <span>${item.product_name} x ${item.quantity}</span>
                  <span>₹${item.price}</span>
                </div>
              `).join('')}
              
              <div class="total">
                <div class="item">
                  <span>Total Amount:</span>
                  <span>₹${order.total}</span>
                </div>
              </div>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard/orders/${order.id}" class="button">
                Track Your Order
              </a>
            </center>
          </div>
          <div class="footer">
            <p>&copy; 2024 RuralBowl. All rights reserved.</p>
            <p>For support, contact us at support@ruralbowl.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  orderStatusUpdate: (order, user, newStatus) => ({
    subject: `Order Status Update - #${order.order_number}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-badge { display: inline-block; padding: 8px 16px; background: #22c55e; color: white; border-radius: 20px; font-weight: bold; }
          .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Updated</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Your order #${order.order_number} status has been updated:</p>
            
            <center>
              <div class="status-badge">${newStatus.toUpperCase()}</div>
            </center>
            
            <p style="margin-top: 20px;">
              ${newStatus === 'shipped' ? 'Your order has been shipped and is on its way!' : ''}
              ${newStatus === 'delivered' ? 'Your order has been delivered. Enjoy your purchase!' : ''}
              ${newStatus === 'cancelled' ? 'Your order has been cancelled. If you have any questions, please contact support.' : ''}
            </p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard/orders/${order.id}" class="button">
                View Order Details
              </a>
            </center>
          </div>
          <div class="footer">
            <p>&copy; 2024 RuralBowl. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  lowStockAlert: (product) => ({
    subject: `⚠️ Low Stock Alert - ${product.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Stock Alert</h1>
          </div>
          <div class="content">
            <div class="alert">
              <h3>${product.name}</h3>
              <p><strong>Current Stock:</strong> ${product.stock_quantity} units</p>
              <p><strong>Category:</strong> ${product.category_name}</p>
              <p><strong>Price:</strong> ₹${product.price}</p>
            </div>
            
            <p>This product is running low on stock. Please restock soon to avoid out-of-stock situations.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/admin/products/${product.id}/edit" class="button">
                Update Stock
              </a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  passwordReset: (user, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}" class="button">
                Reset Password
              </a>
            </center>
            
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong></p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  paymentConfirmation: (order, user) => ({
    subject: `Payment Received - Order #${order.order_number}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success-icon { font-size: 60px; margin: 20px 0; }
          .payment-details { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Payment Received!</h1>
            <p>Your order is being processed</p>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>We have successfully received your payment. Your order is now being prepared for delivery.</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <div class="detail-row">
                <span>Order Number:</span>
                <strong>#${order.order_number}</strong>
              </div>
              <div class="detail-row">
                <span>Payment Method:</span>
                <strong>${order.payment_method}</strong>
              </div>
              <div class="detail-row">
                <span>Amount Paid:</span>
                <strong>₹${order.total}</strong>
              </div>
              <div class="detail-row">
                <span>Transaction Date:</span>
                <strong>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </div>
            </div>
            
            <p>Your items will be shipped within 24 hours. You'll receive a tracking notification once your order is dispatched.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard/orders/${order.id}" class="button">
                Track Order
              </a>
            </center>
          </div>
          <div class="footer">
            <p>&copy; 2024 RuralBowl. All rights reserved.</p>
            <p>Need help? Contact support@ruralbowl.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  shippingNotification: (order, user, trackingDetails) => ({
    subject: `Your Order is On The Way! 🚚 #${order.order_number}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .truck-icon { font-size: 60px; margin: 20px 0; }
          .tracking-box { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; text-align: center; }
          .tracking-number { font-size: 24px; color: #22c55e; font-weight: bold; letter-spacing: 2px; margin: 10px 0; }
          .timeline { margin: 20px 0; }
          .timeline-item { padding: 10px; border-left: 3px solid #22c55e; margin-left: 20px; position: relative; }
          .timeline-item::before { content: '●'; position: absolute; left: -9px; color: #22c55e; font-size: 16px; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="truck-icon">🚚</div>
            <h1>Your Order is On The Way!</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Great news! Your order has been shipped and is on its way to you.</p>
            
            <div class="tracking-box">
              <p style="margin: 0; color: #666;">Tracking Number</p>
              <div class="tracking-number">${trackingDetails?.trackingNumber || order.order_number}</div>
              <p style="margin: 0; color: #666; font-size: 14px;">Expected Delivery: ${trackingDetails?.estimatedDelivery || 'Within 2-3 days'}</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h4 style="margin-top: 0;">Delivery Address:</h4>
              <p style="margin: 0;">${order.shipping_address || order.delivery_address}</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard/orders/${order.id}" class="button">
                Track Your Shipment
              </a>
            </center>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              💡 <strong>Tip:</strong> Please keep your phone accessible. Our delivery partner will contact you before delivery.
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2024 RuralBowl. All rights reserved.</p>
            <p>Questions? Contact us at support@ruralbowl.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  deliveryConfirmation: (order, user) => ({
    subject: `Delivered! 🎉 Order #${order.order_number}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .celebration-icon { font-size: 80px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .feedback-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="celebration-icon">🎉</div>
            <h1>Order Delivered!</h1>
            <p>We hope you love your purchase</p>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Your order #${order.order_number} has been successfully delivered. We hope everything arrived fresh and in perfect condition!</p>
            
            <div class="feedback-box">
              <h4 style="margin-top: 0;">⭐ How was your experience?</h4>
              <p style="margin-bottom: 15px;">Your feedback helps us improve and serve you better.</p>
              <center>
                <a href="${process.env.FRONTEND_URL}/dashboard/orders/${order.id}/review" class="button">
                  Rate Your Order
                </a>
              </center>
            </div>
            
            <p style="margin-top: 30px;">Thank you for choosing RuralBowl! We look forward to serving you again.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/products" class="button">
                Shop Again
              </a>
            </center>
          </div>
          <div class="footer">
            <p>&copy; 2024 RuralBowl. All rights reserved.</p>
            <p>Contact us: support@ruralbowl.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  orderCancellation: (order, user, reason) => ({
    subject: `Order Cancelled - #${order.order_number}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .refund-info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Your order #${order.order_number} has been cancelled.</p>
            
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            
            <div class="refund-info">
              <h4 style="margin-top: 0;">💰 Refund Information</h4>
              <p>Amount: <strong>₹${order.total}</strong></p>
              <p>If payment was already processed, your refund will be initiated within 3-5 business days.</p>
              <p>Refund will be credited to your original payment method.</p>
            </div>
            
            <p>We're sorry to see you go! If you have any questions or concerns, please don't hesitate to reach out to our support team.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/products" class="button">
                Continue Shopping
              </a>
            </center>
          </div>
          <div class="footer">
            <p>&copy; 2024 RuralBowl. All rights reserved.</p>
            <p>Need help? Contact support@ruralbowl.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  newOrderAlert: (order, user) => ({
    subject: `🔔 New Order Received - #${order.order_number}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-summary { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .urgent { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Order Received</h1>
          </div>
          <div class="content">
            <div class="urgent">
              <strong>⚡ Action Required:</strong> New order needs processing
            </div>
            
            <div class="order-summary">
              <h3>Order #${order.order_number}</h3>
              <p><strong>Customer:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
              <p><strong>Total Amount:</strong> ₹${order.total}</p>
              <p><strong>Payment Method:</strong> ${order.payment_method}</p>
              <p><strong>Items:</strong> ${order.items?.length || 0} items</p>
              <p><strong>Order Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/admin/orders/${order.id}" class="button">
                Process Order
              </a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send email function
const sendEmail = async (to, template) => {
  // Skip if email not configured
  if (!isEmailConfigured) {
    console.log('⚠️  Email not configured, skipping email send');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"RuralBowl" <${process.env.EMAIL_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    });
    
    console.log('✅ Email sent to', to, '- ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Export functions
module.exports = {
  sendEmail,
  templates,
  isEmailConfigured,
  
  // OTP Email
  sendOTPEmail: async (to, otp) => {
    return sendEmail(to, templates.otpVerification(otp));
  },
  
  // User Journey Emails
  sendWelcomeEmail: async (to, user) => {
    return sendEmail(to, templates.welcome(user));
  },
  
  sendPasswordReset: async (to, user, resetToken) => {
    return sendEmail(to, templates.passwordReset(user, resetToken));
  },
  
  // Order Journey Emails
  sendOrderConfirmation: async (to, order, user) => {
    return sendEmail(to, templates.orderConfirmation(order, user));
  },
  
  sendPaymentConfirmation: async (to, order, user) => {
    return sendEmail(to, templates.paymentConfirmation(order, user));
  },
  
  sendShippingNotification: async (to, order, user, trackingDetails) => {
    return sendEmail(to, templates.shippingNotification(order, user, trackingDetails));
  },
  
  sendDeliveryConfirmation: async (to, order, user) => {
    return sendEmail(to, templates.deliveryConfirmation(order, user));
  },
  
  sendOrderCancellation: async (to, order, user, reason) => {
    return sendEmail(to, templates.orderCancellation(order, user, reason));
  },
  
  sendOrderStatusUpdate: async (to, order, user, newStatus) => {
    return sendEmail(to, templates.orderStatusUpdate(order, user, newStatus));
  },
  
  // Admin Notifications
  sendNewOrderAlert: async (order, user) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    return sendEmail(adminEmail, templates.newOrderAlert(order, user));
  },
  
  sendLowStockAlert: async (product) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    return sendEmail(adminEmail, templates.lowStockAlert(product));
  },
};
