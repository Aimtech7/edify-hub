import { apiClient } from "./api-client";
import { USE_FIXTURES, fixtureDelay } from "./service-utils";
import { PAYMENTS, REVENUE_TREND } from "./fixtures";
import type { Payment, PaymentMethod } from "@/types";

export interface PaymentSearchParams {
  admissionNo?: string;
  studentName?: string;
  parentName?: string;
  phone?: string;
  receiptNo?: string;
  mpesaRef?: string;
  chequeNo?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreatePaymentPayload {
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes?: string;
}

/**
 * paymentService — maps to Django REST endpoints:
 *   GET  /payments/             -> Payment[] (supports rich query params)
 *   POST /payments/             -> Payment
 *   GET  /payments/revenue/     -> revenue trend
 */
export const paymentService = {
  async search(params: PaymentSearchParams): Promise<Payment[]> {
    if (USE_FIXTURES) {
      let data = [...PAYMENTS];
      const q = (v?: string) => (v ?? "").toLowerCase().trim();
      if (params.admissionNo)
        data = data.filter((p) => q(p.admissionNo).includes(q(params.admissionNo)));
      if (params.studentName)
        data = data.filter((p) => q(p.studentName).includes(q(params.studentName)));
      if (params.parentName)
        data = data.filter((p) => q(p.payer).includes(q(params.parentName)));
      if (params.mpesaRef)
        data = data.filter((p) => q(p.reference).includes(q(params.mpesaRef)));
      if (params.dateFrom) data = data.filter((p) => p.date >= params.dateFrom!);
      if (params.dateTo) data = data.filter((p) => p.date <= params.dateTo!);
      return fixtureDelay(data);
    }
    const { data } = await apiClient.get<Payment[]>("/payments/", { params });
    return data;
  },

  async list(): Promise<Payment[]> {
    if (USE_FIXTURES) return fixtureDelay(PAYMENTS);
    const { data } = await apiClient.get<Payment[]>("/payments/");
    return data;
  },

  async create(payload: CreatePaymentPayload): Promise<Payment> {
    if (USE_FIXTURES) {
      const created: Payment = {
        id: `p-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        studentId: payload.studentId,
        studentName: "New Payment",
        admissionNo: payload.studentId,
        payer: "—",
        amount: payload.amount,
        method: payload.method,
        reference: payload.reference,
        notes: payload.notes,
        allocated: false,
      };
      return fixtureDelay(created, 600);
    }
    const { data } = await apiClient.post<Payment>("/payments/", payload);
    return data;
  },

  async revenueTrend() {
    if (USE_FIXTURES) return fixtureDelay(REVENUE_TREND);
    const { data } = await apiClient.get("/payments/revenue/");
    return data;
  },
};
