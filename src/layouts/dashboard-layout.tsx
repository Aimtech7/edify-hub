import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap,
  ChevronDown,
  Bell,
  Sun,
  Moon,
  LogOut,
  KeyRound,
  Menu,
  X,
  Search,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { initials } from "@/utils/format";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { INSTITUTION } from "@/services/fixtures";
import { roleLabel } from "@/routes/route-config";
import { NAV } from "./nav-config";
import type { AuthUser } from "@/types";

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;
  const groups = NAV[user.role];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 px-5 flex items-center gap-2 border-b border-sidebar-border">
          <div className="size-9 rounded-lg gradient-primary grid place-items-center text-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-sm">{INSTITUTION.name}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">
              {roleLabel[user.role]} portal
            </div>
          </div>
          <button
            className="ml-auto lg:hidden text-sidebar-foreground/80"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 mb-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
                {g.label}
              </div>
              <ul className="space-y-0.5">
                {g.items.map((it) => (
                  <li key={it.to}>
                    <NavLink
                      to={it.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )
                      }
                    >
                      <it.icon className="size-4" />
                      {it.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border text-xs opacity-70">
          v1.0 · © {new Date().getFullYear()}
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 bg-background/85 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 sm:px-6">
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <Breadcrumbs pathname={location.pathname} />
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex relative w-72">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-9 h-9 bg-muted/40" />
            </div>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <NotificationsButton />
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
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
          <span
            className={cn(
              i === parts.length - 1
                ? "text-foreground font-medium capitalize"
                : "capitalize"
            )}
          >
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
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
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
            {initials(user.name)}
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
        <DropdownMenuItem asChild>
          <Link to="/app/profile">
            <User className="size-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/change-password">
            <KeyRound className="size-4 mr-2" />
            Change password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
