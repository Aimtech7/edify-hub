import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2, XCircle, Search, AlertTriangle, ShieldCheck } from "lucide-react";
import { certificateService } from "@/services/certificate-service";

export default function PublicVerifyPage() {
  const { certNo } = useParams<{ certNo?: string }>();
  const [query, setQuery] = useState(certNo || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await certificateService.verify(searchTerm);
      if (data) {
        setResult(data);
      } else {
        setError("Certificate not found or invalid serial/UUID.");
      }
    } catch (err: any) {
      setError(err.message || "Certificate not found or invalid.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certNo) {
      performSearch(certNo);
    }
  }, [certNo]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query) return;
    if (query !== certNo) {
      navigate(`/verify/${query}`, { replace: true });
    }
    performSearch(query);
  };

  const isRevoked = result?.status === "REVOKED" || result?.statusLabel?.includes("REVOKED");

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto size-12 rounded-full gradient-primary text-primary-foreground grid place-items-center mb-4">
            <Award className="size-6" />
          </div>
          <CardTitle className="text-2xl font-display">Certificate Verification</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Enter the certificate serial code or verification UUID to authenticate.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <Input 
              placeholder="e.g. HZD-A1-2026-000001 or UUID" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading || !query}>
              {loading ? "Checking..." : <><Search className="size-4 mr-2" /> Verify</>}
            </Button>
          </form>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-3">
              <XCircle className="size-5 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">Verification Failed</div>
                <div className="text-xs mt-1">{error}</div>
              </div>
            </div>
          )}

          {result && isRevoked && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in zoom-in-95 space-y-3">
              <div className="flex items-center gap-2 font-bold text-base">
                <AlertTriangle className="size-5" /> REVOKED CERTIFICATE
              </div>
              <p className="text-xs">
                This certificate serial number exists in institutional records but has been officially <strong>REVOKED</strong> and is no longer valid.
              </p>
              <div className="space-y-1 text-xs pt-2 border-t border-destructive/20">
                <div><strong>Student Name:</strong> {result.studentName}</div>
                <div><strong>Serial:</strong> {result.certificateNo}</div>
                {result.revocationReason && <div><strong>Reason:</strong> {result.revocationReason}</div>}
              </div>
            </div>
          )}

          {result && !isRevoked && (
            <div className="p-4 rounded-lg bg-success/10 text-success-foreground border border-success/20 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 mb-4 text-success font-bold text-base">
                <ShieldCheck className="size-5" /> Authentic & Valid Certificate
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-success/10 pb-2">
                  <span className="text-success-foreground/70">Student Name</span>
                  <span className="font-medium">{result.studentName}</span>
                </div>
                <div className="flex justify-between border-b border-success/10 pb-2">
                  <span className="text-success-foreground/70">CEFR Level</span>
                  <span className="font-medium">{result.level} ({result.certificateType || "CEFR_LEVEL"})</span>
                </div>
                <div className="flex justify-between border-b border-success/10 pb-2">
                  <span className="text-success-foreground/70">Issue Date</span>
                  <span className="font-medium">{result.completedDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-success-foreground/70">Status</span>
                  <Badge className="bg-success text-white border-transparent text-xs font-bold">
                    {result.statusLabel || "VERIFIED / VALID"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center text-xs text-muted-foreground">
        Horizon Deutsch Training Institute • Public Verification Registry
      </div>
    </div>
  );
}
