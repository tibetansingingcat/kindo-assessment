# Data Model Spec

## Overview

The data model supports a school payment collection flow: a school has trips, parents enrol students on trips, and payments are processed via a legacy payment processor.

## Design Decisions

### No Student Model

The challenge only requires a student's name during registration. A full `Student` model with auth, email, school FK, etc. would be over-engineering for the requirements. `student_name` lives as a field on `Enrolment`. If requirements grew to include student dashboards or multi-trip histories, a `Student` model would be the natural next step.

### Enrolment as Join Entity

Rather than a direct many-to-many between Trip and Student, `Enrolment` is an explicit join table that carries `parent_name` and serves as the anchor for payments. This allows:

- Multiple payment attempts per enrolment (retry history / audit trail)
- De-duplication via `get_or_create` on `(trip, student_name)` to prevent duplicate enrolments on payment retry

### Payment as Separate Table

Each payment attempt is its own record, even failures. This provides a full audit trail. The legacy processor has a 10% random failure rate, so multiple attempts per enrolment are expected. Storing `transaction_id` (on success) and `error_message` (on failure) allows debugging and reconciliation with the legacy system.

### School as a Simple Model

The legacy processor requires `school_id`. Rather than passing this as a magic string, `School` is a minimal model that `Trip` has a FK to. The backend derives `school_id` from `trip.school_id` — the frontend never needs to send it.

## Models

### School

| Field   | Type           | Notes |
| ------- | -------------- | ----- |
| id      | auto PK        |       |
| name    | CharField(255) |       |
| address | CharField(255) |       |

### Trip

| Field       | Type               | Notes                                       |
| ----------- | ------------------ | ------------------------------------------- |
| id          | auto PK            | Passed to legacy processor as `activity_id` |
| school      | FK → School        | Cascade delete                              |
| title       | CharField(255)     |                                             |
| description | TextField          | Optional                                    |
| date        | DateField          |                                             |
| location    | CharField(200)     |                                             |
| cost        | DecimalField(10,2) | Used as `amount` for legacy processor       |
| created_at  | DateTimeField      | Auto-set on creation                        |

### Enrolment

| Field        | Type           | Notes                |
| ------------ | -------------- | -------------------- |
| id           | auto PK        |                      |
| trip         | FK → Trip      | Cascade delete       |
| student_name | CharField(255) |                      |
| parent_name  | CharField(255) |                      |
| created_at   | DateTimeField  | Auto-set on creation |

**Uniqueness:** `get_or_create` on `(trip, student_name)` prevents duplicate enrolments. A unique constraint should be added at the DB level.

### Payment

| Field          | Type               | Notes                                                       |
| -------------- | ------------------ | ----------------------------------------------------------- |
| id             | auto PK            |                                                             |
| enrolment      | FK → Enrolment     | Cascade delete, related_name="payments"                     |
| amount         | DecimalField(10,2) | Derived from trip.cost at payment time                      |
| card_last_four | CharField(4)       | For display/audit only — full card details are never stored |
| success        | BooleanField       | Default False                                               |
| transaction_id | CharField(255)     | Nullable — only present on success                          |
| error_message  | TextField          | Nullable — only present on failure                          |
| created_at     | DateTimeField      | Auto-set on creation                                        |

## Entity Relationship

```
School 1──* Trip 1──* Enrolment 1──* Payment
```
