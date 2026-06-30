import datetime
from django.db.models import Sum, Count, Q

def get_finance_bi_data():
    today = datetime.date.today()
    start_of_week = today - datetime.timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)

    todays_col = 0.00
    weekly_col = 0.00
    monthly_col = 0.00
    total_col = 0.00

    method_breakdown = {
        "Cash": 0.00,
        "M-Pesa": 0.00,
        "Bank Transfer": 0.00,
        "Cheque": 0.00
    }

    pending_alloc = 0
    receipts_count = 0
    invoices_count = 0
    refunds_sum = 0.00
    discounts_sum = 0.00
    scholarships_sum = 0.00

    recent_audit_trail = []
    level_revenue = []
    course_revenue = []

    try:
        from finance.models import Payment, Receipt, StudentLedger, Allocation
        # 1. Collections
        valid_payments = Payment.objects.filter(is_deleted=False).exclude(status='CANCELLED')
        total_col = float(valid_payments.aggregate(s=Sum('amount'))['s'] or 0.00)
        todays_col = float(valid_payments.filter(payment_date=today).aggregate(s=Sum('amount'))['s'] or 0.00)
        weekly_col = float(valid_payments.filter(payment_date__gte=start_of_week).aggregate(s=Sum('amount'))['s'] or 0.00)
        monthly_col = float(valid_payments.filter(payment_date__gte=start_of_month).aggregate(s=Sum('amount'))['s'] or 0.00)

        # 2. Method Breakdown
        for row in valid_payments.values('payment_method').annotate(total=Sum('amount')):
            m = row['payment_method'] or "M-Pesa"
            if m in method_breakdown:
                method_breakdown[m] = float(row['total'] or 0.00)
            else:
                method_breakdown["M-Pesa"] += float(row['total'] or 0.00)

        pending_alloc = valid_payments.filter(status='PENDING_ALLOCATION').count()
        receipts_count = Receipt.objects.filter(is_deleted=False, status='FINAL').count()

        # 3. Ledger Summaries (Refunds, Discounts, Fee Charges)
        ledgers = StudentLedger.objects.filter(is_deleted=False)
        refunds_sum = float(ledgers.filter(transaction_type='Refund').aggregate(s=Sum('amount'))['s'] or 0.00)
        discounts_sum = float(ledgers.filter(transaction_type='Adjustment').aggregate(s=Sum('amount'))['s'] or 0.00)
        invoices_count = ledgers.filter(transaction_type='Fee Charge').count()

        # 4. Audit Trail
        for l in ledgers.select_related('student').order_by('-transaction_date')[:10]:
            recent_audit_trail.append({
                "id": l.id,
                "student": l.student.admission_number if l.student else "System",
                "type": l.transaction_type,
                "amount": float(l.amount),
                "date": l.transaction_date.strftime("%Y-%m-%d %H:%M"),
                "description": l.description
            })

    except Exception as e:
        pass

    # Outstanding Balances
    outstanding_balances = 0.00
    try:
        from students.models import Student
        for s in Student.objects.filter(is_deleted=False):
            if hasattr(s, 'outstanding_balance'):
                val = float(s.outstanding_balance)
                if val > 0:
                    outstanding_balances += val
    except Exception:
        pass

    # Revenue by CEFR Level
    try:
        from students.models import Student
        from finance.models import Payment
        level_map = {}
        for p in Payment.objects.filter(is_deleted=False).select_related('student__current_level').exclude(status='CANCELLED'):
            lvl = p.student.current_level.code if (p.student and p.student.current_level) else "General"
            level_map[lvl] = level_map.get(lvl, 0.0) + float(p.amount)
        for k, v in level_map.items():
            level_revenue.append({"level": k, "revenue": round(v, 2)})
    except Exception:
        pass

    # Trial Balance Summary — only verified ledger figures, no estimates
    trial_balance = {
        "debits": {
            "cash_and_bank": round(total_col - refunds_sum, 2),
            "accounts_receivable": round(outstanding_balances, 2),
        },
        "credits": {
            "tuition_revenue": round(total_col, 2),
            "refunds_issued": round(refunds_sum, 2),
            "discounts_applied": round(discounts_sum, 2),
        }
    }

    return {
        "collections": {
            "today": todays_col,
            "weekly": weekly_col,
            "monthly": monthly_col,
            "total": total_col
        },
        "payment_methods": method_breakdown,
        "kpis": {
            "pending_allocations": pending_alloc,
            "outstanding_balances": round(outstanding_balances, 2),
            "receipts_issued": receipts_count,
            "invoices_generated": invoices_count,
            "refunds": refunds_sum,
            "discounts": discounts_sum,
            "scholarships": scholarships_sum
        },
        "revenue_by_level": level_revenue,
        "revenue_by_course": course_revenue,
        "trial_balance": trial_balance,
        "audit_trail": recent_audit_trail
    }
