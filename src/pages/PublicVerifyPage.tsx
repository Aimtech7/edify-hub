import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2, XCircle, Search } from "lucide-react";
import { apiClient } from "@/services/api-client";

export default function PublicVerifyPage() {
  const { certNo } = useParams<{ certNo?: string }>();
  const [query, setQuery] = useState(certNo || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiClient.get(`/certificates/verify/${query}/`);
      setResult(res.data);
      if (query !== certNo) {
        navigate(`/verify/${query}`, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Certificate not found or invalid.");
    } finally {
      setLoading(false);
    }
  };

  // If a param was passed on mount, we can auto-search (optional)

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto size-12 rounded-full gradient-primary text-primary-foreground grid place-items-center mb-4">
            <Award className="size-6" />
          </div>
          <CardTitle className="text-2xl font-display">Certificate Verification</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Enter the certificate serial number to verify its authenticity.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <Input 
              placeholder="e.g. HZD-A1-2026-000001" 
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

          {result && (
            <div className="p-4 rounded-lg bg-success/10 text-success-foreground border border-success/20 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 mb-4 text-success">
                <CheckCircle2 className="size-6" />
                <h3 className="font-semibold text-lg">Valid Certificate</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-success/10 pb-2">
                  <span className="text-success-foreground/70">Student Name</span>
                  <span className="font-medium">{result.student_name}</span>
                </div>
                <div className="flex justify-between border-b border-success/10 pb-2">
                  <span className="text-success-foreground/70">CEFR Level</span>
                  <span className="font-medium">{result.level_code}</span>
                </div>
                <div className="flex justify-between border-b border-success/10 pb-2">
                  <span className="text-success-foreground/70">Issue Date</span>
                  <span className="font-medium">{result.issue_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-success-foreground/70">Status</span>
                  <Badge className="bg-success text-white border-transparent">{result.status}</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center text-xs text-muted-foreground">
        Horizon Deutsch Training Institute
      </div>
    </div>
  );
}
