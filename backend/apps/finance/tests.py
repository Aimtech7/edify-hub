from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status

from academics.models import Level, Cohort
from django.urls import reverse
from students.models import Student
from finance.models import FeeStructure, Payment, Allocation, Receipt
import django.test.client
django.test.client.store_rendered_templates = lambda *args, **kwargs: None
from certificates.models import Certificate

User = get_user_model()

class FinanceAndCertificateTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Create a Teacher, Accountant and Admin User
        self.admin = User.objects.create_superuser(
            username="admin_test",
            password="testpassword",
            email="admin@test.com",
            role=User.Role.ADMIN
        )
        self.teacher = User.objects.create_user(
            username="teacher_test",
            password="testpassword",
            email="teacher@test.com",
            role=User.Role.TEACHER
        )
        self.accountant = User.objects.create_user(
            username="accountant_test",
            password="testpassword",
            email="accountant@test.com",
            role=User.Role.ACCOUNTANT
        )

        # 2. Create Level and Cohort
        self.level_a1 = Level.objects.create(
            code="A1",
            name="Grundstufe A1",
            duration_weeks=8,
            description="A1 Level"
        )
        self.cohort = Cohort.objects.create(
            name="A1-Batch-2026-01",
            level=self.level_a1,
            instructor=self.teacher,
            start_date="2026-01-05",
            end_date="2026-03-02"
        )

        # 3. Create Student
        # Creating Student will automatically generate a User in serializer, but here we do it directly
        self.student_user = User.objects.create_user(
            username="DA-2026-0001",
            password="testpassword",
            email="student@test.com",
            role=User.Role.STUDENT
        )
        self.student = Student.objects.create(
            user=self.student_user,
            admission_number="DA-2026-0001",
            first_name="John",
            last_name="Doe",
            current_level=self.level_a1,
            current_cohort=self.cohort
        )

        # 4. Create Fee Structure for A1
        self.fee_structure = FeeStructure.objects.create(
            level=self.level_a1,
            academic_year="2026",
            tuition_fee=15000.00,
            exam_fee=2000.00,
            materials_fee=1500.00,
            certificate_fee=1000.00,
            tech_fee=500.00,
            other_fee=0.00
        )

    def test_fee_structure_total(self):
        # Total A1 fee should be 15000 + 2000 + 1500 + 1000 + 500 = 20000.00
        self.assertEqual(self.fee_structure.total_fee, 20000.00)

    def test_payment_creation_generates_draft_receipt(self):
        # Create a payment
        payment = Payment.objects.create(
            student=self.student,
            payer_name="John Doe Parent",
            phone_number="0712345678",
            amount=20000.00,
            payment_method=Payment.Methods.MPESA,
            mpesa_reference="QWE123RTY",
            created_by=self.accountant
        )

        self.assertIsNotNone(payment.receipt_number)
        self.assertTrue(payment.receipt_number.startswith("RCP-"))
        self.assertEqual(payment.status, Payment.Status.PENDING)
        
        # Verify draft receipt is created
        self.assertTrue(hasattr(payment, 'receipt'))
        self.assertEqual(payment.receipt.status, Receipt.Status.DRAFT)

    def test_bulk_allocation_api_validation(self):
        # Authenticate as accountant
        self.client.force_authenticate(user=self.accountant)

        # Create payment
        payment = Payment.objects.create(
            student=self.student,
            payer_name="John Doe Parent",
            phone_number="0712345678",
            amount=20000.00,
            payment_method=Payment.Methods.MPESA,
            mpesa_reference="QWE123RTY",
            created_by=self.accountant
        )

        # Attempt to allocate incorrect amount (total = 18000 instead of 20000)
        allocation_payload = {
            "payment_id": payment.id,
            "allocations": [
                {"category": Allocation.Categories.TUITION, "amount": 15000.00},
                {"category": Allocation.Categories.EXAMINATION, "amount": 3000.00}
            ]
        }
        
        response = self.client.post("/api/allocations/allocate/", allocation_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)

        # Allocate correct amount (total = 20000)
        correct_payload = {
            "payment_id": payment.id,
            "allocations": [
                {"category": Allocation.Categories.TUITION, "amount": 15000.00},
                {"category": Allocation.Categories.EXAMINATION, "amount": 2000.00},
                {"category": Allocation.Categories.LIBRARY, "amount": 1500.00},
                {"category": Allocation.Categories.REGISTRATION, "amount": 1000.00},
                {"category": Allocation.Categories.ACTIVITY, "amount": 500.00}
            ]
        }
        response = self.client.post("/api/allocations/allocate/", correct_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify payment status and receipt status updated
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.ALLOCATED)
        self.assertEqual(payment.receipt.status, Receipt.Status.FINAL)

    def test_balance_engine_calculations(self):
        self.client.force_authenticate(user=self.accountant)

        # Initial balance should be 20000.00 (Fees: 20000, Paid: 0)
        # We can check via Payment serializer / GET student financials helper
        from finance.serializers import PaymentSerializer
        serializer = PaymentSerializer(context={'request': None})
        financials = serializer.get_student_financials(self.student)
        self.assertEqual(financials['total_fees'], 20000.00)
        self.assertEqual(financials['total_paid'], 0.00)
        self.assertEqual(financials['balance'], 20000.00)

        # Make a payment of 10000, and allocate it fully
        p1 = Payment.objects.create(
            student=self.student,
            payer_name="John Doe",
            amount=10000.00,
            created_by=self.accountant
        )
        Allocation.objects.create(payment=p1, category=Allocation.Categories.TUITION, amount=10000.00)
        p1.status = Payment.Status.ALLOCATED
        p1.save()
        p1.receipt.status = Receipt.Status.FINAL
        p1.receipt.save()

        # Outstanding balance should now be 10000.00
        financials = serializer.get_student_financials(self.student)
        self.assertEqual(financials['total_paid'], 10000.00)
        self.assertEqual(financials['balance'], 10000.00)

    def test_certificate_serial_increment(self):
        import datetime
        # Create first certificate
        cert1 = Certificate.objects.create(
            student=self.student,
            level=self.level_a1,
            issued_by=self.admin,
            issue_date=datetime.date(2026, 6, 11)
        )
        self.assertEqual(cert1.certificate_number, "HZD-A1-2026-000001")

        # Create another student for second cert
        student_user2 = User.objects.create_user(
            username="DA-2026-0002",
            password="testpassword",
            email="student2@test.com",
            role=User.Role.STUDENT
        )
        student2 = Student.objects.create(
            user=student_user2,
            admission_number="DA-2026-0002",
            first_name="Jane",
            last_name="Doe",
            current_level=self.level_a1
        )

        cert2 = Certificate.objects.create(
            student=student2,
            level=self.level_a1,
            issued_by=self.admin,
            issue_date=datetime.date(2026, 6, 11)
        )
        self.assertEqual(cert2.certificate_number, "HZD-A1-2026-000002")
