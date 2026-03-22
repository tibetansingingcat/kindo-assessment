import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PaymentSubmissionSerializer, TripSerializer
from .services import PaymentService
from .models import Trip
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)


class SubmitPaymentView(APIView):
    payment_service = PaymentService()

    def post(self, request):
        serializer = PaymentSubmissionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        trip = get_object_or_404(Trip, id=serializer.validated_data["trip_id"])
        student_name = serializer.validated_data["student_name"]
        parent_name = serializer.validated_data["parent_name"]
        card_number = serializer.validated_data["card_number"]
        expiry_date = serializer.validated_data["expiry_date"]
        cvv = serializer.validated_data["cvv"]
        amount = float(trip.cost)

        try:
            processing_result = self.payment_service.enrol_and_pay(
                trip, student_name, parent_name, card_number, expiry_date, cvv
            )
        except Exception:
            logger.exception("Unexpected error processing payment for trip %s", trip.id)
            return Response(
                {"message": "An unexpected error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if processing_result.success:
            return Response(
                {
                    "message": "Payment processed successfully.",
                    "transaction_id": processing_result.transaction_id,
                    "amount_charged": amount,
                    "student_name": student_name,
                    "trip_name": trip.title,
                    "card_last_four": card_number[-4:],
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "message": "Payment failed.",
                "error": processing_result.error_message,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class TripListView(APIView):
    def get(self, _):
        trips = Trip.objects.select_related("school").all()
        serializer = TripSerializer(trips, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TripDetailView(APIView):
    def get(self, _, trip_id):
        trip = get_object_or_404(Trip.objects.select_related("school"), id=trip_id)
        serializer = TripSerializer(trip)
        return Response(serializer.data, status=status.HTTP_200_OK)
