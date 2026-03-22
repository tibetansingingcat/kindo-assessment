from rest_framework import serializers
from .models import School, Trip
import re


class PaymentSubmissionSerializer(serializers.Serializer):
    trip_id = serializers.IntegerField()
    student_name = serializers.CharField(max_length=255)
    parent_name = serializers.CharField(max_length=255)
    card_number = serializers.CharField(max_length=19)  # Allow spaces for readability
    expiry_date = serializers.CharField(max_length=5)  # MM/YY format
    cvv = serializers.CharField(max_length=4)

    def validate_card_number(self, value):
        if not re.match(r"^\d{16}$", value.replace(" ", "")):
            raise serializers.ValidationError("Card number must be 16 digits.")
        return value.strip()

    def validate_expiry_date(self, value):
        if not re.match(r"^(0[1-9]|1[0-2])\/\d{2}$", value):
            raise serializers.ValidationError("Expiry date must be in MM/YY format.")
        return value

    def validate_cvv(self, value):
        if not re.match(r"^\d{3,4}$", value):
            raise serializers.ValidationError("CVV must be 3 or 4 digits.")
        return value


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = School
        fields = ["id", "name"]


class TripSerializer(serializers.ModelSerializer):
    school = SchoolSerializer(read_only=True)

    class Meta:  # type: ignore[override]
        model = Trip
        fields = ["id", "title", "description", "date", "location", "cost", "school"]
