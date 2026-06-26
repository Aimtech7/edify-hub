from django.db import models
from django.conf import settings
from academics.models import Level, Program, VirtualClass

class Course(models.Model):
    title = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='odel_courses', null=True, blank=True)
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='odel_courses')
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to='odel/courses/', null=True, blank=True)
    is_published = models.BooleanField(default=False)
    is_sequential = models.BooleanField(default=True, help_text="Require sequential lesson completion")
    created_at = models.DateTimeField(auto_now_add=True)
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='taught_courses')

    def __str__(self):
        return f"{self.code} - {self.title}"

class Subject(models.Model):
    # e.g., Sprechen, Hören, Lesen, Schreiben, Grammatik, Wortschatz
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='subjects')
    title = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    order = models.PositiveIntegerField(default=1)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', 'title']
        unique_together = ['course', 'code']

    def __str__(self):
        return f"{self.course.code}: {self.title}"

class Unit(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='units')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.subject.title} - Unit {self.order}: {self.title}"

class Module(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='modules', null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='direct_modules', null=True, blank=True)
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=1)
    estimated_duration_minutes = models.PositiveIntegerField(default=60)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        prefix = self.unit.title if self.unit else (self.course.code if self.course else "Module")
        return f"{prefix} - Module {self.order}: {self.title}"

class Lesson(models.Model):
    class MediaType(models.TextChoices):
        VIDEO = "VIDEO", "Video Lecture"
        AUDIO = "AUDIO", "Audio Track"
        PDF = "PDF", "PDF Document"
        PPT = "PPT", "PowerPoint Presentation"
        HTML = "HTML", "Rich HTML Content"
        INTERACTIVE = "INTERACTIVE", "Interactive Exercise"
        SCORM = "SCORM", "SCORM Package"
        EXTERNAL_URL = "EXTERNAL_URL", "External URL"
        DOWNLOAD = "DOWNLOAD", "Downloadable File"
        EMBEDDED_YOUTUBE = "EMBEDDED_YOUTUBE", "Embedded YouTube"
        IMAGE = "IMAGE", "Image Graphic"
        CODE_SNIPPET = "CODE_SNIPPET", "Code Snippet"

    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=1)
    media_type = models.CharField(max_length=20, choices=MediaType.choices, default=MediaType.VIDEO)
    content_url = models.URLField(blank=True)
    content_file = models.FileField(upload_to='odel/lessons/', null=True, blank=True)
    body_html = models.TextField(blank=True)
    code_snippet = models.TextField(blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    is_mandatory = models.BooleanField(default=True)
    is_published = models.BooleanField(default=True)
    completion_rule = models.CharField(max_length=20, choices=[('VIEW', 'View'), ('TIME', 'Min Time'), ('SCORE', 'Pass Assessment')], default='VIEW')
    min_time_seconds = models.PositiveIntegerField(default=0)
    prerequisite = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='dependent_lessons')
    virtual_class = models.ForeignKey(VirtualClass, on_delete=models.SET_NULL, null=True, blank=True, related_name='linked_lessons')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.module.title} - L{self.order}: {self.title}"

class Topic(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='topics')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=1)
    summary = models.TextField(blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.lesson.title} - Topic: {self.title}"

class Resource(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='odel/resources/')
    is_downloadable = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.lesson.title})"

class StudentLessonProgress(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='odel_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    is_unlocked = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True, null=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed_at = models.DateTimeField(auto_now=True)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    progress_percentage = models.FloatField(default=0.0)
    video_watch_percentage = models.FloatField(default=0.0)
    reading_progress_percentage = models.FloatField(default=0.0)
    download_count = models.PositiveIntegerField(default=0)
    resume_position_seconds = models.PositiveIntegerField(default=0)
    is_bookmarked = models.BooleanField(default=False)

    class Meta:
        unique_together = ['student', 'lesson']

    def __str__(self):
        return f"{self.student.admission_number} - {self.lesson.title} ({self.progress_percentage}%)"


# Enterprise Extensions (Milestone 1.2)

class RecordedLecture(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='recorded_lectures')
    title = models.CharField(max_length=200)
    video_file = models.FileField(upload_to='odel/recordings/', null=True, blank=True)
    video_url = models.URLField(blank=True)
    slides_file = models.FileField(upload_to='odel/slides/', null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=60)
    is_download_permitted = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course.code}: {self.title}"

class DiscussionForum(models.Model):
    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name='forum')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_moderated = models.BooleanField(default=True)

    def __str__(self):
        return f"Forum: {self.course.code}"

class ForumThread(models.Model):
    forum = models.ForeignKey(DiscussionForum, on_delete=models.CASCADE, related_name='threads')
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True, related_name='forum_threads')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    body = models.TextField()
    is_pinned = models.BooleanField(default=False)
    is_question = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    likes_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return self.title

class ForumPost(models.Model):
    thread = models.ForeignKey(ForumThread, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField()
    parent_post = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)
    likes_count = models.PositiveIntegerField(default=0)
    is_approved_answer = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Post by {self.author} on {self.thread}"

class Assignment(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='assignment')
    title = models.CharField(max_length=200)
    description = models.TextField()
    attachment = models.FileField(upload_to='odel/assignments/', null=True, blank=True)
    max_attempts = models.PositiveIntegerField(default=1)
    deadline = models.DateTimeField(null=True, blank=True)
    allow_late_submission = models.BooleanField(default=True)
    late_penalty_percentage = models.FloatField(default=10.0)
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    rubric_text = models.TextField(blank=True)

    def __str__(self):
        return f"Assignment: {self.title}"

class AssignmentSubmission(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        GRADED = "GRADED", "Graded"
        RETURNED = "RETURNED", "Returned for Revision"

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='assignment_submissions')
    attempt_number = models.PositiveIntegerField(default=1)
    file_submission = models.FileField(upload_to='odel/submissions/', null=True, blank=True)
    rich_text_submission = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    teacher_feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['assignment', 'student', 'attempt_number']

    def __str__(self):
        return f"{self.student.admission_number} - {self.assignment.title} (Attempt {self.attempt_number})"

class QuestionBank(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='question_banks')
    title = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.course.code} Bank: {self.title}"

class Quiz(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    time_limit_minutes = models.PositiveIntegerField(default=30)
    max_attempts = models.PositiveIntegerField(default=1)
    randomize_questions = models.BooleanField(default=True)
    negative_marking_percentage = models.FloatField(default=0.0)
    pass_percentage = models.FloatField(default=60.0)
    auto_submit_on_timer = models.BooleanField(default=True)

    def __str__(self):
        return f"Quiz: {self.title}"

class QuizQuestion(models.Model):
    class QuestionType(models.TextChoices):
        MCQ = "MCQ", "Multiple Choice"
        TRUE_FALSE = "TRUE_FALSE", "True/False"
        MATCHING = "MATCHING", "Matching"
        ESSAY = "ESSAY", "Essay"
        SHORT_ANSWER = "SHORT_ANSWER", "Short Answer"
        FILL_BLANK = "FILL_BLANK", "Fill in the Blank"
        DRAG_DROP = "DRAG_DROP", "Drag & Drop"

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions', null=True, blank=True)
    bank = models.ForeignKey(QuestionBank, on_delete=models.CASCADE, related_name='questions', null=True, blank=True)
    question_type = models.CharField(max_length=20, choices=QuestionType.choices, default=QuestionType.MCQ)
    prompt_text = models.TextField()
    marks = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)
    options_json = models.JSONField(default=list, blank=True)
    correct_answer_text = models.TextField(blank=True)

    def __str__(self):
        return f"Q: {self.prompt_text[:50]}"

class QuizAttempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='quiz_attempts')
    attempt_number = models.PositiveIntegerField(default=1)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    score_obtained = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    answers_json = models.JSONField(default=dict, blank=True)
    requires_manual_review = models.BooleanField(default=False)

    class Meta:
        unique_together = ['quiz', 'student', 'attempt_number']

    def __str__(self):
        return f"{self.student.admission_number} - {self.quiz.title} ({self.score_obtained})"

class Gradebook(models.Model):
    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name='gradebook')
    continuous_assessment_weight = models.FloatField(default=40.0)
    assignments_weight = models.FloatField(default=30.0)
    quizzes_weight = models.FloatField(default=30.0)

    def __str__(self):
        return f"Gradebook: {self.course.code}"
