from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmployeeRecordViewSet, LeaveTypeViewSet, LeaveRequestViewSet,
    StaffAttendanceViewSet, PayrollSlipViewSet, EmploymentContractViewSet,
    PerformanceReviewViewSet
)

router = DefaultRouter()
router.register(r"employees", EmployeeRecordViewSet, basename="employee")
router.register(r"leave-types", LeaveTypeViewSet, basename="leavetype")
router.register(r"leave-requests", LeaveRequestViewSet, basename="leaverequest")
router.register(r"attendance", StaffAttendanceViewSet, basename="staffattendance")
router.register(r"payroll", PayrollSlipViewSet, basename="payroll")
router.register(r"contracts", EmploymentContractViewSet, basename="contract")
router.register(r"reviews", PerformanceReviewViewSet, basename="review")

urlpatterns = [
    path("", include(router.urls)),
]
