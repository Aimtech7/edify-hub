import { apiClient as api } from "@/services/api-client";

export interface GermanLevel {
  id: number;
  code: string;
  name: string;
  description: string;
  duration_weeks: number;
  cefr_category: string;
  parent_level?: string | null;
}

export interface VirtualClassSession {
  id: number;
  cohort: string;
  platform: "Zoom" | "BBB" | "Google Meet" | "Teams";
  meeting_id: string;
  passcode: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  waiting_room: boolean;
  join_link: string;
  host_link?: string | null;
  recording_url?: string | null;
}

export interface AICoachResponse {
  intent: string;
  topic?: string;
  word?: string;
  original?: string;
  exam_type?: string;
  response: string;
  level: string;
}

export interface AcademicTranscript {
  transcript_id: string;
  generated_at: string;
  student_info: {
    admission_number: string;
    full_name: string;
    current_level: string;
    study_mode: string;
  };
  academic_metrics: {
    overall_lesson_progress_pct: number;
    completed_lessons: number;
    total_tracked_lessons: number;
    attendance_percentage: number;
    fee_clearance_status: string;
    outstanding_balance: number;
  };
  examination_history: Array<{
    exam_code: string;
    title: string;
    level: string;
    exam_type: string;
    marks_obtained?: number | null;
    maximum_marks: number;
    grade: string;
    submitted_at: string;
  }>;
  verification_status: string;
}

export const germanOdelService = {
  async getLevels(): Promise<GermanLevel[]> {
    const res = await api.get("/odel/german/levels/");
    return res.data.levels;
  },

  async getVirtualClasses(): Promise<VirtualClassSession[]> {
    const res = await api.get("/odel/german/virtual-classes/");
    return res.data.virtual_classes;
  },

  async scheduleVirtualClass(data: {
    cohort_id?: number;
    platform: "Zoom" | "BBB";
    date: string;
    start_time: string;
    end_time: string;
  }) {
    const res = await api.post("/odel/german/virtual-classes/", data);
    return res.data;
  },

  async recordAttendance(virtual_class_id: number, connection_interruptions = 0) {
    const res = await api.post("/odel/german/attendance/", {
      virtual_class_id,
      connection_interruptions,
    });
    return res.data;
  },

  async askAICoach(data: {
    intent?: string;
    prompt: string;
    level?: string;
    context?: string;
  }): Promise<AICoachResponse> {
    const res = await api.post("/odel/german/ai-coach/", data);
    return res.data;
  },

  async getTranscript(student_id?: number): Promise<AcademicTranscript> {
    const url = student_id ? `/odel/german/transcript/?student_id=${student_id}` : "/odel/german/transcript/";
    const res = await api.get(url);
    return res.data;
  },

  async issueCertificate(student_id: number, level_id: number) {
    const res = await api.post("/odel/german/issue-certificate/", { student_id, level_id });
    return res.data;
  },
};
