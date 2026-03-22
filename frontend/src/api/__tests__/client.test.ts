import { getTrips, getTrip, submitPayment, API_BASE } from '../client';
import { ApiError } from '../../types';
import { mockTrip, mockTrips, mockPaymentSuccess, mockPaymentRequest } from '../../test/fixtures';

describe('API Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTrips', () => {
    it('fetches from /api/trips/ and returns parsed trips', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(mockTrips), { status: 200 }),
      );

      const trips = await getTrips();

      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/trips/`);
      expect(trips).toEqual(mockTrips);
    });

    it('throws ApiError on network error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(getTrips()).rejects.toThrow();
    });
  });

  describe('getTrip', () => {
    it('fetches from /api/trips/{id}/ with correct id', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(mockTrip), { status: 200 }),
      );

      const trip = await getTrip(1);

      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/trips/1/`);
      expect(trip).toEqual(mockTrip);
    });

    it('throws ApiError with status 404 when trip not found', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Not found.' }), { status: 404 }),
      );

      await expect(getTrip(999)).rejects.toThrow(ApiError);
      try {
        await getTrip(999);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });
  });

  describe('submitPayment', () => {
    it('POSTs with correct method, headers, and body', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(mockPaymentSuccess), { status: 200 }),
      );

      await submitPayment(mockPaymentRequest);

      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/payments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPaymentRequest),
      });
    });

    it('returns PaymentSuccess on 200 response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(mockPaymentSuccess), { status: 200 }),
      );

      const result = await submitPayment(mockPaymentRequest);

      expect(result).toEqual(mockPaymentSuccess);
    });

    it('throws ApiError with fieldErrors on 400 validation error', async () => {
      const validationBody = { card_number: ['Card number must be 16 digits.'] };
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(validationBody), { status: 400 }),
      );

      try {
        await submitPayment(mockPaymentRequest);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.fieldErrors).toEqual(validationBody);
      }
    });

    it('throws ApiError with paymentError on 400 payment declined', async () => {
      const declinedBody = {
        message: 'Payment failed.',
        error: 'Payment declined by processor. Please try again.',
      };
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(declinedBody), { status: 400 }),
      );

      try {
        await submitPayment(mockPaymentRequest);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.paymentError).toEqual(declinedBody);
      }
    });

    it('throws ApiError on 500 server error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: 'An unexpected error occurred. Please try again later.' }),
          { status: 500 },
        ),
      );

      try {
        await submitPayment(mockPaymentRequest);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(500);
      }
    });
  });
});
