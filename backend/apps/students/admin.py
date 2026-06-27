import csv
from django.contrib import admin
from django.http import HttpResponse
from .models import Student, PlacementTest, AdmissionApplication, ParentGuardian, AdmissionsActivityLog

def export_as_csv(modeladmin, request, queryset):
    meta = modeladmin.model._meta
    field_names = [field.name for field in meta.fields]
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename={meta}.csv'
    writer = csv.writer(response)
    writer.writerow(field_names)
    for obj in queryset:
        writer.writerow([getattr(obj, field) for field in field_names])
    return response
export_as_csv.short_description = "Export Selected Records as CSV"

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('admission_number', 'first_name', 'last_name', 'current_level', 'status', 'enrollment_date')
    list_filter = ('status', 'current_level', 'campus')
    search_fields = ('admission_number', 'first_name', 'last_name', 'email', 'phone')
    ordering = ('-enrollment_date',)
    date_hierarchy = 'enrollment_date'
    actions = [export_as_csv]

@admin.register(PlacementTest)
class PlacementTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'application', 'score', 'recommended_level', 'date_taken')
    list_filter = ('recommended_level', 'date_taken')
    search_fields = ('student__admission_number', 'student__first_name', 'application__first_name')
    actions = [export_as_csv]

@admin.register(AdmissionApplication)
class AdmissionApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'phone', 'preferred_campus', 'status', 'assigned_officer', 'priority', 'created_at')
    list_filter = ('status', 'preferred_campus', 'priority')
    search_fields = ('first_name', 'last_name', 'phone', 'email', 'national_id')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    actions = [export_as_csv]

@admin.register(ParentGuardian)
class ParentGuardianAdmin(admin.ModelAdmin):
    list_display = ('user', 'relationship', 'phone_number', 'created_at')
    search_fields = ('user__username', 'user__email', 'phone_number')
    actions = [export_as_csv]

@admin.register(AdmissionsActivityLog)
class AdmissionsActivityLogAdmin(admin.ModelAdmin):
    list_display = ('application', 'actor', 'action', 'old_status', 'new_status', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('application__first_name', 'application__last_name', 'notes')
    readonly_fields = ('application', 'actor', 'action', 'old_status', 'new_status', 'notes', 'timestamp')
