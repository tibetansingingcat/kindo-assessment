import pytest
from rest_framework.test import APIClient


pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


class TestTripListView:
    def test_list_trips_200(self, api_client, trip):
        response = api_client.get("/api/trips/")
        assert response.status_code == 200
        titles = [t["title"] for t in response.data]
        assert "Museum Field Trip" in titles

    def test_list_trips_includes_nested_school(self, api_client, trip):
        response = api_client.get(f"/api/trips/{trip.id}/")
        assert response.data["school"] == {
            "id": trip.school.id,
            "name": "Kowhai Primary",
        }

    def test_list_trips_returns_list(self, api_client):
        response = api_client.get("/api/trips/")
        assert response.status_code == 200
        assert isinstance(response.data, list)


class TestTripDetailView:
    def test_get_trip_detail_200(self, api_client, trip):
        response = api_client.get(f"/api/trips/{trip.id}/")
        assert response.status_code == 200
        assert response.data["title"] == "Museum Field Trip"
        assert response.data["cost"] == "45.00"

    def test_get_trip_detail_includes_nested_school(self, api_client, trip):
        response = api_client.get(f"/api/trips/{trip.id}/")
        assert response.data["school"] == {
            "id": trip.school.id,
            "name": "Kowhai Primary",
        }

    def test_get_trip_detail_404(self, api_client):
        response = api_client.get("/api/trips/9999/")
        assert response.status_code == 404


class TestSubmitPaymentView:
    def test_post_payment_success_200(self, api_client, valid_payment_data, mock_processor_success):
        response = api_client.post("/api/payments/", valid_payment_data, format="json")
        assert response.status_code == 200
        assert response.data["message"] == "Payment processed successfully."
        assert response.data["transaction_id"] == "TX-1234567890-1234"
        assert response.data["amount_charged"] == 45.0
        assert response.data["student_name"] == "Emma Wilson"
        assert response.data["trip_name"] == "Museum Field Trip"

    def test_post_payment_validation_error_400(self, api_client, valid_payment_data):
        valid_payment_data["card_number"] = "bad"
        response = api_client.post("/api/payments/", valid_payment_data, format="json")
        assert response.status_code == 400
        assert "card_number" in response.data

    def test_post_payment_decline_400(self, api_client, valid_payment_data, mock_processor_failure):
        response = api_client.post("/api/payments/", valid_payment_data, format="json")
        assert response.status_code == 400
        assert response.data["message"] == "Payment failed."
        assert "declined" in response.data["error"].lower()

    def test_post_payment_invalid_trip_404(self, api_client, valid_payment_data):
        valid_payment_data["trip_id"] = 9999
        response = api_client.post("/api/payments/", valid_payment_data, format="json")
        assert response.status_code == 404

    def test_post_payment_missing_fields_400(self, api_client, trip):
        response = api_client.post(
            "/api/payments/", {"trip_id": trip.id}, format="json"
        )
        assert response.status_code == 400

    def test_post_payment_unexpected_error_500(self, api_client, valid_payment_data):
        from unittest.mock import patch

        with patch("payments.services.PaymentService.legacy_processor") as mock:
            mock.process_payment.side_effect = Exception("Connection timeout")
            response = api_client.post(
                "/api/payments/", valid_payment_data, format="json"
            )
        assert response.status_code == 500
        assert (
            response.data["message"]
            == "An unexpected error occurred. Please try again later."
        )
