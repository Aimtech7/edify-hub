import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INSTITUTION, COURSES, TESTIMONIALS, ANNOUNCEMENTS } from "@/lib/sample-data";
import { GraduationCap, ShieldCheck, Sparkles, BookOpen, Users, Award, Phone, Mail, MapPin, ArrowRight, Calendar } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-primary grid place-items-center text-primary-foreground">
              <GraduationCap className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-base">{INSTITUTION.name}</div>
              <div className="text-[11px] text-muted-foreground">LMS · Finance ERP</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#programs" className="hover:text-foreground">Programmes</a>
            <a href="#announcements" className="hover:text-foreground">Announcements</a>
            <a href="#testimonials" className="hover:text-foreground">Testimonials</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login/student">Student</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/login/staff">Staff</Link></Button>
            <Button asChild size="sm" className="gradient-primary text-primary-foreground"><Link to="/login/admin">Admin</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-60"
             style={{ background: "radial-gradient(60% 60% at 80% 0%, oklch(0.85 0.1 265 / 0.4), transparent), radial-gradient(60% 60% at 0% 100%, oklch(0.9 0.08 200 / 0.35), transparent)" }} />
        <div className="mx-auto max-w-7xl px-6 py-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <Badge variant="secondary" className="rounded-full px-3 py-1 mb-5">
              <Sparkles className="size-3.5 mr-1.5" /> Est. {INSTITUTION.established} · Trusted by 4,200+ families
            </Badge>
            <h1 className="font-display font-extrabold text-5xl md:text-6xl leading-[1.05] tracking-tight">
              {INSTITUTION.tagline.split(" ").slice(0, 1).join(" ")}{" "}
              <span className="text-gradient">{INSTITUTION.tagline.split(" ").slice(1).join(" ")}</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Horizon Academy is an integrated learning and finance platform. Students, teachers and accountants
              work from one source of truth — results, fees, receipts and reports, beautifully unified.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elevated">
                <Link to="/login/student">Student Login <ArrowRight className="size-4 ml-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline"><Link to="/login/staff">Staff Login</Link></Button>
              <Button asChild size="lg" variant="ghost"><Link to="/login/admin">Admin Login</Link></Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { k: "4,200+", v: "Active students" },
                { k: "180+", v: "Teaching staff" },
                { k: "98%", v: "Fee transparency" },
              ].map((s) => (
                <div key={s.k}>
                  <div className="text-2xl font-display font-bold">{s.k}</div>
                  <div className="text-xs text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 hidden lg:block">
            <div className="rounded-2xl bg-card border border-border shadow-elevated p-6 space-y-4">
              {[
                { icon: ShieldCheck, t: "Role-based secure access", d: "Student, Teacher, Accountant, Admin" },
                { icon: BookOpen, t: "Academic management", d: "Results, marks, attendance, reports" },
                { icon: Users, t: "Finance ERP", d: "Payments, receipts, allocations" },
                { icon: Award, t: "Real-time insights", d: "Dashboards and analytics for every role" },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="size-9 rounded-md gradient-primary text-primary-foreground grid place-items-center flex-shrink-0">
                    <f.icon className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{f.t}</div>
                    <div className="text-xs text-muted-foreground">{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="programs" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl">Our Programmes</h2>
            <p className="mt-2 text-muted-foreground">World-class education for every learner</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COURSES.map((c) => (
              <Card key={c.code} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-3">{c.code}</Badge>
                  <h3 className="font-semibold mb-2">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                  <div className="mt-4 text-xs text-muted-foreground">{c.level}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="announcements" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display font-bold text-3xl mb-8">Announcements</h2>
          <div className="space-y-4">
            {ANNOUNCEMENTS.map((a) => (
              <Card key={a.id} className="shadow-card">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center flex-shrink-0">
                    <Calendar className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{a.title}</span>
                      <Badge variant="secondary" className="text-[10px]">{a.tag}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{a.date}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display font-bold text-3xl mb-8 text-center">What our community says</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="shadow-card">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground italic">"{t.quote}"</p>
                  <div className="mt-4">
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-display font-bold text-3xl mb-4">Get in touch</h2>
            <p className="text-muted-foreground mb-8">We're here to help. Reach out to our team.</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="size-4" />{INSTITUTION.address}
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Phone className="size-4" />{INSTITUTION.phone}
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Mail className="size-4" />{INSTITUTION.email}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {INSTITUTION.name}. All rights reserved. · {INSTITUTION.motto}
      </footer>
    </div>
  );
}
