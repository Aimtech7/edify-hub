from django.db.models import Q

def perform_global_search(query: str) -> dict:
    q = query.strip()
    if not q or len(q) < 2:
        return {"query": q, "total_results": 0, "results": {}}

    results = {
        "students": [],
        "payments": [],
        "receipts": [],
        "certificates": [],
        "lessons": [],
        "documents": [],
        "messages": []
    }

    try:
        from students.models import Student
        for s in Student.objects.filter(is_deleted=False).filter(
            Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(admission_number__icontains=q)
        )[:10]:
            results["students"].append({
                "id": s.id,
                "title": f"{s.admission_number} - {s.first_name} {s.last_name}",
                "detail": f"Level: {s.current_level.code if s.current_level else 'N/A'}",
                "url": f"/app/students?id={s.id}"
            })
    except Exception:
        pass

    try:
        from finance.models import Payment, Receipt
        for p in Payment.objects.filter(is_deleted=False).filter(
            Q(receipt_number__icontains=q) | Q(transaction_id__icontains=q) | Q(payer_name__icontains=q) | Q(phone_number__icontains=q)
        )[:10]:
            results["payments"].append({
                "id": p.id,
                "title": f"{p.receipt_number} (KES {p.amount})",
                "detail": f"Payer: {p.payer_name} | Method: {p.payment_method}",
                "url": f"/app/receipts?payment={p.id}"
            })
    except Exception:
        pass

    try:
        from certificates.models import Certificate
        for c in Certificate.objects.filter(is_deleted=False).filter(
            Q(certificate_number__icontains=q) | Q(student__admission_number__icontains=q)
        )[:5]:
            results["certificates"].append({
                "id": c.id,
                "title": f"Cert #{c.certificate_number}",
                "detail": f"Student: {c.student.admission_number}",
                "url": f"/verify/{c.certificate_number}"
            })
    except Exception:
        pass

    try:
        from odel.models import Lesson
        for l in Lesson.objects.filter(is_deleted=False).filter(Q(title__icontains=q))[:5]:
            results["lessons"].append({
                "id": l.id,
                "title": l.title,
                "detail": f"Module: {l.course.title if hasattr(l, 'course') and l.course else 'General'}",
                "url": f"/app/player?lesson={l.id}"
            })
    except Exception:
        pass

    tot = sum(len(v) for v in results.values())
    return {
        "query": q,
        "total_results": tot,
        "results": results
    }
