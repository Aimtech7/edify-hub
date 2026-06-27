import React from "react";
import { Check, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkflowType = "admissions" | "finance" | "attendance" | "results" | "certificate";

interface Step {
  label: string;
  description?: string;
}

const WORKFLOW_STEPS: Record<WorkflowType, Step[]> = {
  admissions: [
    { label: "Application Submitted", description: "Online admission form received" },
    { label: "Document Review", description: "Admissions officer verification" },
    { label: "Placement Test", description: "Schedule & grade Einstufungstest" },
    { label: "CEFR Assigned", description: "Level confirmed (A1 - C1)" },
    { label: "Tuition Paid", description: "First installment verification" },
    { label: "Enrolled", description: "Converted to official SIS record" },
  ],
  finance: [
    { label: "Invoice Generated", description: "Fee statement billed to account" },
    { label: "Payment Logged", description: "M-Pesa / Bank deposit received" },
    { label: "Allocation", description: "Matched against tuition invoice" },
    { label: "Receipt Issued", description: "Official PDF stamped receipt" },
    { label: "Reconciled", description: "Accountant audit signed off" },
  ],
  attendance: [
    { label: "Roll Call Opened", description: "Class session initialized" },
    { label: "Attendance Marked", description: "Teacher logs present / absent" },
    { label: "Parent Notification", description: "SMS alerts sent for absences" },
    { label: "Register Locked", description: "Daily attendance archived" },
  ],
  results: [
    { label: "Marks Entered", description: "Teacher submits exam grading" },
    { label: "HOD Verification", description: "Department head review" },
    { label: "Academic Board Approval", description: "Final exam moderation" },
    { label: "Published", description: "Available on student portal" },
  ],
  certificate: [
    { label: "Course Completion", description: "Final attendance & exam pass verified" },
    { label: "CEFR Audit", description: "Goethe / Horizon grading compliance" },
    { label: "Principal Approval", description: "Digital signature affixed" },
    { label: "QR Generation", description: "Cryptographic verification badge created" },
    { label: "Issued", description: "Downloaded or printed for graduate" },
  ],
};

interface WorkflowTrackerProps {
  type: WorkflowType;
  currentStepIndex: number; // 0-indexed
  status?: "active" | "completed" | "error" | "paused";
  title?: string;
}

export function WorkflowTracker({
  type,
  currentStepIndex,
  status = "active",
  title,
}: WorkflowTrackerProps) {
  const steps = WORKFLOW_STEPS[type] || [];

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      {title && (
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-foreground">
            {title} ({type} lifecycle)
          </h4>
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase",
              status === "completed" && "bg-emerald-500/10 text-emerald-500",
              status === "active" && "bg-blue-500/10 text-blue-500",
              status === "error" && "bg-destructive/10 text-destructive",
              status === "paused" && "bg-amber-500/10 text-amber-500"
            )}
          >
            {status}
          </span>
        </div>
      )}

      <div className="relative">
        <div className="flex items-center justify-between overflow-x-auto pb-4 pt-2 gap-2">
          {steps.map((step, idx) => {
            const isDone = idx < currentStepIndex || status === "completed";
            const isCurrent = idx === currentStepIndex && status !== "completed";
            const isPending = idx > currentStepIndex;

            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center text-center min-w-[110px] max-w-[140px] flex-1">
                  <div
                    className={cn(
                      "size-9 rounded-full grid place-items-center font-bold text-xs transition-all shadow-sm",
                      isDone && "gradient-primary text-primary-foreground scale-105",
                      isCurrent && "border-2 border-primary bg-primary/10 text-primary animate-pulse scale-110",
                      isPending && "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {isDone ? (
                      <Check className="size-4 stroke-[2.5]" />
                    ) : isCurrent ? (
                      <Clock className="size-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="mt-2 font-semibold text-xs text-foreground leading-tight">{step.label}</div>
                  {step.description && (
                    <div className="mt-1 text-[10px] text-muted-foreground leading-snug line-clamp-2">
                      {step.description}
                    </div>
                  )}
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden sm:flex items-center justify-center text-muted-foreground/40 px-1 pt-4">
                    <ArrowRight className="size-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
