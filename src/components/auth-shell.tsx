import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, GraduationCap, Users, ShieldCheck, UserCheck } from "lucide-react";
import { INSTITUTION } from "@/lib/sample-data";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const location = useLocation();
  
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-primary-foreground gradient-primary overflow-hidden">
        <div className="absolute inset-0 opacity-30"
             style={{ background: "radial-gradient(50% 50% at 20% 20%, white, transparent)" }} />
        <Link to="/" className="relative flex items-center gap-3 bg-white/10 p-3 rounded-xl w-fit backdrop-blur hover:bg-white/15 transition">
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

      <div className="flex flex-col justify-center p-6 sm:p-10 relative">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/60">
            <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="size-4" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-3 text-xs font-medium">
              <Link to="/login/student" className={`transition hover:text-primary ${location.pathname.includes('student') ? 'text-primary font-bold underline underline-offset-4' : 'text-muted-foreground'}`}>Student</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link to="/login/staff" className={`transition hover:text-primary ${location.pathname.includes('staff') ? 'text-primary font-bold underline underline-offset-4' : 'text-muted-foreground'}`}>Staff</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link to="/login/parent" className={`transition hover:text-primary ${location.pathname.includes('parent') ? 'text-primary font-bold underline underline-offset-4' : 'text-muted-foreground'}`}>Parent</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link to="/login/admin" className={`transition hover:text-primary ${location.pathname.includes('admin') ? 'text-primary font-bold underline underline-offset-4' : 'text-muted-foreground'}`}>Admin</Link>
            </div>
          </div>

          <Link to="/" className="lg:hidden flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="Horizon DTI Logo" className="h-10 w-auto object-contain bg-white rounded p-1 shadow-sm border border-border" />
            <div>
              <span className="font-display font-bold text-lg tracking-wide block leading-none">HORIZON DTI</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Deutsch Training Institute</span>
            </div>
          </Link>

          <h1 className="text-2xl font-display font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground pt-4 border-t border-border/40">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
