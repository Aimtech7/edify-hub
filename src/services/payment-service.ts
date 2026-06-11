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
  unallocated?: boolean | string;
}

export interface CreatePaymentPayload {
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes?: string;
  payerName?: string;
  phoneNumber?: string;
  nationalId?: string;
}

function mapBackendPaymentToFrontend(bp: any): Payment {
  return {
    id: String(bp.id),
    date: bp.payment_date,
    studentId: String(bp.student),
    studentName: bp.student_name,
    admissionNo: bp.admission_no,
    payer: bp.payer_name || "—",
    amount: typeof bp.amount === "string" ? parseFloat(bp.amount) : bp.amount,
    method: bp.payment_method,
    reference: bp.mpesa_reference || bp.cheque_number || bp.transaction_id || "",
    notes: bp.notes || "",
    allocated: bp.status === "ALLOCATED",
  };
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
      if (params.unallocated !== undefined) {
        const unallocatedOnly = typeof params.unallocated === "string" 
          ? params.unallocated === "true" 
          : !!params.unallocated;
        data = data.filter((p) => p.allocated !== unallocatedOnly);
      }
      return fixtureDelay(data);
    }

    const apiParams: Record<string, string> = {};
    if (params.admissionNo) apiParams.admission_no = params.admissionNo;
    if (params.studentName) apiParams.student_name = params.studentName;
    if (params.parentName) apiParams.payer_name = params.parentName;
    if (params.phone) apiParams.phone = params.phone;
    if (params.receiptNo) apiParams.receipt_no = params.receiptNo;
    if (params.mpesaRef) apiParams.mpesa_ref = params.mpesaRef;
    if (params.chequeNo) apiParams.cheque_no = params.chequeNo;
    if (params.dateFrom) apiParams.start_date = params.dateFrom;
    if (params.dateTo) apiParams.end_date = params.dateTo;
    if (params.unallocated !== undefined) {
      apiParams.unallocated = String(params.unallocated);
    }

    const { data } = await apiClient.get<any[]>("/payments/", { params: apiParams });
    return data.map(mapBackendPaymentToFrontend);
  },

  async list(): Promise<Payment[]> {
    if (USE_FIXTURES) return fixtureDelay(PAYMENTS);
    const { data } = await apiClient.get<any[]>("/payments/");
    return data.map(mapBackendPaymentToFrontend);
  },

  async create(payload: CreatePaymentPayload): Promise<Payment> {
    if (USE_FIXTURES) {
      const created: Payment = {
        id: `p-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        studentId: payload.studentId,
        studentName: "New Payment",
        admissionNo: payload.studentId,
        payer: payload.payerName || "—",
        amount: payload.amount,
        method: payload.method,
        reference: payload.reference,
        notes: payload.notes,
        allocated: false,
      };
      return fixtureDelay(created, 600);
    }

    const backendPayload: any = {
      student: parseInt(payload.studentId, 10),
      amount: payload.amount,
      payment_method: payload.method,
      payer_name: payload.payerName || "—",
      phone_number: payload.phoneNumber || "—",
      national_id: payload.nationalId || "",
      notes: payload.notes || "",
    };

    if (payload.method === "M-Pesa") {
      backendPayload.mpesa_reference = payload.reference;
    } else if (payload.method === "Cheque") {
      backendPayload.cheque_number = payload.reference;
    } else {
      backendPayload.transaction_id = payload.reference;
    }

    const { data } = await apiClient.post<any>("/payments/", backendPayload);
    return mapBackendPaymentToFrontend(data);
  },

  async revenueTrend() {
    if (USE_FIXTURES) return fixtureDelay(REVENUE_TREND);
    const { data } = await apiClient.get("/payments/revenue/");
    return data;
  },

  async getReport(type: "daily_collections" | "outstanding_balances" | "fully_paid" | "unallocated_payments"): Promise<any> {
    if (USE_FIXTURES) {
      if (type === "daily_collections") {
        return fixtureDelay({
          date: new Date().toISOString().slice(0, 10),
          total_collections: 88000,
          methods: [
            { payment_method: "M-Pesa", total: 38000 },
            { payment_method: "Bank Transfer", total: 30000 },
            { payment_method: "Cash", total: 10000 },
            { payment_method: "Cheque", total: 20000 }
          ]
        });
      }
      if (type === "outstanding_balances") {
        return fixtureDelay([
          { student_id: 1, name: "Amani Wanjiru", admission_no: "DA-2024-1042", level: "B2", total_fees: 50000, total_paid: 37000, balance: 13000 },
          { student_id: 3, name: "Cynthia Njoki", admission_no: "DA-2024-1044", level: "A2", total_fees: 38000, total_paid: 18000, balance: 20000 }
        ]);
      }
      if (type === "fully_paid") {
        return fixtureDelay([
          { student_id: 2, name: "Brian Otieno", admission_no: "DA-2024-1043", total_fees: 50000, total_paid: 50000 }
        ]);
      }
      return fixtureDelay([]);
    }
    const { data } = await apiClient.get("/reports/", { params: { type } });
    return data;
  }
};


