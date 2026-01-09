# Product Unit Value Feature

## Overview
Products without variants now support numeric unit values (e.g., 500gm, 1kg, 2 pieces, 500ml). This allows precise product specification in the format: `[number][unit]`.

## Database Changes

### Migration
- **File**: `server/src/config/addUnitValue.js`
- **Changes**: Added `unit_value` column to products table
  - Type: `DECIMAL(10, 3)` 
  - Default: `1`
  - Examples: `500` (for 500gm), `1` (for 1kg), `2.5` (for 2.5L)

### Products Table
```sql
ALTER TABLE products 
ADD COLUMN unit_value DECIMAL(10, 3) DEFAULT 1;
```

## Backend Updates

### Controllers Updated

#### adminController.js
- **createProduct**: Added `unit_value` field handling
  - Accepts `unit_value` from request body
  - Defaults to `1` if not provided
  - Example: `{ unit_value: 500, unit: 'g' }` → "500g"

- **updateProduct**: Added `unit_value` to dynamic update fields
  - Allows updating unit_value independently
  - Maintains existing value if not provided

#### productController.js
- **createProduct**: Added `unit_value` parameter
- **updateProduct**: Added `unit_value` parameter

## Frontend Updates

### Admin Product Forms

#### New Product Form (`web/src/app/admin/products/new/page.js`)
- **Initial State**: Added `unit_value: '1'` to formData
- **UI Section**: "Product Unit & Quantity"
  - **Quantity/Weight Input**: 
    - Type: Number (step: 0.001, min: 0)
    - Placeholder: "e.g., 500, 1, 2"
    - Required for non-variant products
  - **Unit Type Dropdown**:
    - Options: kg, g, piece, dozen, liter (L), ml, pack, bundle, box
  - **Live Preview**: Shows combined value (e.g., "500g", "1kg")

#### Edit Product Form (`web/src/app/admin/products/[id]/edit/page.js`)
- Same UI structure as new product form
- Loads existing `unit_value` from product data
- Defaults to `'1'` if not set

### Product Display

#### ProductCard Component (`web/src/components/ProductCard.js`)
- Updated price label from `per ${unit}` to `${unit_value}${unit}`
- Examples:
  - "500g" instead of "per g"
  - "1kg" instead of "per kg"
  - "2 piece" instead of "per piece"

## Unit Options

### Available Units
- **Weight**: kg (Kilogram), g (Gram)
- **Volume**: liter (Liter, L), ml (Milliliter)
- **Count**: piece, dozen
- **Packaging**: pack, bundle, box

## Usage Examples

### Example 1: Rice Product
```json
{
  "name": "Basmati Rice",
  "unit_value": 1,
  "unit": "kg",
  "price": 120
}
```
**Display**: "1kg" • ₹120

### Example 2: Tomatoes
```json
{
  "name": "Fresh Tomatoes",
  "unit_value": 500,
  "unit": "g",
  "price": 40
}
```
**Display**: "500g" • ₹40

### Example 3: Milk Bottle
```json
{
  "name": "Full Cream Milk",
  "unit_value": 500,
  "unit": "ml",
  "price": 25
}
```
**Display**: "500ml" • ₹25

### Example 4: Eggs
```json
{
  "name": "Farm Fresh Eggs",
  "unit_value": 1,
  "unit": "dozen",
  "price": 80
}
```
**Display**: "1dozen" • ₹80

## API Changes

### Create Product Request
```json
POST /api/admin/products
{
  "name": "Product Name",
  "price": 100,
  "unit": "kg",
  "unit_value": 1,
  "category_id": 1,
  ...
}
```

### Update Product Request
```json
PUT /api/admin/products/:id
{
  "unit_value": 2,
  "unit": "liter"
}
```

### Product Response
```json
{
  "id": 1,
  "name": "Product Name",
  "price": 100,
  "unit": "kg",
  "unit_value": 1,
  ...
}
```

## Variants vs Unit Value

### Products WITHOUT Variants
- Use `unit` + `unit_value` for single option
- Example: Rice 1kg @ ₹120

### Products WITH Variants
- Ignore `unit` and `unit_value` on product level
- Each variant has its own `variant_value` (e.g., "500gm", "1kg")
- Example: Rice with variants 500gm @ ₹65, 1kg @ ₹120

## Backward Compatibility

### Default Behavior
- Existing products without `unit_value` default to `1`
- Display remains correct: "1kg", "1 piece", etc.

### Migration Safety
- Column added with DEFAULT value
- No existing data disrupted
- Non-breaking change

## Testing Checklist

- [x] Database migration successful
- [x] Admin can create product with unit_value
- [x] Admin can edit product unit_value
- [x] ProductCard displays correct format
- [ ] Product detail page shows unit_value
- [ ] API returns unit_value in responses
- [ ] Frontend validation for numeric input

## Next Steps

1. Test creating new products with different unit values
2. Verify display on product cards
3. Update product detail page to show unit value
4. Consider adding more unit types (oz, lb, etc.) if needed
5. Add unit value to cart/order displays if needed
