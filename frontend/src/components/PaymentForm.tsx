import { useState, useEffect, useRef } from 'react';
import type { Trip, PaymentSuccess, ValidationErrors } from '../types';
import { ApiError } from '../types';
import { submitPayment } from '../api/client';

interface PaymentFormProps {
  trip: Trip;
  onSuccess: (result: PaymentSuccess) => void;
  onBack: () => void;
}

function formatCost(cost: string): string {
  return `$${parseFloat(cost).toFixed(2)}`;
}

export function PaymentForm({ trip, onSuccess, onBack }: PaymentFormProps) {
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  function validate(): ValidationErrors {
    const errors: ValidationErrors = {};
    if (!studentName.trim()) errors.student_name = ['Student name is required'];
    if (!parentName.trim()) errors.parent_name = ['Parent name is required'];

    const strippedCard = cardNumber.replace(/\s/g, '');
    if (!strippedCard) {
      errors.card_number = ['Card number is required'];
    } else if (!/^\d{16}$/.test(strippedCard)) {
      errors.card_number = ['Card number must be 16 digits'];
    }

    if (!expiryDate) {
      errors.expiry_date = ['Expiry date is required'];
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      errors.expiry_date = ['Expiry must be MM/YY format'];
    }

    if (!cvv) {
      errors.cvv = ['CVV is required'];
    } else if (!/^\d{3}$/.test(cvv)) {
      errors.cvv = ['CVV must be 3 digits'];
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setLoadingMessage('Processing payment...');

    const t1 = setTimeout(() => setLoadingMessage('Taking a little longer than usual, hang on...'), 1500);
    const t2 = setTimeout(() => setLoadingMessage("Still working on it, please don't close this page..."), 4500);
    timersRef.current = [t1, t2];

    try {
      const result = await submitPayment({
        trip_id: trip.id,
        student_name: studentName.trim(),
        parent_name: parentName.trim(),
        card_number: cardNumber.replace(/\s/g, ''),
        expiry_date: expiryDate,
        cvv,
      });
      onSuccess(result);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        } else if (err.paymentError) {
          setGeneralError(err.paymentError.error);
        } else {
          setGeneralError('An unexpected error occurred. Please try again.');
        }
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } finally {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      setSubmitting(false);
      setLoadingMessage('');
    }
  }

  function renderFieldError(field: string) {
    const errs = fieldErrors[field];
    if (!errs || errs.length === 0) return null;
    return (
      <p id={`${field}-error`} className="mt-1 text-sm text-red-600">
        {errs[0]}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <h2 className="text-lg font-semibold text-gray-900">{trip.title}</h2>
        <p className="text-sm text-gray-600">{trip.location}</p>
        <p className="text-lg font-bold text-gray-900">{formatCost(trip.cost)}</p>
      </div>

      {generalError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {generalError}
        </div>
      )}

      {submitting && (
        <div aria-live="polite" className="mb-4 text-center text-sm text-gray-500">
          {loadingMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <fieldset className="mb-6 space-y-4">
          <legend className="text-lg font-semibold text-gray-900">Student Details</legend>
          <div>
            <label htmlFor="student_name" className="block text-sm font-medium text-gray-700">
              Student Name
            </label>
            <input
              id="student_name"
              type="text"
              placeholder="Child's full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              aria-describedby={fieldErrors.student_name ? 'student_name-error' : undefined}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#00acc9] focus:outline-none focus:ring-1 focus:ring-[#00acc9]"
            />
            {renderFieldError('student_name')}
          </div>
          <div>
            <label htmlFor="parent_name" className="block text-sm font-medium text-gray-700">
              Parent Name
            </label>
            <input
              id="parent_name"
              type="text"
              placeholder="Your full name"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              aria-describedby={fieldErrors.parent_name ? 'parent_name-error' : undefined}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#00acc9] focus:outline-none focus:ring-1 focus:ring-[#00acc9]"
            />
            {renderFieldError('parent_name')}
          </div>
        </fieldset>

        <fieldset className="mb-6 space-y-4">
          <legend className="text-lg font-semibold text-gray-900">Payment Details</legend>
          <div>
            <label htmlFor="card_number" className="block text-sm font-medium text-gray-700">
              Card Number
            </label>
            <input
              id="card_number"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              aria-describedby={fieldErrors.card_number ? 'card_number-error' : undefined}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#00acc9] focus:outline-none focus:ring-1 focus:ring-[#00acc9]"
            />
            {renderFieldError('card_number')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700">
                Expiry Date
              </label>
              <input
                id="expiry_date"
                type="text"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                aria-describedby={fieldErrors.expiry_date ? 'expiry_date-error' : undefined}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#00acc9] focus:outline-none focus:ring-1 focus:ring-[#00acc9]"
              />
              {renderFieldError('expiry_date')}
            </div>
            <div>
              <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                CVV
              </label>
              <input
                id="cvv"
                type="text"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                aria-describedby={fieldErrors.cvv ? 'cvv-error' : undefined}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#00acc9] focus:outline-none focus:ring-1 focus:ring-[#00acc9]"
              />
              {renderFieldError('cvv')}
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[#00acc9] px-6 py-2 text-sm font-medium text-white hover:bg-[#0097b0] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {submitting ? 'Processing...' : 'Submit Payment'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
