import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ShieldCheck, BarChart3, Wallet } from "lucide-react";
import { INSTITUTION } from "@/services/fixtures";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-primary-foreground gradient-primary overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(50% 50% at 20% 20%, white, transparent)" }}
          aria-hidden
        />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="size-10 rounded-lg bg-white/15 border border-white/20 grid place-items-center backdrop-blur">
            <GraduationCap className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold">{INSTITUTION.name}</div>
            <div className="text-[11px] opacity-80">LMS · Finance ERP</div>
          </div>
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight text-balance">
            One portal for learning, finance and operations.
          </h2>
          <p className="mt-4 opacity-85 text-pretty">
            From admission to alumni — Horizon keeps every record in step.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: ShieldCheck, t: "Role-based secure access" },
              { icon: Wallet, t: "Transparent fee tracking" },
              { icon: BarChart3, t: "Real-time performance insights" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-3">
                <span className="size-8 rounded-md bg-white/15 grid place-items-center">
                  <f.icon className="size-4" />
                </span>
                {f.t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs opacity-75">
          © {new Date().getFullYear()} {INSTITUTION.name}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="size-9 rounded-lg gradient-primary grid place-items-center text-primary-foreground">
              <GraduationCap className="size-5" />
            </div>
            <span className="font-display font-bold">{INSTITUTION.name}</span>
          </Link>
          <h1 className="text-2xl font-display font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1.5 text-pretty">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
