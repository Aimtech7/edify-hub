import { apiClient } from "./api-client";
import { USE_FIXTURES, fixtureDelay } from "./service-utils";
import type { Allocation } from "@/types";

export interface CreateAllocationPayload {
  paymentId: string;
  studentId: string;
  allocations: Allocation[];
}

/**
 * allocationService — maps to Django REST endpoints:
 *   GET  /allocations/?student=:id  -> Allocation[]
 *   POST /allocations/              -> persist fee allocation breakdown
 */
export const allocationService = {
  async forStudent(studentId: string): Promise<Allocation[]> {
    if (USE_FIXTURES) {
      return fixtureDelay([
        { category: "Tuition", amount: 18000 },
        { category: "Examination", amount: 3000 },
        { category: "Library", amount: 1000 },
        { category: "Activity", amount: 3000 },
      ]);
    }
    const { data } = await apiClient.get<Allocation[]>("/allocations/", {
      params: { student: studentId },
    });
    return data;
  },

  async create(payload: CreateAllocationPayload): Promise<void> {
    if (USE_FIXTURES) return fixtureDelay(undefined, 600);
    await apiClient.post("/allocations/", payload);
  },
};
