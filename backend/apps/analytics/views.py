from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .services.command_center import get_executive_overview
from .services.finance_bi import get_finance_bi_data
from .services.academic_bi import get_academic_bi_data
from .services.admissions_bi import get_admissions_bi_data
from .services.odel_bi import get_odel_bi_data, get_communication_bi_data
from .services.ai_executor import execute_ai_query
from .services.report_center import generate_filtered_report
from .services.search_engine import perform_global_search

class ExecutiveOverviewView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response(get_executive_overview())

class FinanceBIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response(get_finance_bi_data())

class AcademicBIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response(get_academic_bi_data())

class AdmissionsBIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response(get_admissions_bi_data())

class OdelBIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response(get_odel_bi_data())

class CommunicationBIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response(get_communication_bi_data())

class AIExecutorView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        prompt = request.data.get("prompt") or request.data.get("question", "")
        return Response(execute_ai_query(prompt))

class ReportCenterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        report_type = request.data.get("report_type", "FINANCE")
        filters = request.data.get("filters", {})
        return Response(generate_filtered_report(report_type, filters))

class GlobalSearchView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        q = request.query_params.get("q", "")
        return Response(perform_global_search(q))
