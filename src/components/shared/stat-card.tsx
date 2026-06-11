import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "info" | "destructive";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  trend?: { value: string; positive?: boolean };
}) {
  const toneBg: Record<Tone, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className="shadow-card border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {label}
            </div>
            <div className="mt-2 text-2xl font-display font-bold truncate">{value}</div>
            <div className="mt-1 flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.positive ? "text-success" : "text-destructive"
                  )}
                >
                  {trend.positive ? "▲" : "▼"} {trend.value}
                </span>
              )}
              {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
            </div>
          </div>
          {icon && (
            <div className={cn("size-10 shrink-0 rounded-lg grid place-items-center", toneBg[tone])}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
