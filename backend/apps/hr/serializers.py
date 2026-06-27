from rest_framework import serializers
from .models import (
    EmployeeRecord, LeaveType, LeaveRequest, StaffAttendance,
    PayrollSlip, EmploymentContract, PerformanceReview
)

class EmployeeRecordSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeRecord
        fields = [
            "id", "user", "user_name", "email", "employee_id", "department",
            "designation", "date_joined", "basic_salary", "bank_name",
            "bank_account_no", "tax_id", "is_active"
        ]
        read_only_fields = ["id"]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_email(self, obj):
        return obj.user.email


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ["id", "name", "days_allowed", "is_paid"]


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=EmployeeRecord.objects.all(), required=False)
    employee_name = serializers.CharField(source="employee.user.get_full_name", read_only=True)
    employee_id_str = serializers.CharField(source="employee.employee_id", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    total_days = serializers.ReadOnlyField()

    class Meta:
        model = LeaveRequest
        fields = [
            "id", "employee", "employee_name", "employee_id_str", "leave_type",
            "leave_type_name", "start_date", "end_date", "reason", "status",
            "approved_by", "created_at", "total_days"
        ]
        read_only_fields = ["id", "created_at", "approved_by"]


class StaffAttendanceSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=EmployeeRecord.objects.all(), required=False)
    employee_name = serializers.CharField(source="employee.user.get_full_name", read_only=True)
    employee_id_str = serializers.CharField(source="employee.employee_id", read_only=True)

    class Meta:
        model = StaffAttendance
        fields = [
            "id", "employee", "employee_name", "employee_id_str", "date",
            "status", "clock_in", "clock_out"
        ]


class PayrollSlipSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=EmployeeRecord.objects.all(), required=False)
    employee_name = serializers.CharField(source="employee.user.get_full_name", read_only=True)
    employee_id_str = serializers.CharField(source="employee.employee_id", read_only=True)
    designation = serializers.CharField(source="employee.designation", read_only=True)

    class Meta:
        model = PayrollSlip
        fields = [
            "id", "employee", "employee_name", "employee_id_str", "designation",
            "month", "basic_salary", "allowances", "deductions", "net_salary",
            "status", "payment_date"
        ]
        read_only_fields = ["id", "net_salary"]


class EmploymentContractSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=EmployeeRecord.objects.all(), required=False)

    class Meta:
        model = EmploymentContract
        fields = [
            "id", "employee", "contract_type", "start_date", "end_date", "document_url"
        ]


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=EmployeeRecord.objects.all(), required=False)
    reviewer_name = serializers.CharField(source="reviewer.get_full_name", read_only=True)

    class Meta:
        model = PerformanceReview
        fields = [
            "id", "employee", "reviewer", "reviewer_name", "review_date",
            "rating", "comments", "goals"
        ]
        read_only_fields = ["id", "reviewer"]
