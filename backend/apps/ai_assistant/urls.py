from django.urls import path
from .views import (
    AIChatView,
    AIFeedbackView,
    AISettingsView,
    AIConversationListView,
    AIConversationDetailView,
    KnowledgeDocumentListView,
    KnowledgeDocumentDetailView,
    KnowledgeReindexView,
    SemanticSearchView,
    IndexingJobListView,
    IndexingJobRetryView,
    AIDashboardStatsView,
)

urlpatterns = [
    # Chat & Feedback
    path("chat/", AIChatView.as_view(), name="ai_chat"),
    path("feedback/", AIFeedbackView.as_view(), name="ai_feedback"),
    path("settings/", AISettingsView.as_view(), name="ai_settings"),

    # Conversations
    path("conversations/", AIConversationListView.as_view(), name="ai_conversations"),
    path("conversations/<int:pk>/", AIConversationDetailView.as_view(), name="ai_conversation_detail"),

    # Knowledge Base & Indexing
    path("knowledge/", KnowledgeDocumentListView.as_view(), name="ai_knowledge_list"),
    path("knowledge/<int:pk>/", KnowledgeDocumentDetailView.as_view(), name="ai_knowledge_detail"),
    path("knowledge/<int:pk>/reindex/", KnowledgeReindexView.as_view(), name="ai_knowledge_reindex"),
    path("knowledge/search/", SemanticSearchView.as_view(), name="ai_semantic_search"),

    # Indexing Jobs
    path("indexing-jobs/", IndexingJobListView.as_view(), name="ai_indexing_jobs"),
    path("indexing-jobs/<int:pk>/retry/", IndexingJobRetryView.as_view(), name="ai_indexing_job_retry"),

    # Telemetry
    path("dashboard-stats/", AIDashboardStatsView.as_view(), name="ai_dashboard_stats"),
]
