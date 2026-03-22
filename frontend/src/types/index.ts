export interface School {
  id: number;
  name: string;
}

export interface Trip {
  id: number;
  title: string;
  description: string;
  date: string; // "YYYY-MM-DD"
  location: string;
  cost: string; // Decimal comes as string from DRF
  school: School;
}

export interface PaymentRequest {
  trip_id: number;
  student_name: string;
  parent_name: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
}

export interface PaymentSuccess {
  message: string;
  transaction_id: string;
  amount_charged: number;
  student_name: string;
  trip_name: string;
}

export interface PaymentError {
  message: string;
  error: string;
}

export interface ValidationErrors {
  [field: string]: string[];
}

export type AppStep = 'select_trip' | 'payment_form' | 'confirmation';

export class ApiError extends Error {
  status: number;
  fieldErrors?: ValidationErrors;
  paymentError?: PaymentError;

  constructor(
    message: string,
    status: number,
    fieldErrors?: ValidationErrors,
    paymentError?: PaymentError,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.paymentError = paymentError;
  }
}
