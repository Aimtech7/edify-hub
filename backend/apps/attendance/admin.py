from django.contrib import admin
from .models import Attendance

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'status', 'recorded_by', 'created_at')
    list_filter = ('status', 'date')
    search_fields = ('student__admission_number', 'student__first_name', 'student__last_name')
    date_hierarchy = 'date'
