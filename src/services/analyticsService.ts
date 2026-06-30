import { apiClient } from "./api-client";

export interface CommandCenterData {
  kpis: {
    total_students: number;
    active_students: number;
    applicants: number;
    admissions_today: number;
    today_attendance_pct: number;
    teacher_attendance_pct: number;
    courses_running: number;
    classes_running: number;
    todays_revenue: number;
    outstanding_fees: number;
    receipts_issued_today: number;
    payments_awaiting_allocation: number;
    certificates_generated: number;
    exams_scheduled: number;
    assignments_due: number;
    support_tickets: number;
    communication_activity: number;
    storage_usage_mb: number;
    ai_usage_queries: number;
    active_workflows: number;
    background_jobs: number;
  };
  system_health: {
    server_health: string;
    database_health: string;
    cpu_usage: number;
    memory_usage: number;
    api_status: string;
    supabase_storage: string;
  };
  timestamp: string;
}

export interface FinanceBIData {
  collections: {
    today: number;
    weekly: number;
    monthly: number;
    total: number;
  };
  payment_methods: Record<string, number>;
  kpis: {
    pending_allocations: number;
    outstanding_balances: number;
    receipts_issued: number;
    invoices_generated: number;
    refunds: number;
    discounts: number;
    scholarships: number;
  };
  revenue_by_level: Array<{ level: string; revenue: number }>;
  revenue_by_course: Array<{ course: string; revenue: number }>;
  trial_balance: {
    debits: Record<string, number>;
    credits: Record<string, number>;
  };
  audit_trail: Array<{
    id: number;
    student: string;
    type: string;
    amount: number;
    date: string;
    description: string;
  }>;
}

export interface AcademicBIData {
  enrollment_by_level: Array<{ level: string; count: number }>;
  enrollment_by_intake: Array<{ intake: string; count: number }>;
  enrollment_by_campus: Array<{ campus: string; count: number }>;
  teacher_workload: Array<{ name: string; classes_assigned: number; students_taught: number }>;
  class_sizes: Array<{ class_name: string; students: number }>;
  kpis: {
    attendance_rate: number;
    course_completion: number;
    exam_pass_rate: number;
  };
}

export interface AdmissionsBIData {
  kpis: {
    applications_received: number;
    applications_pending: number;
    applications_approved: number;
    applications_rejected: number;
  };
  admissions_by_intake: Array<{ intake: string; count: number }>;
  admissions_by_country: Array<{ country: string; count: number }>;
  admissions_by_gender: Array<{ gender: string; count: number }>;
}

export interface OdelBIData {
  kpis: {
    lessons_published: number;
    lessons_viewed: number;
    assignments_submitted: number;
    discussion_activity: number;
    resource_downloads: number;
    video_views: number;
    online_students: number;
    virtual_classes: number;
    learning_progress_pct: number;
  };
}

export interface CommunicationBIData {
  kpis: {
    messages_today: number;
    announcements: number;
    group_activity: number;
    unread_messages: number;
    ai_conversations: number;
  };
  most_active_classes: Array<{ class: string; messages: number }>;
  most_active_teachers: Array<{ teacher: string; announcements: number }>;
}

export interface ReportResult {
  report_type: string;
  generated_at: string;
  filters_applied: Record<string, any>;
  summary: Record<string, any>;
  row_count: number;
  data: Array<Record<string, any>>;
}

export interface SearchResult {
  query: string;
  total_results: number;
  results: Record<string, Array<{ id: number; title: string; detail: string; url: string }>>;
}

export const analyticsService = {
  getCommandCenterOverview: async (): Promise<CommandCenterData> => {
    const { data } = await apiClient.get("/analytics/command-center/");
    return data;
  },
  getFinanceBI: async (): Promise<FinanceBIData> => {
    const { data } = await apiClient.get("/analytics/finance/");
    return data;
  },
  getAcademicBI: async (): Promise<AcademicBIData> => {
    const { data } = await apiClient.get("/analytics/academic/");
    return data;
  },
  getAdmissionsBI: async (): Promise<AdmissionsBIData> => {
    const { data } = await apiClient.get("/analytics/admissions/");
    return data;
  },
  getOdelBI: async (): Promise<OdelBIData> => {
    const { data } = await apiClient.get("/analytics/odel/");
    return data;
  },
  getCommunicationBI: async (): Promise<CommunicationBIData> => {
    const { data } = await apiClient.get("/analytics/communication/");
    return data;
  },
  askAIAssistant: async (prompt: string): Promise<any> => {
    const { data } = await apiClient.post("/analytics/ai-assistant/", { prompt });
    return data;
  },
  generateReport: async (reportType: string, filters: Record<string, any> = {}): Promise<ReportResult> => {
    const { data } = await apiClient.post("/analytics/reports/", { report_type: reportType, filters });
    return data;
  },
  globalSearch: async (q: string): Promise<SearchResult> => {
    const { data } = await apiClient.get(`/analytics/search/?q=${encodeURIComponent(q)}`);
    return data;
  },
};
