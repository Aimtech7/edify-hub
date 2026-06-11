import { apiClient } from "./api-client";
import { USE_FIXTURES, fixtureDelay } from "./service-utils";
import {
  STUDENT_RESULTS,
  TERM_PERFORMANCE,
  UPCOMING_EXAMS,
  SUBJECTS,
} from "./fixtures";
import type { SubjectResult, TermPerformance, UpcomingExam } from "@/types";

/**
 * resultService — maps to Django REST endpoints:
 *   GET  /results/?student=:id&term=:term  -> SubjectResult[]
 *   GET  /results/performance/?student=:id -> TermPerformance[]
 *   POST /results/marks/                   -> bulk marks entry
 */
export const resultService = {
  async forStudent(studentId?: string): Promise<SubjectResult[]> {
    if (USE_FIXTURES) return fixtureDelay(STUDENT_RESULTS);
    const { data } = await apiClient.get<SubjectResult[]>("/results/", {
      params: { student: studentId },
    });
    return data;
  },

  async performance(studentId?: string): Promise<TermPerformance[]> {
    if (USE_FIXTURES) return fixtureDelay(TERM_PERFORMANCE);
    const { data } = await apiClient.get<TermPerformance[]>("/results/performance/", {
      params: { student: studentId },
    });
    return data;
  },

  async upcomingExams(studentId?: string): Promise<UpcomingExam[]> {
    if (USE_FIXTURES) return fixtureDelay(UPCOMING_EXAMS);
    const { data } = await apiClient.get<UpcomingExam[]>("/exams/upcoming/", {
      params: { student: studentId },
    });
    return data;
  },

  async subjects(): Promise<string[]> {
    if (USE_FIXTURES) return fixtureDelay(SUBJECTS);
    const { data } = await apiClient.get<string[]>("/subjects/");
    return data;
  },

  async saveMarks(payload: {
    classroom: string;
    subject: string;
    marks: { studentId: string; score: number }[];
  }): Promise<void> {
    if (USE_FIXTURES) return fixtureDelay(undefined, 600);
    await apiClient.post("/results/marks/", payload);
  },
};
