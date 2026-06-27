from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from .models import EmployeeRecord, LeaveType, LeaveRequest, PayrollSlip

User = get_user_model()

class HrManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hr_user = User.objects.create_user(
            username="hrofficer", password="password123", role="HR"
        )
        self.teacher_user = User.objects.create_user(
            username="teacher1", password="password123", role="TEACHER"
        )

        self.hr_emp = EmployeeRecord.objects.create(
            user=self.hr_user, employee_id="EMP-HR-01", department="ADMIN",
            designation="HR Manager", date_joined=date(2023, 1, 1), basic_salary=150000
        )
        self.teacher_emp = EmployeeRecord.objects.create(
            user=self.teacher_user, employee_id="EMP-AC-01", department="ACADEMIC",
            designation="Senior German Instructor", date_joined=date(2024, 1, 1), basic_salary=120000
        )

        self.leave_type = LeaveType.objects.create(name="Annual Leave", days_allowed=21, is_paid=True)

    def get_list_data(self, response_data):
        if isinstance(response_data, dict) and "results" in response_data:
            return response_data["results"]
        return response_data

    def test_employee_record_scoping(self):
        # Regular teacher sees only their own record
        self.client.force_authenticate(user=self.teacher_user)
        res = self.client.get("/api/hr/employees/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = self.get_list_data(res.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["employee_id"], "EMP-AC-01")

        # HR sees all records
        self.client.force_authenticate(user=self.hr_user)
        res_hr = self.client.get("/api/hr/employees/")
        self.assertEqual(res_hr.status_code, status.HTTP_200_OK)
        data_hr = self.get_list_data(res_hr.data)
        self.assertEqual(len(data_hr), 2)

    def test_leave_approval_workflow(self):
        # Teacher requests leave
        self.client.force_authenticate(user=self.teacher_user)
        req_data = {
            "leave_type": self.leave_type.id,
            "start_date": "2026-07-01",
            "end_date": "2026-07-05",
            "reason": "Family vacation"
        }
        create_res = self.client.post("/api/hr/leave-requests/", req_data)
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        leave_id = create_res.data["id"]
        self.assertEqual(create_res.data["status"], "PENDING")
        self.assertEqual(create_res.data["total_days"], 5)

        # Teacher cannot approve their own leave
        approve_fail = self.client.post(f"/api/hr/leave-requests/{leave_id}/approve/")
        self.assertEqual(approve_fail.status_code, status.HTTP_403_FORBIDDEN)

        # HR approves leave
        self.client.force_authenticate(user=self.hr_user)
        approve_ok = self.client.post(f"/api/hr/leave-requests/{leave_id}/approve/")
        self.assertEqual(approve_ok.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_ok.data["status"], "APPROVED")

    def test_payroll_slip_calculation(self):
        slip = PayrollSlip.objects.create(
            employee=self.teacher_emp,
            month="June 2026",
            basic_salary=120000,
            allowances=20000,
            deductions=15000
        )
        self.assertEqual(slip.net_salary, 125000)

        self.client.force_authenticate(user=self.hr_user)
        res = self.client.get("/api/hr/payroll/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = self.get_list_data(res.data)
        self.assertEqual(data[0]["net_salary"], "125000.00")
