import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INSTITUTION, COURSES, TESTIMONIALS, ANNOUNCEMENTS } from "@/lib/sample-data";
import { GraduationCap, ShieldCheck, Sparkles, BookOpen, Users, Award, Phone, Mail, MapPin, ArrowRight, Calendar } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${INSTITUTION.name} — ${INSTITUTION.tagline}` },
      { name: "description", content: `${INSTITUTION.name}: an integrated learning and finance management portal for students, teachers and administrators.` },
      { property: "og:title", content: `${INSTITUTION.name} — ${INSTITUTION.tagline}` },
      { property: "og:description", content: INSTITUTION.motto },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
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

      {/* Hero */}
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
                <div key={s.v}>
                  <div className="text-2xl font-display font-bold">{s.k}</div>
                  <div className="text-xs text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 gradient-primary opacity-20 blur-3xl rounded-3xl" />
              <Card className="relative shadow-elevated border-border/60 overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4 text-primary" /> Today at Horizon</div>
                  <Badge variant="secondary">Live</Badge>
                </div>
                <CardContent className="p-5 space-y-4">
                  {[
                    { icon: BookOpen, label: "Lessons in session", value: "42 / 56" },
                    { icon: Users, label: "Attendance today", value: "96.4%" },
                    { icon: Award, label: "Top performer (Form 3)", value: "Amani Wanjiru — 86.4%" },
                    { icon: Calendar, label: "Next event", value: "Parents' Day · Jun 14" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-md bg-card border border-border grid place-items-center">
                          <row.icon className="size-4 text-primary" />
                        </div>
                        <div className="text-sm text-muted-foreground">{row.label}</div>
                      </div>
                      <div className="text-sm font-semibold">{row.value}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-3 gap-10">
          <div>
            <h2 className="text-3xl font-display font-bold">A school that runs on clarity.</h2>
          </div>
          <div className="md:col-span-2 text-muted-foreground leading-relaxed">
            Founded in {INSTITUTION.established}, {INSTITUTION.name} combines academic rigour with modern
            operations. Our portal unifies learning management with finance — so parents see every shilling, teachers
            close the gradebook on time, and administrators steer the institution with real numbers.
            <div className="mt-6 flex flex-wrap gap-2">
              {["KCSE", "Cambridge IGCSE", "Boarding", "TVET", "Sports Academy"].map((t) => (
                <Badge key={t} variant="outline" className="rounded-full">{t}</Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-sm text-primary font-medium">Programmes</div>
            <h2 className="text-3xl font-display font-bold mt-1">Pathways that fit every learner</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {COURSES.map((c) => (
            <Card key={c.code} className="shadow-card hover:shadow-elevated transition-shadow border-border/60">
              <CardContent className="p-6">
                <div className="size-10 rounded-lg gradient-primary grid place-items-center text-primary-foreground mb-4">
                  <BookOpen className="size-5" />
                </div>
                <div className="text-xs text-muted-foreground">{c.level}</div>
                <div className="font-semibold mt-1">{c.name}</div>
                <p className="text-sm text-muted-foreground mt-2">{c.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Announcements */}
      <section id="announcements" className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-sm text-primary font-medium">Announcements</div>
          <h2 className="text-3xl font-display font-bold mt-1 mb-8">Latest from the office</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {ANNOUNCEMENTS.map((a) => (
              <Card key={a.id} className="shadow-card border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{a.tag}</Badge>
                    <span className="text-xs text-muted-foreground">{a.date}</span>
                  </div>
                  <h3 className="mt-3 font-semibold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{a.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-sm text-primary font-medium">Voices</div>
        <h2 className="text-3xl font-display font-bold mt-1 mb-8">What our community says</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="shadow-card border-border/60">
              <CardContent className="p-6">
                <p className="italic text-foreground/90">"{t.quote}"</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-3 gap-6">
          {[
            { icon: MapPin, t: "Address", v: INSTITUTION.address },
            { icon: Phone, t: "Phone", v: INSTITUTION.phone },
            { icon: Mail, t: "Email", v: INSTITUTION.email },
          ].map((c) => (
            <div key={c.t} className="flex items-start gap-4">
              <div className="size-10 rounded-lg bg-card border border-border grid place-items-center">
                <c.icon className="size-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{c.t}</div>
                <div className="font-semibold">{c.v}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md gradient-primary grid place-items-center text-primary-foreground"><GraduationCap className="size-4" /></div>
            <span>© {new Date().getFullYear()} {INSTITUTION.name}. {INSTITUTION.motto}.</span>
          </div>
          <div className="flex gap-5">
            <Link to="/login/student" className="hover:text-foreground">Student</Link>
            <Link to="/login/staff" className="hover:text-foreground">Staff</Link>
            <Link to="/login/admin" className="hover:text-foreground">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
