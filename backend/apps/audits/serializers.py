from rest_framework import serializers
from audits.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    user_role = serializers.ReadOnlyField(source='user.role')

    class Meta:
        model = AuditLog
        fields = '__all__'
