from django.db import models

class InstitutionProfile(models.Model):
    name = models.CharField(max_length=200, default="Horizon Deutsch Training Institute")
    abbreviation = models.CharField(max_length=20, default="HDTI")
    tagline = models.CharField(max_length=255, blank=True)
    
    phone_primary = models.CharField(max_length=20, blank=True)
    phone_secondary = models.CharField(max_length=20, blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    email_primary = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    
    postal_address = models.TextField(blank=True)
    physical_address = models.TextField(blank=True)
    
    facebook_link = models.URLField(blank=True)
    instagram_link = models.URLField(blank=True)
    tiktok_link = models.URLField(blank=True)
    twitter_link = models.URLField(blank=True)
    linkedin_link = models.URLField(blank=True)
    google_maps_link = models.URLField(blank=True)

    class Meta:
        verbose_name = "Institution Profile"
        verbose_name_plural = "Institution Profile"

    def __str__(self):
        return self.name

    @classmethod
    def get_solo(cls):
        obj, created = cls.objects.get_or_create(id=1)
        return obj

class SupportTicket(models.Model):
    class Category(models.TextChoices):
        ADMISSIONS = "Admissions", "Admissions"
        FINANCE = "Finance", "Finance"
        ACADEMIC = "Academic", "Academic"
        TECHNICAL = "Technical Support", "Technical Support"
        VISA = "Visa Guidance", "Visa Guidance"
        CAREER = "Career Guidance", "Career Guidance"

    class Status(models.TextChoices):
        OPEN = "Open", "Open"
        IN_PROGRESS = "In Progress", "In Progress"
        RESOLVED = "Resolved", "Resolved"
        CLOSED = "Closed", "Closed"

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='support_tickets')
    category = models.CharField(max_length=50, choices=Category.choices)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.admission_number} - {self.subject} ({self.status})"

class FAQ(models.Model):
    question = models.CharField(max_length=255)
    answer = models.TextField()
    category = models.CharField(max_length=100, default="General")
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"

    def __str__(self):
        return self.question

class Testimonial(models.Model):
    student_name = models.CharField(max_length=150)
    course_taken = models.CharField(max_length=100, default="German A1-B2")
    quote = models.TextField()
    photo = models.FileField(upload_to='testimonials/', null=True, blank=True)
    rating = models.IntegerField(default=5)
    is_featured = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Testimonial"
        verbose_name_plural = "Testimonials"

    def __str__(self):
        return f"{self.student_name} - {self.course_taken}"

class NewsItem(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    summary = models.TextField()
    content = models.TextField()
    image = models.FileField(upload_to='news/', null=True, blank=True)
    published_date = models.DateField(auto_now_add=True)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['-published_date']
        verbose_name = "News Item"
        verbose_name_plural = "News Items"

    def __str__(self):
        return self.title

class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    event_date = models.DateTimeField()
    location = models.CharField(max_length=200)
    image = models.FileField(upload_to='events/', null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['event_date']
        verbose_name = "Event"
        verbose_name_plural = "Events"

    def __str__(self):
        return self.title

class GalleryImage(models.Model):
    title = models.CharField(max_length=150)
    image = models.FileField(upload_to='gallery/')
    category = models.CharField(max_length=100, default="Campus Life")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Gallery Image"
        verbose_name_plural = "Gallery Images"

    def __str__(self):
        return self.title

class DownloadResource(models.Model):
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='downloads/')
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, default="Brochures")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Download Resource"
        verbose_name_plural = "Download Resources"

    def __str__(self):
        return self.title

class ContactDetail(models.Model):
    department = models.CharField(max_length=100)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    office_location = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = "Contact Detail"
        verbose_name_plural = "Contact Details"

    def __str__(self):
        return f"{self.department} ({self.phone})"
