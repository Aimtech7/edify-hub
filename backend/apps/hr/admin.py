from django.contrib import admin
from .models import EmployeeRecord, LeaveType, LeaveRequest, StaffAttendance, PayrollSlip, EmploymentContract, PerformanceReview

for model in [EmployeeRecord, LeaveType, LeaveRequest, StaffAttendance, PayrollSlip, EmploymentContract, PerformanceReview]:
    @admin.register(model)
    class GenericHrAdmin(admin.ModelAdmin):
        list_display = [f.name for f in model._meta.fields[:6]]
