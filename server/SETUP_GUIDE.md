# Quick Setup Guide for RuralBowl Backend

## Step 1: Install Dependencies

If you encounter PowerShell execution policy errors, try one of these methods:

### Option A: Using PowerShell (Set Execution Policy)
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install
```

### Option B: Using Command Prompt (cmd)
Open Command Prompt and run:
```cmd
cd c:\Users\kvram\OneDrive\Desktop\ruralbowl_app\server
npm install
```

### Option C: Using Node.js Command Prompt
- Open "Node.js command prompt" from Start Menu
- Navigate to the server folder
- Run `npm install`

## Step 2: Setup PostgreSQL Database

1. Install PostgreSQL if not already installed
2. Open pgAdmin or psql command line
3. Create a new database:
```sql
CREATE DATABASE ruralbowl_db;
```

4. Update the `.env` file with your database credentials:
   - DB_USER: Your PostgreSQL username (default: postgres)
   - DB_PASSWORD: Your PostgreSQL password

## Step 3: Initialize Database Tables

After installing dependencies, run:
```bash
npm run init-db
```

This will create all necessary tables and insert default categories.

## Step 4: Run the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will be available at: http://localhost:5000

## Step 5: Test the API

Visit: http://localhost:5000/api/health

You should see:
```json
{
  "status": "OK",
  "message": "RuralBowl API is running"
}
```

## Troubleshooting

### PowerShell Script Execution Error
If you get "running scripts is disabled" error:
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy RemoteSigned`
3. Type 'Y' to confirm
4. Try `npm install` again

### Database Connection Error
- Make sure PostgreSQL service is running
- Verify database credentials in `.env` file
- Check if port 5432 is available

### Port Already in Use
If port 5000 is already in use, change the PORT value in `.env` file.

## Next Steps

1. Test API endpoints using Postman or Thunder Client
2. Create an admin user by registering through `/api/auth/register`
3. Manually update the user's role to 'admin' in the database
4. Connect the frontend application to this backend

## Database Management

### To view/edit data:
- Use pgAdmin GUI tool
- Or use psql command line:
  ```bash
  psql -U postgres -d ruralbowl_db
  ```

### Useful SQL Commands:
```sql
-- View all users
SELECT * FROM users;

-- View all products
SELECT * FROM products;

-- Make a user admin
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## API Documentation

Refer to README.md for complete API endpoint documentation.
