# ✅ Gmail SMTP - Quick Checklist

Print this or keep it open while setting up!

---

## 📋 Setup Steps

### ☐ Step 1: Enable 2FA
- [ ] Go to https://myaccount.google.com/security
- [ ] Enable "2-Step Verification"
- [ ] Complete setup

### ☐ Step 2: Get App Password
- [ ] Go to https://myaccount.google.com/apppasswords
- [ ] Select "Mail" app
- [ ] Select "Other" device
- [ ] Type "RuralBowl App"
- [ ] Click Generate
- [ ] Copy 16-char password

### ☐ Step 3: Update .env
- [ ] Open `server/.env`
- [ ] Update EMAIL_USER=your-gmail@gmail.com
- [ ] Update EMAIL_PASSWORD=16charpassword
- [ ] Update ADMIN_EMAIL=admin-email@gmail.com
- [ ] Save file

### ☐ Step 4: Restart
- [ ] Stop server (Ctrl+C)
- [ ] Run `npm run dev`
- [ ] Look for: ✅ Email server ready (Gmail SMTP)

---

## 🧪 Test Steps

### ☐ Test 1: Welcome Email
- [ ] Open http://localhost:3000/auth/signup
- [ ] Register with real email
- [ ] Check inbox for "Welcome to RuralBowl!"

### ☐ Test 2: Order Emails
- [ ] Login and add products to cart
- [ ] Complete checkout
- [ ] Check for "Order Confirmation" email
- [ ] Check for "Payment Received" email
- [ ] Check admin inbox for "New Order" alert

### ☐ Test 3: Status Emails
- [ ] Login as admin
- [ ] Change order to "shipped"
- [ ] Check for "On The Way!" email
- [ ] Change order to "delivered"
- [ ] Check for "Delivered!" email

---

## ✅ Success Indicators

Look for these in console:
```
✅ Email server ready (Gmail SMTP)
📧 Sending from: your-email@gmail.com
✅ Welcome email sent to: user@example.com
✅ Order confirmation email sent to: user@example.com
✅ Payment confirmation email sent to: user@example.com
✅ New order alert sent to admin
```

---

## ❌ Error Indicators

If you see these, something's wrong:
```
⚠️  Email not configured
❌ Email configuration error: Invalid credentials
```

**Fix:** Check EMAIL_USER and EMAIL_PASSWORD in .env

---

## 📧 Email Count Check

After all tests, you should have received:

**Customer Inbox:**
1. Welcome email
2. Order confirmation
3. Payment confirmation
4. Shipping notification
5. Delivery confirmation

**Admin Inbox:**
1. New order alert

**Total: 6 emails**

---

## 🎯 Final Check

- [ ] All 6 emails received
- [ ] Emails look good (not broken)
- [ ] Mobile rendering works (check on phone)
- [ ] No errors in console
- [ ] Ready for production!

---

**Time needed: 20 minutes**
**Difficulty: Easy**

Once all checkboxes are ✅, you're done! 🎉
