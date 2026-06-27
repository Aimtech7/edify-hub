import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthUser, Role, clearUser, getUser } from "@/lib/auth";
import { useTheme } from "@/contexts/theme-context";
import { INSTITUTION } from "@/lib/sample-data";
import {
  LayoutDashboard, GraduationCap, FileBarChart2, Wallet, ReceiptText, User, Users, ClipboardEdit,
  CalendarCheck2, BarChart3, CreditCard, Layers3, FileSpreadsheet, Settings, ShieldCheck,
  BookCopy, ScrollText, ChevronDown, Bell, Sun, Moon, LogOut, KeyRound, Menu, X, Search, Award, Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { NAV } from "@/layouts/nav-config";

const roleLabel: Record<Role, string> = {
  student: "Student", teacher: "Teacher", accountant: "Accountant", admin: "Administrator", parent: "Parent / Guardian", hr: "HR Manager",
  admissions: "Admissions Officer", registrar: "Registrar", library: "Librarian", ict: "ICT Administrator",
};

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const u = getUser();
    if (!u) { navigate("/login/student"); return; }
    setUserState(u);
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!user) return null;
  const groups = NAV[user.role] || [];

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-16 px-5 flex items-center gap-2 border-b border-sidebar-border">
          <div className="size-9 rounded-lg gradient-primary grid place-items-center text-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-sm">{INSTITUTION.name}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">{roleLabel[user.role]} portal</div>
          </div>
          <button className="ml-auto lg:hidden text-sidebar-foreground/80" onClick={() => setMobileOpen(false)}>
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {groups.map((g) => {
            const isCollapsed = collapsedGroups[g.label];
            return (
              <div key={g.label} className="space-y-1">
                <button
                  onClick={() => toggleGroup(g.label)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors rounded"
                >
                  <span>{g.label}</span>
                  <ChevronDown className={cn("size-3 transition-transform", isCollapsed && "-rotate-90")} />
                </button>
                {!isCollapsed && (
                  <ul className="space-y-0.5">
                    {g.items.map((it) => {
                      const active = pathname === it.to;
                      return (
                        <li key={it.to}>
                          <Link
                            to={it.to}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                              active
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-medium"
                                : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <it.icon className="size-4" />
                            {it.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border text-xs opacity-70 flex items-center justify-between">
          <span>v1.0 · © {new Date().getFullYear()}</span>
          <button onClick={() => setCmdOpen(true)} className="px-1.5 py-0.5 rounded bg-sidebar-accent text-[10px] font-mono">⌘K</button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 bg-background/85 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 sm:px-6">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></button>
          <Breadcrumbs pathname={pathname} />
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex relative w-72" onClick={() => setCmdOpen(true)}>
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer" />
              <Input readOnly placeholder="Search menu & quick actions (⌘K)..." className="pl-9 h-9 bg-muted/40 cursor-pointer" />
            </div>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <NotificationsButton />
            <UserMenu user={user} onLogout={() => { clearUser(); navigate("/"); }} />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {cmdOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4 animate-fadeIn" onClick={() => setCmdOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <Search className="size-5 text-red-500" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or search modules..."
                className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
                onChange={(e) => {
                  // simple filter logic could go here
                }}
              />
              <button onClick={() => setCmdOpen(false)} className="text-slate-500 hover:text-white text-xs px-2 py-1 rounded bg-slate-800">ESC</button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-slate-500">Navigation Links</div>
              {groups.flatMap(g => g.items).map((it) => (
                <button
                  key={it.to}
                  onClick={() => { navigate(it.to); setCmdOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                >
                  <it.icon className="size-4 text-red-400" />
                  <span>{it.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  return (
    <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="opacity-50">/</span>}
          <span className={cn(i === parts.length - 1 ? "text-foreground font-medium capitalize" : "capitalize")}>
            {p.replace(/-/g, " ")}
          </span>
        </span>
      ))}
    </div>
  );
}

function NotificationsButton() {
  const items = [
    { t: "Payment received", d: "KES 25,000 from Mr. Wanjiru", ago: "2m" },
    { t: "Marks pending", d: "B2 Batch-03 · Grammatik", ago: "1h" },
    { t: "New announcement", d: "Mid-term exams begin July 1st", ago: "3h" },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-destructive" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-sm">Notifications</span>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <ul className="divide-y divide-border">
          {items.map((n, i) => (
            <li key={i} className="px-4 py-3 hover:bg-muted/50">
              <div className="text-sm font-medium">{n.t}</div>
              <div className="text-xs text-muted-foreground">{n.d}</div>
              <div className="text-[10px] text-muted-foreground/70 mt-1">{n.ago} ago</div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 pl-1 pr-2">
          <div className="size-8 rounded-full gradient-primary text-primary-foreground grid place-items-center text-xs font-semibold">
            {user.name.split(" ").map((p) => p[0]).slice(0,2).join("")}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <div className="text-xs font-medium">{user.name}</div>
            <div className="text-[10px] text-muted-foreground capitalize">{user.role}</div>
          </div>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="font-medium">{user.name}</div>
          <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/app/profile"><User className="size-4 mr-2" />Profile</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/change-password"><KeyRound className="size-4 mr-2" />Change password</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="size-4 mr-2" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RoleGate({ allowed, children }: { allowed: Role[]; children: ReactNode }) {
  const navigate = useNavigate();
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const u = getUser();
    if (!u) { navigate("/login/student"); return; }
    if (!allowed.includes(u.role)) { navigate("/unauthorized"); return; }
    setOk(true);
  }, [navigate, allowed]);
  if (!ok) return null;
  return <>{children}</>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser() {
  const [u, setU] = useState<AuthUser | null>(null);
  useEffect(() => { setU(getUser()); }, []);
  return u;
}
