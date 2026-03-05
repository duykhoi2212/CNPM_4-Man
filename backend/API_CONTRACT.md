# API Contract - Football Booking Backend

Base URL: `http://127.0.0.1:8000`

## 1) Authentication

- Auth type: `TokenAuthentication`
- Header for protected endpoints:

```http
Authorization: Token <token>
Content-Type: application/json
```

- Public endpoints: field list/detail/types/availability, review list/detail.

## 2) Response Conventions

- Success: JSON object with data payload (`message`, object, or list).
- Validation errors (DRF):

```json
{
  "field_name": ["error message"]
}
```

- Custom errors:

```json
{
  "error": "error message"
}
```

- Decimal values are returned as strings, for example: `"400000.00"`.

## 3) Business Rules

- Booking can only be created for today/future dates.
- Booking timeslots cannot conflict with existing `pending`/`confirmed` bookings.
- Payment create is only for `pending` booking and one payment per booking.
- Payment confirm (fake flow) changes:
  - Payment: `pending -> completed`
  - Booking: `pending -> confirmed`
- Review with `booking_id` requires:
  - Booking belongs to current user
  - Booking status is `completed`
  - One booking can only have one review

## 4) Accounts API (`/api/auth/`)

### 4.1 Register
- `POST /api/auth/register/`
- Auth: No

Request:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "StrongPass123!",
  "password2": "StrongPass123!",
  "first_name": "Test",
  "last_name": "User",
  "phone": "0999999999",
  "address": "77 Binh Dinh"
}
```

### 4.2 Login
- `POST /api/auth/login/`
- Auth: No

Request:
```json
{
  "username": "testuser",
  "password": "StrongPass123!"
}
```

### 4.3 Logout
- `POST /api/auth/logout/`
- Auth: Yes

### 4.4 Profile
- `GET /api/auth/profile/`
- Auth: Yes

### 4.5 Update profile
- `PUT/PATCH /api/auth/profile/update/`
- Auth: Yes

## 5) Fields API (`/api/fields/`)

### 5.1 Field types
- `GET /api/fields/types/`
- Auth: No

### 5.2 Field list
- `GET /api/fields/`
- Auth: No
- Query params:
  - `type`
  - `price_min`
  - `price_max`
  - `rating_min`
  - `search`
  - `ordering` (`price_per_hour`, `-avg_rating`, `name`)

### 5.3 Field detail
- `GET /api/fields/{id}/`
- Auth: No

### 5.4 Field availability
- `GET /api/fields/{id}/availability/?date=YYYY-MM-DD`
- Auth: No

### 5.5 Field admin CRUD
- `POST /api/fields/create/`
- `PUT/PATCH /api/fields/{id}/update/`
- `DELETE /api/fields/{id}/delete/`
- Auth: Admin

## 6) Bookings API (`/api/bookings/`)

### 6.1 List bookings
- `GET /api/bookings/`
- Auth: Yes
- Admin sees all, normal user sees own bookings.
- Query params: `status`, `date`, `field`

### 6.2 Create booking
- `POST /api/bookings/create/`
- Auth: Yes

Request:
```json
{
  "field": 4,
  "booking_date": "2026-03-10",
  "timeslot_ids": [6],
  "customer_name": "Test User",
  "customer_phone": "0999999999",
  "customer_email": "test@example.com",
  "notes": ""
}
```

### 6.3 Booking detail
- `GET /api/bookings/{id}/`
- Auth: Owner or Admin

### 6.4 Booking actions
- `PUT /api/bookings/{id}/cancel/` (Owner/Admin)
- `PUT /api/bookings/{id}/confirm/` (Admin)
- `PUT /api/bookings/{id}/complete/` (Admin)

## 7) Payments API (`/api/payments/`)

### 7.1 Create payment
- `POST /api/payments/`
- Auth: Yes

Request:
```json
{
  "booking_id": 5,
  "payment_method": "momo"
}
```

### 7.2 Payment detail
- `GET /api/payments/{id}/`
- Auth: Owner/Admin

### 7.3 Confirm payment (fake)
- `POST /api/payments/{id}/confirm/`
- Auth: Owner/Admin

### 7.4 Payment by booking
- `GET /api/payments/booking/{booking_id}/`
- Auth: Owner/Admin

## 8) Reviews API (`/api/reviews/`)

### 8.1 List reviews
- `GET /api/reviews/`
- Auth: No
- Query params: `field`, `user`, `rating_min`

### 8.2 Create review
- `POST /api/reviews/create/`
- Auth: Yes

Request:
```json
{
  "field": 4,
  "booking_id": 5,
  "rating": 5,
  "comment": "Tuyet voi, se quay lai."
}
```

### 8.3 Review detail
- `GET /api/reviews/{id}/`
- Auth: No

### 8.4 Update review
- `PUT/PATCH /api/reviews/{id}/update/`
- Auth: Owner/Admin

### 8.5 Delete review
- `DELETE /api/reviews/{id}/delete/`
- Auth: Admin

### 8.6 Review images
- `POST /api/reviews/{id}/add-image/` (multipart/form-data, key: `image`, max 5)
- `DELETE /api/reviews/{id}/images/{image_id}/`

## 9) Statistics API (`/api/statistics/`)

### 9.1 Admin overview
- `GET /api/statistics/admin/overview/`
- Auth: Admin
- Query params: `date_from`, `date_to`, `field_id`

### 9.2 Admin revenue series
- `GET /api/statistics/admin/revenue/`
- Auth: Admin
- Query params: `date_from`, `date_to`, `field_id`, `group_by=day|month`

### 9.3 Admin top fields
- `GET /api/statistics/admin/top-fields/`
- Auth: Admin
- Query params: `date_from`, `date_to`, `limit`

### 9.4 My overview
- `GET /api/statistics/me/overview/`
- Auth: Yes
- Query params: `date_from`, `date_to`

## 10) Frontend Integration Notes

- Always attach `Authorization` token for protected APIs.
- For forms with money fields, parse decimal strings to numbers in UI if needed.
- Handle both error styles:
  - `{"error": "..."}`
  - `{"field": ["..."]}`
- For review flow, frontend should only show review action when booking is `completed`.
