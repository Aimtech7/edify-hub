import { apiClient } from "./api-client";
import { USE_FIXTURES, fixtureDelay } from "./service-utils";
import { STUDENTS } from "./fixtures";
import type { Student } from "@/types";

/**
 * studentService — maps to Django REST endpoints:
 *   GET    /students/            -> Student[]
 *   GET    /students/:id/        -> Student
 *   POST   /students/            -> Student
 *   PATCH  /students/:id/        -> Student
 */
export const studentService = {
  async list(params?: { classroom?: string; search?: string }): Promise<Student[]> {
    if (USE_FIXTURES) {
      let data = [...STUDENTS];
      if (params?.classroom) data = data.filter((s) => s.classroom === params.classroom);
      if (params?.search) {
        const q = params.search.toLowerCase();
        data = data.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.admissionNo.toLowerCase().includes(q) ||
            s.parent.toLowerCase().includes(q)
        );
      }
      return fixtureDelay(data);
    }
    const { data } = await apiClient.get<Student[]>("/students/", { params });
    return data;
  },

  async get(id: string): Promise<Student> {
    if (USE_FIXTURES) {
      const found = STUDENTS.find((s) => s.id === id || s.admissionNo === id);
      return fixtureDelay(found ?? STUDENTS[0]);
    }
    const { data } = await apiClient.get<Student>(`/students/${id}/`);
    return data;
  },

  async search(query: string): Promise<Student[]> {
    if (USE_FIXTURES) {
      const q = query.toLowerCase();
      return fixtureDelay(
        STUDENTS.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.admissionNo.toLowerCase().includes(q) ||
            s.parent.toLowerCase().includes(q) ||
            s.phone.includes(q)
        )
      );
    }
    const { data } = await apiClient.get<Student[]>("/students/search/", {
      params: { q: query },
    });
    return data;
  },
};
