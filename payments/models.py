from django.db import models


class Trip(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    date = models.DateField()
    location = models.CharField(max_length=200)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class School(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)


class Enrolment(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE)
    student_name = models.CharField(max_length=255)
    parent_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)


class Payment(models.Model):
    enrolment = models.ForeignKey(
        Enrolment, on_delete=models.CASCADE, related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    card_last_four = models.CharField(max_length=4)
    created_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=False)
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
