from rest_framework import viewsets, permissions
from academics.models import Level, Cohort, PromotionHistory
from academics.serializers import LevelSerializer, CohortSerializer, PromotionHistorySerializer
from accounts.permissions import IsAdminUser, IsTeacher, IsAccountant

class LevelViewSet(viewsets.ModelViewSet):
    queryset = Level.objects.all().order_by('code')
    serializer_class = LevelSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

class CohortViewSet(viewsets.ModelViewSet):
    queryset = Cohort.objects.all().order_by('-start_date')
    serializer_class = CohortSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return Cohort.objects.filter(instructor=user).order_by('-start_date')
        return super().get_queryset()

class PromotionHistoryViewSet(viewsets.ModelViewSet):
    queryset = PromotionHistory.objects.all().order_by('-promotion_date')
    serializer_class = PromotionHistorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def perform_create(self, serializer):
        promotion = serializer.save()
        from audits.models import log_action
        log_action(
            self.request.user,
            f"Promoted {promotion.student.admission_number} from {promotion.previous_level.code} to {promotion.new_level.code}",
            self.request
        )
        
        # Send Notification
        from notifications.services import NotificationService
        NotificationService.notify_user(
            user=promotion.student.user,
            title="Level Promotion",
            message=f"Congratulations! You have been promoted to Level {promotion.new_level.code}. Keep up the great work!",
            send_email=True
        )

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return PromotionHistory.objects.filter(student__user=user).order_by('-promotion_date')
        return super().get_queryset()
