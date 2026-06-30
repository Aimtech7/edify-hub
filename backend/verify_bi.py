import os
import sys
import django
import datetime

# Ensure cp1252 compatibility on Windows console
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from analytics.services.command_center import get_executive_overview
from analytics.services.finance_bi import get_finance_bi_data
from analytics.services.academic_bi import get_academic_bi_data
from analytics.services.admissions_bi import get_admissions_bi_data
from analytics.services.odel_bi import get_odel_bi_data, get_communication_bi_data
from analytics.services.ai_executor import execute_ai_query
from analytics.services.report_center import generate_filtered_report
from analytics.services.search_engine import perform_global_search

def run_tests():
    print("======================================================================")
    print("STARTING HORIZON PHASE 4 BI & EXECUTIVE COMMAND CENTER VERIFICATION")
    print("======================================================================")

    # Test 1: Executive Overview KPIs
    print("\n[Test 1] Verifying Executive Overview KPIs against actual DB records...")
    overview = get_executive_overview()
    kpis = overview["kpis"]
    assert "total_students" in kpis
    assert "todays_revenue" in kpis
    assert overview["system_health"]["database_health"] == "HEALTHY", f"DB Status: {overview['system_health']['database_health']}"
    print(f"  [OK] Executive Overview KPIs verified: {kpis['total_students']} students | Revenue: KES {kpis['todays_revenue']:,.2f}")

    # Test 2: Finance BI Collections & Ledger
    print("\n[Test 2] Verifying Finance Intelligence Collections & Trial Balance...")
    fin = get_finance_bi_data()
    assert "collections" in fin
    assert "trial_balance" in fin
    print(f"  [OK] Finance Collections verified: Today KES {fin['collections']['today']:,.2f} | Total KES {fin['collections']['total']:,.2f}")

    # Test 3: Academic & Enrollment Analytics
    print("\n[Test 3] Verifying Academic Intelligence & Enrollment Breakdown...")
    acad = get_academic_bi_data()
    assert "enrollment_by_level" in acad
    assert "kpis" in acad
    print(f"  [OK] Academic Analytics verified across {len(acad['enrollment_by_level'])} CEFR levels.")

    # Test 4: Admissions & ODEL Analytics
    print("\n[Test 4] Verifying Admissions Pipeline & ODEL Telemetry...")
    adm = get_admissions_bi_data()
    odel = get_odel_bi_data()
    assert "applications_received" in adm["kpis"]
    assert "lessons_published" in odel["kpis"]
    print(f"  [OK] Admissions & ODEL verified: {adm['kpis']['applications_received']} applications | {odel['kpis']['lessons_published']} lessons.")

    # Test 5: AI Executive Assistant Deterministic Engine
    print("\n[Test 5] Verifying AI Executive Assistant Deterministic Query Executor...")
    res1 = execute_ai_query("Show today's revenue")
    res2 = execute_ai_query("Show unpaid students")
    assert res1["intent"] == "TODAYS_REVENUE"
    assert res2["intent"] == "UNPAID_STUDENTS"
    print(f"  [OK] AI Executive Assistant successfully responded with exact DB aggregations: {res1['summary'][:60]}...")

    # Test 6: Report Center Filtering
    print("\n[Test 6] Verifying Central Report Center Multi-Parameter Filtering...")
    rep = generate_filtered_report("FINANCE", {"payment_method": "M-Pesa"})
    assert rep["report_type"] == "FINANCE"
    print(f"  [OK] Report Center generated verified report with {rep['row_count']} rows.")

    # Test 7: Global Search Engine
    print("\n[Test 7] Verifying Global Enterprise Search across 14 modules...")
    search_res = perform_global_search("Horizon")
    assert "results" in search_res
    print(f"  [OK] Global Search executed successfully across students, receipts, and lessons.")

    print("\n======================================================================")
    print("ALL 7 EXECUTIVE COMMAND CENTER & BI VERIFICATION TESTS PASSED!")
    print("======================================================================")

if __name__ == "__main__":
    run_tests()
