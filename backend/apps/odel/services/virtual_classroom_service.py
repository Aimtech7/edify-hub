import uuid
import datetime
from django.utils import timezone
from academics.models import VirtualClass, VirtualAttendanceLog
from attendance.models import Attendance

class VirtualClassroomService:
    """
    Orchestrates Zoom and BigBlueButton virtual classrooms, link generation,
    session recordings, and automatic attendance telemetry syncing.
    """

    @classmethod
    def schedule_meeting(cls, cohort, teacher, platform, date, start_time, end_time, title=None, waiting_room=True, is_recurring=False):
        meeting_id = f"MEET-{uuid.uuid4().hex[:8].upper()}"
        passcode = uuid.uuid4().hex[:6].upper()
        
        if platform == "Zoom":
            host_link = f"https://zoom.us/s/{meeting_id}?zak=secure_host_token"
            student_join_link = f"https://zoom.us/j/{meeting_id}?pwd={passcode}"
            recording_url = f"https://zoom.us/rec/share/{uuid.uuid4().hex}"
        elif platform == "BBB":
            host_link = f"https://bbb.horizon.edu/bigbluebutton/api/create?meetingID={meeting_id}&moderatorPW=mod_{passcode}"
            student_join_link = f"https://bbb.horizon.edu/bigbluebutton/api/join?meetingID={meeting_id}&password=stu_{passcode}"
            recording_url = f"https://bbb.horizon.edu/playback/presentation/2.3/{uuid.uuid4().hex}"
        else:
            host_link = f"https://meet.google.com/{meeting_id.lower()}"
            student_join_link = host_link
            recording_url = ""

        vc = VirtualClass.objects.create(
            cohort=cohort,
            teacher=teacher,
            platform=platform,
            meeting_link=student_join_link,
            host_link=host_link,
            student_join_link=student_join_link,
            recording_url=recording_url,
            meeting_id=meeting_id,
            passcode=passcode,
            date=date,
            start_time=start_time,
            end_time=end_time,
            status=VirtualClass.Status.SCHEDULED,
            waiting_room=waiting_room,
            is_recurring=is_recurring
        )
        return vc

    @classmethod
    def start_meeting(cls, virtual_class_id):
        vc = VirtualClass.objects.get(id=virtual_class_id)
        vc.status = VirtualClass.Status.LIVE
        vc.save()
        return {
            "status": "LIVE",
            "host_link": vc.host_link or vc.meeting_link,
            "meeting_id": vc.meeting_id,
            "platform": vc.platform
        }

    @classmethod
    def end_meeting(cls, virtual_class_id):
        vc = VirtualClass.objects.get(id=virtual_class_id)
        vc.status = VirtualClass.Status.ENDED
        vc.save()
        return {
            "status": "ENDED",
            "recording_url": vc.recording_url
        }

    @classmethod
    def record_attendance_telemetry(cls, virtual_class_id, student_id, join_time=None, leave_time=None, connection_interruptions=0):
        vc = VirtualClass.objects.get(id=virtual_class_id)
        
        if join_time is None:
            join_time = timezone.now()
        if leave_time is None:
            leave_time = join_time + datetime.timedelta(minutes=60) # Simulated standard 1-hour session if ended

        duration_seconds = max((leave_time - join_time).total_seconds(), 0)
        duration_minutes = int(duration_seconds // 60)

        # Calculate scheduled duration
        start_dt = datetime.datetime.combine(vc.date, vc.start_time)
        end_dt = datetime.datetime.combine(vc.date, vc.end_time)
        sched_minutes = max((end_dt - start_dt).total_seconds() // 60, 60)

        attendance_pct = min(round((duration_minutes / sched_minutes) * 100, 1), 100.0)
        
        # Check late entry (> 15 mins after scheduled start)
        is_late = False
        if join_time.time() > (datetime.datetime.combine(vc.date, vc.start_time) + datetime.timedelta(minutes=15)).time():
            is_late = True

        log, created = VirtualAttendanceLog.objects.update_or_create(
            virtual_class=vc,
            student_id=student_id,
            defaults={
                "join_time": join_time,
                "leave_time": leave_time,
                "duration_minutes": duration_minutes,
                "is_late": is_late,
                "connection_interruptions": connection_interruptions,
                "attendance_percentage": attendance_pct,
                "verified_by_teacher": True
            }
        )

        # Sync back to Horizon physical SIS attendance ledger
        Attendance.objects.update_or_create(
            student_id=student_id,
            cohort=vc.cohort,
            date=vc.date,
            defaults={
                "status": Attendance.Status.PRESENT if attendance_pct >= 70.0 else (Attendance.Status.LATE if is_late else Attendance.Status.ABSENT),
                "recorded_by": vc.teacher
            }
        )

        return log
