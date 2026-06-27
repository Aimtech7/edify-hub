from decimal import Decimal
from rest_framework import serializers
from finance.models import FeeStructure, Payment, Allocation, Receipt

class FeeStructureSerializer(serializers.ModelSerializer):
    level_code = serializers.ReadOnlyField(source='level.code')
    total_fee = serializers.ReadOnlyField()

    class Meta:
        model = FeeStructure
        fields = '__all__'

class AllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Allocation
        fields = '__all__'
        read_only_fields = ('payment',)

class ReceiptSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    admission_no = serializers.ReadOnlyField(source='payment.student.admission_number')
    payer_name = serializers.ReadOnlyField(source='payment.payer_name')
    amount = serializers.ReadOnlyField(source='payment.amount')
    payment_method = serializers.ReadOnlyField(source='payment.payment_method')
    reference = serializers.SerializerMethodField()
    allocations = AllocationSerializer(source='payment.allocations', many=True, read_only=True)

    class Meta:
        model = Receipt
        fields = '__all__'

    def get_student_name(self, obj):
        return f"{obj.payment.student.first_name} {obj.payment.student.last_name}".strip()

    def get_reference(self, obj):
        return obj.payment.mpesa_reference or obj.payment.cheque_number or obj.payment.transaction_id or ''


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    admission_no = serializers.ReadOnlyField(source='student.admission_number')
    created_by_name = serializers.SerializerMethodField()
    allocations = AllocationSerializer(many=True, read_only=True)
    receipt_status = serializers.ReadOnlyField(source='receipt.status')

    # Student financials fields (computed dynamically)
    student_total_fees = serializers.SerializerMethodField()
    student_total_paid = serializers.SerializerMethodField()
    student_outstanding_balance = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = '__all__'

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def get_student_financials(self, student):
        return {
            'total_fees': student.total_fees,
            'total_paid': student.total_paid,
            'balance': student.outstanding_balance
        }

    def get_student_total_fees(self, obj):
        return self.get_financial_val(obj.student, 'total_fees')

    def get_student_total_paid(self, obj):
        return self.get_financial_val(obj.student, 'total_paid')

    def get_student_outstanding_balance(self, obj):
        return self.get_financial_val(obj.student, 'balance')

    def get_financial_val(self, student, key):
        # Cache results on the request context to avoid duplicate calls
        request = self.context.get('request')
        if not request:
            return self.get_student_financials(student)[key]
            
        cache_key = f"financials_student_{student.id}"
        if not hasattr(request, cache_key):
            setattr(request, cache_key, self.get_student_financials(student))
            
        return getattr(request, cache_key)[key]

class BulkAllocationSerializer(serializers.Serializer):
    payment_id = serializers.IntegerField()
    allocations = AllocationSerializer(many=True)

    def validate(self, attrs):
        try:
            payment_id = attrs['payment_id']
            allocations_data = attrs['allocations']
            payment = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            raise serializers.ValidationError({"payment_id": "Payment not found."})
            
        total_allocated = sum((item['amount'] for item in allocations_data), Decimal('0.00'))
        if total_allocated != payment.amount:
            raise serializers.ValidationError(
                f"Total allocation ({total_allocated}) must match payment amount ({payment.amount}) exactly."
            )
            
        attrs['payment_obj'] = payment
        return attrs

class STKPushSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    phone_number = serializers.CharField(max_length=20)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    def validate_student_id(self, value):
        from students.models import Student
        try:
            return Student.objects.get(id=value)
        except Student.DoesNotExist:
            raise serializers.ValidationError("Student not found.")
