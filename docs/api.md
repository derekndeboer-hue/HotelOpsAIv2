# Hotel Ops API Documentation

Base URL: `https://{domain}/api`

All endpoints require a valid JWT in the `Authorization: Bearer <token>` header unless marked as public.

---

## Authentication

| Method | Path | Description | Role |
|--------|------|-------------|------|
| POST | `/auth/login` | Authenticate user, return JWT + refresh token | Public |
| POST | `/auth/refresh` | Refresh an expired access token | Public |
| POST | `/auth/logout` | Invalidate refresh token | Any |
| POST | `/auth/forgot-password` | Send password reset email | Public |
| POST | `/auth/reset-password` | Reset password with token | Public |

## Users

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/users` | List all users for current hotel | Admin, Manager |
| GET | `/users/:id` | Get user details | Admin, Manager, Self |
| POST | `/users` | Create a new user | Admin |
| PUT | `/users/:id` | Update user profile | Admin, Self |
| DELETE | `/users/:id` | Deactivate a user | Admin |
| PUT | `/users/:id/role` | Change user role | Admin |

## Hotels

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/hotels/current` | Get current hotel details | Any |
| PUT | `/hotels/current` | Update hotel settings | Admin |
| GET | `/hotels/current/stats` | Get hotel dashboard stats | Admin, Manager |

## Rooms

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/rooms` | List all rooms with status | Any |
| GET | `/rooms/:id` | Get room details | Any |
| POST | `/rooms` | Create a new room | Admin |
| PUT | `/rooms/:id` | Update room details | Admin, Manager |
| DELETE | `/rooms/:id` | Remove a room | Admin |
| PUT | `/rooms/:id/status` | Update room status (clean, dirty, inspected, OOO) | Staff, Manager, Admin |
| GET | `/rooms/board` | Get room board (housekeeping view) | Any |

## Work Orders

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/work-orders` | List work orders (filterable) | Any |
| GET | `/work-orders/:id` | Get work order details | Any |
| POST | `/work-orders` | Create a work order | Any |
| PUT | `/work-orders/:id` | Update work order | Maintenance, Manager, Admin |
| PUT | `/work-orders/:id/assign` | Assign work order to user | Manager, Admin |
| PUT | `/work-orders/:id/status` | Update work order status | Maintenance, Manager, Admin |
| POST | `/work-orders/:id/comments` | Add comment to work order | Any |
| POST | `/work-orders/:id/photos` | Upload photo to work order | Any |

## Schedules

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/schedules` | List schedules (by date range) | Any |
| GET | `/schedules/:id` | Get schedule details | Any |
| POST | `/schedules` | Create a schedule | Manager, Admin |
| PUT | `/schedules/:id` | Update a schedule | Manager, Admin |
| DELETE | `/schedules/:id` | Delete a schedule | Admin |
| POST | `/schedules/generate` | Auto-generate daily schedule | System, Admin |
| GET | `/schedules/my` | Get current user's schedule | Any |
| PUT | `/schedules/:id/swap` | Request shift swap | Staff |
| PUT | `/schedules/:id/swap/approve` | Approve shift swap | Manager, Admin |

## Reports

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/reports` | List available reports | Manager, Admin |
| POST | `/reports/generate` | Generate a report (async) | Manager, Admin |
| GET | `/reports/:id` | Get report status/download | Manager, Admin |
| POST | `/reports/weekly-digest` | Trigger weekly digest email | System, Admin |
| GET | `/reports/occupancy` | Get occupancy report data | Manager, Admin |
| GET | `/reports/maintenance` | Get maintenance report data | Manager, Admin |

## Compliance

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/compliance/status` | Get compliance dashboard | Manager, Admin |
| POST | `/compliance/check` | Run compliance checks | System, Admin |
| GET | `/compliance/inspections` | List inspection records | Manager, Admin |
| POST | `/compliance/inspections` | Log an inspection | Staff, Manager, Admin |

## Notifications

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/notifications` | List current user's notifications | Any |
| PUT | `/notifications/:id/read` | Mark notification as read | Any |
| PUT | `/notifications/read-all` | Mark all notifications as read | Any |
| GET | `/notifications/preferences` | Get notification preferences | Any |
| PUT | `/notifications/preferences` | Update notification preferences | Any |

## Health

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/health` | Health check endpoint | Public |
| GET | `/health/ready` | Readiness check (includes DB) | Public |

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": []
  }
}
```

Common HTTP status codes:
- `400` - Validation error
- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Resource not found
- `409` - Conflict (duplicate resource)
- `429` - Rate limited
- `500` - Internal server error
