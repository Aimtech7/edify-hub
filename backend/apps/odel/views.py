import hashlib
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
import datetime
import json
from django.db.models import Q, Avg, Count
from odel.models import (
    Course, Subject, Unit, Module, Lesson, Topic, Resource, StudentLessonProgress,
    RecordedLecture, DiscussionForum, ForumThread, ForumPost, Assignment,
    AssignmentSubmission, QuestionBank, Quiz, QuizQuestion, QuizAttempt, Gradebook,
    OfficialExamination, ExamSessionLog, ExamSubmission, StudentLessonNote
)
from odel.serializers import (
    CourseSerializer, SubjectSerializer, UnitSerializer, ModuleSerializer,
    LessonSerializer, TopicSerializer, ResourceSerializer, StudentLessonProgressSerializer,
    RecordedLectureSerializer, DiscussionForumSerializer, ForumThreadSerializer,
    ForumPostSerializer, AssignmentSerializer, AssignmentSubmissionSerializer,
    QuestionBankSerializer, QuizSerializer, QuizQuestionSerializer, QuizAttemptSerializer,
    GradebookSerializer, OfficialExaminationSerializer, ExamSessionLogSerializer,
    ExamSubmissionSerializer, StudentLessonNoteSerializer
)
from accounts.permissions import IsStaffOrReadOnly
from audits.models import log_action
from odel.services.resource_indexing_service import ResourceIndexingService

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by('-created_at')
    serializer_class = CourseSerializer
    permission_classes = [IsStaffOrReadOnly]

    def perform_create(self, serializer):
        course = serializer.save(instructor=self.request.user if self.request.user.is_authenticated else None)
        log_action(self.request.user, f"Created Course {course.code}", self.request, "Course", course.id)
        # Auto-create discussion forum and default channels
        forum, _ = DiscussionForum.objects.get_or_create(course=course, defaults={'title': f"{course.code} Discussion Hub"})
        default_channels = ["General", "Grammar", "Vocabulary", "Homework", "Teacher Q&A"]
        for ch in default_channels:
            ForumThread.objects.get_or_create(
                forum=forum,
                title=ch,
                defaults={'author': self.request.user, 'body': f"Official channel for {ch} discussions.", 'is_pinned': True}
            )

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        course = self.get_object()
        if request.user.role != 'STUDENT':
            return Response({'progress_percentage': 100.0, 'completed_lessons': 0, 'total_lessons': 0})
        total_lessons = Lesson.objects.filter(module__unit__subject__course=course).count() + Lesson.objects.filter(module__course=course).count()
        if total_lessons == 0:
            return Response({'progress_percentage': 0.0, 'completed_lessons': 0, 'total_lessons': 0})
        completed = StudentLessonProgress.objects.filter(
            student__user=request.user,
            lesson__module__unit__subject__course=course,
            is_completed=True
        ).count() + StudentLessonProgress.objects.filter(
            student__user=request.user,
            lesson__module__course=course,
            is_completed=True
        ).count()
        pct = round((completed / total_lessons) * 100, 2)
        return Response({
            'progress_percentage': pct,
            'completed_lessons': completed,
            'total_lessons': total_lessons
        })

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsStaffOrReadOnly]

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsStaffOrReadOnly]

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsStaffOrReadOnly]

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all().order_by('order')
    serializer_class = LessonSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_permissions(self):
        if self.action == 'record_progress':
            return [permissions.IsAuthenticated()]
        return [IsStaffOrReadOnly()]

    @action(detail=True, methods=['post'], url_path='record-progress')
    def record_progress(self, request, pk=None):
        lesson = self.get_object()
        if request.user.role != 'STUDENT':
            return Response({'status': 'ignored_for_staff'})
        student = getattr(request.user, 'student_profile', None)
        if not student:
            from students.models import Student
            student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

        time_spent = int(request.data.get('time_spent_seconds', 10))
        is_done = request.data.get('is_completed', False)
        if isinstance(is_done, str):
            is_done = is_done.lower() in ('true', '1', 'yes')

        prog, _ = StudentLessonProgress.objects.get_or_create(student=student, lesson=lesson)
        prog.time_spent_seconds += time_spent
        if is_done and not prog.is_completed:
            prog.is_completed = True
            prog.completed_at = timezone.now()
            prog.progress_percentage = 100.0
        elif not prog.is_completed:
            if lesson.duration_seconds > 0:
                prog.progress_percentage = min(99.0, round((prog.time_spent_seconds / lesson.duration_seconds) * 100, 1))
        prog.save()
        return Response(StudentLessonProgressSerializer(prog).data)

    @action(detail=True, methods=['post'], url_path='duplicate')
    def duplicate(self, request, pk=None):
        lesson = self.get_object()
        new_lesson = Lesson.objects.create(
            module=lesson.module,
            title=f"{lesson.title} (Copy)",
            order=lesson.order + 1,
            media_type=lesson.media_type,
            content_url=lesson.content_url,
            body_html=lesson.body_html,
            code_snippet=lesson.code_snippet,
            duration_seconds=lesson.duration_seconds,
            is_mandatory=lesson.is_mandatory,
            is_published=False,
            status='DRAFT',
            description=lesson.description,
            objectives=lesson.objectives,
            teacher=request.user if request.user.is_authenticated else None
        )
        for topic in lesson.topics.all():
            Topic.objects.create(lesson=new_lesson, title=topic.title, order=topic.order, summary=topic.summary)
        log_action(request.user, f"Duplicated Lesson L{lesson.id} -> L{new_lesson.id}", request, "Lesson", new_lesson.id)
        return Response(LessonSerializer(new_lesson).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='archive')
    def archive(self, request, pk=None):
        lesson = self.get_object()
        lesson.status = 'ARCHIVED'
        lesson.is_published = False
        lesson.save()
        ResourceIndexingService.unindex_lesson(lesson)
        log_action(request.user, f"Archived Lesson L{lesson.id}", request, "Lesson", lesson.id)
        return Response(LessonSerializer(lesson).data)

    @action(detail=True, methods=['post'], url_path='schedule')
    def schedule(self, request, pk=None):
        lesson = self.get_object()
        rel = request.data.get('release_date')
        exp = request.data.get('expiry_date')
        if rel:
            lesson.release_date = rel
        if exp:
            lesson.expiry_date = exp
        lesson.save()
        log_action(request.user, f"Scheduled Lesson L{lesson.id}", request, "Lesson", lesson.id)
        return Response(LessonSerializer(lesson).data)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        lesson = self.get_object()
        lesson.status = 'PUBLISHED'
        lesson.is_published = True
        lesson.save()
        ResourceIndexingService.index_lesson(lesson)
        log_action(request.user, f"Published Lesson L{lesson.id}", request, "Lesson", lesson.id)
        return Response(LessonSerializer(lesson).data)

    @action(detail=True, methods=['post'], url_path='unpublish')
    def unpublish(self, request, pk=None):
        lesson = self.get_object()
        lesson.status = 'DRAFT'
        lesson.is_published = False
        lesson.save()
        ResourceIndexingService.unindex_lesson(lesson)
        log_action(request.user, f"Unpublished Lesson L{lesson.id}", request, "Lesson", lesson.id)
        return Response(LessonSerializer(lesson).data)


class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsStaffOrReadOnly]

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsStaffOrReadOnly]

    def perform_create(self, serializer):
        res = serializer.save()
        if res.file:
            try:
                res.file.seek(0)
                file_bytes = res.file.read()
                res.file_size_bytes = len(file_bytes)
                res.checksum = hashlib.sha256(file_bytes).hexdigest()
                res.virus_scan_status = 'CLEAN'
                fname = res.file.name.lower()
                if fname.endswith('.pdf'):
                    res.file_type = 'pdf'
                    res.mime_type = 'application/pdf'
                elif fname.endswith('.mp4'):
                    res.file_type = 'mp4'
                    res.mime_type = 'video/mp4'
                elif fname.endswith('.docx'):
                    res.file_type = 'docx'
                    res.mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                else:
                    res.file_type = fname.split('.')[-1] if '.' in fname else 'bin'
                res.save()
            except Exception:
                pass
        ResourceIndexingService.index_resource(res)
        log_action(self.request.user, f"Uploaded Resource R{res.id} ({res.title})", self.request, "Resource", res.id)


class RecordedLectureViewSet(viewsets.ModelViewSet):
    queryset = RecordedLecture.objects.all()
    serializer_class = RecordedLectureSerializer
    permission_classes = [IsStaffOrReadOnly]

class DiscussionForumViewSet(viewsets.ModelViewSet):
    queryset = DiscussionForum.objects.all()
    serializer_class = DiscussionForumSerializer
    permission_classes = [permissions.IsAuthenticated]

class ForumThreadViewSet(viewsets.ModelViewSet):
    queryset = ForumThread.objects.all()
    serializer_class = ForumThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class ForumPostViewSet(viewsets.ModelViewSet):
    queryset = ForumPost.objects.all()
    serializer_class = ForumPostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def destroy(self, request, *args, **kwargs):
        if request.user.role == 'STUDENT':
            return Response({'error': 'Students cannot delete discussion posts'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsStaffOrReadOnly]

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        student = getattr(self.request.user, 'student_profile', None)
        if not student:
            from students.models import Student
            student = Student.objects.filter(user=self.request.user).first()
        serializer.save(student=student)

class QuestionBankViewSet(viewsets.ModelViewSet):
    queryset = QuestionBank.objects.all()
    serializer_class = QuestionBankSerializer
    permission_classes = [IsStaffOrReadOnly]

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsStaffOrReadOnly]

class QuizQuestionViewSet(viewsets.ModelViewSet):
    queryset = QuizQuestion.objects.all()
    serializer_class = QuizQuestionSerializer
    permission_classes = [IsStaffOrReadOnly]

class QuizAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        student = getattr(self.request.user, 'student_profile', None)
        if not student:
            from students.models import Student
            student = Student.objects.filter(user=self.request.user).first()
        serializer.save(student=student)

class GradebookViewSet(viewsets.ModelViewSet):
    queryset = Gradebook.objects.all()
    serializer_class = GradebookSerializer
    permission_classes = [IsStaffOrReadOnly]


class OfficialExaminationViewSet(viewsets.ModelViewSet):
    serializer_class = OfficialExaminationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return OfficialExamination.objects.none()
        if user.role != 'STUDENT':
            return OfficialExamination.objects.all().order_by('-start_datetime')
        
        from students.models import Student
        student = Student.objects.filter(user=user).first()
        if not student:
            return OfficialExamination.objects.filter(publish_status=OfficialExamination.PublishStatus.PUBLISHED).order_by('-start_datetime')
            
        # Eligible if level matches, or explicitly assigned in eligible_students
        return OfficialExamination.objects.filter(
            Q(publish_status=OfficialExamination.PublishStatus.PUBLISHED) &
            (Q(level=student.current_level) | Q(eligible_students=student))
        ).distinct().order_by('-start_datetime')

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user)
        self._process_exam_files_and_notify(obj)

    def perform_update(self, serializer):
        obj = serializer.save()
        self._process_exam_files_and_notify(obj)

    def _process_exam_files_and_notify(self, obj):
        # Validate and calculate checksum for PDF paper
        if obj.exam_paper_pdf:
            try:
                obj.exam_paper_pdf.seek(0)
                file_content = obj.exam_paper_pdf.read()
                obj.checksum = hashlib.sha256(file_content).hexdigest()
                obj.file_size_bytes = len(file_content)
                ext = obj.exam_paper_pdf.name.split('.')[-1].lower() if '.' in obj.exam_paper_pdf.name else 'pdf'
                obj.mime_type = 'application/pdf' if ext == 'pdf' else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                obj.save(update_fields=['checksum', 'file_size_bytes', 'mime_type'])
            except Exception as e:
                pass

        # Trigger AI indexing into KnowledgeBase
        if obj.publish_status == OfficialExamination.PublishStatus.PUBLISHED:
            try:
                from ai_assistant.models import KnowledgeDocument
                content_summary = f"Examination: {obj.title} ({obj.exam_code})\nLevel: {obj.level.code if obj.level else 'N/A'}\nType: {obj.get_exam_type_display()}\nDuration: {obj.duration_minutes} mins\nMax Marks: {obj.maximum_marks}\nPassing Marks: {obj.passing_marks}\nInstructions: {obj.exam_instructions}\nDescription: {obj.description}"
                KnowledgeDocument.objects.create(
                    title=f"[EXAM REGULATION] {obj.exam_code} - {obj.title}",
                    category="COURSE_NOTE",
                    content=content_summary[:4000]
                )
            except Exception:
                pass

            # Notify students & teachers via Communication Hub
            try:
                from notifications.models import Notification
                if obj.teacher:
                    Notification.objects.create(
                        user=obj.teacher,
                        title="Examination Allocated",
                        message=f"You have been allocated examination proctoring/grading for: {obj.title} ({obj.exam_code})."
                    )
            except Exception:
                pass

    @action(detail=True, methods=['post'], url_path='start-session')
    def start_session(self, request, pk=None):
        exam = self.get_object()
        user = request.user
        from students.models import Student
        student = Student.objects.filter(user=user).first()
        if not student:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_400_BAD_REQUEST)
            
        now = timezone.now()
        if now < exam.start_datetime:
            return Response({'error': 'Examination has not started yet'}, status=status.HTTP_403_FORBIDDEN)
            
        sess, created = ExamSessionLog.objects.get_or_create(
            examination=exam,
            student=student,
            defaults={
                'opened_at': now,
                'pdf_viewed_at': now,
                'browser_info': request.META.get('HTTP_USER_AGENT', '')[:250],
                'ip_address': request.META.get('REMOTE_ADDR')
            }
        )
        if not created and not sess.opened_at:
            sess.opened_at = now
            sess.pdf_viewed_at = now
            sess.save()
            
        return Response(ExamSessionLogSerializer(sess).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='log-event')
    def log_event(self, request, pk=None):
        exam = self.get_object()
        from students.models import Student
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_400_BAD_REQUEST)
            
        sess = ExamSessionLog.objects.filter(examination=exam, student=student).order_by('-started_at').first()
        if not sess:
            return Response({'error': 'Active session not found'}, status=status.HTTP_404_NOT_FOUND)
            
        event_type = request.data.get('event_type')
        if event_type == 'focus_change':
            sess.focus_change_count += 1
            if sess.focus_change_count >= 5:
                sess.flagged_for_review = True
        elif event_type == 'interruption':
            sess.connection_interruptions += 1
        elif event_type == 'download':
            sess.downloaded_at = timezone.now()
            
        duration = request.data.get('session_duration_seconds')
        if duration:
            sess.session_duration_seconds = int(duration)
            
        sess.save()
        return Response(ExamSessionLogSerializer(sess).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='submit-script')
    def submit_script(self, request, pk=None):
        exam = self.get_object()
        from students.models import Student
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_400_BAD_REQUEST)
            
        file_obj = request.FILES.get('uploaded_file')
        if not file_obj:
            return Response({'error': 'No examination file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce file size check max 25MB
        if file_obj.size > 25 * 1024 * 1024:
            return Response({'error': 'Uploaded script exceeds maximum allowed size of 25MB'}, status=status.HTTP_400_BAD_REQUEST)
            
        now = timezone.now()
        is_late = now > exam.end_datetime
        if is_late and exam.late_submission_policy == OfficialExamination.LatePolicy.REJECT:
            return Response({'error': 'Late submissions are rejected for this examination'}, status=status.HTTP_403_FORBIDDEN)
            
        attempts_count = ExamSubmission.objects.filter(examination=exam, student=student).count()
        if attempts_count >= exam.allowed_attempts:
            return Response({'error': 'Maximum submission attempts exceeded'}, status=status.HTTP_403_FORBIDDEN)
            
        student_comments = request.data.get('student_comments', '')

        sub = ExamSubmission.objects.create(
            examination=exam,
            student=student,
            attempt_number=attempts_count + 1,
            uploaded_file=file_obj,
            file_type=file_obj.name.split('.')[-1].upper() if '.' in file_obj.name else 'FILE',
            file_size_bytes=file_obj.size,
            student_comments=student_comments,
            is_late=is_late
        )
        
        # Update session log submitted_at
        sess = ExamSessionLog.objects.filter(examination=exam, student=student).order_by('-started_at').first()
        if sess:
            sess.submitted_at = now
            sess.save()
            
        return Response(ExamSubmissionSerializer(sub, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='reports')
    def reports(self, request):
        if request.user.role == 'STUDENT':
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
            
        total_exams = OfficialExamination.objects.count()
        published_exams = OfficialExamination.objects.filter(publish_status=OfficialExamination.PublishStatus.PUBLISHED).count()
        total_submissions = ExamSubmission.objects.count()
        late_submissions = ExamSubmission.objects.filter(is_late=True).count()
        graded_submissions = ExamSubmission.objects.filter(marking_status__in=['GRADED', 'PUBLISHED']).count()
        
        # Calculate pass/fail based on marks obtained vs passing marks
        graded_qs = ExamSubmission.objects.filter(marking_status__in=['GRADED', 'PUBLISHED'], marks_obtained__isnull=False)
        passed_count = 0
        failed_count = 0
        total_score = 0
        for g in graded_qs:
            total_score += float(g.marks_obtained)
            if g.marks_obtained >= g.examination.passing_marks:
                passed_count += 1
            else:
                failed_count += 1
                
        avg_score = round(total_score / len(graded_qs), 1) if len(graded_qs) > 0 else 0
        pass_rate = round((passed_count / len(graded_qs)) * 100, 1) if len(graded_qs) > 0 else 0
        
        return Response({
            'total_exams': total_exams,
            'published_exams': published_exams,
            'total_submissions': total_submissions,
            'late_submissions': late_submissions,
            'graded_submissions': graded_submissions,
            'passed_count': passed_count,
            'failed_count': failed_count,
            'pass_rate': pass_rate,
            'average_score': avg_score
        })


class ExamSessionLogViewSet(viewsets.ModelViewSet):
    queryset = ExamSessionLog.objects.all().order_by('-started_at')
    serializer_class = ExamSessionLogSerializer
    permission_classes = [IsStaffOrReadOnly]


class ExamSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ExamSubmission.objects.none()
        if user.role != 'STUDENT':
            return ExamSubmission.objects.all().order_by('-submitted_at')
        from students.models import Student
        student = Student.objects.filter(user=user).first()
        if not student:
            return ExamSubmission.objects.none()
        return ExamSubmission.objects.filter(student=student).order_by('-submitted_at')

    @action(detail=True, methods=['post'], url_path='mark')
    def mark(self, request, pk=None):
        if request.user.role == 'STUDENT':
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
            
        sub = self.get_object()
        marks = request.data.get('marks_obtained')
        feedback = request.data.get('teacher_feedback', '')
        status_val = request.data.get('marking_status', 'GRADED')
        marked_file = request.FILES.get('marked_script')
        
        if marks is not None:
            sub.marks_obtained = float(marks)
            # Apply late penalty if applicable
            if sub.is_late and sub.examination.late_submission_policy == OfficialExamination.LatePolicy.PENALTY:
                penalty = float(sub.examination.late_penalty_percentage) / 100.0
                sub.marks_obtained = max(0, float(sub.marks_obtained) * (1.0 - penalty))
                
            # Grade text calculation
            pct = (float(sub.marks_obtained) / float(sub.examination.maximum_marks)) * 100 if sub.examination.maximum_marks > 0 else 0
            if pct >= 90: sub.grade = "Sehr Gut"
            elif pct >= 80: sub.grade = "Gut"
            elif pct >= 70: sub.grade = "Befriedigend"
            elif pct >= 60: sub.grade = "Ausreichend"
            else: sub.grade = "Nicht Bestanden"
            
        if feedback:
            sub.teacher_feedback = feedback
        if marked_file:
            sub.marked_script = marked_file
            
        sub.marking_status = status_val
        sub.graded_by = request.user
        sub.graded_at = timezone.now()
        if status_val == 'PUBLISHED':
            sub.published_at = timezone.now()
            self._sync_result_to_sis(sub)
            
        sub.save()
        return Response(ExamSubmissionSerializer(sub, context={'request': request}).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='moderate')
    def moderate(self, request, pk=None):
        if request.user.role == 'STUDENT':
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        sub = self.get_object()
        mod_status = request.data.get('moderation_status', 'APPROVED')
        notes = request.data.get('moderator_notes', '')

        sub.moderation_status = mod_status
        sub.moderator_notes = notes
        sub.moderated_by = request.user
        sub.moderated_at = timezone.now()

        if mod_status == 'APPROVED' and sub.marking_status != 'PUBLISHED':
            sub.marking_status = 'PUBLISHED'
            sub.published_at = timezone.now()
            self._sync_result_to_sis(sub)

        sub.save()
        return Response(ExamSubmissionSerializer(sub, context={'request': request}).data, status=status.HTTP_200_OK)

    def _sync_result_to_sis(self, sub):
        try:
            from results.models import Result
            from academics.models import StudentTimelineEvent
            from notifications.models import Notification
            exam = sub.examination
            if not exam or not sub.marks_obtained:
                return

            score_val = float(sub.marks_obtained)
            pct = (score_val / float(exam.maximum_marks)) * 100.0 if exam.maximum_marks > 0 else 0.0
            pct = min(100.0, max(0.0, pct))

            res, created = Result.objects.get_or_create(
                student=sub.student,
                level=exam.level,
                term=exam.semester or "Formal Exam",
                defaults={
                    'listening': pct,
                    'reading': pct,
                    'writing': pct,
                    'speaking': pct,
                    'grammar': pct,
                    'vocabulary': pct,
                    'is_published': True,
                    'remarks': sub.teacher_feedback or f"Verified Exam Score: {score_val}/{exam.maximum_marks}"
                }
            )
            if not created:
                # Update specific category if match, else update overall average
                etype = exam.exam_type
                if etype == 'LISTENING': res.listening = pct
                elif etype == 'READING': res.reading = pct
                elif etype == 'WRITING': res.writing = pct
                elif etype == 'SPEAKING': res.speaking = pct
                else:
                    res.listening = pct
                    res.reading = pct
                    res.writing = pct
                    res.speaking = pct
                    res.grammar = pct
                    res.vocabulary = pct
                res.is_published = True
                res.remarks = sub.teacher_feedback or res.remarks
                res.save()

            # Record Timeline Event
            passed = pct >= float(exam.passing_marks / exam.maximum_marks * 100.0 if exam.maximum_marks > 0 else 60.0)
            StudentTimelineEvent.objects.create(
                student=sub.student,
                event_type=StudentTimelineEvent.EventType.EXAM_PASSED if passed else StudentTimelineEvent.EventType.EXAM_FAILED,
                title=f"Examination Published: {exam.title}",
                description=f"Score: {score_val} / {exam.maximum_marks} ({sub.grade}) - Moderation: {sub.moderation_status}"
            )

            # Notify Student
            if sub.student.user:
                Notification.objects.create(
                    user=sub.student.user,
                    title="Formal Examination Results Published",
                    message=f"Your verified results for '{exam.title}' have been published. Score: {score_val}/{exam.maximum_marks} ({sub.grade})."
                )
        except Exception as e:
            pass


class GermanTeachingViewSet(viewsets.ViewSet):
    """
    Unified API viewset for Phase 5 German Language Teaching Platform:
    Levels, Virtual Classrooms (Zoom/BBB), German AI Coach, and Transcripts.
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='levels')
    def list_levels(self, request):
        from academics.models import Level
        levels = Level.objects.all().order_by('code')
        data = []
        for l in levels:
            data.append({
                "id": l.id,
                "code": l.code,
                "name": l.name,
                "description": l.description,
                "duration_weeks": l.duration_weeks,
                "cefr_category": l.cefr_category,
                "parent_level": l.parent_level.code if l.parent_level else None
            })
        return Response({"levels": data})

    @action(detail=False, methods=['get', 'post'], url_path='virtual-classes')
    def virtual_classes(self, request):
        from academics.models import VirtualClass, Cohort
        from odel.services.virtual_classroom_service import VirtualClassroomService

        if request.method == 'GET':
            vcs = VirtualClass.objects.all().order_by('-date', '-start_time')
            data = []
            for v in vcs:
                data.append({
                    "id": v.id,
                    "cohort": v.cohort.name,
                    "platform": v.platform,
                    "meeting_id": v.meeting_id,
                    "passcode": v.passcode,
                    "date": str(v.date),
                    "start_time": str(v.start_time),
                    "end_time": str(v.end_time),
                    "status": v.status,
                    "waiting_room": v.waiting_room,
                    "join_link": v.student_join_link or v.meeting_link,
                    "host_link": v.host_link if request.user.role in ['TEACHER', 'ADMIN'] else None,
                    "recording_url": v.recording_url
                })
            return Response({"virtual_classes": data})

        # POST create meeting
        if request.user.role not in ['TEACHER', 'ADMIN']:
            return Response({"error": "Only teachers or admins can schedule virtual classes"}, status=status.HTTP_403_FORBIDDEN)

        cohort_id = request.data.get('cohort_id')
        platform = request.data.get('platform', 'Zoom')
        date_str = request.data.get('date', str(timezone.now().date()))
        start_time_str = request.data.get('start_time', '18:00:00')
        end_time_str = request.data.get('end_time', '19:30:00')

        cohort = Cohort.objects.filter(id=cohort_id).first() or Cohort.objects.first()
        vc = VirtualClassroomService.schedule_meeting(
            cohort=cohort,
            teacher=request.user,
            platform=platform,
            date=datetime.datetime.strptime(date_str, '%Y-%m-%d').date(),
            start_time=datetime.datetime.strptime(start_time_str, '%H:%M:%S').time(),
            end_time=datetime.datetime.strptime(end_time_str, '%H:%M:%S').time()
        )
        return Response({"id": vc.id, "meeting_id": vc.meeting_id, "join_link": vc.student_join_link}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='attendance')
    def record_attendance(self, request):
        from odel.services.virtual_classroom_service import VirtualClassroomService
        vc_id = request.data.get('virtual_class_id')
        student_id = request.data.get('student_id')
        interruptions = int(request.data.get('connection_interruptions', 0))

        if not student_id:
            from students.models import Student
            st = Student.objects.filter(user=request.user).first()
            if st:
                student_id = st.id

        if not vc_id or not student_id:
            return Response({"error": "Missing virtual_class_id or student_id"}, status=status.HTTP_400_BAD_REQUEST)

        log = VirtualClassroomService.record_attendance_telemetry(vc_id, student_id, connection_interruptions=interruptions)
        return Response({
            "virtual_class_id": vc_id,
            "student_id": student_id,
            "attendance_percentage": log.attendance_percentage,
            "is_late": log.is_late
        })

    @action(detail=False, methods=['post'], url_path='ai-coach')
    def ai_coach(self, request):
        from odel.services.german_ai_coach import GermanAICoachService
        intent = request.data.get('intent', 'GENERAL')
        prompt = request.data.get('prompt', '')
        level = request.data.get('level', 'B1.1')
        context = request.data.get('context', None)

        res = GermanAICoachService.assist(intent=intent, prompt=prompt, lesson_context=context, level_code=level)
        return Response(res)

    @action(detail=False, methods=['get'], url_path='transcript')
    def transcript(self, request):
        from odel.services.transcript_service import TranscriptService
        student_id = request.query_params.get('student_id')
        if not student_id:
            from students.models import Student
            st = Student.objects.filter(user=request.user).first()
            if st:
                student_id = st.id
            else:
                st = Student.objects.first()
                if st:
                    student_id = st.id

        if not student_id:
            return Response({"error": "No student found"}, status=status.HTTP_404_NOT_FOUND)

        data = TranscriptService.generate_academic_transcript(student_id)
        return Response(data)

    @action(detail=False, methods=['post'], url_path='issue-certificate')
    def issue_certificate(self, request):
        from odel.services.transcript_service import TranscriptService
        student_id = request.data.get('student_id')
        level_id = request.data.get('level_id')
        if not student_id or not level_id:
            return Response({"error": "Missing student_id or level_id"}, status=status.HTTP_400_BAD_REQUEST)

        res = TranscriptService.verify_and_issue_certificate(student_id, level_id, issued_by=request.user)
        if res["success"]:
            return Response(res, status=status.HTTP_201_CREATED)
        return Response(res, status=status.HTTP_400_BAD_REQUEST)


class StudentLessonNoteViewSet(viewsets.ModelViewSet):
    queryset = StudentLessonNote.objects.all()
    serializer_class = StudentLessonNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return StudentLessonNote.objects.none()
        if user.role == 'STUDENT':
            return StudentLessonNote.objects.filter(student__user=user)
        return StudentLessonNote.objects.all()

    def perform_create(self, serializer):
        student = getattr(self.request.user, 'student_profile', None)
        if not student:
            from students.models import Student
            student = Student.objects.filter(user=self.request.user).first()
        note = serializer.save(student=student)
        prog, _ = StudentLessonProgress.objects.get_or_create(student=student, lesson=note.lesson)
        prog.notes_count = StudentLessonNote.objects.filter(student=student, lesson=note.lesson).count()
        prog.save()

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        fmt = request.query_params.get('format', 'txt').lower()
        notes = self.get_queryset()
        if fmt == 'json':
            data = [StudentLessonNoteSerializer(n).data for n in notes]
            return Response(data)
        elif fmt == 'markdown':
            lines = ["# My Horizon ODEL Study Notes\n"]
            for n in notes:
                lines.append(f"## [{n.note_type}] {n.lesson.title} (@ {n.timestamp_seconds}s)")
                if n.selected_text:
                    lines.append(f"> \"{n.selected_text}\"")
                lines.append(f"{n.content}\n")
            return HttpResponse("\n".join(lines), content_type="text/markdown")
        else:
            lines = ["HORIZON ODEL STUDY NOTES\n========================\n"]
            for n in notes:
                lines.append(f"Lesson: {n.lesson.title} | Type: {n.note_type} | Time: {n.timestamp_seconds}s")
                if n.selected_text:
                    lines.append(f"Quote: {n.selected_text}")
                lines.append(f"Note: {n.content}\n------------------------\n")
            return HttpResponse("\n".join(lines), content_type="text/plain")



