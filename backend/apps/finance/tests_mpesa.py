import json
from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from academics.models import Level, Cohort
from students.models import Student
from finance.models import MpesaTransaction, Payment

# Monkey-patch to bypass Django 4.2+ template context copying bug during 500 errors
import django.test.client
django.test.client.store_rendered_templates = lambda *args, **kwargs: None

User = get_user_model()

class MpesaIntegrationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="password")
        self.level = Level.objects.create(code="JHS1", name="Junior High 1")
        self.cohort = Cohort.objects.create(
            name="Class of 2026",
            level=self.level,
            start_date="2026-01-01",
            end_date="2026-12-31"
        )
        self.student = Student.objects.create(
            user=self.user,
            admission_number="ADM-001",
            first_name="John",
            last_name="Doe",
            current_level=self.level,
            current_cohort=self.cohort
        )
        self.client.force_authenticate(user=self.user)
        
    @patch('finance.services.mpesa.MpesaService.initiate_stk_push')
    def test_stk_push_initiation(self, mock_initiate):
        mock_initiate.return_value = {
            "success": True,
            "merchant_request_id": "MRQ_12345",
            "checkout_request_id": "CHK_12345",
            "customer_message": "Success"
        }
        
        payload = {
            "student_id": self.student.id,
            "phone_number": "254712345678",
            "amount": "5000.00"
        }
        
        response = self.client.post("/api/mpesa/stk-push/", payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify transaction created
        txn = MpesaTransaction.objects.get(checkout_request_id="CHK_12345")
        self.assertEqual(txn.amount, 5000.00)
        self.assertEqual(txn.status, "PENDING")
        self.assertEqual(txn.student, self.student)
        
    def test_mpesa_callback_success(self):
        # Create a pending transaction
        txn = MpesaTransaction.objects.create(
            checkout_request_id="ws_CO_09052026",
            merchant_request_id="12345-6789-1",
            student=self.student,
            phone="254712345678",
            amount=5000.00,
            status="PENDING"
        )
        
        payload = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "12345-6789-1",
                    "CheckoutRequestID": "ws_CO_09052026",
                    "ResultCode": 0,
                    "ResultDesc": "The service request is processed successfully.",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": 5000.00},
                            {"Name": "MpesaReceiptNumber", "Value": "NLJ7RT61SV"},
                            {"Name": "PhoneNumber", "Value": 254712345678}
                        ]
                    }
                }
            }
        }
        
        response = self.client.post("/api/mpesa/callback/", payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        txn.refresh_from_db()
        self.assertEqual(txn.status, "COMPLETED")
        self.assertEqual(txn.mpesa_reference, "NLJ7RT61SV")
        
        # Ensure Payment was created
        payment = Payment.objects.get(mpesa_reference="NLJ7RT61SV")
        self.assertEqual(payment.student, self.student)
        self.assertEqual(payment.amount, 5000.00)
        
    def test_mpesa_callback_failure(self):
        txn = MpesaTransaction.objects.create(
            checkout_request_id="ws_CO_FAILED",
            merchant_request_id="FAIL-123",
            student=self.student,
            amount=1000.00,
            status="PENDING"
        )
        
        payload = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "FAIL-123",
                    "CheckoutRequestID": "ws_CO_FAILED",
                    "ResultCode": 1032,
                    "ResultDesc": "Request cancelled by user"
                }
            }
        }
        
        response = self.client.post("/api/mpesa/callback/", payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        txn.refresh_from_db()
        self.assertEqual(txn.status, "FAILED")
        
        # Payment should NOT be created
        self.assertEqual(Payment.objects.count(), 0)
