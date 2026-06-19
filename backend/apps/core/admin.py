from django.contrib import admin
from .models import InstitutionProfile, SupportTicket

@admin.register(InstitutionProfile)
class InstitutionProfileAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        # Prevent adding multiple settings instances
        if self.model.objects.count() >= 1:
            return False
        return super().has_add_permission(request)

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('subject', 'student', 'category', 'status', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('student__admission_number', 'student__first_name', 'subject')
