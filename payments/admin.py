from django.contrib import admin
from .models import School, Trip, Enrolment, Payment


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("name", "address")


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("title", "school", "date", "location", "cost")


@admin.register(Enrolment)
class EnrolmentAdmin(admin.ModelAdmin):
    list_display = ("student_name", "trip", "parent_name", "created_at")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("enrolment", "amount", "success", "transaction_id", "created_at")
