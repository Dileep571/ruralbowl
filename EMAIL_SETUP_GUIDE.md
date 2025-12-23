# 📧 Gmail SMTP Email Setup Guide

## Overview
Your application now sends automated email notifications at every step of the customer journey using Gmail SMTP.

## ✅ Email Notifications Implemented

### **Customer Journey Emails:**
1. **Welcome Email** 🎉
   - Sent immediately after user registration
   - Introduces the platform and features
   - Encourages first purchase

2. **Order Confirmation** ✅
   - Sent when order is placed
   - Includes order details, items, and total amount
   - Provides order tracking link

3. **Payment Confirmation** 💳
   - Sent after payment is processed
   - Shows payment details and receipt
   - Confirms order is being prepared

4. **Shipping Notification** 🚚
   - Sent when order status changes to "shipped"
   - Includes tracking number
   - Shows estimated delivery date

5. **Delivery Confirmation** 🎉
   - Sent when order is delivered
   - Requests feedback/review
   - Encourages repeat purchase

6. **Order Status Updates** 📦
   - Sent for processing status changes
   - Keeps customer informed

7. **Order Cancellation** ❌
   - Sent when order is cancelled
   - Explains refund process
   - Includes cancellation reason if provided

8. **Password Reset** 🔐
   - Sent when user requests password reset
   - Secure token link (expires in 1 hour)

### **Admin Notifications:**
1. **New Order Alert** 🔔
   - Sent to admin when new order is placed
   - Includes customer details and order summary
   - Quick link to process order

2. **Low Stock Alert** ⚠️
   - Sent when product stock is low
   - Helps prevent out-of-stock situations

---

## 🔧 Gmail SMTP Setup (Required)

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Find **"2-Step Verification"**
3. Click **"Get Started"** and follow instructions
4. Enable 2FA (required for App Passwords)

### Step 2: Generate Gmail App Password
1. Go to: https://myaccount.google.com/apppasswords
   - Or search "App passwords" in Google Account settings
2. Select **"Mail"** as the app
3. Select **"Other"** as the device
4. Enter name: `RuralBowl App`
5. Click **"Generate"**
6. **Copy the 16-character password** (shown as: `xxxx xxxx xxxx xxxx`)
   - ⚠️ Save it immediately! It won't be shown again

### Step 3: Update Environment Variables

Edit `server/.env`:

```env
# Email Configuration (Gmail SMTP)
EMAIL_USER=your-gmail@gmail.com          # Your Gmail address
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx       # 16-char App Password from Step 2
ADMIN_EMAIL=admin@ruralbowl.com          # Admin email for notifications
```

**Example:**
```env
EMAIL_USER=ruralbowl.orders@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
ADMIN_EMAIL=admin@ruralbowl.com
```

### Step 4: Restart Server
```powershell
cd server
npm run dev
```

**Expected output:**
```
✅ Email server ready (Gmail SMTP)
📧 Sending from: your-email@gmail.com
```

---

## 🧪 Testing Email Notifications

### Test 1: Welcome Email
1. Register a new account at: http://localhost:3000/auth/signup
2. Check inbox for welcome email
3. Should arrive within seconds

### Test 2: Order Confirmation & Payment
1. Add products to cart
2. Complete checkout
3. Check inbox for:
   - Order confirmation email
   - Payment confirmation email
4. Admin should receive new order alert

### Test 3: Shipping Notification
1. Login as admin
2. Go to Orders page
3. Change order status to "shipped"
4. Customer receives shipping notification

### Test 4: Delivery Confirmation
1. Change order status to "delivered"
2. Customer receives delivery confirmation
3. Includes request for review

### Test 5: Order Cancellation
1. Change order status to "cancelled"
2. Customer receives cancellation email
3. Includes refund information

---

## 🛠️ Configuration Options

### Change Sender Name
Edit `server/src/services/emailService.js`:

```javascript
from: `"Your Store Name" <${process.env.EMAIL_USER}>`,
```

### Customize Email Templates
Edit templates in `server/src/services/emailService.js`:

```javascript
const templates = {
  welcome: (user) => ({
    subject: 'Your Custom Subject',
    html: `Your custom HTML...`
  }),
  // ... other templates
}
```

### Disable Specific Emails
Comment out email calls in controllers if not needed:

```javascript
// await emailService.sendWelcomeEmail(user.email, user);
```

---

## 🚨 Troubleshooting

### Error: "Invalid credentials"
**Cause:** Wrong email or App Password

**Solution:**
1. Verify EMAIL_USER is your full Gmail address
2. Generate new App Password (not regular password)
3. Copy password without spaces: `abcdefghijklmnop`
4. Restart server

### Error: "Connection timeout"
**Cause:** Firewall or network blocking SMTP

**Solution:**
1. Check firewall allows port 587
2. Try port 465 (change in emailService.js):
   ```javascript
   port: 465,
   secure: true,
   ```

### Emails Not Sending
**Check:**
```javascript
// In server console:
✅ Email server ready (Gmail SMTP)  // Should see this
📧 Sending from: your-email@gmail.com

// After action (signup/order):
✅ Email sent to user@example.com - ID: <message-id>
```

**If not configured:**
```javascript
⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env
```

### Emails Going to Spam
**Solutions:**
1. Add your domain to SPF record
2. Use a custom domain email (business email)
3. Ask users to whitelist your email
4. Avoid spam trigger words in subject

### Gmail Daily Limit
**Free Gmail accounts:**
- 500 emails/day
- 100 external recipients/day

**Google Workspace (paid):**
- 2,000 emails/day

**Solution for high volume:**
- Use professional email service:
  - SendGrid (100 emails/day free)
  - Mailgun (1,000 emails/month free)
  - AWS SES (62,000 emails/month free)

---

## 🔒 Security Best Practices

### ✅ Do's
- ✅ Use App Passwords (never regular password)
- ✅ Keep credentials in .env (not in code)
- ✅ Add .env to .gitignore
- ✅ Rotate App Passwords periodically
- ✅ Use separate Gmail account for app

### ❌ Don'ts
- ❌ Never commit EMAIL_PASSWORD to git
- ❌ Don't use personal Gmail for production
- ❌ Don't share App Passwords
- ❌ Don't store passwords in plain text

---

## 📊 Email Tracking (Optional)

Add tracking to see who opens emails:

### Option 1: Gmail Read Receipts
Enable in Gmail settings (limited)

### Option 2: Third-party Services
- **SendGrid** - Built-in analytics
- **Mailgun** - Click/open tracking
- **PostMark** - Delivery tracking

### Option 3: Custom Tracking Pixel
Add to email templates:
```html
<img src="${process.env.FRONTEND_URL}/api/track/email/${order.id}" width="1" height="1" />
```

---

## 🚀 Production Deployment

### Switch to Professional Email Service

#### Option 1: SendGrid (Recommended)
```bash
npm install @sendgrid/mail
```

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const transporter = {
  sendMail: async (mailOptions) => {
    return sgMail.send({
      to: mailOptions.to,
      from: mailOptions.from,
      subject: mailOptions.subject,
      html: mailOptions.html,
    });
  }
};
```

#### Option 2: AWS SES
```bash
npm install aws-sdk
```

```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });
```

#### Option 3: Keep Gmail (Small Scale)
- Works for up to 500 emails/day
- Free and reliable
- Good for MVP/testing

---

## 📝 Email Template Customization

### Add Your Logo
Replace in all templates:
```html
<img src="${process.env.FRONTEND_URL}/images/logo.png" alt="RuralBowl" style="max-width: 150px;" />
```

### Brand Colors
Update hex codes:
```javascript
background: #22c55e;  // Your brand color
```

### Add Social Links
Add to footer:
```html
<div class="social-links">
  <a href="https://facebook.com/ruralbowl">Facebook</a>
  <a href="https://instagram.com/ruralbowl">Instagram</a>
  <a href="https://twitter.com/ruralbowl">Twitter</a>
</div>
```

---

## 📱 Mobile Responsive Emails

All templates are mobile-responsive. Test on:
- Gmail app (iOS/Android)
- Outlook mobile
- Apple Mail
- Yahoo Mail

---

## ✅ Quick Checklist

Before going live:

- [ ] Gmail 2FA enabled
- [ ] App Password generated
- [ ] EMAIL_USER set in .env
- [ ] EMAIL_PASSWORD set in .env
- [ ] ADMIN_EMAIL configured
- [ ] Server restarted
- [ ] Test welcome email (signup)
- [ ] Test order emails (place order)
- [ ] Test status updates (change order status)
- [ ] Check spam folder
- [ ] Verify all emails look good on mobile
- [ ] Add logo to templates (optional)
- [ ] Customize brand colors (optional)
- [ ] Set up custom domain (optional)

---

## 🆘 Support

### If Emails Still Not Working:

1. **Check server logs:**
   ```powershell
   cd server
   npm run dev
   # Look for: ✅ Email server ready (Gmail SMTP)
   ```

2. **Test transporter manually:**
   ```javascript
   // In server/src/services/emailService.js
   transporter.sendMail({
     from: process.env.EMAIL_USER,
     to: 'your-test-email@gmail.com',
     subject: 'Test Email',
     text: 'Testing Gmail SMTP'
   }, (error, info) => {
     console.log(error || 'Email sent: ' + info.messageId);
   });
   ```

3. **Verify credentials:**
   ```javascript
   console.log('EMAIL_USER:', process.env.EMAIL_USER);
   console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET');
   ```

4. **Check Gmail account:**
   - Go to: https://myaccount.google.com/security
   - Check "Recent security events"
   - Look for blocked sign-in attempts

---

## 🎉 You're All Set!

Your application now sends beautiful, automated emails at every step of the customer journey. Users will receive:
- Welcome emails when they sign up
- Order confirmations when they purchase
- Shipping updates when orders are dispatched
- Delivery confirmations when orders arrive
- And much more!

**Test it now:** Sign up with a real email address and watch the magic happen! ✨

---

**Need Help?** Check the troubleshooting section or contact support.
