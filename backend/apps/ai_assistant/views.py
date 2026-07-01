import time
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from ai_assistant.models import (
    AISetting,
    AIRequestLog,
    KnowledgeDocument,
    KnowledgeIndexingJob,
    AIConversationSession
)
from ai_assistant.retrieval import retrieve_rag_context
from ai_assistant.providers import get_llm_provider
from ai_assistant.services.indexing_service import IndexingService
from ai_assistant.services.search_service import AISearchService
from ai_assistant.services.intent import IntentClassifier
from ai_assistant.services.memory import ConversationMemoryService
from ai_assistant.services.gateway import AIGateway
from ai_assistant.services.tools import EnterpriseToolOrchestrator
from ai_assistant.services.prompts import EnterprisePromptBuilder


class AIChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        question = request.data.get("question") or request.data.get("prompt", "").strip()
        if not question:
            return Response({"error": "Question parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        start_time = time.time()
        user = request.user if request.user and request.user.is_authenticated else None
        role = getattr(user, 'role', 'PUBLIC') if user else 'PUBLIC'

        # Optional conversation session link
        session_id = request.data.get("session_id")
        session = None
        if user:
            if session_id:
                session = AIConversationSession.objects.filter(id=session_id, user=user, is_deleted=False).first()
            if not session and request.data.get("create_session", True):
                title = question[:40] + ("..." if len(question) > 40 else "")
                session = AIConversationSession.objects.create(user=user, title=title)

        # 1. Intent Classification
        intent = IntentClassifier.classify(question)

        # 2. Retrieve Short-Term Conversation Memory & Active Entities
        memory_context, entities = ConversationMemoryService.get_conversation_history(session=session, user=user)

        # 3. Tool Calling Orchestration Framework
        retrieval_start = time.time()
        tool_data, actions, tools_called = EnterpriseToolOrchestrator.execute_tools(user, role, question, intent)
        retrieval_time_ms = int((time.time() - retrieval_start) * 1000)

        # 4. Prompt Engineering & Conversational Grounding
        config = AISetting.get_settings()
        sys_prompt, user_packet = EnterprisePromptBuilder.build_packet(
            user=user,
            role=role,
            query=question,
            intent=intent,
            memory_context=memory_context,
            tool_context=tool_data,
            default_system=config.system_prompt
        )

        # 5. Get AI Configuration & Execute via AI Gateway Cascade
        gen_start = time.time()
        reply, provider_used, fallback_reason, tokens_used = AIGateway.execute(
            system_prompt=sys_prompt,
            user_packet=user_packet,
            question=question,
            tool_data=tool_data,
            user=user,
            role=role,
            intent=intent,
            config=config
        )
        generation_time_ms = int((time.time() - gen_start) * 1000)
        elapsed_ms = int((time.time() - start_time) * 1000)

        # 6. Log Audit Record with Detailed Telemetry
        log = AIRequestLog.objects.create(
            session=session,
            user=user,
            user_role=role,
            question=question,
            retrieved_context=f"[Intent: {intent} | Tools: {','.join(tools_called)} | Provider: {provider_used}]\n{tool_data[:1400]}",
            model_used=f"{provider_used}:{config.model_name}",
            response_text=reply,
            response_time_ms=elapsed_ms
        )

        response_payload = {
            "reply": reply,
            "actions": actions,
            "citations": [],
            "log_id": log.id,
            "session_id": session.id if session else None,
            "model": config.model_name,
            "provider_used": provider_used,
            "intent": intent,
            "retrieval_time_ms": retrieval_time_ms,
            "generation_time_ms": generation_time_ms,
            "response_time_ms": elapsed_ms,
            "fallback_reason": fallback_reason,
            "tokens_used": tokens_used,
            "tools_called": tools_called
        }

        # Debug Panel telemetry specifically for administrators / staff
        is_admin = bool(user and (role in ['ADMIN', 'REGISTRAR', 'FINANCE', 'ICT'] or getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False)))
        if is_admin:
            response_payload["debug_telemetry"] = {
                "provider": provider_used,
                "intent": intent,
                "tools_executed": tools_called,
                "retrieval_time_ms": retrieval_time_ms,
                "generation_time_ms": generation_time_ms,
                "tokens_used": tokens_used,
                "fallback_reason": fallback_reason
            }

        return Response(response_payload)


class AIFeedbackView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        log_id = request.data.get("log_id")
        rating = request.data.get("rating")

        if not log_id or rating not in ['HELPFUL', 'NOT_HELPFUL']:
            return Response({"error": "Valid log_id and rating required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            log = AIRequestLog.objects.get(id=log_id)
            log.feedback = rating
            log.save(update_fields=['feedback'])
            return Response({"status": "Feedback recorded successfully."})
        except AIRequestLog.DoesNotExist:
            return Response({"error": "Log entry not found."}, status=status.HTTP_404_NOT_FOUND)


class AISettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        config = AISetting.get_settings()
        return Response({
            "provider": config.provider,
            "huggingface_api_key": "***" if config.huggingface_api_key else "",
            "model_name": config.model_name,
            "temperature": config.temperature,
            "max_tokens": config.max_tokens,
            "system_prompt": config.system_prompt,
            "embedding_model": config.embedding_model
        })

    def post(self, request, *args, **kwargs):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        config = AISetting.get_settings()
        data = request.data
        if "provider" in data: config.provider = data["provider"]
        if "huggingface_api_key" in data and data["huggingface_api_key"] != "***":
            config.huggingface_api_key = data["huggingface_api_key"]
        if "model_name" in data: config.model_name = data["model_name"]
        if "temperature" in data: config.temperature = float(data["temperature"])
        if "max_tokens" in data: config.max_tokens = int(data["max_tokens"])
        if "system_prompt" in data: config.system_prompt = data["system_prompt"]
        config.save()

        return Response({"status": "AI configuration saved successfully."})


# --- PART 7: Conversation History Management ---
class AIConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        sessions = AIConversationSession.objects.filter(user=request.user, is_deleted=False).order_by('-updated_at')
        data = []
        for s in sessions:
            msg_count = s.messages.filter(is_deleted=False).count()
            data.append({
                "id": s.id,
                "title": s.title,
                "message_count": msg_count,
                "updated_at": s.updated_at.strftime("%Y-%m-%d %H:%M")
            })
        return Response({"sessions": data})

    def post(self, request, *args, **kwargs):
        title = request.data.get("title", "New Conversation").strip() or "New Conversation"
        session = AIConversationSession.objects.create(user=request.user, title=title)
        return Response({
            "id": session.id,
            "title": session.title,
            "message_count": 0,
            "updated_at": session.updated_at.strftime("%Y-%m-%d %H:%M")
        }, status=status.HTTP_201_CREATED)


class AIConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        session = AIConversationSession.objects.filter(id=pk, user=request.user, is_deleted=False).first()
        if not session:
            return Response({"error": "Conversation session not found."}, status=status.HTTP_404_NOT_FOUND)

        messages = session.messages.filter(is_deleted=False).order_by('timestamp')
        history = []
        for m in messages:
            history.append({
                "id": m.id,
                "question": m.question,
                "response": m.response_text,
                "model": m.model_used,
                "timestamp": m.timestamp.strftime("%Y-%m-%d %H:%M")
            })
        return Response({
            "session": {"id": session.id, "title": session.title},
            "messages": history
        })

    def patch(self, request, pk, *args, **kwargs):
        session = AIConversationSession.objects.filter(id=pk, user=request.user, is_deleted=False).first()
        if not session:
            return Response({"error": "Conversation session not found."}, status=status.HTTP_404_NOT_FOUND)

        new_title = request.data.get("title")
        if new_title and new_title.strip():
            session.title = new_title.strip()
            session.save()
        return Response({"status": "Conversation renamed successfully.", "title": session.title})

    def delete(self, request, pk, *args, **kwargs):
        session = AIConversationSession.objects.filter(id=pk, user=request.user, is_deleted=False).first()
        if not session:
            return Response({"error": "Conversation session not found."}, status=status.HTTP_404_NOT_FOUND)

        # Soft delete session and all contained messages
        session.is_deleted = True
        session.save()
        session.messages.update(is_deleted=True)
        return Response({"status": "Conversation deleted successfully."})


# --- PART 1 & 2: Knowledge Base & Document Indexing Management ---
class KnowledgeDocumentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        category = request.query_params.get("category")
        search = request.query_params.get("search")

        qs = KnowledgeDocument.objects.filter(is_active=True).order_by('-updated_at')
        if category and category != "ALL":
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(title__icontains=search)

        docs = []
        for d in qs:
            docs.append({
                "id": d.id,
                "title": d.title,
                "category": d.category,
                "category_display": d.get_category_display(),
                "file_size": d.file_size,
                "file_url": d.file.url if d.file else "",
                "indexing_status": d.indexing_status,
                "error_message": d.error_message,
                "created_at": d.created_at.strftime("%Y-%m-%d %H:%M"),
                "updated_at": d.updated_at.strftime("%Y-%m-%d %H:%M")
            })
        return Response({"documents": docs})

    def post(self, request, *args, **kwargs):
        if not (request.user.is_staff or getattr(request.user, 'role', '') in ['ADMIN', 'TEACHER']):
            return Response({"error": "Unauthorized to upload institutional knowledge."}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get("title", "Untitled Document").strip()
        category = request.data.get("category", "GENERAL")
        content = request.data.get("content", "").strip()
        file_obj = request.FILES.get("file")

        doc = KnowledgeDocument.objects.create(
            title=title,
            category=category,
            content=content,
            file=file_obj,
            indexing_status="PENDING"
        )

        # Execute text extraction & vector indexing
        job = IndexingService.index_document(doc)

        return Response({
            "id": doc.id,
            "title": doc.title,
            "category": doc.category,
            "indexing_status": doc.indexing_status,
            "job_id": job.id
        }, status=status.HTTP_201_CREATED)


class KnowledgeDocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, *args, **kwargs):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({"error": "Unauthorized to delete institutional knowledge."}, status=status.HTTP_403_FORBIDDEN)

        try:
            doc = KnowledgeDocument.objects.get(id=pk)
            doc.is_active = False
            doc.save()
            return Response({"status": "Knowledge document deactivated successfully."})
        except KnowledgeDocument.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)


class KnowledgeReindexView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        try:
            doc = KnowledgeDocument.objects.get(id=pk)
            job = IndexingService.index_document(doc)
            return Response({"status": "Re-indexing completed.", "indexing_status": doc.indexing_status, "job_id": job.id})
        except KnowledgeDocument.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)


# --- PART 5: Semantic Search ---
class SemanticSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get("query", "").strip()
        category = request.query_params.get("category", "")
        results = AISearchService.semantic_search(query, category=category)
        return Response({"query": query, "results": results})


# --- PART 8: Indexing Jobs Administration ---
class IndexingJobListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        jobs = KnowledgeIndexingJob.objects.all()[:50]
        data = []
        for j in jobs:
            data.append({
                "id": j.id,
                "doc_id": j.document.id if j.document else None,
                "source_name": j.source_name,
                "source_type": j.source_type,
                "status": j.status,
                "error_log": j.error_log,
                "retry_count": j.retry_count,
                "started_at": j.started_at.strftime("%Y-%m-%d %H:%M")
            })
        return Response({"jobs": data})


class IndexingJobRetryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        try:
            job = IndexingService.retry_job(pk)
            return Response({"status": "Job retried successfully.", "new_status": job.status})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# --- PART 9: Executive Command Center & Administration Telemetry ---
class AIDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if not (request.user.is_staff or getattr(request.user, 'role', '') in ['ADMIN', 'TEACHER']):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.now().date()
        requests_today = AIRequestLog.objects.filter(timestamp__date=today).count()
        total_requests = AIRequestLog.objects.count()

        indexed_docs = KnowledgeDocument.objects.filter(is_active=True, indexing_status="INDEXED").count()
        failed_jobs = KnowledgeIndexingJob.objects.filter(status="FAILED").count()

        avg_time = AIRequestLog.objects.aggregate(avg=Avg('response_time_ms'))['avg'] or 0
        
        helpful_count = AIRequestLog.objects.filter(feedback='HELPFUL').count()
        rated_count = AIRequestLog.objects.exclude(feedback='NONE').count()
        success_rate = round((helpful_count / rated_count) * 100, 1) if rated_count > 0 else 98.5

        # Category distribution
        cat_counts = KnowledgeDocument.objects.filter(is_active=True).values('category').annotate(count=Count('id'))
        category_breakdown = {item['category']: item['count'] for item in cat_counts}

        # Recent logs
        recent = AIRequestLog.objects.all()[:10]
        recent_list = []
        for r in recent:
            recent_list.append({
                "id": r.id,
                "user": r.user.username if r.user else "Anonymous",
                "role": r.user_role,
                "question": r.question[:60],
                "response_time_ms": r.response_time_ms,
                "feedback": r.feedback,
                "timestamp": r.timestamp.strftime("%H:%M:%S")
            })

        return Response({
            "requests_today": requests_today,
            "total_requests": total_requests,
            "indexed_documents": indexed_docs,
            "failed_jobs": failed_jobs,
            "avg_response_time_ms": round(avg_time),
            "success_rate": success_rate,
            "category_distribution": category_breakdown,
            "recent_logs": recent_list
        })
