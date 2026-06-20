import { apiClient } from "./api-client";
import { USE_FIXTURES, fixtureDelay } from "./service-utils";
import { STUDENTS } from "./fixtures";

export interface CertificateData {
  certificateNo: string;
  studentName: string;
  admissionNo: string;
  level: string;
  completedDate: string;
  finalScore: number;
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
          .map((ev) => ({
            certificateNo: ev.certificateNo 
              ? ev.certificateNo.replace("CERT-", "HZD-") 
              : `HZD-${ev.level}-${ev.completedDate?.split("-")[0] || "2025"}-000${s.admissionNo.split("-")[2] || "042"}`,
            studentName: s.name,
            admissionNo: s.admissionNo,
            level: ev.level,
            completedDate: ev.completedDate || "",
            finalScore: ev.finalScore || 0,
          }))
      );
      return fixtureDelay(certs);
    }
    const { data } = await apiClient.get<any>("/certificates/", { 
      params: { student: studentId } 
    });
    const results = Array.isArray(data) ? data : data.results || [];
    return results.map((item: any) => ({
      certificateNo: item.certificate_number,
      studentName: item.student_name,
      admissionNo: item.admission_no,
      level: item.level_code,
      completedDate: item.issue_date,
      finalScore: item.final_score || 0,
    }));
  },

  async verify(certNo: string): Promise<CertificateData | null> {
    if (USE_FIXTURES) {
      const all = await this.list();
      const found = all.find((c) => c.certificateNo === certNo);
      return fixtureDelay(found ?? null);
    }
    try {
      const { data } = await apiClient.get<any>(`/certificates/verify/`, { 
        params: { cert_no: certNo } 
      });
      return {
        certificateNo: data.certificate_number,
        studentName: data.student_name,
        admissionNo: data.admission_no,
        level: data.level_code,
        completedDate: data.issue_date,
        finalScore: data.final_score || 0,
      };
    } catch {
      return null;
    }
  }
};
