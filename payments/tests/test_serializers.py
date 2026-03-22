import pytest
from payments.serializers import PaymentSubmissionSerializer, TripSerializer


class TestPaymentSubmissionSerializer:
    def test_valid_input_passes(self, valid_payment_data):
        serializer = PaymentSubmissionSerializer(data=valid_payment_data)
        assert serializer.is_valid(), serializer.errors

    def test_missing_fields_rejected(self, valid_payment_data):
        for field in ["trip_id", "student_name", "parent_name", "card_number", "expiry_date", "cvv"]:
            data = {k: v for k, v in valid_payment_data.items() if k != field}
            serializer = PaymentSubmissionSerializer(data=data)
            assert not serializer.is_valid()
            assert field in serializer.errors

    @pytest.mark.parametrize("bad_card", ["123456789012345", "12345678901234567", "abcdefghijklmnop", "1234"])
    def test_bad_card_number_rejected(self, valid_payment_data, bad_card):
        valid_payment_data["card_number"] = bad_card
        serializer = PaymentSubmissionSerializer(data=valid_payment_data)
        assert not serializer.is_valid()
        assert "card_number" in serializer.errors

    def test_card_number_with_spaces_accepted(self, valid_payment_data):
        valid_payment_data["card_number"] = "1234 5678 9012 3456"
        serializer = PaymentSubmissionSerializer(data=valid_payment_data)
        assert serializer.is_valid(), serializer.errors

    @pytest.mark.parametrize("bad_expiry", ["13/25", "1/25", "AA/BB", "00/25"])
    def test_bad_expiry_rejected(self, valid_payment_data, bad_expiry):
        valid_payment_data["expiry_date"] = bad_expiry
        serializer = PaymentSubmissionSerializer(data=valid_payment_data)
        assert not serializer.is_valid()
        assert "expiry_date" in serializer.errors

    @pytest.mark.parametrize("bad_cvv", ["12", "ABCD", "12345"])
    def test_bad_cvv_rejected(self, valid_payment_data, bad_cvv):
        valid_payment_data["cvv"] = bad_cvv
        serializer = PaymentSubmissionSerializer(data=valid_payment_data)
        assert not serializer.is_valid()
        assert "cvv" in serializer.errors

    def test_valid_cvv_3_digits(self, valid_payment_data):
        valid_payment_data["cvv"] = "123"
        serializer = PaymentSubmissionSerializer(data=valid_payment_data)
        assert serializer.is_valid(), serializer.errors

    def test_valid_cvv_4_digits(self, valid_payment_data):
        valid_payment_data["cvv"] = "1234"
        serializer = PaymentSubmissionSerializer(data=valid_payment_data)
        assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
class TestTripSerializer:
    def test_trip_serializer_fields(self, trip):
        serializer = TripSerializer(trip)
        assert set(serializer.data.keys()) == {"id", "title", "description", "date", "location", "cost", "school"}

    def test_trip_serializer_nested_school(self, trip):
        serializer = TripSerializer(trip)
        assert serializer.data["school"] == {"id": trip.school.id, "name": "Kowhai Primary"}
