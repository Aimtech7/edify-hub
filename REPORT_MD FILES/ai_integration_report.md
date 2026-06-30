# HORIZON AI RAG INTEGRATION REPORT

## 7-Tier Retrieval Hierarchy
The RAG engine (`apps/ai_assistant/retrieval.py`) queries institutional knowledge in strict prioritization order:
1. **Live ERP Database**: Real-time student fee balances, attendance records, exam results.
2. **Lesson Resources**: CEFR A1–C2 grammar guides, vocabulary lists, pronunciation audio.
3. **Knowledge Base**: Handbooks, Ausbildung guides, FAQs.
4. **Institutional Policies**: Refund rules, code of conduct.
5. **Blog & News Articles**: Public institutional updates.
6. **Announcements**: Broadcast messages and campus alerts.
7. **General AI Knowledge Base**: Fallback language tutoring rules and German language pedagogy.
