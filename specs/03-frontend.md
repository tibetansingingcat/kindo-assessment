# Frontend Spec

## Overview

Single-page React application for parents to view school trips, register their child, and make a payment. Clean, responsive design with Tailwind CSS.

## Stack

- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- fetch for API calls (no axios needed for this scope)

## Project Setup

```
frontend/
├── src/
│   ├── components/
│   │   ├── TripList.tsx
│   │   ├── TripCard.tsx
│   │   ├── PaymentForm.tsx
│   │   ├── Confirmation.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── LoadingSpinner.tsx
│   ├── api/
│   │   └── client.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## TypeScript Types

```typescript
interface School {
  id: number;
  name: string;
}

interface Trip {
  id: number;
  title: string;
  description: string;
  date: string; // "YYYY-MM-DD"
  location: string;
  cost: string; // Decimal comes as string from DRF
  school: School;
}

interface PaymentRequest {
  trip_id: number;
  student_name: string;
  parent_name: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
}

interface PaymentSuccess {
  message: string;
  transaction_id: string;
  amount_charged: number;
  student_name: string;
  trip_name: string;
}

interface PaymentError {
  message: string;
  error: string;
}

// DRF validation errors come back as field -> string[]
interface ValidationErrors {
  [field: string]: string[];
}
```

## API Client

Simple wrapper around fetch pointing at the Django backend.

```typescript
// api/client.ts
const API_BASE = "http://localhost:8000/api";

export async function getTrips(): Promise<Trip[]> { ... }
export async function getTrip(id: number): Promise<Trip> { ... }
export async function submitPayment(data: PaymentRequest): Promise<PaymentSuccess> { ... }
```

`submitPayment` should handle the response branching: parse the JSON, check response.ok, throw or return appropriately so the component can distinguish between success, validation errors, and payment failures.

## App Flow

The app is a single-page stepped flow, managed with React state (no router needed). Three states:

```
SELECT_TRIP  →  PAYMENT_FORM  →  CONFIRMATION
                    ↑                   |
                    └── (retry) ────────┘
                    ↑
              (back button)
```

### State Management

Top-level App component holds:

- `step`: "select_trip" | "payment_form" | "confirmation"
- `selectedTrip`: Trip | null
- `paymentResult`: PaymentSuccess | null

No Redux or context needed — prop drilling is fine for 3 components.

## Screens

### Screen 1: Trip Selection

**Route into:** App loads here by default.

**Behaviour:**

- On mount, fetch GET /api/trips/
- Show loading spinner while fetching
- Display trips as cards in a responsive grid
- Handle empty state ("No trips available")
- Handle fetch error ("Could not load trips. Please try again.")

**Trip Card contents:**

- Trip title (prominent)
- School name
- Date (formatted nicely, e.g. "15 April 2026")
- Location
- Cost (formatted as currency, e.g. "$45.00")
- Description (if present)
- "Register & Pay" button

**On "Register & Pay" click:**

- Set selectedTrip, advance to payment_form step

### Screen 2: Registration & Payment Form

**Layout:**

- Trip summary banner at top (title, date, location, cost) so parent confirms what they're paying for
- Form below with two sections:
  1. **Student Details**: student name, parent name
  2. **Payment Details**: card number, expiry date, CVV

**Field details:**

| Field        | Type | Placeholder           | Validation                          |
| ------------ | ---- | --------------------- | ----------------------------------- |
| Student Name | text | "Child's full name"   | Required                            |
| Parent Name  | text | "Your full name"      | Required                            |
| Card Number  | text | "1234 5678 9012 3456" | Required, 16 digits (allow spaces)  |
| Expiry Date  | text | "MM/YY"               | Required, format MM/YY, month 01-12 |
| CVV          | text | "123"                 | Required, exactly 3 digits          |

**Client-side validation:**

- Validate on submit (not on every keystroke — less annoying)
- Show inline error messages below each invalid field
- Don't submit if validation fails
- Card number: strip spaces, check 16 digits
- Expiry: regex match MM/YY, month in range
- CVV: exactly 3 digits

**On submit:**

- Disable submit button
- Show loading state with progressive messages:
  - 0-1.5s: "Processing payment..."
  - After 1.5s: "Taking a little longer than usual, hang on..."
  - After 4.5s: "Still working on it, please don't close this page..."
  - Use a simple setTimeout chain or interval to update the message. The 1.5s threshold corresponds to one legacy processor call; if we've passed that, the backend is likely retrying.
- POST to /api/payments/
- On success: advance to confirmation step with result data
- On validation error (400 with field errors): show field-level errors from server response
- On payment failure (400 with message/error): show error message, keep form populated, allow retry
- On network/server error (500 or fetch failure): show generic error message

**Back button:** Return to trip selection, clear form state.

### Screen 3: Confirmation

**Displayed on payment success.**

**Contents:**

- Success icon/banner (green checkmark or similar)
- "Payment Confirmed" heading
- Transaction ID
- Trip name
- Student name
- Amount charged (formatted as currency)
- Date of trip
- "Register Another Student" button → returns to trip selection

**Nice-to-have:**

- Print/save receipt (window.print() with print-friendly CSS)
- Subtle confetti or success animation

## Styling Guidelines

**Tailwind CSS approach:**

- Max width container (max-w-2xl) centered on page
- White card with shadow for main content area
- Kindo brand colour for buttons and highlights: #00acc9 (a teal/cyan)
- Responsive: single column on mobile, still looks good on desktop
- Form inputs: full width, rounded borders, clear focus states
- Buttons: full width on mobile, auto-width on desktop, clear hover/disabled states
- Error messages: red text below fields
- Loading spinner: centered, with text message beneath

**Typography:**

- Clean sans-serif (Tailwind default is fine)
- Trip title: text-2xl font-bold
- Section headings: text-lg font-semibold
- Body text: text-base
- Helper/error text: text-sm

## Error Handling Summary

| Scenario                                     | UI Behaviour                                            |
| -------------------------------------------- | ------------------------------------------------------- |
| Trips fail to load                           | Error message with retry button                         |
| Form validation fails (client)               | Inline errors under fields                              |
| Server validation fails (400 + field errors) | Map server errors to inline field errors                |
| Payment declined (400 + message)             | Error banner above form, form stays populated for retry |
| Unexpected server error (500)                | Generic error banner, suggest retry                     |
| Network failure                              | Generic error banner, suggest retry                     |

## Accessibility

- All form inputs have associated labels (not just placeholder text)
- Error messages linked to inputs via aria-describedby
- Loading states announced via aria-live region
- Buttons have clear disabled styling and are not focusable when loading
- Sufficient colour contrast on all text

## Dev Server

Vite dev server on port 5173. Either configure Vite proxy to forward /api/\* to localhost:8000, or rely on django-cors-headers. CORS is simpler for this challenge.
