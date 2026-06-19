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
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        payment = serializer.validated_data['payment_obj']
        allocations_data = serializer.validated_data['allocations']
        
        with transaction.atomic():
            # Delete existing allocations for this payment
            Allocation.objects.filter(payment=payment).delete()
            
            # Create new allocations
            allocations = []
            for item in allocations_data:
                allocations.append(Allocation(
                    payment=payment,
                    category=item['category'],
                    amount=item['amount']
                ))
            Allocation.objects.bulk_create(allocations)
            
            # Update payment status
            payment.status = Payment.Status.ALLOCATED
            payment.save(update_fields=['status'])
            
            # Update receipt status
            if hasattr(payment, 'receipt'):
                payment.receipt.status = Receipt.Status.FINAL
                payment.receipt.save(update_fields=['status'])
                
            from audits.models import log_action
            log_action(
                request.user,
                f"Allocated and finalized payment {payment.receipt_number} of amount {payment.amount} for student {payment.student.admission_number}",
                request
            )
            
        return Response({"message": "Allocations saved successfully"}, status=status.HTTP_200_OK)

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

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        receipt = self.get_object()
        from finance.services.pdf_service import FinancePDFService
        pdf_buffer = FinancePDFService.generate_receipt_pdf(receipt)
        
        from django.http import HttpResponse
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Receipt_{receipt.receipt_number}.pdf"'
        
        from audits.models import log_action
        log_action(
            request.user,
            f"Downloaded PDF for receipt {receipt.receipt_number}",
            request
        )
        return response

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
                balance = s.outstanding_balance
                if balance > 0:
                    records.append({
                        "student_id": s.id,
                        "name": f"{s.first_name} {s.last_name}",
                        "admission_no": s.admission_number,
                        "level": s.current_level.code if s.current_level else "N/A",
                        "total_fees": s.total_fees,
                        "total_paid": s.total_paid,
                        "balance": balance
                    })
            return Response(records)
            
        elif report_type == 'fully_paid':
            students = Student.objects.filter(status=Student.Status.ACTIVE)
            records = []
            for s in students:
                total_fees = s.total_fees
                balance = s.outstanding_balance
                if balance <= 0 and total_fees > 0:
                    records.append({
                        "student_id": s.id,
                        "name": f"{s.first_name} {s.last_name}",
                        "admission_no": s.admission_number,
                        "total_fees": total_fees,
                        "total_paid": s.total_paid
                    })
            return Response(records)
            
        elif report_type == 'unallocated_payments':
            unallocated = Payment.objects.filter(status=Payment.Status.PENDING)
            serializer = PaymentSerializer(unallocated, many=True)
            return Response(serializer.data)
            
        elif report_type == 'monthly_collections':
            # From 1st of month to today
            today = datetime.date.today()
            first_of_month = today.replace(day=1)
            total = Payment.objects.filter(payment_date__gte=first_of_month, payment_date__lte=today, status=Payment.Status.ALLOCATED).aggregate(Sum('amount'))['amount__sum'] or 0.00
            return Response({
                "month": today.strftime('%Y-%m'),
                "total_collections": total
            })
            
        elif report_type == 'payment_methods':
            today = datetime.date.today()
            first_of_month = today.replace(day=1)
            by_method = Payment.objects.filter(payment_date__gte=first_of_month, payment_date__lte=today).values('payment_method').annotate(total=Sum('amount'))
            return Response(by_method)
            
        elif report_type == 'recent_receipts':
            receipts = Receipt.objects.filter(status=Receipt.Status.FINAL).order_by('-updated_at')[:10]
            serializer = ReceiptSerializer(receipts, many=True)
            return Response(serializer.data)
            
        elif report_type == 'weekly_collections':
            today = datetime.date.today()
            start_of_week = today - datetime.timedelta(days=today.weekday())
            total = Payment.objects.filter(payment_date__gte=start_of_week, payment_date__lte=today, status=Payment.Status.ALLOCATED).aggregate(Sum('amount'))['amount__sum'] or 0.00
            return Response({
                "week_start": start_of_week.strftime('%Y-%m-%d'),
                "total_collections": total
            })

        elif report_type == 'credit_balances':
            students = Student.objects.filter(status=Student.Status.ACTIVE)
            records = []
            for s in students:
                credit = s.credit_balance
                if credit > 0:
                    records.append({
                        "student_id": s.id,
                        "name": f"{s.first_name} {s.last_name}",
                        "admission_no": s.admission_number,
                        "credit_balance": credit
                    })
            return Response(records)
            
        return Response(
            {"detail": "Invalid report type. Supported: daily_collections, weekly_collections, monthly_collections, outstanding_balances, credit_balances, fully_paid, unallocated_payments, payment_methods, recent_receipts"},
            status=status.HTTP_400_BAD_REQUEST
        )

class STKPushView(APIView):
    def post(self, request):
        from finance.serializers import STKPushSerializer
        from finance.services.mpesa import MpesaService
        
        serializer = STKPushSerializer(data=request.data)
        if serializer.is_valid():
            student = serializer.validated_data['student_id']
            phone = serializer.validated_data['phone_number']
            amount = serializer.validated_data['amount']

            mpesa_service = MpesaService()
            try:
                result = mpesa_service.initiate_stk_push(
                    phone=phone,
                    amount=amount,
                    account_reference=student.admission_number,
                    transaction_desc=f"Fees {student.admission_number}"
                )
                
                if result.get('success'):
                    from finance.models import MpesaTransaction
                    MpesaTransaction.objects.create(
                        checkout_request_id=result['checkout_request_id'],
                        merchant_request_id=result['merchant_request_id'],
                        amount=amount,
                        phone=phone,
                        student=student,
                        status='PENDING'
                    )
                    return Response(result, status=status.HTTP_200_OK)
                else:
                    return Response({"error": result.get("error")}, status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MpesaCallbackView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        """
        Daraja API callback endpoint.
        """
        data = request.data
        try:
            body = data.get('Body', {}).get('stkCallback', {})
            merchant_req_id = body.get('MerchantRequestID')
            checkout_req_id = body.get('CheckoutRequestID')
            result_code = body.get('ResultCode')
            
            from finance.models import MpesaTransaction, Payment
            from django.db import transaction

            if result_code == 0:
                # Success
                items = body.get('CallbackMetadata', {}).get('Item', [])
                amount = next((item['Value'] for item in items if item['Name'] == 'Amount'), 0)
                receipt_no = next((item['Value'] for item in items if item['Name'] == 'MpesaReceiptNumber'), '')
                phone = next((item['Value'] for item in items if item['Name'] == 'PhoneNumber'), '')
                
                with transaction.atomic():
                    mpesa_txn = MpesaTransaction.objects.filter(checkout_request_id=checkout_req_id).first()
                    
                    if mpesa_txn:
                        mpesa_txn.merchant_request_id = merchant_req_id
                        mpesa_txn.mpesa_reference = receipt_no
                        mpesa_txn.amount = amount
                        mpesa_txn.phone = phone
                        mpesa_txn.status = 'COMPLETED'
                        mpesa_txn.save()

                        # Auto-reconcile payment if student exists
                        if mpesa_txn.student and not Payment.objects.filter(mpesa_reference=receipt_no).exists():
                            Payment.objects.create(
                                student=mpesa_txn.student,
                                amount=amount,
                                payment_method=Payment.Methods.MPESA,
                                mpesa_reference=receipt_no,
                                payer_name=phone
                            )
                    else:
                        MpesaTransaction.objects.create(
                            checkout_request_id=checkout_req_id,
                            merchant_request_id=merchant_req_id,
                            mpesa_reference=receipt_no,
                            amount=amount,
                            phone=phone,
                            status='COMPLETED'
                        )
            else:
                # Failed
                mpesa_txn = MpesaTransaction.objects.filter(checkout_request_id=checkout_req_id).first()
                if mpesa_txn:
                    mpesa_txn.merchant_request_id = merchant_req_id
                    mpesa_txn.status = 'FAILED'
                    mpesa_txn.save()
                else:
                    MpesaTransaction.objects.create(
                        checkout_request_id=checkout_req_id,
                        merchant_request_id=merchant_req_id,
                        status='FAILED'
                    )
        except Exception as e:
            pass # Usually you log this
            
        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        from django.db.models import Sum
        
        revenue_by_campus = Payment.objects.values('student__campus__name').annotate(total=Sum('amount'))
        revenue_by_level = Payment.objects.values('student__current_level__code').annotate(total=Sum('amount'))
        revenue_by_intake = Payment.objects.values('student__intake__name').annotate(total=Sum('amount'))

        return Response({
            'by_campus': revenue_by_campus,
            'by_level': revenue_by_level,
            'by_intake': revenue_by_intake,
        })
