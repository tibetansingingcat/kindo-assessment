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
    } else {
      const month = parseInt(expiryDate.slice(0, 2), 10);
      const year = 2000 + parseInt(expiryDate.slice(3), 10);
      const now = new Date();
      if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
        errors.expiry_date = ['Card has expired'];
      }
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
      <p id={`${field}-error`} className="mt-1.5 text-xs font-medium text-red-500">
        {errs[0]}
      </p>
    );
  }

  const inputClass = (field: string) =>
    `mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 ${
      fieldErrors[field] ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
    }`;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to trips
      </button>

      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 text-xl">
          <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-slate-900">{trip.title}</h2>
          <p className="text-sm text-slate-400">{trip.location}</p>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-slate-900">{formatCost(trip.cost)}</span>
        </div>
      </div>

      {generalError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-600">{generalError}</p>
        </div>
      )}

      {submitting && (
        <div aria-live="polite" className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-cyan-50 p-3 text-sm text-cyan-700">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {loadingMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Student Details
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="student_name" className="block text-sm font-medium text-slate-700">
                Student Name
              </label>
              <input
                id="student_name"
                type="text"
                placeholder="Child's full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                aria-describedby={fieldErrors.student_name ? 'student_name-error' : undefined}
                className={inputClass('student_name')}
              />
              {renderFieldError('student_name')}
            </div>
            <div>
              <label htmlFor="parent_name" className="block text-sm font-medium text-slate-700">
                Parent Name
              </label>
              <input
                id="parent_name"
                type="text"
                placeholder="Your full name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                aria-describedby={fieldErrors.parent_name ? 'parent_name-error' : undefined}
                className={inputClass('parent_name')}
              />
              {renderFieldError('parent_name')}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            Payment Details
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="card_number" className="block text-sm font-medium text-slate-700">
                Card Number
              </label>
              <input
                id="card_number"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                aria-describedby={fieldErrors.card_number ? 'card_number-error' : undefined}
                className={inputClass('card_number')}
              />
              {renderFieldError('card_number')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiry_date" className="block text-sm font-medium text-slate-700">
                  Expiry Date
                </label>
                <input
                  id="expiry_date"
                  type="text"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => {
                    let val = e.target.value;
                    // Auto-insert slash after 2 digits
                    if (val.length === 2 && expiryDate.length === 1) {
                      val += '/';
                    }
                    setExpiryDate(val);
                  }}
                  aria-describedby={fieldErrors.expiry_date ? 'expiry_date-error' : undefined}
                  className={inputClass('expiry_date')}
                />
                {renderFieldError('expiry_date')}
              </div>
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-slate-700">
                  CVV
                </label>
                <input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  aria-describedby={fieldErrors.cvv ? 'cvv-error' : undefined}
                  className={inputClass('cvv')}
                />
                {renderFieldError('cvv')}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/30 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg disabled:hover:brightness-100"
        >
          {submitting ? 'Processing...' : 'Submit Payment'}
        </button>
      </form>
    </div>
  );
}
