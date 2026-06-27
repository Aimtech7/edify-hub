import React from "react";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkflowTracker } from "@/components/shared/WorkflowTracker";
import { Users, BookOpen, Layers3, Activity, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, HardDrive, Cpu, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AdmissionsDash() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admissions Operations Control"
        description="Manage online applicants, Einstufungstests, and SIS record conversions."
        action={
          <Button onClick={() => navigate("/app/admissions-queue")} className="gap-2 gradient-primary text-primary-foreground shadow-md">
            Open Admissions Bridge <ArrowRight className="size-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="New Applications" value="24" hint="+6 today" tone="info" icon={<Users className="size-5" />} />
        <StatCard label="Placement Tests Pending" value="12" hint="Scheduled this week" tone="warning" icon={<Activity className="size-5" />} />
        <StatCard label="Approved & Enrolled" value="142" hint="Current intake" tone="success" icon={<CheckCircle2 className="size-5" />} />
        <StatCard label="Conversion Rate" value="84.5%" hint="Target: >80%" tone="info" icon={<Layers3 className="size-5" />} />
      </div>

      <WorkflowTracker type="admissions" currentStepIndex={2} status="active" title="Applicant Processing Lifecycle #ADM-2026-089" />

      <Card>
        <CardContent className="p-6 space-y-4">
          <h4 className="font-display font-semibold text-base">Recent Application Queue</h4>
          <div className="divide-y divide-border">
            {[
              { name: "Felix Mwangi", level: "B1 Intensive", status: "Placement Test Scheduled", time: "10m ago" },
              { name: "Hannah Ochieng", level: "A1 Beginner", status: "Document Review", time: "45m ago" },
              { name: "David Kiptoo", level: "A2 Standard", status: "Tuition Paid (Converting)", time: "2h ago" },
            ].map((app, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{app.name}</div>
                  <div className="text-xs text-muted-foreground">{app.level}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{app.status}</Badge>
                  <span className="text-xs text-muted-foreground">{app.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RegistrarDash() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrar & Records Center"
        description="Monitor student progression, CEFR batches, and institutional grading audits."
        action={
          <Button onClick={() => navigate("/app/students")} className="gap-2 gradient-primary text-primary-foreground shadow-md">
            Student Directory <ArrowRight className="size-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Students" value="486" hint="All campuses" tone="info" icon={<Users className="size-5" />} />
        <StatCard label="Graduation Candidates" value="64" hint="C1 & B2 exam completed" tone="success" icon={<CheckCircle2 className="size-5" />} />
        <StatCard label="Pending Transcripts" value="18" hint="Requires HOD seal" tone="warning" icon={<AlertTriangle className="size-5" />} />
        <StatCard label="CEFR Pass Rate" value="92.1%" hint="+1.4% from last term" tone="info" icon={<Activity className="size-5" />} />
      </div>

      <WorkflowTracker type="results" currentStepIndex={2} status="active" title="Term Exam Moderation (Batch B2-03)" />

      <WorkflowTracker type="certificate" currentStepIndex={3} status="active" title="Certificate Issuance Pipeline" />
    </div>
  );
}

export function LibraryDash() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Library & Resource Catalog"
        description="Manage German audiobooks, Goethe exam prep materials, and physical loan checkouts."
        action={
          <Button onClick={() => navigate("/app/library")} className="gap-2 gradient-primary text-primary-foreground shadow-md">
            Browse Catalog <ArrowRight className="size-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Catalog Assets" value="1,240" hint="E-books & Audio" tone="info" icon={<BookOpen className="size-5" />} />
        <StatCard label="Active Borrowings" value="184" hint="Currently checked out" tone="info" icon={<Layers3 className="size-5" />} />
        <StatCard label="Overdue Returns" value="9" hint="Reminders sent" tone="warning" icon={<AlertTriangle className="size-5" />} />
        <StatCard label="AI Knowledge Embeddings" value="850" hint="Vectorized PDFs" tone="success" icon={<CheckCircle2 className="size-5" />} />
      </div>
    </div>
  );
}

export function IctDash() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader
        title="ICT & Infrastructure Telemetry"
        description="Real-time monitoring of Supabase storage buckets, database latency, and user security policies."
        action={
          <Button onClick={() => navigate("/app/storage-dashboard")} className="gap-2 gradient-primary text-primary-foreground shadow-md">
            Storage Telemetry <ArrowRight className="size-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Server Uptime" value="99.98%" hint="Past 30 days" tone="success" icon={<Server className="size-5" />} />
        <StatCard label="DB Query Avg Latency" value="14ms" hint="Optimal (<20ms)" tone="info" icon={<Cpu className="size-5" />} />
        <StatCard label="Storage Utilization" value="18.4 GB" hint="of 100 GB allocated" tone="info" icon={<HardDrive className="size-5" />} />
        <StatCard label="Security Audits" value="0 Alerts" hint="System hardened" tone="success" icon={<ShieldCheck className="size-5" />} />
      </div>

      <Card className="bg-slate-950 border-slate-800 text-slate-200">
        <CardContent className="p-6 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-emerald-400 font-bold">● SYSTEM HEALTH MONITOR (LIVE TELEMETRY)</span>
            <span className="text-slate-500">REGION: eu-central-1 (Frankfurt)</span>
          </div>
          <div className="space-y-1 text-slate-400">
            <p>[OK] Supabase PostgreSQL connection pool: 12/50 active connections.</p>
            <p>[OK] Redis Cache Layer HIT rate: 94.2%.</p>
            <p>[OK] Django REST API JWT token verification: 0 authentication failures in last 24h.</p>
            <p>[OK] RAG AI Embedding Service vector search latency: ~110ms.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
