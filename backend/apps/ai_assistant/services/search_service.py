import re
import math
from django.db.models import Q
from ai_assistant.models import KnowledgeDocument
from ai_assistant.services.indexing_service import IndexingService

class AISearchService:
    @classmethod
    def semantic_search(cls, query: str, category: str = "", limit: int = 10) -> list[dict]:
        """Perform semantic vector similarity + keyword relevance search across indexed knowledge."""
        if not query or not query.strip():
            return []

        q_clean = query.strip().lower()
        q_words = set(re.findall(r'\b\w{3,}\b', q_clean))
        q_vector = IndexingService.generate_embedding_vector(query)

        qs = KnowledgeDocument.objects.filter(is_active=True, indexing_status="INDEXED")
        if category and category != "ALL":
            qs = qs.filter(category=category)

        matches = []
        for doc in qs:
            doc_text = f"{doc.title} {doc.content}".lower()
            doc_words = set(re.findall(r'\b\w{3,}\b', doc_text))
            word_overlap = len(q_words.intersection(doc_words))
            
            # Cosine similarity on embedding vectors
            cosine_sim = 0.0
            if doc.embedding_vector and isinstance(doc.embedding_vector, list) and len(doc.embedding_vector) == len(q_vector):
                dot = sum(a * b for a, b in zip(q_vector, doc.embedding_vector))
                cosine_sim = dot

            # Combined ranking score (word overlap + cosine similarity * 10)
            score = word_overlap + (cosine_sim * 10.0)
            
            # If query term matches exact title or content substring
            if q_clean in doc.title.lower():
                score += 15.0
            elif any(w in doc_text for w in q_words):
                score += 3.0

            if score > 0.5 or word_overlap > 0:
                snippet = doc.content[:350] + ("..." if len(doc.content) > 350 else "")
                matches.append({
                    "id": doc.id,
                    "title": doc.title,
                    "category": doc.category,
                    "snippet": snippet,
                    "score": round(score, 2),
                    "updated_at": doc.updated_at.strftime("%Y-%m-%d %H:%M")
                })

        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches[:limit]
