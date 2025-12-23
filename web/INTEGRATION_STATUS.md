# Integration Status (Nov 12, 2025)

This frontend is fully wired to the Express + PostgreSQL backend at http://localhost:5000/api.

Implemented pages/components
- Auth
  - /auth/login: Uses backend login; stores token/user in localStorage
  - /auth/signup: New implementation with register + auto-login
- Products
  - /products: Fetches products and categories from API, includes search/filter
  - /products/[id]: Fetches a single product and supports add-to-cart
- Cart & Checkout
  - /cart: Displays cart from API, supports qty update, remove, clear
  - /checkout: Prefills address from current user, places order via API
  - /checkout/success: Shows confirmation and optional orderId
- Dashboard
  - /dashboard: Shows subscription status and available plans with subscribe
  - /dashboard/orders: Lists user orders with filters
  - /dashboard/orders/[id]: Order detail view
  - /dashboard/profile: View/update name, phone, address
  - /dashboard/calendar: Delivery calendar with month filter and status updates

Configuration
- Frontend: set NEXT_PUBLIC_API_URL in `web/.env.local` (defaults to http://localhost:5000/api)
- Auth: token and user stored in localStorage; Authorization bearer added per request

Run locally (Windows PowerShell, npm scripts may be blocked)
- Backend (port 5000):
  node c:\Users\kvram\OneDrive\Desktop\ruralbowl_app\server\src\server.js
- Frontend (port 3000):
  node c:\Users\kvram\OneDrive\Desktop\ruralbowl_app\web\node_modules\next\dist\bin\next dev c:\Users\kvram\OneDrive\Desktop\ruralbowl_app\web -p 3000

Notes
- If you prefer npm scripts, run PowerShell as Administrator and execute: Set-ExecutionPolicy RemoteSigned
- The UI tolerates item shapes from API (item.product or flat item). Adjust mapping if backend response changes.
- Online payment is disabled (coming soon); COD is enabled.