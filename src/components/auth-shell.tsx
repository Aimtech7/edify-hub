import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { INSTITUTION } from "@/lib/sample-data";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-primary-foreground gradient-primary overflow-hidden">
        <div className="absolute inset-0 opacity-30"
             style={{ background: "radial-gradient(50% 50% at 20% 20%, white, transparent)" }} />
        <Link to="/" className="relative flex items-center gap-3 bg-white/10 p-3 rounded-xl w-fit backdrop-blur">
          <img src="/logo.png" alt="Horizon DTI Logo" className="h-10 w-auto object-contain bg-white rounded p-1" />
          <div className="leading-tight text-white">
            <div className="font-display font-bold tracking-wide">HORIZON DTI</div>
            <div className="text-[11px] opacity-80 uppercase tracking-wider">Deutsch Training Institute</div>
          </div>
        </Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">Your German learning journey, beautifully managed.</h2>
          <p className="mt-4 opacity-85">Track your CEFR progression, manage fees, and access assessments — all in one place.</p>
        </div>
        <div className="relative text-xs opacity-75">© {new Date().getFullYear()} {INSTITUTION.name}</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="Horizon DTI Logo" className="h-10 w-auto object-contain bg-white rounded p-1 shadow-sm border border-border" />
            <span className="font-display font-bold text-lg tracking-wide">HORIZON DTI</span>
          </Link>
          <h1 className="text-2xl font-display font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
