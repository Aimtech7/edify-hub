import datetime
from django.db import transaction
from django.db.models import Sum, Q
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response

from finance.models import FeeStructure, Payment, Allocation, Receipt
from finance.serializers import (
    FeeStructureSerializer,
    PaymentSerializer,
    AllocationSerializer,
    BulkAllocationSerializer,
    ReceiptSerializer
)
from students.models import Student
from accounts.permissions import IsAccountant, IsAdminUser

class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.all().order_by('academic_year', 'level__code')
    serializer_class = FeeStructureSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-payment_date')
    serializer_class = PaymentSerializer

    def get_permissions(self):
        # Authenticated users can list/retrieve (with role filters applied in get_queryset)
        # Only Accountant/Admin can create/delete/modify
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAccountant()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            # Students see their own payments only
            return Payment.objects.filter(student__user=user).order_by('-payment_date')
            
        queryset = Payment.objects.all().order_by('-payment_date')
        
        # Apply filters
        admission_no = self.request.query_params.get('admission_no')
        student_name = self.request.query_params.get('student_name')
        payer_name = self.request.query_params.get('payer_name')
        phone = self.request.query_params.get('phone')
        national_id = self.request.query_params.get('national_id')
        receipt_no = self.request.query_params.get('receipt_no')
        mpesa_ref = self.request.query_params.get('mpesa_ref')
        cheque_no = self.request.query_params.get('cheque_no')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        unallocated_only = self.request.query_params.get('unallocated')
        
        if admission_no:
            queryset = queryset.filter(student__admission_number__icontains=admission_no)
        if student_name:
            queryset = queryset.filter(
                Q(student__first_name__icontains=student_name) |
                Q(student__last_name__icontains=student_name)
            )
        if payer_name:
            queryset = queryset.filter(payer_name__icontains=payer_name)
        if phone:
            queryset = queryset.filter(phone_number__icontains=phone)
        if national_id:
            queryset = queryset.filter(national_id__icontains=national_id)
        if receipt_no:
            queryset = queryset.filter(receipt_number__icontains=receipt_no)
        if mpesa_ref:
            queryset = queryset.filter(mpesa_reference__icontains=mpesa_ref)
        if cheque_no:
            queryset = queryset.filter(cheque_number__icontains=cheque_no)
        if start_date:
            queryset = queryset.filter(payment_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(payment_date__lte=end_date)
        if unallocated_only and unallocated_only.lower() in ('true', '1'):
            queryset = queryset.filter(status=Payment.Status.PENDING)
            
        return queryset

    def perform_create(self, serializer):
        payment = serializer.save(created_by=self.request.user)
        from audits.models import log_action
        log_action(
            self.request.user,
            f"Created payment {payment.receipt_number} of amount {payment.amount} for student {payment.student.admission_number}",
            self.request
        )

class AllocationViewSet(viewsets.ModelViewSet):
    queryset = Allocation.objects.all()
    serializer_class = AllocationSerializer
    permission_classes = (IsAccountant,)

    @action(detail=False, methods=['post'], serializer_class=BulkAllocationSerializer)
    def allocate(self, request):
        """
        Processes bulk allocations. Validates that allocation sum matches payment amount exactly.
        Changes payment status to ALLOCATED and receipt status to FINAL.
        """
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        payment = serializer.validated_data['payment_obj']
        allocations_data = serializer.validated_data['allocations']
        
        with transaction.atomic():
            # Delete existing allocations to allow updates
            Allocation.objects.filter(payment=payment).delete()
            
            # Save new allocations
            for item in allocations_data:
                Allocation.objects.create(
                    payment=payment,
                    category=item['category'],
                    amount=item['amount']
                )
                
            # Promote payment and receipt state
            payment.status = Payment.Status.ALLOCATED
            payment.save()
            
            if hasattr(payment, 'receipt'):
                receipt = payment.receipt
                receipt.status = Receipt.Status.FINAL
                receipt.save()

        from audits.models import log_action
        log_action(
            request.user,
            f"Allocated and finalized payment {payment.receipt_number} of amount {payment.amount} for student {payment.student.admission_number}",
            request
        )
                
        return Response({
            "message": "Payment allocations saved successfully. Receipt finalized."
        }, status=status.HTTP_200_OK)

class ReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Receipt.objects.all().order_by('-issue_date')
    serializer_class = ReceiptSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            # Students only see receipts for their own payments
            return Receipt.objects.filter(payment__student__user=user)
        return Receipt.objects.all().order_by('-issue_date')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        from audits.models import log_action
        log_action(
            request.user,
            f"Printed/Viewed receipt {instance.receipt_number} for student {instance.payment.student.admission_number}",
            request
        )
        return super().retrieve(request, *args, **kwargs)

class FinanceReportsView(APIView):
    permission_classes = (IsAccountant,)

    def get(self, request):
        report_type = request.query_params.get('type')
        
        if report_type == 'daily_collections':
            today = datetime.date.today()
            total = Payment.objects.filter(payment_date=today, status=Payment.Status.ALLOCATED).aggregate(Sum('amount'))['amount__sum'] or 0.00
            by_method = Payment.objects.filter(payment_date=today, status=Payment.Status.ALLOCATED).values('payment_method').annotate(total=Sum('amount'))
            return Response({
                "date": today,
                "total_collections": total,
                "methods": by_method
            })
            
        elif report_type == 'outstanding_balances':
            # Calculate outstanding balances for all students
            students = Student.objects.filter(status=Student.Status.ACTIVE)
            records = []
            for s in students:
                total_fees = 0.00
                if s.current_level:
                    fee_struct = FeeStructure.objects.filter(level=s.current_level).first()
                    if fee_struct:
                        total_fees = float(fee_struct.total_fee)
                        
                total_paid = float(sum(p.amount for p in s.payments.filter(status=Payment.Status.ALLOCATED)))
                balance = total_fees - total_paid
                
                if balance > 0:
                    records.append({
                        "student_id": s.id,
                        "name": f"{s.first_name} {s.last_name}",
                        "admission_no": s.admission_number,
                        "level": s.current_level.code if s.current_level else "N/A",
                        "total_fees": total_fees,
                        "total_paid": total_paid,
                        "balance": balance
                    })
            return Response(records)
            
        elif report_type == 'fully_paid':
            students = Student.objects.filter(status=Student.Status.ACTIVE)
            records = []
            for s in students:
                total_fees = 0.00
                if s.current_level:
                    fee_struct = FeeStructure.objects.filter(level=s.current_level).first()
                    if fee_struct:
                        total_fees = float(fee_struct.total_fee)
                        
                total_paid = float(sum(p.amount for p in s.payments.filter(status=Payment.Status.ALLOCATED)))
                balance = total_fees - total_paid
                
                if balance <= 0 and total_fees > 0:
                    records.append({
                        "student_id": s.id,
                        "name": f"{s.first_name} {s.last_name}",
                        "admission_no": s.admission_number,
                        "total_fees": total_fees,
                        "total_paid": total_paid
                    })
            return Response(records)
            
        elif report_type == 'unallocated_payments':
            unallocated = Payment.objects.filter(status=Payment.Status.PENDING)
            serializer = PaymentSerializer(unallocated, many=True)
            return Response(serializer.data)
            
        return Response(
            {"detail": "Invalid report type. Supported: daily_collections, outstanding_balances, fully_paid, unallocated_payments"},
            status=status.HTTP_400_BAD_REQUEST
        )
