import { apiClient } from "./api-client";
import { USE_FIXTURES, fixtureDelay } from "./service-utils";
import {
  USERS,
  AUDIT_LOGS,
  FEE_STRUCTURE,
  ACADEMIC_YEARS,
  CLASSES,
  SUBJECTS,
} from "./fixtures";
import type { FeeStructure } from "@/types";

/**
 * adminService — maps to Django REST admin endpoints:
 *   GET    /admin/users/         -> users
 *   GET    /admin/audit-logs/    -> audit trail
 *   GET    /admin/fee-structure/ -> fee structures
 *   GET    /admin/academic-years/
 *   CRUD on classes, subjects, roles, settings
 */
export const adminService = {
  async users() {
    if (USE_FIXTURES) return fixtureDelay(USERS);
    const { data } = await apiClient.get("/admin/users/");
    return data;
  },

  async auditLogs() {
    if (USE_FIXTURES) return fixtureDelay(AUDIT_LOGS);
    const { data } = await apiClient.get("/admin/audit-logs/");
    return data;
  },

  async feeStructure(): Promise<FeeStructure[]> {
    if (USE_FIXTURES) return fixtureDelay(FEE_STRUCTURE);
    const { data } = await apiClient.get<FeeStructure[]>("/admin/fee-structure/");
    return data;
  },

  async academicYears() {
    if (USE_FIXTURES) return fixtureDelay(ACADEMIC_YEARS);
    const { data } = await apiClient.get("/admin/academic-years/");
    return data;
  },

  async classes(): Promise<string[]> {
    if (USE_FIXTURES) return fixtureDelay(CLASSES);
    const { data } = await apiClient.get<string[]>("/admin/classes/");
    return data;
  },

  async subjects(): Promise<string[]> {
    if (USE_FIXTURES) return fixtureDelay(SUBJECTS);
    const { data } = await apiClient.get<string[]>("/admin/subjects/");
    return data;
  },
};
