# 🚀 New Features - Usage Guide

## ✅ Features Added

### 1. **Toast Notification System**
Elegant toast notifications for user feedback (success, error, warning, info).

### 2. **Loading Components**
Reusable loading indicators and skeleton loaders.

### 3. **Form Validation Utilities**
Comprehensive validation functions for all input types.

### 4. **Email Service**
Complete email notification system with beautiful templates.

---

## 📖 How to Use

### 1️⃣ Toast Notifications

#### Setup (Add to your root layout)
```jsx
// web/src/app/layout.js
import { ToastProvider } from '@/components/ToastProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

#### Usage in Components
```jsx
'use client';
import { useToast } from '@/components/ToastProvider';

export default function MyComponent() {
  const toast = useToast();
  
  const handleAction = async () => {
    try {
      // Your API call
      await api.someAction();
      toast.success('Action completed successfully!');
    } catch (error) {
      toast.error('Something went wrong!');
    }
  };
  
  return (
    <button onClick={handleAction}>Do Something</button>
  );
}
```

#### Available Methods
```javascript
toast.success('Operation successful!');
toast.error('An error occurred!');
toast.warning('Please be careful!');
toast.info('Here is some information.');

// Custom duration (default is 3000ms)
toast.success('Message', 5000); // Shows for 5 seconds
```

---

### 2️⃣ Loading Components

```jsx
import { 
  FullPageLoader, 
  Spinner, 
  LoadingButton, 
  SectionLoader,
  SkeletonCard,
  SkeletonTableRow 
} from '@/components/LoadingSpinner';

// Full page loader
{loading && <FullPageLoader message="Loading data..." />}

// Spinner only
<Spinner size="lg" color="green" />

// Button with loading state
<LoadingButton
  loading={isSubmitting}
  disabled={!isValid}
  className="bg-green-600 text-white px-6 py-2 rounded"
  onClick={handleSubmit}
>
  Submit Form
</LoadingButton>

// Section loader
{loading ? (
  <SectionLoader message="Fetching products..." />
) : (
  <ProductsList />
)}

// Skeleton loaders for better UX
{loading ? (
  <div className="grid grid-cols-3 gap-4">
    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
  </div>
) : (
  // Real content
)}

// Table skeleton
<table>
  <tbody>
    {loading ? (
      <>
        <SkeletonTableRow columns={5} />
        <SkeletonTableRow columns={5} />
        <SkeletonTableRow columns={5} />
      </>
    ) : (
      // Real rows
    )}
  </tbody>
</table>
```

---

### 3️⃣ Form Validation

#### Simple Validation
```jsx
import { validators, validateForm } from '@/utils/validation';

const handleSubmit = (e) => {
  e.preventDefault();
  
  const formData = {
    email: 'user@example.com',
    password: 'mypassword',
    phone: '9876543210',
  };
  
  const rules = {
    email: validators.email,
    password: (val) => validators.minLength(val, 6, 'Password'),
    phone: validators.phone,
  };
  
  const { isValid, errors } = validateForm(formData, rules);
  
  if (!isValid) {
    console.log('Validation errors:', errors);
    return;
  }
  
  // Submit form
};
```

#### Advanced with React Hook
```jsx
'use client';
import { validators } from '@/utils/validation';
import { useState } from 'react';

export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  
  const [errors, setErrors] = useState({});
  
  const validate = (field, value) => {
    let error = '';
    
    switch(field) {
      case 'name':
        error = validators.required(value, 'Name');
        break;
      case 'email':
        error = validators.email(value);
        break;
      case 'password':
        error = validators.strongPassword(value);
        break;
      case 'confirmPassword':
        error = validators.match(value, formData.password, 'Password confirmation', 'password');
        break;
      case 'phone':
        error = validators.phone(value);
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validate(name, value);
  };
  
  return (
    <form>
      <div>
        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
      </div>
      {/* More fields... */}
    </form>
  );
}
```

#### Available Validators
```javascript
validators.email(value)
validators.password(value, minLength)
validators.strongPassword(value)
validators.phone(value)
validators.required(value, fieldName)
validators.minLength(value, min, fieldName)
validators.maxLength(value, max, fieldName)
validators.number(value, fieldName)
validators.positiveNumber(value, fieldName)
validators.url(value, fieldName)
validators.match(value, matchValue, fieldName, matchFieldName)
validators.pincode(value)
```

---

### 4️⃣ Email Service

#### Backend Setup

1. **Install Dependency** (Already done ✅)
```bash
npm install nodemailer
```

2. **Configure Environment Variables**
Add to your `.env` file:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@ruralbowl.com
FRONTEND_URL=http://localhost:3000
```

3. **Get Gmail App Password**
   - Go to https://myaccount.google.com/security
   - Enable 2-Factor Authentication
   - Go to "App passwords"
   - Generate password for "Mail"
   - Use that password in `EMAIL_PASSWORD`

#### Usage in Controllers

```javascript
const emailService = require('../services/emailService');

// Send order confirmation
const placeOrder = async (req, res) => {
  try {
    // Create order in database
    const order = await createOrder(req.body);
    const user = req.user;
    
    // Send email notification
    await emailService.sendOrderConfirmation(
      user.email,
      order,
      user
    );
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Update in database
    const order = await updateOrder(id, status);
    const user = await getUserById(order.user_id);
    
    // Send status update email
    await emailService.sendOrderStatusUpdate(
      user.email,
      order,
      user,
      status
    );
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Low stock alert (can be triggered from admin panel or cron job)
const checkStockLevels = async () => {
  const lowStockProducts = await getProductsWithLowStock(10); // threshold: 10
  
  for (const product of lowStockProducts) {
    await emailService.sendLowStockAlert(product);
  }
};
```

#### Available Email Functions
```javascript
// Order confirmation
emailService.sendOrderConfirmation(to, order, user);

// Order status update
emailService.sendOrderStatusUpdate(to, order, user, newStatus);

// Low stock alert (sends to admin)
emailService.sendLowStockAlert(product);

// Password reset
emailService.sendPasswordReset(to, user, resetToken);

// Custom email
emailService.sendEmail(to, {
  subject: 'Your Subject',
  html: '<h1>Your HTML content</h1>'
});
```

---

## 🎯 Integration Examples

### Example 1: Login Form with Toast & Validation
```jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { LoadingButton } from '@/components/LoadingSpinner';
import { validators } from '@/utils/validation';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const emailError = validators.email(formData.email);
    const passwordError = validators.required(formData.password, 'Password');
    
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      toast.error('Please fix validation errors');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Login successful!');
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <LoadingButton
        type="submit"
        loading={loading}
        className="w-full bg-green-600 text-white py-2 rounded"
      >
        Login
      </LoadingButton>
    </form>
  );
}
```

### Example 2: Admin Product Creation with All Features
```jsx
'use client';
import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { LoadingButton } from '@/components/LoadingSpinner';
import { validators, validateForm } from '@/utils/validation';
import { adminAPI } from '@/lib/api';

export default function CreateProduct() {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock_quantity: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const rules = {
      name: validators.required,
      price: validators.positiveNumber,
      stock_quantity: validators.positiveNumber,
      description: validators.required,
    };
    
    const { isValid, errors } = validateForm(formData, rules);
    
    if (!isValid) {
      toast.error('Please fix validation errors');
      return;
    }
    
    setLoading(true);
    try {
      await adminAPI.createProduct(formData);
      toast.success('Product created successfully!', 5000);
      // Reset form or redirect
    } catch (error) {
      toast.error(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <LoadingButton
        type="submit"
        loading={loading}
        className="bg-green-600 text-white px-6 py-2 rounded"
      >
        Create Product
      </LoadingButton>
    </form>
  );
}
```

---

## 📝 Next Steps

1. **Integrate Toast in existing pages:**
   - Login/Signup forms
   - Add to cart actions
   - Order placement
   - Admin CRUD operations

2. **Add Loading States:**
   - Product listings
   - Dashboard data loading
   - Form submissions
   - Image uploads

3. **Implement Email Notifications:**
   - Configure `.env` with Gmail credentials
   - Add email sending to order controller
   - Add email sending to admin order status updates
   - Set up low stock alerts

4. **Add Validation:**
   - All forms (login, signup, checkout)
   - Admin product/category forms
   - User profile updates

---

## 🎨 Customization

### Toast Styles
Edit `web/src/components/ToastProvider.js` to customize colors and animations.

### Email Templates
Edit `server/src/services/emailService.js` to customize email HTML templates.

### Validation Rules
Add custom validators in `web/src/utils/validation.js`.

---

## 🐛 Troubleshooting

### Email not sending?
1. Check Gmail App Password is correct
2. Verify 2FA is enabled on Gmail
3. Check `.env` file has correct variables
4. Look at server console for error messages

### Toast not showing?
1. Ensure `ToastProvider` wraps your app in root layout
2. Check browser console for errors
3. Verify component is client-side (`'use client'`)

---

Need help integrating any of these? Let me know which feature you want to add first! 🚀
