from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import datetime
from django.db.models import Q, Avg, Count
from odel.models import (
    Course, Subject, Unit, Module, Lesson, Topic, Resource, StudentLessonProgress,
    RecordedLecture, DiscussionForum, ForumThread, ForumPost, Assignment,
    AssignmentSubmission, QuestionBank, Quiz, QuizQuestion, QuizAttempt, Gradebook,
    OfficialExamination, ExamSessionLog, ExamSubmission
)
from odel.serializers import (
    CourseSerializer, SubjectSerializer, UnitSerializer, ModuleSerializer,
    LessonSerializer, TopicSerializer, ResourceSerializer, StudentLessonProgressSerializer,
    RecordedLectureSerializer, DiscussionForumSerializer, ForumThreadSerializer,
    ForumPostSerializer, AssignmentSerializer, AssignmentSubmissionSerializer,
    QuestionBankSerializer, QuizSerializer, QuizQuestionSerializer, QuizAttemptSerializer,
    GradebookSerializer, OfficialExaminationSerializer, ExamSessionLogSerializer,
    ExamSubmissionSerializer
)
from accounts.permissions import IsStaffOrReadOnly

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by('-created_at')
    serializer_class = CourseSerializer
    permission_classes = [IsStaffOrReadOnly]

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

class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsStaffOrReadOnly]

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsStaffOrReadOnly]

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
        serializer.save(created_by=self.request.user)

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
            
        now = timezone.now()
        is_late = now > exam.end_datetime
        if is_late and exam.late_submission_policy == OfficialExamination.LatePolicy.REJECT:
            return Response({'error': 'Late submissions are rejected for this examination'}, status=status.HTTP_403_FORBIDDEN)
            
        attempts_count = ExamSubmission.objects.filter(examination=exam, student=student).count()
        if attempts_count >= exam.allowed_attempts:
            return Response({'error': 'Maximum submission attempts exceeded'}, status=status.HTTP_403_FORBIDDEN)
            
        sub = ExamSubmission.objects.create(
            examination=exam,
            student=student,
            attempt_number=attempts_count + 1,
            uploaded_file=file_obj,
            file_type=file_obj.name.split('.')[-1].upper() if '.' in file_obj.name else 'FILE',
            file_size_bytes=file_obj.size,
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
            
        sub.save()
        return Response(ExamSubmissionSerializer(sub, context={'request': request}).data, status=status.HTTP_200_OK)


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


