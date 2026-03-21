# Design Decisions & AI Usage

## AI-Assisted Development Process

### Approach

I used a two-phase approach to this challenge:

**Phase 1 — Manual exploration.** I built the data model, first API endpoints, DRF serializers with custom validation, the payment service layer, and retry logic by hand. This gave me a solid understanding of Django and DRF's patterns and let me make informed architectural decisions rather than blindly accepting generated code.

**Phase 2 — Spec-Driven Development (SDD).** Once I had a strong mental model of the system, I wrote detailed specification documents (see `specs/` directory) and used Claude Code to rapidly implement the remaining work: frontend build, backend polish, styling, and tests. Every generated output was reviewed against the specs and my understanding of the system.

### Tools Used

- Claude (Anthropic) — architectural discussion, spec authoring, code review
- Claude Code — implementation from specs, test generation

### Why This Approach

The challenge explicitly encourages AI tool usage while also evaluating whether the candidate can identify when tools are "hallucinating or going awry." Building the core backend by hand ensured I could catch any issues in generated code, while the spec-driven handoff kept the AI-generated work aligned with intentional design decisions.

## Architectural Decisions

### Data Model Simplification — No Student Model

The challenge requires a student's name during registration but nothing else — no auth, no student dashboard, no multi-trip history. A `Student` model with school FK, email, etc. would add complexity with no payoff. `student_name` lives as a string on `Enrolment`. If requirements grew to include student accounts, extracting a model would be straightforward.

### Enrolment as Explicit Join Entity

Rather than a flat payment submission, `Enrolment` represents "this student is registered for this trip." This gives us:

- A natural anchor for multiple payment attempts (FK from Payment to Enrolment)
- De-duplication via `unique_together` on `(trip, student_name)` and `get_or_create`
- Clean separation between registration data and payment data

### Separate Payment Table with Full Audit Trail

Each payment attempt is a separate record, including failures. The legacy processor has a 10% random failure rate, so retries are expected. Storing every attempt with `transaction_id` (success) or `error_message` (failure) enables:

- Debugging failed payments
- Reconciliation with the legacy system via transaction ID
- Visibility into retry patterns (how often do payments require multiple attempts?)

### Service Layer Pattern

Business logic lives in `PaymentService`, not in the view. The view handles HTTP concerns (validation, response formatting, status codes), the service handles domain logic (enrolment creation, processor integration, retry decisions). Benefits:

- Testable without HTTP overhead — mock the processor, call the service directly
- Thin views that read like a controller should
- Single responsibility — if the enrol-and-pay flow changes, one file to edit

### Retry Strategy — Selective, Not Blanket

The legacy processor returns the same `PaymentResponse` type for both validation errors and transient failures. We only retry on the specific transient failure message ("Payment declined by processor. Please try again."). Validation errors (bad card, missing fields, bad CVV) are returned immediately. This prevents wasting time retrying requests that will never succeed.

The retry condition is matched on an exact error message string, which is brittle. This is acknowledged and isolated in a single `_is_retryable` method. In production, we'd push for the legacy API to return structured error codes.

### Backend Derives What It Can

The frontend sends only what the parent types: `trip_id`, `student_name`, `parent_name`, and card details. The backend derives `amount` from `trip.cost`, `school_id` from `trip.school_id`, and `activity_id` from `trip.id`. This prevents the frontend from controlling the charge amount (security) and reduces the API surface area.

### Django REST Framework Over Plain Views

DRF serializers provide declarative input validation with structured error responses for free. The alternative — hand-writing `if field not in request.body` checks — duplicates what the legacy processor already does and produces inconsistent error formats. DRF is also likely what the Kindo team uses day-to-day.

### Django Over FastAPI

The challenge requirements mention both, but the constraints section specifies Django. More importantly, Kindo is a Django shop. Choosing Django demonstrates willingness to work in the team's stack rather than reaching for a more familiar tool.

## Production Considerations

If this were a real payment system rather than a challenge, the following would be priorities:

### Idempotency Keys

Prevent double-charging by requiring clients to send a unique idempotency key with each payment request. The backend checks whether a payment with that key already exists before processing. Critical for any payment system where network failures can cause ambiguous outcomes (did the payment go through or not?).

### Database Transactions

The current flow creates an Enrolment, then calls the processor, then creates a Payment. If the application crashes between any of these steps, the data is inconsistent. Wrapping the entire flow in `django.db.transaction.atomic()` ensures either everything commits or nothing does. For the processor call specifically (which is an external side effect), we'd need to consider a two-phase approach: create records in a "pending" state, call the processor, then update status.

### Observability

Structured logging with correlation IDs so a single payment request can be traced end-to-end. Metrics on: payment success/failure rates, retry frequency, processor latency (p50/p95/p99). Alerting if failure rate exceeds baseline. Integration with a tool like Datadog or Sentry for error tracking.

### Rate Limiting

Protect the legacy processor from abuse. Rate limit by IP or session at the API gateway level. Also consider rate limiting per-student to prevent rapid-fire retries from a buggy frontend.

### Circuit Breaker on Legacy Processor

If the legacy processor starts failing consistently (not just the 10% random decline, but a sustained outage), every payment request will wait through retries and eventually fail. This wastes time for parents and puts unnecessary load on a struggling service. A circuit breaker tracks recent failure rates across all requests and short-circuits immediately when the failure rate exceeds a threshold — returning a fast "service unavailable" instead of making parents wait 4.5s for an inevitable failure. After a cooldown period, it lets a single probe request through to test recovery. Combined with per-request retry backoff, this provides protection at both the individual request and system level.

### Typed Error Codes from Legacy API

The current legacy processor returns human-readable error messages with no structured error codes. This forces us to match on exact strings to distinguish retryable vs non-retryable errors — brittle and dangerous. In production, we'd advocate for the legacy API to return machine-readable error codes (e.g. `DECLINED_TRANSIENT`, `INVALID_CARD`, `INVALID_CVV`) alongside the messages. Until then, our string-matching is isolated in a single method to minimise blast radius when messages change.
