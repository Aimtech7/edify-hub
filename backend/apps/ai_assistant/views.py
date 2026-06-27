import time
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework import status

from ai_assistant.models import AISetting, AIRequestLog
from ai_assistant.retrieval import retrieve_rag_context
from ai_assistant.providers import get_llm_provider

class AIChatView(APIView):
    permission_classes = [AllowAny] # Allow public website inquiries as well as authenticated portals

    def post(self, request, *args, **kwargs):
        question = request.data.get("question") or request.data.get("prompt", "").strip()
        if not question:
            return Response({"error": "Question parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        start_time = time.time()
        user = request.user if request.user and request.user.is_authenticated else None
        role = getattr(user, 'role', 'PUBLIC') if user else 'PUBLIC'

        # 1. Retrieve RAG Context & Suggested Actions
        context_text, actions = retrieve_rag_context(user, question)

        # 2. Get AI Provider & Generate
        config = AISetting.get_settings()
        provider = get_llm_provider(config)
        
        reply = provider.generate(
            system_prompt=config.system_prompt,
            user_prompt=question,
            context=context_text,
            temperature=config.temperature,
            max_tokens=config.max_tokens
        )

        elapsed_ms = int((time.time() - start_time) * 1000)

        # 3. Log Audit Record
        log = AIRequestLog.objects.create(
            user=user,
            user_role=role,
            question=question,
            retrieved_context=context_text[:1500],
            model_used=f"{config.provider}:{config.model_name}",
            response_text=reply,
            response_time_ms=elapsed_ms
        )

        return Response({
            "reply": reply,
            "actions": actions,
            "log_id": log.id,
            "model": config.model_name,
            "response_time_ms": elapsed_ms
        })


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
    permission_classes = [IsAuthenticated] # Or check role admin

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
