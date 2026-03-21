from .models import Enrolment, Payment, Trip
from .legacy_processor import LegacyPaymentProcessor, PaymentResponse
import logging


class PaymentService:
    legacy_processor = LegacyPaymentProcessor()
    logger = logging.getLogger(__name__)

    def enrol_and_pay(
        self,
        trip: Trip,
        student_name: str,
        parent_name: str,
        card_number: str,
        expiry_date: str,
        cvv: str,
    ) -> PaymentResponse:

        enrolment, created = Enrolment.objects.get_or_create(
            trip=trip,
            student_name=student_name,
            defaults={"parent_name": parent_name},
        )
        if created:
            self.logger.info(
                "Created new enrolment for student '%s' in trip '%s'.",
                student_name,
                trip.title,
            )
        else:
            self.logger.info(
                "Found existing enrolment for student '%s' in trip '%s'. Proceeding with payment.",
                student_name,
                trip.title,
            )

        activity_id = str(trip.id)  # type: ignore[attr-defined]
        amount = float(trip.cost)
        school_id = trip.school_id  # type: ignore[attr-defined]

        return self._process_with_retry(
            enrolment,
            activity_id,
            school_id,
            student_name,
            parent_name,
            card_number,
            expiry_date,
            cvv,
            amount,
        )

    def _process_with_retry(
        self,
        enrolment: Enrolment,
        activity_id: str,
        school_id: str,
        student_name: str,
        parent_name: str,
        card_number: str,
        expiry_date: str,
        cvv: str,
        amount: float,
        max_attempts: int = 3,
    ) -> PaymentResponse:

        result = PaymentResponse(success=False, error_message="No attempts made.")

        for _ in range(max_attempts):
            result = self.legacy_processor.process_payment(
                payment_data={
                    "student_name": student_name,
                    "parent_name": parent_name,
                    "card_number": card_number,
                    "expiry_date": expiry_date,
                    "cvv": cvv,
                    "activity_id": activity_id,
                    "amount": amount,
                    "school_id": school_id,
                }
            )
            Payment.objects.create(
                enrolment=enrolment,
                amount=amount,
                card_last_four=card_number[-4:],
                success=result.success,
                transaction_id=result.transaction_id,
                error_message=result.error_message,
            )
            if result.success or not self._is_retryable(result):
                if result.success:
                    self.logger.info(
                        "Payment successful for student '%s' on attempt %d.",
                        student_name,
                        _ + 1,
                    )
                else:
                    self.logger.warning(
                        "Payment failed for student '%s' on attempt %d with non-retryable error: %s",
                        student_name,
                        _ + 1,
                        result.error_message,
                    )
                return result

            self.logger.warning(
                "Payment attempt %d failed for student '%s' with retryable error: %s. Retrying...",
                _ + 1,
                student_name,
                result.error_message,
            )

        self.logger.error(
            "All payment attempts failed for student '%s'. Final error: %s",
            student_name,
            result.error_message,
        )
        return result

    def _is_retryable(self, result: PaymentResponse) -> bool:
        return (
            not result.success
            and result.error_message
            == "Payment declined by processor. Please try again."
        )
