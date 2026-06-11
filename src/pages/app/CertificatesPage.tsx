import { useState, useEffect } from "react";
import { useCurrentUser } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CEFR_LEVEL_INFO, INSTITUTION } from "@/lib/sample-data";
import { Award, Printer, Download, Eye, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { certificateService, type CertificateData } from "@/services/certificate-service";

export default function CertificatesPage() {
  const user = useCurrentUser();
  const [certs, setCerts] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState<CertificateData | null>(null);

  const isStudent = user?.role === "student";

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Fetch certificates for current student, or all if staff
    certificateService.list(isStudent ? user.admissionNo : undefined)
      .then((data) => setCerts(data))
      .catch((err) => toast.error("Error loading certificates: " + err.message))
      .finally(() => setLoading(false));
  }, [user, isStudent]);

  if (!user) return null;

  return (
    <>
      <PageHeader 
        title="Certificates" 
        description={isStudent ? "View and download your official CEFR language level certificates." : "Audit and verify student certificates."} 
      />

      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Issued Certificates</h3>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {certs.length} Level Certificate{certs.length !== 1 ? "s" : ""}
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
                  {!isStudent && <TableHead>Student</TableHead>}
                  <TableHead>CEFR Level</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certs.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs font-semibold">{c.certificateNo}</TableCell>
                    {!isStudent && (
                      <TableCell>
                        <div className="font-medium text-sm">{c.studentName}</div>
                        <div className="text-xs text-muted-foreground">{c.admissionNo}</div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="secondary" className="font-bold text-xs bg-success/10 text-success border-success/20">
                        Level {c.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.completedDate || "—"}</TableCell>
                    <TableCell className="text-right font-medium">{c.finalScore}%</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveCert(c)}
                      >
                        <Eye className="size-4 mr-1.5" />
                        View Certificate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {certs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isStudent ? 5 : 6} className="text-center text-muted-foreground py-8">
                      No completed certificates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!activeCert} onOpenChange={(open) => !open && setActiveCert(null)}>
        <DialogContent className="max-w-2xl bg-card border-2 border-primary/20 shadow-elevated">
          {activeCert && (
            <CertificateDisplay 
              cert={activeCert} 
              onClose={() => setActiveCert(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CertificateDisplay({ 
  cert, 
  onClose 
}: { 
  cert: CertificateData; 
  onClose: () => void 
}) {
  const levelInfo = CEFR_LEVEL_INFO[cert.level as keyof typeof CEFR_LEVEL_INFO];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success(`Certificate ${cert.certificateNo} PDF download started!`);
  };

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
                has successfully completed the language curriculum and passed all examinations for
              </p>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Level {cert.level} — {levelInfo.band} German
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto italic px-4">
                "{levelInfo.description}"
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 py-4 text-xs max-w-sm mx-auto">
            <div className="text-left border-r border-primary/10 pr-4">
              <span className="text-muted-foreground">Completed Date:</span>
              <div className="font-semibold">{cert.completedDate || "—"}</div>
            </div>
            <div className="text-right pl-4">
              <span className="text-muted-foreground">Final Score:</span>
              <div className="font-semibold text-success">{cert.finalScore}% (Gut)</div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-primary/10 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-success" />
              Verified Certificate
            </div>
            <div className="font-mono">
              Serial No: <strong className="text-foreground">{cert.certificateNo}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="size-4 mr-2" />
          Print Certificate
        </Button>
        <Button className="gradient-primary text-primary-foreground" onClick={handleDownload}>
          <Download className="size-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
