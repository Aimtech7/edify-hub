import { apiClient } from "./api-client";
import { USE_FIXTURES, fixtureDelay } from "./service-utils";
import { STUDENTS } from "./fixtures";

export interface CertificateData {
  id?: number;
  certificateNo: string;
  uuid?: string;
  studentName: string;
  admissionNo: string;
  level: string;
  certificateType?: string;
  completedDate: string;
  finalScore: number;
  status?: string;
  statusLabel?: string;
  revocationReason?: string;
  reissueReason?: string;
  pdfUrl?: string;
}

export interface CertificateTemplateData {
  id: number;
  title: string;
  certificate_type: string;
  is_active: boolean;
  header_text: string;
  subtitle_text?: string;
  body_template: string;
  footer_text: string;
  signature_name: string;
  signature_title: string;
  background_style: string;
}

export interface EligibilityCheckResult {
  eligible: boolean;
  reasons: string[];
  final_score: number;
  attendance_pct: number;
  finance_cleared: boolean;
  student_id: number;
  student_name: string;
  admission_number: string;
  level_code: string;
  level_name: string;
}

export const certificateService = {
  async list(studentId?: string): Promise<CertificateData[]> {
    if (USE_FIXTURES) {
      const list = studentId 
        ? STUDENTS.filter((s) => s.id === studentId || s.admissionNo === studentId)
        : STUDENTS;
      const certs = list.flatMap((s) => 
        s.progressionHistory
          .filter((ev) => ev.status === "completed")
          .map((ev, i) => ({
            id: 100 + i,
            certificateNo: ev.certificateNo 
              ? ev.certificateNo.replace("CERT-", "HZD-") 
              : `HZD-${ev.level}-${ev.completedDate?.split("-")[0] || "2025"}-000${s.admissionNo.split("-")[2] || "042"}`,
            uuid: "8f7e6d5c-4b3a-2109-8765-43210fedcba9",
            studentName: s.name,
            admissionNo: s.admissionNo,
            level: ev.level,
            certificateType: "CEFR_LEVEL",
            completedDate: ev.completedDate || "2025-06-15",
            finalScore: ev.finalScore || 88,
            status: "ACTIVE",
            statusLabel: "VERIFIED / VALID",
          }))
      );
      return fixtureDelay(certs);
    }
    const { data } = await apiClient.get<any>("/certificates/", { 
      params: { student: studentId } 
    });
    const results = Array.isArray(data) ? data : data.results || [];
    return results.map((item: any) => ({
      id: item.id,
      certificateNo: item.certificate_number,
      uuid: item.verification_code,
      studentName: item.student_name,
      admissionNo: item.admission_no,
      level: item.level_code,
      certificateType: item.certificate_type || "CEFR_LEVEL",
      completedDate: item.issue_date,
      finalScore: item.metadata?.final_score || 0,
      status: item.status || "ACTIVE",
      statusLabel: item.status === "REVOKED" ? "REVOKED / INVALID" : "VERIFIED / VALID",
      revocationReason: item.revocation_reason,
      reissueReason: item.reissue_reason,
      pdfUrl: item.pdf_url,
    }));
  },

  async checkEligibility(studentId: number, levelId: number, certType: string = "CEFR_LEVEL"): Promise<EligibilityCheckResult> {
    if (USE_FIXTURES) {
      return fixtureDelay({
        eligible: true,
        reasons: [],
        final_score: 91.5,
        attendance_pct: 88.0,
        finance_cleared: true,
        student_id: studentId,
        student_name: "Anna Schmidt",
        admission_number: "DA-2025-0042",
        level_code: "B1",
        level_name: "Intermediate",
      });
    }
    const { data } = await apiClient.post<EligibilityCheckResult>("/certificates/check_eligibility/", {
      student_id: studentId,
      level_id: levelId,
      certificate_type: certType,
    });
    return data;
  },

  async issueCertificate(payload: { student: number; level: number; certificate_type: string; template?: number; override_eligibility?: boolean }): Promise<any> {
    if (USE_FIXTURES) {
      return fixtureDelay({ id: 999, certificate_number: "HZD-B1-2026-000099", status: "ACTIVE" });
    }
    const { data } = await apiClient.post("/certificates/", payload);
    return data;
  },

  async reissue(id: number, reason: string): Promise<any> {
    if (USE_FIXTURES) {
      return fixtureDelay({ status: "ACTIVE", reissue_reason: reason });
    }
    const { data } = await apiClient.post(`/certificates/${id}/reissue/`, { reason });
    return data;
  },

  async revoke(id: number, reason: string): Promise<any> {
    if (USE_FIXTURES) {
      return fixtureDelay({ status: "REVOKED", revocation_reason: reason });
    }
    const { data } = await apiClient.post(`/certificates/${id}/revoke/`, { reason });
    return data;
  },

  async listTemplates(): Promise<CertificateTemplateData[]> {
    if (USE_FIXTURES) {
      return fixtureDelay([
        {
          id: 1,
          title: "Goethe CEFR Standard Template",
          certificate_type: "CEFR_LEVEL",
          is_active: true,
          header_text: "ZERTIFIKAT",
          subtitle_text: "CERTIFICATE OF COMPLETION",
          body_template: "This is to certify that {student_name} has successfully completed the German Language Course and met all examination requirements for level {level_name} ({level_code}).",
          footer_text: "Authorized by Horizon Deutsch Institute Board",
          signature_name: "Dr. Klaus Weber",
          signature_title: "Academic Director",
          background_style: "CLASSIC_BORDER",
        },
        {
          id: 2,
          title: "Intensive Participation Template",
          certificate_type: "PARTICIPATION",
          is_active: true,
          header_text: "TEILNAHMEBESTÄTIGUNG",
          subtitle_text: "CERTIFICATE OF PARTICIPATION",
          body_template: "This certifies that {student_name} has actively participated in the intensive German language seminar for level {level_name} ({level_code}).",
          footer_text: "Horizon Deutsch Training Institute",
          signature_name: "Prof. Hans Müller",
          signature_title: "Head of Studies",
          background_style: "MODERN_MINIMAL",
        }
      ]);
    }
    const { data } = await apiClient.get<any>("/templates/");
    return Array.isArray(data) ? data : data.results || [];
  },

  async activateTemplate(id: number): Promise<any> {
    if (USE_FIXTURES) {
      return fixtureDelay({ is_active: true });
    }
    const { data } = await apiClient.post(`/templates/${id}/activate/`);
    return data;
  },

  async verify(certNo: string): Promise<CertificateData | null> {
    if (USE_FIXTURES) {
      const all = await this.list();
      const found = all.find((c) => c.certificateNo === certNo || c.uuid === certNo);
      return fixtureDelay(found ?? null);
    }
    try {
      const { data } = await apiClient.get<any>(`/certificates/verify/${certNo}/`);
      return {
        id: data.id,
        certificateNo: data.certificate_number,
        uuid: data.verification_code,
        studentName: data.student_name,
        admissionNo: data.admission_no,
        level: data.level_code,
        certificateType: data.certificate_type || "CEFR_LEVEL",
        completedDate: data.issue_date,
        finalScore: data.final_score || 0,
        status: data.status,
        statusLabel: data.status_label,
        revocationReason: data.revocation_reason,
      };
    } catch {
      return null;
    }
  }
};
