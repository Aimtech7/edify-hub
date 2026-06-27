from django.contrib import admin
from .models import Conversation, PrivateMessage, Announcement, BroadcastMessage, PushNotificationToken

for model in [Conversation, PrivateMessage, Announcement, BroadcastMessage, PushNotificationToken]:
    @admin.register(model)
    class GenericCommAdmin(admin.ModelAdmin):
        list_display = [f.name for f in model._meta.fields[:6]]
