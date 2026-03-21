# Backend API Spec

## Overview

Django + Django REST Framework backend serving a React frontend. SQLite database. All endpoints return JSON.

## Stack

- Python 3.14 / Django / DRF
- SQLite (sufficient for challenge scope)
- django-cors-headers for cross-origin requests from React dev server

## Endpoints

### GET /api/trips/

List all available trips.

**Response 200:**

```json
[
  {
    "id": 1,
    "title": "Museum Field Trip",
    "description": "A visit to Auckland Museum",
    "date": "2026-04-15",
    "location": "Auckland Museum",
    "cost": "45.00",
    "school": {
      "id": 1,
      "name": "Kowhai Primary"
    }
  }
]
```

**Notes:**

- Includes nested school info so the frontend can display which school the trip belongs to
- TripSerializer uses ModelSerializer with nested SchoolSerializer (read-only)

### GET /api/trips/{trip_id}/

Get details for a single trip.

**Response 200:** Same shape as list item above.

**Response 404:**

```json
{
  "detail": "Not found."
}
```

### POST /api/payments/

Submit a registration and payment for a trip.

**Request body:**

```json
{
  "trip_id": 1,
  "student_name": "Emma Wilson",
  "parent_name": "Sarah Wilson",
  "card_number": "1234567890123456",
  "expiry_date": "12/27",
  "cvv": "123"
}
```

**Validation rules (backend):**

- All fields required
- `card_number`: must be exactly 16 digits after stripping spaces
- `expiry_date`: must match MM/YY format, month 01-12
- `cvv`: must be exactly 3 digits
- `trip_id`: must reference an existing Trip

**Response 200 (success):**

```json
{
  "message": "Payment processed successfully.",
  "transaction_id": "TX-1774060539-9883",
  "amount_charged": 45.0,
  "student_name": "Emma Wilson",
  "trip_name": "Museum Field Trip"
}
```

**Response 400 (validation error):**

```json
{
  "card_number": ["Card number must be 16 digits."]
}
```

**Response 400 (payment declined after retries):**

```json
{
  "message": "Payment failed.",
  "error": "Payment declined by processor. Please try again."
}
```

**Response 404 (invalid trip_id):**

```json
{
  "detail": "Not found."
}
```

**Response 500 (unexpected processor error):**

```json
{
  "message": "An unexpected error occurred. Please try again later."
}
```

## Service Layer

### PaymentService

Located in `payments/services.py`. Keeps views thin — all business logic lives here.

**`enrol_and_pay(trip, student_name, parent_name, card_number, expiry_date, cvv) -> PaymentResponse`**

Flow:

1. `get_or_create` Enrolment for `(trip, student_name)`, using `parent_name` in defaults
2. Build payment_data dict for legacy processor, deriving `amount` from `trip.cost`, `school_id` from `trip.school_id`, `activity_id` from `trip.id`
3. Call `_process_with_retry` (up to 3 attempts for retryable failures)
4. Save Payment record with result (success or failure)
5. Return PaymentResponse

**Retry logic:**

- Only retries on "Payment declined by processor. Please try again." (the random 10% failure)
- Validation errors (bad card, missing fields, bad CVV) are returned immediately — no retry
- Each attempt (including failed retries) creates a Payment record for audit
- Logging on each retry attempt

### Legacy Processor Integration

`LegacyPaymentProcessor` is the provided simulation class, stored in `payments/legacy_processor.py` with added type hints. It is:

- Stateless — instantiated once as a class attribute on PaymentService
- Synchronous — blocks for 1.5s per call (acceptable for challenge scope)
- 10% random failure rate on top of validation failures

**Production considerations (debrief talking points):**

- Async processing via Celery task queue to avoid blocking the request
- Webhook callback pattern instead of synchronous wait
- Circuit breaker if failure rate spikes
- Idempotency key to prevent double-charging

## Django Admin

All models registered in `payments/admin.py` for data management:

- SchoolAdmin
- TripAdmin
- EnrolmentAdmin (display student_name, trip, parent_name, created_at)
- PaymentAdmin (display enrolment, amount, success, transaction_id, created_at)

## Seed Data

Either via Django admin, shell, or management command. Minimum viable seed:

- 1 School: "Kowhai Primary", "123 Main Street, Auckland"
- 1-2 Trips with upcoming dates and reasonable costs ($25-$50)

## Configuration

### CORS

`django-cors-headers` with `CORS_ALLOWED_ORIGINS` set to React dev server origin (<http://localhost:5173>).

### Logging

Python stdlib logging configured in `config/settings.py`. PaymentService logs:

- INFO: payment processing started, enrolment created/reused, payment succeeded
- WARNING: retryable failure on attempt N
- ERROR: all retry attempts exhausted, unexpected exceptions

## Testing Strategy

### Unit Tests (pytest + pytest-django)

- **Serializer tests**: valid input passes, missing fields rejected, bad card format rejected, bad expiry rejected, bad CVV rejected
- **Service tests**: mock LegacyPaymentProcessor, verify enrolment creation, verify payment record saved on success, verify payment record saved on failure, verify retry on retryable error, verify no retry on validation error, verify get_or_create prevents duplicate enrolments
- **View tests**: DRF test client, full request/response integration, verify correct status codes

### Test fixtures

- pytest fixtures for School, Trip instances
- Mock processor that returns controllable responses
