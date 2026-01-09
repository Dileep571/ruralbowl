# Product Variants Feature - Complete Guide

## Overview
Your Rural Bowl application now supports **product variants** - allowing you to sell products in multiple sizes, weights, or packages (e.g., 200gm, 500gm, 1kg) with different prices for each variant. This works exactly like other major ecommerce platforms.

## What Was Implemented

### 1. Database Changes ✅
- **New Table**: `product_variants`
  - Stores all variant information (name, value, price, stock, SKU)
  - Each variant belongs to a product
  - Supports multiple variants per product
  
- **Updated Tables**:
  - `products`: Added `has_variants` boolean column
  - `cart`: Added `variant_id` column to track selected variant
  - `order_items`: Added `variant_id` and `variant_name` columns

### 2. Backend API ✅
- **Product Variants Controller** (`server/src/controllers/variantController.js`)
  - Get all variants for a product
  - Create/update/delete variants
  - Bulk update variants
  
- **Updated Product Controller**
  - Products now include variants in API responses
  - Price range calculation for products with variants
  
- **Updated Cart Controller**
  - Cart now handles variant selection
  - Stock checking per variant
  - Validation for required variant selection

### 3. Admin Dashboard ✅
- **Enhanced Product Creation** (`web/src/app/admin/products/new/page.js`)
  - Toggle to enable/disable variants
  - Dynamic variant form with:
    - Variant type (e.g., "Weight", "Size")
    - Variant value (e.g., "500gm", "Large")
    - Price per variant
    - Original price (for discounts)
    - Stock quantity per variant
    - SKU per variant
    - Availability toggle
  - Add/remove variants dynamically
  - Visual order management

### 4. User Frontend ✅
- **Product Card** (`web/src/components/ProductCard.js`)
  - Shows price range for products with variants
  - "Multiple Options" badge
  - "Select Options" button instead of direct "Add to Cart"
  
- **Product Detail Page** (`web/src/app/products/[slug]/page.js`)
  - Variant selector with grid layout
  - Shows variant name, price, stock status
  - Selected variant highlighting
  - Price updates when variant selected
  - Stock checking per variant
  - "Out of stock" and "Only X left" indicators
  
- **Cart System** (`web/src/components/CartProvider.js`)
  - Supports variant tracking
  - Different cart items for different variants of same product
  - Guest cart and authenticated cart both support variants

## How to Use

### For Admins: Adding Products with Variants

1. **Navigate to Admin Dashboard** → Products → Add New Product

2. **Fill Basic Information**:
   - Product name (e.g., "Farm Fresh Rice")
   - Description
   - Category
   - Image

3. **Enable Variants**:
   - Check the "This product has multiple variants" checkbox
   
4. **Add Variants**:
   - Each variant needs:
     - **Type**: Common name for all variants (e.g., "Weight")
     - **Value**: Specific variant (e.g., "500gm", "1kg", "5kg")
     - **Price**: Selling price for this variant (₹)
     - **Original Price**: Optional, for showing discounts
     - **Stock**: Available quantity for this variant
     - **SKU**: Optional product code
     - **Available**: Toggle on/off
   
5. **Click "Add Variant"** to add more options

6. **Submit** to create the product

### Example: Rice Product with Multiple Weights

```javascript
Product: "Premium Basmati Rice"
Variants:
  - Type: Weight, Value: 500gm, Price: ₹80, Stock: 50
  - Type: Weight, Value: 1kg,   Price: ₹150, Stock: 40
  - Type: Weight, Value: 5kg,   Price: ₹700, Stock: 20
```

### For Users: Shopping with Variants

1. **Browse Products**:
   - Products with variants show "Multiple Options" badge
   - Price range displayed (e.g., "₹80 - ₹700")

2. **Product Detail Page**:
   - See all available variants in a grid
   - Each variant shows:
     - Size/weight
     - Price
     - Stock status
   - Click to select desired variant

3. **Add to Cart**:
   - Must select a variant before adding
   - Each variant is a separate cart item

4. **Checkout**:
   - Cart shows selected variant for each product

## API Endpoints

### Product Variants

```
GET    /api/products/:productId/variants          # Get all variants
POST   /api/products/:productId/variants          # Create variant (Admin)
PUT    /api/products/:productId/variants/bulk     # Bulk update (Admin)
DELETE /api/products/:productId/variants          # Remove all variants (Admin)
PUT    /api/products/:productId/variants/:variantId    # Update variant (Admin)
DELETE /api/products/:productId/variants/:variantId    # Delete variant (Admin)
```

### Cart with Variants

```
POST   /api/cart    # Add to cart
Body: { product_id: 123, quantity: 2, variant_id: 456 }
```

## Database Schema

### product_variants Table
```sql
id                SERIAL PRIMARY KEY
product_id        INTEGER (references products)
variant_name      VARCHAR(100)    # e.g., "Weight", "Size"
variant_value     VARCHAR(100)    # e.g., "500gm", "Large"
price             DECIMAL(10,2)
original_price    DECIMAL(10,2)
sku               VARCHAR(100)
stock_quantity    INTEGER
is_available      BOOLEAN
display_order     INTEGER
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

## Common Use Cases

### 1. Weight-Based Products
- **Rice, Flour, Sugar**: 500gm, 1kg, 5kg
- **Spices**: 50gm, 100gm, 250gm

### 2. Size-Based Products
- **Fruits/Vegetables**: Small, Medium, Large
- **Clothing**: S, M, L, XL

### 3. Pack Size
- **Eggs**: 6 pieces, 12 pieces, 30 pieces
- **Bottles**: Single, Pack of 6, Pack of 12

### 4. Volume-Based
- **Milk**: 500ml, 1L, 2L
- **Juice**: 200ml, 500ml, 1L

## Best Practices

### For Admin:
1. **Consistent Naming**: Use same variant type for related products (all use "Weight" or all use "Size")
2. **Logical Ordering**: Arrange variants from smallest to largest
3. **Clear Values**: Use standard units (gm, kg, ml, L, pieces)
4. **Competitive Pricing**: Larger quantities should offer better per-unit value
5. **Stock Management**: Update stock regularly per variant
6. **SKU System**: Use systematic SKU codes (e.g., RICE-500, RICE-1000)

### For Development:
1. **Always Include Variants**: When fetching products, include variants in response
2. **Validate Selection**: Check if variant is selected before adding to cart
3. **Stock Checking**: Always check variant-specific stock, not product stock
4. **Price Display**: Show correct price based on selected variant
5. **Cart Items**: Treat same product with different variants as separate items

## Migration Commands

To set up the database for existing deployments:

```bash
# Run these migrations in order:
cd server
node src/config/addProductVariants.js      # Creates variants table
node src/config/updateCartForVariants.js   # Updates cart and orders
```

## Testing Checklist

- [ ] Create product without variants (standard flow)
- [ ] Create product with 3+ variants
- [ ] Edit existing product to add variants
- [ ] Select each variant and verify price update
- [ ] Add different variants of same product to cart
- [ ] Verify cart shows correct variant info
- [ ] Check stock validation per variant
- [ ] Test "out of stock" variant
- [ ] Complete checkout with variant products
- [ ] Verify order shows correct variant

## Troubleshooting

### Product shows no variants
**Solution**: Check `has_variants` is true and variants exist in database

### Can't add to cart
**Solution**: Ensure variant is selected (check selectedVariant state)

### Wrong price displayed
**Solution**: Verify variant price is used instead of product price

### Stock always shows 0
**Solution**: Check variant stock_quantity, not product stock_quantity

## Future Enhancements (Optional)

1. **Variant Images**: Different images per variant
2. **Bulk Discounts**: Automatic discounts for larger quantities
3. **Variant Combinations**: Multiple attributes (Size + Color)
4. **Quick Add**: Add to cart from product card with variant dropdown
5. **Variant Comparison**: Side-by-side variant comparison table
6. **Low Stock Alerts**: Admin notifications when variant stock is low

## Support

For questions or issues with the variants feature:
1. Check this guide first
2. Review the example products in admin dashboard
3. Test with sample products before adding real inventory
4. Check browser console for any errors
5. Verify database migrations ran successfully

---

**Feature Status**: ✅ Production Ready
**Last Updated**: December 25, 2025
**Version**: 1.0
