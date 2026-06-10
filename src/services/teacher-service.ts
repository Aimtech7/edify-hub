import { apiClient } from "./api-client";
import { USE_FIXTURES, fixtureDelay } from "./service-utils";
import { TEACHER_CLASSES, ATTENDANCE_RECENT } from "./fixtures";

/**
 * teacherService — maps to Django REST endpoints:
 *   GET  /teacher/classes/      -> assigned classes
 *   GET  /teacher/attendance/   -> attendance summary
 *   POST /teacher/attendance/   -> record attendance
 */
export const teacherService = {
  async assignedClasses() {
    if (USE_FIXTURES) return fixtureDelay(TEACHER_CLASSES);
    const { data } = await apiClient.get("/teacher/classes/");
    return data;
  },

  async attendanceSummary(classroom?: string) {
    if (USE_FIXTURES) {
      const data = classroom
        ? ATTENDANCE_RECENT.filter((a) => a.classroom === classroom)
        : ATTENDANCE_RECENT;
      return fixtureDelay(data);
    }
    const { data } = await apiClient.get("/teacher/attendance/", {
      params: { classroom },
    });
    return data;
  },

  async recordAttendance(payload: {
    classroom: string;
    date: string;
    records: { studentId: string; present: boolean }[];
  }): Promise<void> {
    if (USE_FIXTURES) return fixtureDelay(undefined, 600);
    await apiClient.post("/teacher/attendance/", payload);
  },
};
