import { useState, useEffect } from "react";
import { useCurrentUser } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CEFR_LEVEL_INFO, INSTITUTION } from "@/lib/sample-data";
import { 
  Award, Printer, Download, Eye, ShieldCheck, Loader2, CheckCircle2, 
  XCircle, AlertTriangle, RefreshCw, Ban, FileText, Search, PlusCircle
} from "lucide-react";
import { toast } from "sonner";
import { 
  certificateService, 
  type CertificateData, 
  type CertificateTemplateData,
  type EligibilityCheckResult
} from "@/services/certificate-service";

export default function CertificatesPage() {
  const user = useCurrentUser();
  const [certs, setCerts] = useState<CertificateData[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog & Active states
  const [activeCert, setActiveCert] = useState<CertificateData | null>(null);
  const [reissueModalCert, setReissueModalCert] = useState<CertificateData | null>(null);
  const [reissueReason, setReissueReason] = useState("");
  const [revokeModalCert, setRevokeModalCert] = useState<CertificateData | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  // Eligibility Engine state
  const [studentIdInput, setStudentIdInput] = useState("1");
  const [levelIdInput, setLevelIdInput] = useState("1");
  const [certTypeInput, setCertTypeInput] = useState("CEFR_LEVEL");
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityCheckResult | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [issuingCert, setIssuingCert] = useState(false);

  const isStudent = user?.role === "student";

  const loadData = () => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      certificateService.list(isStudent ? user.admissionNo : undefined),
      !isStudent ? certificateService.listTemplates() : Promise.resolve([])
    ])
      .then(([cData, tData]) => {
        setCerts(cData);
        setTemplates(tData);
      })
      .catch((err) => toast.error("Error loading certificate records: " + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user, isStudent]);

  if (!user) return null;

  const filteredCerts = certs.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.certificateNo.toLowerCase().includes(q) ||
      c.studentName.toLowerCase().includes(q) ||
      c.admissionNo.toLowerCase().includes(q) ||
      (c.uuid && c.uuid.toLowerCase().includes(q))
    );
  });

  const handleRunEligibility = async () => {
    setCheckingEligibility(true);
    setEligibilityResult(null);
    try {
      const res = await certificateService.checkEligibility(
        Number(studentIdInput),
        Number(levelIdInput),
        certTypeInput
      );
      setEligibilityResult(res);
      if (res.eligible) {
        toast.success("Eligibility passed! Student qualifies for certificate issuance.");
      } else {
        toast.warning("Eligibility validation found unmet requirements.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to run eligibility validation.");
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleIssueCert = async (override = false) => {
    if (!eligibilityResult) return;
    setIssuingCert(true);
    try {
      await certificateService.issueCertificate({
        student: Number(studentIdInput),
        level: Number(levelIdInput),
        certificate_type: certTypeInput,
        override_eligibility: override
      });
      toast.success("Official certificate generated and stored successfully!");
      setEligibilityResult(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to issue certificate.");
    } finally {
      setIssuingCert(false);
    }
  };

  const handleReissueSubmit = async () => {
    if (!reissueModalCert || !reissueModalCert.id) return;
    try {
      await certificateService.reissue(reissueModalCert.id, reissueReason || "Administrative correction");
      toast.success(`Certificate ${reissueModalCert.certificateNo} reissued successfully!`);
      setReissueModalCert(null);
      setReissueReason("");
      loadData();
    } catch (err: any) {
      toast.error("Error reissuing certificate: " + err.message);
    }
  };

  const handleRevokeSubmit = async () => {
    if (!revokeModalCert || !revokeModalCert.id || !revokeReason) {
      toast.error("Please enter a mandatory revocation reason.");
      return;
    }
    try {
      await certificateService.revoke(revokeModalCert.id, revokeReason);
      toast.success(`Certificate ${revokeModalCert.certificateNo} revoked permanently.`);
      setRevokeModalCert(null);
      setRevokeReason("");
      loadData();
    } catch (err: any) {
      toast.error("Error revoking certificate: " + err.message);
    }
  };

  const handleActivateTemplate = async (id: number) => {
    try {
      await certificateService.activateTemplate(id);
      toast.success("Template activated.");
      loadData();
    } catch (err: any) {
      toast.error("Error activating template: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Enterprise Certificate Management" 
        description={isStudent ? "View, download, and verify your official CEFR language certificates." : "Automated eligibility validation, certificate generation, reissue, and revocation."} 
      />

      {isStudent ? (
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Award className="size-5 text-primary" /> My Earned Certificates
              </h3>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                {certs.length} Certificate{certs.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading certificates...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate No</TableHead>
                    <TableHead>CEFR Level</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certs.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs font-semibold">{c.certificateNo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-bold text-xs bg-success/10 text-success border-success/20">
                          Level {c.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{c.certificateType || "CEFR_LEVEL"}</TableCell>
                      <TableCell className="text-sm">{c.completedDate || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "REVOKED" ? "destructive" : "default"} className="text-[10px]">
                          {c.statusLabel || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setActiveCert(c)}
                        >
                          <Eye className="size-4 mr-1.5" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {certs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No completed certificates found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="issued" className="w-full">
          <TabsList className="grid grid-cols-3 max-w-xl mb-4">
            <TabsTrigger value="issued" className="flex items-center gap-2">
              <Award className="size-4" /> Issued Certificates
            </TabsTrigger>
            <TabsTrigger value="eligibility" className="flex items-center gap-2">
              <CheckCircle2 className="size-4" /> Eligibility Engine
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="size-4" /> Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issued" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Issued Institutional Certificates</CardTitle>
                  <CardDescription>Search by student name, admission number, serial number, or UUID.</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    placeholder="Search serial, UUID, student..." 
                    className="pl-9 h-9 text-xs" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading registry...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial & UUID</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Level & Type</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCerts.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="font-mono text-xs font-semibold text-primary">{c.certificateNo}</div>
                            {c.uuid && <div className="font-mono text-[10px] text-muted-foreground">{c.uuid.slice(0, 13)}...</div>}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{c.studentName}</div>
                            <div className="text-xs text-muted-foreground">{c.admissionNo}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className="font-bold text-xs bg-success/10 text-success border-success/20">
                                {c.level}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{c.certificateType}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{c.completedDate || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === "REVOKED" ? "destructive" : "default"} className="text-[10px]">
                              {c.statusLabel || c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => setActiveCert(c)}>
                              <Eye className="size-4" />
                            </Button>
                            {c.status !== "REVOKED" && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => setReissueModalCert(c)}>
                                  <RefreshCw className="size-3.5 mr-1" /> Reissue
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => setRevokeModalCert(c)}>
                                  <Ban className="size-3.5 mr-1" /> Revoke
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredCerts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No matching certificate records found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eligibility" className="space-y-4">
            <Card className="shadow-card border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-lg">Automated Certificate Eligibility Engine</CardTitle>
                <CardDescription>
                  Before generating a certificate, the system verifies student status, academic results, attendance thresholds, finance clearance, and duplicate issues.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-muted/20 p-4 rounded-lg">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Student ID / Admission</label>
                    <Input value={studentIdInput} onChange={(e) => setStudentIdInput(e.target.value)} placeholder="e.g. 1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">CEFR Level ID</label>
                    <Input value={levelIdInput} onChange={(e) => setLevelIdInput(e.target.value)} placeholder="e.g. 1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Certificate Type</label>
                    <select 
                      value={certTypeInput} 
                      onChange={(e) => setCertTypeInput(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="CEFR_LEVEL">CEFR Level Completion Certificate</option>
                      <option value="COURSE_COMPLETION">Course Completion Certificate</option>
                      <option value="PARTICIPATION">Participation Certificate</option>
                      <option value="ACHIEVEMENT">Achievement Certificate</option>
                    </select>
                  </div>
                  <div>
                    <Button 
                      onClick={handleRunEligibility} 
                      disabled={checkingEligibility} 
                      className="w-full gradient-primary text-primary-foreground"
                    >
                      {checkingEligibility ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                      Run Validation
                    </Button>
                  </div>
                </div>

                {eligibilityResult && (
                  <div className="border rounded-lg p-6 space-y-4 animate-in fade-in zoom-in-95 bg-card">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-bold text-base">{eligibilityResult.student_name} ({eligibilityResult.admission_number})</h4>
                        <p className="text-xs text-muted-foreground">Target Level: {eligibilityResult.level_name} ({eligibilityResult.level_code})</p>
                      </div>
                      {eligibilityResult.eligible ? (
                        <Badge className="bg-success text-white font-bold px-3 py-1 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="size-4" /> ELIGIBLE FOR ISSUANCE
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="font-bold px-3 py-1 text-xs flex items-center gap-1.5">
                          <XCircle className="size-4" /> INELIGIBLE ({eligibilityResult.reasons.length} Issues)
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-2">
                      <div className="p-3 rounded bg-muted/30">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Academic Score</span>
                        <div className="text-lg font-bold text-foreground mt-0.5">{eligibilityResult.final_score.toFixed(1)}%</div>
                      </div>
                      <div className="p-3 rounded bg-muted/30">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Attendance Rate</span>
                        <div className="text-lg font-bold text-foreground mt-0.5">{eligibilityResult.attendance_pct.toFixed(1)}%</div>
                      </div>
                      <div className="p-3 rounded bg-muted/30">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Finance Clearance</span>
                        <div className="text-lg font-bold text-foreground mt-0.5">
                          {eligibilityResult.finance_cleared ? <span className="text-success">Cleared</span> : <span className="text-destructive">Pending Balance</span>}
                        </div>
                      </div>
                    </div>

                    {!eligibilityResult.eligible && (
                      <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20 space-y-2">
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          <AlertTriangle className="size-4" /> Validation Failure Reasons:
                        </div>
                        <ul className="list-disc list-inside text-xs space-y-1">
                          {eligibilityResult.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-3 border-t">
                      {!eligibilityResult.eligible && (
                        <Button 
                          variant="outline" 
                          className="border-destructive/30 text-destructive text-xs" 
                          onClick={() => handleIssueCert(true)}
                          disabled={issuingCert}
                        >
                          Override & Force Issue
                        </Button>
                      )}
                      {eligibilityResult.eligible && (
                        <Button 
                          className="gradient-primary text-primary-foreground text-xs"
                          onClick={() => handleIssueCert(false)}
                          disabled={issuingCert}
                        >
                          {issuingCert ? <Loader2 className="size-4 animate-spin mr-2" /> : <Award className="size-4 mr-2" />}
                          Generate & Store Certificate
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Certificate Branding & Templates</CardTitle>
                <CardDescription>Configure header titles, signatures, logos, and seals for every certificate type.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates.map((t) => (
                    <div key={t.id} className="border-2 rounded-xl p-5 bg-card space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-base">{t.title}</h4>
                          <Badge variant="outline" className="text-[10px] mt-1">{t.certificate_type}</Badge>
                        </div>
                        {t.is_active ? (
                          <Badge className="bg-success text-white">Active Template</Badge>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleActivateTemplate(t.id)}>Activate</Button>
                        )}
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground border-t pt-3">
                        <div><strong className="text-foreground">Header:</strong> {t.header_text}</div>
                        <div><strong className="text-foreground">Signatory:</strong> {t.signature_name} ({t.signature_title})</div>
                        <div><strong className="text-foreground">Footer:</strong> {t.footer_text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Certificate Preview / Display Dialog */}
      <Dialog open={!!activeCert} onOpenChange={(open) => !open && setActiveCert(null)}>
        <DialogContent className="max-w-2xl bg-card border-2 border-primary/20 shadow-elevated">
          {activeCert && <CertificateDisplay cert={activeCert} onClose={() => setActiveCert(null)} />}
        </DialogContent>
      </Dialog>

      {/* Reissue Dialog */}
      <Dialog open={!!reissueModalCert} onOpenChange={(open) => !open && setReissueModalCert(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reissue Official Certificate</DialogTitle>
            <DialogDescription>
              Reissuing will regenerate the PDF and preserve the original issuance history in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <label className="text-xs font-semibold">Reason for Reissuance</label>
            <Textarea 
              placeholder="e.g., Name spelling correction / updated CEFR score" 
              value={reissueReason} 
              onChange={(e) => setReissueReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReissueModalCert(null)}>Cancel</Button>
            <Button onClick={handleReissueSubmit}>Reissue Certificate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={!!revokeModalCert} onOpenChange={(open) => !open && setRevokeModalCert(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Revoke Certificate</DialogTitle>
            <DialogDescription>
              Revoking sets the status to REVOKED, prevents public verification validation, and records an audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <label className="text-xs font-semibold text-destructive">Mandatory Revocation Reason</label>
            <Textarea 
              placeholder="e.g., Academic misconduct / fraudulent coursework completion" 
              value={revokeReason} 
              onChange={(e) => setRevokeReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeModalCert(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevokeSubmit}>Confirm Revocation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CertificateDisplay({ cert, onClose }: { cert: CertificateData; onClose: () => void }) {
  const levelInfo = CEFR_LEVEL_INFO[cert.level as keyof typeof CEFR_LEVEL_INFO];

  const handlePrint = () => window.print();
  const handleDownload = () => toast.success(`Certificate ${cert.certificateNo} PDF download started!`);

  return (
    <div className="space-y-6">
      <div className="relative border-8 border-double border-primary/30 p-8 text-center bg-muted/20 rounded-md select-none">
        <div className="absolute inset-0 grid place-items-center opacity-[0.02] pointer-events-none">
          <Award className="size-80" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-center mb-2">
            <div className="size-12 rounded-full gradient-primary text-primary-foreground grid place-items-center">
              <Award className="size-6" />
            </div>
          </div>

          <h2 className="font-display text-2xl font-extrabold tracking-tight text-primary uppercase">
            {INSTITUTION.name}
          </h2>
          <p className="text-[10px] tracking-widest text-muted-foreground uppercase -mt-2">
            {INSTITUTION.motto}
          </p>

          <div className="py-4">
            <p className="text-xs text-muted-foreground italic">This is to certify that</p>
            <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight py-2 border-b border-primary/10 max-w-md mx-auto">
              {cert.studentName}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Admission Number: {cert.admissionNo}</p>
          </div>

          {levelInfo && (
            <div className="space-y-2 py-2">
              <p className="text-sm text-muted-foreground">
                has successfully completed the language curriculum and met all examination requirements for
              </p>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Level {cert.level} — {levelInfo.band} German ({cert.certificateType || "CEFR_LEVEL"})
              </h3>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 py-4 text-xs max-w-sm mx-auto">
            <div className="text-left border-r border-primary/10 pr-4">
              <span className="text-muted-foreground">Issue Date:</span>
              <div className="font-semibold">{cert.completedDate || "—"}</div>
            </div>
            <div className="text-right pl-4">
              <span className="text-muted-foreground">Final Score:</span>
              <div className="font-semibold text-success">{cert.finalScore}%</div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-primary/10 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              {cert.status === "REVOKED" ? (
                <span className="text-destructive font-bold flex items-center gap-1"><XCircle className="size-3.5" /> REVOKED CERTIFICATE</span>
              ) : (
                <span className="text-success font-bold flex items-center gap-1"><ShieldCheck className="size-3.5" /> Verified Certificate</span>
              )}
            </div>
            <div className="font-mono">
              Serial: <strong className="text-foreground">{cert.certificateNo}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="size-4 mr-2" /> Print
        </Button>
        {cert.status !== "REVOKED" && (
          <Button className="gradient-primary text-primary-foreground" onClick={handleDownload}>
            <Download className="size-4 mr-2" /> Download PDF
          </Button>
        )}
      </div>
    </div>
  );
}
