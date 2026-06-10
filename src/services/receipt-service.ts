import { apiClient } from "./api-client";
import { USE_FIXTURES, fixtureDelay } from "./service-utils";
import { RECEIPTS } from "./fixtures";
import type { Receipt } from "@/types";

/**
 * receiptService — maps to Django REST endpoints:
 *   GET  /receipts/             -> Receipt[]
 *   GET  /receipts/:id/         -> Receipt
 *   POST /receipts/:id/reprint/ -> log a reprint
 */
export const receiptService = {
  async list(params?: { studentId?: string; search?: string }): Promise<Receipt[]> {
    if (USE_FIXTURES) {
      let data = [...RECEIPTS];
      if (params?.studentId)
        data = data.filter((r) => r.studentId === params.studentId);
      if (params?.search) {
        const q = params.search.toLowerCase();
        data = data.filter(
          (r) =>
            r.receiptNo.toLowerCase().includes(q) ||
            r.studentName.toLowerCase().includes(q) ||
            r.admissionNo.toLowerCase().includes(q)
        );
      }
      return fixtureDelay(data);
    }
    const { data } = await apiClient.get<Receipt[]>("/receipts/", { params });
    return data;
  },

  async get(id: string): Promise<Receipt> {
    if (USE_FIXTURES) {
      const found = RECEIPTS.find((r) => r.id === id || r.receiptNo === id);
      return fixtureDelay(found ?? RECEIPTS[0]);
    }
    const { data } = await apiClient.get<Receipt>(`/receipts/${id}/`);
    return data;
  },

  async reprint(id: string): Promise<void> {
    if (USE_FIXTURES) return fixtureDelay(undefined, 400);
    await apiClient.post(`/receipts/${id}/reprint/`);
  },
};
