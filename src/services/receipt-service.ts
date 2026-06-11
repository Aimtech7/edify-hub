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
function mapBackendReceiptToFrontend(br: any): Receipt {
  return {
    id: String(br.id),
    receiptNo: br.receipt_number,
    date: br.issue_date,
    studentId: String(br.payment),
    studentName: br.student_name || "—",
    admissionNo: br.admission_no || "—",
    payer: br.payer_name || "—",
    amount: typeof br.amount === "string" ? parseFloat(br.amount) : (br.amount || 0),
    method: br.payment_method || "—",
    reference: br.reference || "",
    allocations: (br.allocations || []).map((a: any) => ({
      category: Object.keys(CATEGORY_MAP_REV).find(k => CATEGORY_MAP_REV[k] === a.category) || a.category,
      amount: typeof a.amount === "string" ? parseFloat(a.amount) : a.amount
    })),
  };
}

const CATEGORY_MAP_REV: Record<string, string> = {
  "Course Fee": "Tuition",
  "Exam Registration": "Examination",
  "Study Materials": "Library",
  "Certificate Fee": "Registration",
  "Lab/Tech Fee": "Activity",
};

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
    
    // For backend, map frontend search params if needed
    const apiParams: Record<string, string> = {};
    if (params?.studentId) apiParams.student = params.studentId;
    if (params?.search) apiParams.search = params.search;

    const { data } = await apiClient.get<any[]>("/receipts/", { params: apiParams });
    return data.map(mapBackendReceiptToFrontend);
  },

  async get(id: string): Promise<Receipt> {
    if (USE_FIXTURES) {
      const found = RECEIPTS.find((r) => r.id === id || r.receiptNo === id);
      return fixtureDelay(found ?? RECEIPTS[0]);
    }
    const { data } = await apiClient.get<any>(`/receipts/${id}/`);
    return mapBackendReceiptToFrontend(data);
  },

  async reprint(id: string): Promise<void> {
    if (USE_FIXTURES) return fixtureDelay(undefined, 400);
    await apiClient.post(`/receipts/${id}/reprint/`);
  },
};

