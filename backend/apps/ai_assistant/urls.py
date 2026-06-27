from django.urls import path
from .views import AIChatView, AIFeedbackView, AISettingsView

urlpatterns = [
    path("chat/", AIChatView.as_view(), name="ai_chat"),
    path("feedback/", AIFeedbackView.as_view(), name="ai_feedback"),
    path("settings/", AISettingsView.as_view(), name="ai_settings"),
]
