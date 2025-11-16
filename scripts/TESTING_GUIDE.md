# CPOS User Management System - Complete Testing Guide

## Overview

This guide provides comprehensive testing procedures for the CPOS (Cloud POS) user management system, including backend API testing, frontend UI testing, integration testing, performance testing, and security testing.

## Prerequisites

- Node.js and npm installed
- PostgreSQL database running
- Project dependencies installed (`npm install` in both backend and frontend directories)

## 1. Start Servers

### Backend Server (Port 4000)

```bash
cd /Users/qaisu/Downloads/grbac-cpos/backend
npm run dev
```

### Frontend Server (Port 3000)

```bash
cd /Users/qaisu/Downloads/grbac-cpos/frontend
npm run dev
```

## 2. Backend API Testing

### 2.1 Test User Authentication (Login as Admin)

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cpos.local", "password": "Passw0rd!"}'
```

**Expected Response:**

```json
{
  "user": {
    "id": "usr-admin-uuid",
    "email": "admin@cpos.local",
    "fullName": "CPOS Super Admin"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2.2 Test User Management APIs

```bash
# Set the access token from login response
ACCESS_TOKEN="your_access_token_here"

# List all users
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Get specific user details
curl -X GET http://localhost:4000/api/users/usr-1 \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Update user roles (assign Super Admin role)
curl -X PATCH http://localhost:4000/api/users/usr-1/roles \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roles": ["role-super-admin-uuid"]
  }'

# Update user status (deactivate user)
curl -X PATCH http://localhost:4000/api/users/usr-1/status \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isEnabled": false
  }'
```

### 2.3 Test RBAC APIs

```bash
# List all roles
curl -X GET http://localhost:4000/api/rbac/roles \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# List dashboard widgets
curl -X GET http://localhost:4000/api/rbac/widgets \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Update role permissions
curl -X PATCH http://localhost:4000/api/rbac/roles/role-uuid/permissions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": ["user.read", "user.write"]
  }'

# Update role widgets
curl -X PATCH http://localhost:4000/api/rbac/roles/role-uuid/widgets \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "widgets": ["widget-dashboard", "widget-analytics"]
  }'
```

## 3. Frontend Testing

### 3.1 Login as Admin

1. Open browser to `http://localhost:3000`
2. Navigate to login page
3. Login with:
   - Email: `admin@cpos.local`
   - Password: `Passw0rd!`

### 3.2 Test Dashboard Navigation

1. After login, verify you're redirected to `/dashboard`
2. Check sidebar navigation includes:
   - Dashboard
   - Categories
   - Products
   - Users (should be visible if you have `rbac.manage.users` permission)

### 3.3 Test User Management Page

1. Click "Users" in the sidebar
2. Verify the page loads at `/dashboard/users`
3. Check the user table displays:
   - User information (name, email, username)
   - Current roles as badges
   - Status (Active/Inactive)

### 3.4 Test Role Assignment

1. Click "Assign Role" button on any user row
2. Verify modal opens showing available roles
3. Select a role and click to assign
4. Verify the role appears as a badge on the user
5. Test removing roles by clicking the × on role badges

### 3.5 Test User Status Management

1. Click "Deactivate" on an active user
2. Verify status changes to "Inactive"
3. Click "Activate" on an inactive user
4. Verify status changes back to "Active"

### 3.6 Test Permission-Based Access

1. Try accessing `/dashboard/users` without proper permissions
2. Verify access is denied (403 error or redirect)

## 4. Integration Testing

### Test Data Flow

1. Make changes in the UI (assign role, change status)
2. Use API calls to verify backend state changes
3. Refresh the UI to ensure data consistency

### Test Error Handling

1. Try API calls without authentication
2. Try API calls with invalid data
3. Test network disconnection scenarios

## 5. Performance Testing

### API Response Times

```bash
# Test user list API performance
time curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o /dev/null -s
```

### Frontend Load Testing

1. Open multiple browser tabs
2. Navigate between user management and other pages
3. Monitor for memory leaks or performance issues

## 6. Security Testing

### Test Authentication

```bash
# Try accessing protected endpoints without token
curl -X GET http://localhost:4000/api/users
# Should return 401 Unauthorized
```

### Test Authorization

```bash
# Try user management with insufficient permissions
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer $INSUFFICIENT_TOKEN"
# Should return 403 Forbidden
```

## 7. Cleanup

### Stop Servers

```bash
# In each terminal, press Ctrl+C to stop the servers
```

### Reset Database (if needed)

```bash
cd /Users/qaisu/Downloads/grbac-cpos/backend
npm run db:reset
```

## Expected Test Results

### ✅ Backend Tests:

- All API endpoints return 200/201 status codes
- Authentication middleware works correctly
- RBAC permissions are enforced
- Database operations complete successfully

### ✅ Frontend Tests:

- User management page loads without errors
- Role assignment modal functions properly
- Status changes update immediately
- Navigation works with permission checks
- No TypeScript compilation errors

### ✅ Integration Tests:

- UI changes reflect in API responses
- API changes appear in UI after refresh
- Error states are handled gracefully

## Troubleshooting

### Backend Issues:

- Check database connection in logs
- Verify environment variables in `.env`
- Check Prisma schema matches database

### Frontend Issues:

- Clear Next.js cache: `rm -rf .next`
- Check browser console for errors
- Verify API_BASE_URL in environment

### Permission Issues:

- Ensure user has `rbac.manage.users` permission
- Check role assignments in database
- Verify JWT token contains correct permissions

## API Endpoints Summary

| Method | Endpoint                          | Description             |
| ------ | --------------------------------- | ----------------------- |
| POST   | `/api/auth/login`                 | User authentication     |
| GET    | `/api/users`                      | List all users          |
| GET    | `/api/users/:id`                  | Get user details        |
| PATCH  | `/api/users/:id/roles`            | Update user roles       |
| PATCH  | `/api/users/:id/status`           | Update user status      |
| GET    | `/api/rbac/roles`                 | List all roles          |
| GET    | `/api/rbac/widgets`               | List dashboard widgets  |
| PATCH  | `/api/rbac/roles/:id/permissions` | Update role permissions |
| PATCH  | `/api/rbac/roles/:id/widgets`     | Update role widgets     |

## Test Credentials

- **Admin Email:** `admin@cpos.local`
- **Admin Password:** `Passw0rd!`
- **Password Hash:** `$2a$12$prqszdBxEi5Ur.pQEJYqJuzezBGZ7A2Bd2GvLhzW96iFz0n.m/zA2`

This comprehensive test suite covers all aspects of the user management system implementation. Follow these steps systematically to ensure complete functionality.</content>
<parameter name="filePath">/Users/qaisu/Downloads/grbac-cpos/TESTING_GUIDE.md
