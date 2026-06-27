from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import (
    EmployeeRecord, LeaveType, LeaveRequest, StaffAttendance,
    PayrollSlip, EmploymentContract, PerformanceReview
)
from .serializers import (
    EmployeeRecordSerializer, LeaveTypeSerializer, LeaveRequestSerializer,
    StaffAttendanceSerializer, PayrollSlipSerializer, EmploymentContractSerializer,
    PerformanceReviewSerializer
)

class IsHrOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.role in ["ADMIN", "HR"]:
            return True
        return False


class EmployeeRecordViewSet(viewsets.ModelViewSet):
    queryset = EmployeeRecord.objects.select_related("user").all()
    serializer_class = EmployeeRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in ["ADMIN", "HR"]:
            return self.queryset
        return self.queryset.filter(user=user)

    @action(detail=False, methods=["get"])
    def me(self, request):
        try:
            emp = EmployeeRecord.objects.get(user=request.user)
            serializer = self.get_serializer(emp)
            return Response(serializer.data)
        except EmployeeRecord.DoesNotExist:
            return Response({"detail": "No employee record found for current user."}, status=status.HTTP_404_NOT_FOUND)


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related("employee__user", "leave_type").all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in ["ADMIN", "HR"]:
            return self.queryset
        return self.queryset.filter(employee__user=user)

    def perform_create(self, serializer):
        # Auto assign employee if not HR creating for someone else
        user = self.request.user
        if not (user.is_superuser or user.role in ["ADMIN", "HR"]):
            emp = EmployeeRecord.objects.get(user=user)
            serializer.save(employee=emp)
        else:
            serializer.save()

    @action(detail=True, methods=["post"], permission_classes=[IsHrOrAdmin])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = LeaveRequest.Status.APPROVED
        leave.approved_by = request.user
        leave.save()
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=["post"], permission_classes=[IsHrOrAdmin])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = LeaveRequest.Status.REJECTED
        leave.approved_by = request.user
        leave.save()
        return Response(self.get_serializer(leave).data)


class StaffAttendanceViewSet(viewsets.ModelViewSet):
    queryset = StaffAttendance.objects.select_related("employee__user").all()
    serializer_class = StaffAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in ["ADMIN", "HR"]:
            return self.queryset
        return self.queryset.filter(employee__user=user)


class PayrollSlipViewSet(viewsets.ModelViewSet):
    queryset = PayrollSlip.objects.select_related("employee__user").all()
    serializer_class = PayrollSlipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in ["ADMIN", "HR", "ACCOUNTANT", "FINANCE"]:
            return self.queryset
        return self.queryset.filter(employee__user=user)

    @action(detail=True, methods=["post"], permission_classes=[IsHrOrAdmin])
    def mark_paid(self, request, pk=None):
        slip = self.get_object()
        slip.status = PayrollSlip.Status.PAID
        slip.payment_date = timezone.now().date()
        slip.save()
        return Response(self.get_serializer(slip).data)


class EmploymentContractViewSet(viewsets.ModelViewSet):
    queryset = EmploymentContract.objects.select_related("employee__user").all()
    serializer_class = EmploymentContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in ["ADMIN", "HR"]:
            return self.queryset
        return self.queryset.filter(employee__user=user)


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.select_related("employee__user", "reviewer").all()
    serializer_class = PerformanceReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in ["ADMIN", "HR"]:
            return self.queryset
        return self.queryset.filter(employee__user=user)

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)
