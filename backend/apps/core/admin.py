from django.contrib import admin
from .models import (
    InstitutionProfile, SupportTicket, FAQ, Testimonial,
    NewsItem, Event, GalleryImage, DownloadResource, ContactDetail
)

@admin.register(InstitutionProfile)
class InstitutionProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'abbreviation', 'phone_primary', 'email_primary')
    def has_add_permission(self, request):
        if self.model.objects.count() >= 1:
            return False
        return super().has_add_permission(request)

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('subject', 'student', 'category', 'status', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('student__admission_number', 'student__first_name', 'subject')
    date_hierarchy = 'created_at'

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ('question', 'category', 'order', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('question', 'answer')
    list_editable = ('order', 'is_active')

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'course_taken', 'rating', 'is_featured', 'created_at')
    list_filter = ('rating', 'is_featured')
    search_fields = ('student_name', 'quote')

@admin.register(NewsItem)
class NewsItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'published_date', 'is_published')
    list_filter = ('is_published',)
    search_fields = ('title', 'summary', 'content')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'published_date'

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_date', 'location', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'description', 'location')
    date_hierarchy = 'event_date'

@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'uploaded_at')
    list_filter = ('category',)
    search_fields = ('title',)

@admin.register(DownloadResource)
class DownloadResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'uploaded_at')
    list_filter = ('category',)
    search_fields = ('title', 'description')

@admin.register(ContactDetail)
class ContactDetailAdmin(admin.ModelAdmin):
    list_display = ('department', 'contact_person', 'phone', 'email')
    search_fields = ('department', 'contact_person', 'phone', 'email')
