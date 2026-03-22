import pytest
from unittest.mock import patch

from payments.models import Enrolment, Payment
from payments.services import PaymentService
from payments.legacy_processor import PaymentResponse


pytestmark = pytest.mark.django_db


class TestPaymentService:
    def setup_method(self):
        self.service = PaymentService()

    def _call(self, trip, mock):
        return self.service.enrol_and_pay(
            trip=trip,
            student_name="Emma Wilson",
            parent_name="Sarah Wilson",
            card_number="1234567890123456",
            expiry_date="12/27",
            cvv="123",
        )

    def test_enrol_and_pay_creates_enrolment(self, trip, mock_processor_success):
        self._call(trip, mock_processor_success)
        assert Enrolment.objects.filter(trip=trip, student_name="Emma Wilson").exists()

    def test_enrol_and_pay_reuses_existing_enrolment(self, trip, mock_processor_success):
        Enrolment.objects.create(trip=trip, student_name="Emma Wilson", parent_name="Sarah Wilson")
        self._call(trip, mock_processor_success)
        assert Enrolment.objects.filter(trip=trip, student_name="Emma Wilson").count() == 1

    def test_payment_record_saved_on_success(self, trip, mock_processor_success):
        self._call(trip, mock_processor_success)
        payment = Payment.objects.first()
        assert payment.success is True
        assert payment.transaction_id == "TX-1234567890-1234"

    def test_payment_record_saved_on_failure(self, trip, mock_processor_validation_error):
        self._call(trip, mock_processor_validation_error)
        payment = Payment.objects.first()
        assert payment.success is False
        assert payment.error_message == "Invalid card number. Must be 16 digits."

    def test_retry_on_retryable_error(self, trip, mock_processor_failure):
        self._call(trip, mock_processor_failure)
        assert mock_processor_failure.process_payment.call_count == 3

    def test_no_retry_on_validation_error(self, trip, mock_processor_validation_error):
        self._call(trip, mock_processor_validation_error)
        assert mock_processor_validation_error.process_payment.call_count == 1

    def test_payment_record_per_attempt(self, trip, mock_processor_failure):
        self._call(trip, mock_processor_failure)
        assert Payment.objects.count() == 3

    def test_successful_response_returned(self, trip, mock_processor_success):
        result = self._call(trip, mock_processor_success)
        assert result.success is True
        assert result.transaction_id == "TX-1234567890-1234"

    def test_failed_response_after_retries(self, trip, mock_processor_failure):
        result = self._call(trip, mock_processor_failure)
        assert result.success is False
        assert result.error_message == "Payment declined by processor. Please try again."

    def test_retry_then_success(self, trip):
        fail = PaymentResponse(success=False, error_message="Payment declined by processor. Please try again.")
        success = PaymentResponse(success=True, transaction_id="TX-9999")
        with patch("payments.services.PaymentService.legacy_processor") as mock:
            mock.process_payment.side_effect = [fail, success]
            result = self._call(trip, mock)
        assert result.success is True
        assert Payment.objects.count() == 2
