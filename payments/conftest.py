import pytest
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from payments.models import School, Trip
from payments.legacy_processor import PaymentResponse


@pytest.fixture
def school(db):
    return School.objects.create(name="Kowhai Primary", address="123 Main Street, Auckland")


@pytest.fixture
def trip(school):
    return Trip.objects.create(
        title="Museum Field Trip",
        school=school,
        description="A visit to Auckland Museum",
        date=date(2026, 4, 15),
        location="Auckland Museum",
        cost=Decimal("45.00"),
    )


@pytest.fixture
def valid_payment_data(trip):
    return {
        "trip_id": trip.id,
        "student_name": "Emma Wilson",
        "parent_name": "Sarah Wilson",
        "card_number": "1234567890123456",
        "expiry_date": f"12/{date.today().year % 100 + 2:02d}",
        "cvv": "123",
    }


@pytest.fixture
def mock_processor_success():
    response = PaymentResponse(success=True, transaction_id="TX-1234567890-1234")
    with patch("payments.services.PaymentService.legacy_processor") as mock:
        mock.process_payment.return_value = response
        yield mock


@pytest.fixture
def mock_processor_failure():
    response = PaymentResponse(
        success=False,
        error_message="Payment declined by processor. Please try again.",
    )
    with patch("payments.services.PaymentService.legacy_processor") as mock:
        mock.process_payment.return_value = response
        yield mock


@pytest.fixture
def mock_processor_validation_error():
    response = PaymentResponse(
        success=False,
        error_message="Invalid card number. Must be 16 digits.",
    )
    with patch("payments.services.PaymentService.legacy_processor") as mock:
        mock.process_payment.return_value = response
        yield mock
