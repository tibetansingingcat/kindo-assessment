from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PaymentSubmissionSerializer, TripSerializer
from .legacy_processor import LegacyPaymentProcessor
from .models import Enrolment, Payment, Trip
from django.shortcuts import get_object_or_404


class SubmitPaymentView(APIView):
    def post(self, request):
        serializer = PaymentSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            trip = get_object_or_404(Trip, id=serializer.validated_data["trip_id"])
            student_name = serializer.validated_data["student_name"]
            parent_name = serializer.validated_data["parent_name"]
            card_number = serializer.validated_data["card_number"]
            expiry_date = serializer.validated_data["expiry_date"]
            cvv = serializer.validated_data["cvv"]
            activity_id = str(trip.id)  # type: ignore[attr-defined]
            amount = float(trip.cost)
            print(trip.school)
            school_id = trip.school_id  # type: ignore[attr-defined]
            enrolment = Enrolment.objects.create(
                trip=trip, student_name=student_name, parent_name=parent_name
            )
            legacy_processor = LegacyPaymentProcessor()
            processing_result = legacy_processor.process_payment(
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
                success=processing_result.success,
                transaction_id=processing_result.transaction_id,
                error_message=processing_result.error_message,
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
