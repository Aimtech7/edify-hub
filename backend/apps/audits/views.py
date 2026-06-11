from rest_framework import viewsets
from audits.models import AuditLog
from audits.serializers import AuditLogSerializer
from accounts.permissions import IsAdminUser

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = (IsAdminUser,)

    def get_queryset(self):
        queryset = AuditLog.objects.all().order_by('-timestamp')
        username = self.request.query_params.get('username')
        action = self.request.query_params.get('action')
        
        if username:
            queryset = queryset.filter(user__username__icontains=username)
        if action:
            queryset = queryset.filter(action__icontains=action)
            
        return queryset
