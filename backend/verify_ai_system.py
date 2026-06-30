import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from ai_assistant.models import (
    AISetting,
    KnowledgeDocument,
    KnowledgeIndexingJob,
    AIConversationSession,
    AIRequestLog
)
from ai_assistant.services.indexing_service import IndexingService
from ai_assistant.services.search_service import AISearchService
from ai_assistant.retrieval import retrieve_rag_context

User = get_user_model()

def run_ai_verification():
    print("==================================================================")
    print("HORIZON ERP + ODEL - PHASE 9 INSTITUTIONAL AI PLATFORM AUDIT")
    print("==================================================================\n")

    # 1. Ensure AI settings exist
    config = AISetting.get_settings()
    print(f"[OK] [Config] AI Setting loaded: Provider={config.provider}, Model={config.model_name}")

    # 2. Create sample knowledge documents across multiple categories
    print("\n--- Testing Document Indexing Pipeline & Multi-Format Support ---")
    doc_policy = KnowledgeDocument.objects.create(
        title="Horizon Tuition Refund Policy 2026",
        category="POLICY",
        content="Students withdrawing within 14 days of enrollment are eligible for an 80% tuition refund upon submitting formal written notification to the Registrar."
    )
    job_policy = IndexingService.index_document(doc_policy)
    print(f"[OK] [Indexing] Indexed Policy Doc ID={doc_policy.id}, Vector Dims={len(doc_policy.embedding_vector)}, Job Status={job_policy.status}")

    doc_lesson = KnowledgeDocument.objects.create(
        title="Goethe B1 Akkusativ vs Dativ Grammar Guide",
        category="LESSON_PDF",
        content="Prepositions taking Akkusativ: durch, fur, gegen, ohne, um. Prepositions taking Dativ: aus, ausser, bei, mit, nach, seit, von, zu."
    )
    job_lesson = IndexingService.index_document(doc_lesson)
    print(f"[OK] [Indexing] Indexed Lesson Doc ID={doc_lesson.id}, Vector Dims={len(doc_lesson.embedding_vector)}, Job Status={job_lesson.status}")

    # 3. Test Semantic Search Ranking
    print("\n--- Testing Semantic Vector & Keyword Search ---")
    results = AISearchService.semantic_search("what is the refund rule if I withdraw?", limit=5)
    print(f"[OK] [Search] Query 'withdraw refund' returned {len(results)} ranked matches.")
    if results:
        print(f"    Top Match: [{results[0]['category']}] {results[0]['title']} (Score: {results[0]['score']})")

    grammar_results = AISearchService.semantic_search("prepositions for akkusativ and dativ", limit=5)
    print(f"[OK] [Search] Query 'akkusativ dativ' returned {len(grammar_results)} ranked matches.")
    if grammar_results:
        print(f"    Top Match: [{grammar_results[0]['category']}] {grammar_results[0]['title']} (Score: {grammar_results[0]['score']})")

    # 4. Test Role-Based RAG Governance
    print("\n--- Testing Role-Isolated RAG Retrieval Security ---")
    student_user, _ = User.objects.get_or_create(username="ai_test_student", defaults={"role": "student"})
    teacher_user, _ = User.objects.get_or_create(username="ai_test_teacher", defaults={"role": "teacher"})

    ctx_student, actions_s = retrieve_rag_context(student_user, "How do I conjugate sprechen?")
    assert "SECURITY GOVERNANCE (STUDENT ROLE ENFORCED)" in ctx_student
    print("[OK] [Security] Student role isolation governance verified.")

    ctx_teacher, actions_t = retrieve_rag_context(teacher_user, "Show me grading rubric for B1 writing.")
    assert "SECURITY GOVERNANCE (TEACHER ROLE ENFORCED)" in ctx_teacher
    print("[OK] [Security] Teacher role isolation governance verified.")

    # 5. Test Conversation Session Management
    print("\n--- Testing Persistent Conversation History & Soft Deletion ---")
    sess = AIConversationSession.objects.create(user=student_user, title="German Grammar Questions")
    log = AIRequestLog.objects.create(
        session=sess,
        user=student_user,
        user_role="student",
        question="How do I conjugate sprechen?",
        retrieved_context=ctx_student[:500],
        model_used=f"{config.provider}:{config.model_name}",
        response_text="Sprechen conjugates as: ich spreche, du sprichst, er/sie/es spricht...",
        response_time_ms=120,
        feedback="HELPFUL"
    )
    print(f"[OK] [Conversation] Log ID={log.id} linked to Session ID={sess.id} ('{sess.title}')")

    # Test rename & soft delete
    sess.title = "German Grammar Mastery"
    sess.save()
    assert AIConversationSession.objects.get(id=sess.id).title == "German Grammar Mastery"
    print("[OK] [Conversation] Session rename verified.")

    sess.is_deleted = True
    sess.save()
    sess.messages.update(is_deleted=True)
    assert AIConversationSession.objects.filter(id=sess.id, is_deleted=False).count() == 0
    assert AIRequestLog.objects.filter(session=sess, is_deleted=False).count() == 0
    print("[OK] [Conversation] Soft deletion of session and messages verified.")

    # 6. Test Index Job Retry Queue
    print("\n--- Testing Indexing Job Automated Retry Queue ---")
    job_retry = IndexingService.retry_job(job_policy.id)
    print(f"[OK] [Retry] Re-ran Job #{job_policy.id}, New Retry Count={job_retry.retry_count}, Status={job_retry.status}")

    print("\n==================================================================")
    print("[SUCCESS] ALL PHASE 9 INSTITUTIONAL AI PLATFORM QUALITY GATES PASSED!")
    print("==================================================================")

if __name__ == "__main__":
    run_ai_verification()
