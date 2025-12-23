# 📧 Quick Start: Gmail SMTP Setup

## ⚡ 5-Minute Setup

### Step 1: Get Gmail App Password (3 minutes)
1. Go to: **https://myaccount.google.com/apppasswords**
2. Enable 2FA if prompted (required)
3. Select **"Mail"** → **"Other"** → Type: **"RuralBowl"**
4. Click **"Generate"**
5. Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)

### Step 2: Update Environment Variables (1 minute)
Edit `server/.env`:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
ADMIN_EMAIL=admin@ruralbowl.com
```

### Step 3: Restart Server (30 seconds)
```powershell
cd server
npm run dev
```

### Step 4: Look for Success Message (10 seconds)
Console should show:
```
✅ Email server ready (Gmail SMTP)
📧 Sending from: your-gmail@gmail.com
```

---

## 🧪 Quick Test

### Test Now (2 minutes):
1. Open: http://localhost:3000/auth/signup
2. Register with your real email
3. Check inbox for welcome email 🎉

**Expected:** Email arrives within seconds with subject "Welcome to RuralBowl! 🌾"

---

## 📧 All Email Notifications

| Event | Email Sent | Recipient |
|-------|------------|-----------|
| User signs up | Welcome email 🌾 | Customer |
| Order placed | Order confirmation ✅ | Customer |
| Order placed | Payment confirmation 💳 | Customer |
| Order placed | New order alert 🔔 | Admin |
| Status → Shipped | Shipping notification 🚚 | Customer |
| Status → Delivered | Delivery confirmation 🎉 | Customer |
| Status → Cancelled | Cancellation notice ❌ | Customer |
| Stock low | Low stock alert ⚠️ | Admin |
| Password reset | Reset link 🔐 | Customer |

**Total: 9 different email types** ✨

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid credentials" | Use App Password, not regular password |
| "Email not configured" | Check .env has EMAIL_USER and EMAIL_PASSWORD |
| Emails not arriving | Check spam folder first |
| Console shows warnings | EMAIL_USER is still `your-email@gmail.com` |

---

## 📋 Checklist

- [ ] Gmail 2FA enabled
- [ ] App Password generated  
- [ ] EMAIL_USER updated in .env
- [ ] EMAIL_PASSWORD updated in .env
- [ ] Server restarted
- [ ] Console shows "✅ Email server ready"
- [ ] Test email received

---

## 📚 Full Documentation

- **EMAIL_SETUP_GUIDE.md** - Complete setup & troubleshooting
- **EMAIL_INTEGRATION_SUMMARY.md** - Technical details & testing
- **server/.env.example** - Configuration reference

---

## 🎯 Done!

Once you see **"✅ Email server ready (Gmail SMTP)"** in console, all email notifications are active! 

**Every signup, order, and status change will now send beautiful automated emails.** 🚀

---

**Questions?** Check EMAIL_SETUP_GUIDE.md for detailed help.
