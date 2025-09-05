# API Endpoints Documentation

## Care Plans (Vårdplaner)

### GET `/api/care-plans/all`
Returns all care plans.

### GET `/api/care-plans/:id`
Returns a specific care plan by ID.
- **Note**: Only handles care plan IDs (e.g., `cp_xxx`), not client IDs

### GET `/api/care-plans/client/:clientId`
Returns all care plans for a specific client.

### GET `/api/care-plans/staff/:staffId`
Returns all care plans for a specific staff member.

### POST `/api/care-plans`
Creates a new care plan.
- **Status**: 201 Created
- **Body**: `{ clientId, staffId, planContent, status, ... }`

### PUT `/api/care-plans/:id`
Updates an existing care plan.
- **Status**: 200 OK
- **Body**: `{ status, comment, ... }`

### DELETE `/api/care-plans/:id`
Deletes a care plan.
- **Status**: 204 No Content
- **Body**: Empty

## Implementation Plans (Genomförandeplaner)

### GET `/api/implementation-plans/all`
Returns all implementation plans.

### GET `/api/implementation-plans/:clientId`
Returns all implementation plans for a specific client.

### GET `/api/implementation-plans/staff/:staffId`
Returns all implementation plans for a specific staff member.

### POST `/api/implementation-plans`
Creates a new implementation plan.
- **Status**: 201 Created
- **Body**: `{ clientId, staffId, planContent, status, ... }`

### PUT `/api/implementation-plans/:id`
Updates an existing implementation plan.
- **Status**: 200 OK
- **Body**: `{ status, comments, ... }`

### DELETE `/api/implementation-plans/:id`
Deletes an implementation plan.
- **Status**: 204 No Content
- **Body**: Empty

## Authentication

All endpoints require authentication via:
- `credentials: 'include'` in fetch requests
- `X-Dev-Token` header (development only)

## Query Keys (Frontend)

### Care Plans
- `['care-plans', 'all']` - All care plans
- `['care-plans', clientId]` - Client-specific care plans

### Implementation Plans
- `['implementation-plans']` - All implementation plans
- `['implementation-plans', clientId]` - Client-specific implementation plans

## Error Handling

- **404**: Resource not found
- **400**: Bad request (validation error)
- **401**: Unauthorized
- **500**: Internal server error

## Development Setup

```bash
# Start backend
npm run dev

# Start frontend
cd client && npm run dev

# Test endpoints
./test-crud-verification.sh
```
