import pytest
from django.contrib.admin.sites import AdminSite

from payments.models import School, Trip, Enrolment, Payment
from payments.admin import SchoolAdmin, TripAdmin, EnrolmentAdmin, PaymentAdmin


pytestmark = pytest.mark.django_db


class TestAdminRegistration:
    def test_school_admin_registered(self):
        assert SchoolAdmin is not None

    def test_trip_admin_registered(self):
        assert TripAdmin is not None

    def test_enrolment_admin_registered(self):
        admin = EnrolmentAdmin(Enrolment, AdminSite())
        assert "student_name" in admin.list_display
        assert "trip" in admin.list_display
        assert "parent_name" in admin.list_display
        assert "created_at" in admin.list_display

    def test_payment_admin_registered(self):
        admin = PaymentAdmin(Payment, AdminSite())
        assert "enrolment" in admin.list_display
        assert "amount" in admin.list_display
        assert "success" in admin.list_display
        assert "transaction_id" in admin.list_display
        assert "created_at" in admin.list_display
