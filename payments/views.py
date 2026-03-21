from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PaymentSubmissionSerializer, TripSerializer
from .services import PaymentService
from .models import Trip
from django.shortcuts import get_object_or_404


class SubmitPaymentView(APIView):
    payment_service = PaymentService()

    def post(self, request):
        serializer = PaymentSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            trip = get_object_or_404(Trip, id=serializer.validated_data["trip_id"])
            student_name = serializer.validated_data["student_name"]
            parent_name = serializer.validated_data["parent_name"]
            card_number = serializer.validated_data["card_number"]
            expiry_date = serializer.validated_data["expiry_date"]
            cvv = serializer.validated_data["cvv"]
            amount = float(trip.cost)

            processing_result = self.payment_service.enrol_and_pay(
                trip, student_name, parent_name, card_number, expiry_date, cvv
            )

            if processing_result.success:
                return Response(
                    {
                        "message": "Payment processed successfully.",
                        "transaction_id": processing_result.transaction_id,
                        "amount_charged": amount,
                        "student_name": student_name,
                        "trip_name": trip.title,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {
                        "message": "Payment failed.",
                        "error": processing_result.error_message,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TripDetailView(APIView):
    def get(self, _, trip_id):
        trip = get_object_or_404(Trip, id=trip_id)
        serializer = TripSerializer(trip)
        return Response(serializer.data, status=status.HTTP_200_OK)
