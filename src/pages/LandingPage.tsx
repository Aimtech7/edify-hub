import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INSTITUTION, COURSES, TESTIMONIALS, ANNOUNCEMENTS, CEFR_LEVELS, CEFR_LEVEL_INFO } from "@/lib/sample-data";
import { GraduationCap, ShieldCheck, Sparkles, BookOpen, Users, Award, Phone, Mail, MapPin, ArrowRight, Calendar, TrendingUp } from "lucide-react";

const BAND_COLORS: Record<string, string> = {
  Beginner:     "bg-blue-100 text-blue-700 border-blue-200",
  Intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  Advanced:     "bg-green-100 text-green-700 border-green-200",
};

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
              <div className="text-[11px] text-muted-foreground">German Language Institute · LMS & ERP</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#levels"        className="hover:text-foreground">CEFR Levels</a>
            <a href="#programs"      className="hover:text-foreground">Programmes</a>
            <a href="#announcements" className="hover:text-foreground">News</a>
            <a href="#contact"       className="hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login/student">Student</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/login/staff">Instructor</Link></Button>
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
              <Sparkles className="size-3.5 mr-1.5" /> Est. {INSTITUTION.established} · CEFR A1 – C2 Certified
            </Badge>
            <h1 className="font-display font-extrabold text-5xl md:text-6xl leading-[1.05] tracking-tight">
              Mastering German,{" "}
              <span className="text-gradient">Opening Worlds</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              {INSTITUTION.name} offers structured German language training from A1 to C2. Track your progression,
              manage fees, and access results — all in one platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elevated">
                <Link to="/login/student">Student Portal <ArrowRight className="size-4 ml-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline"><Link to="/login/staff">Instructor Login</Link></Button>
              <Button asChild size="lg" variant="ghost"><Link to="/login/admin">Admin</Link></Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { k: "1,200+", v: "Active students" },
                { k: "6",      v: "CEFR levels" },
                { k: "98%",    v: "Pass rate" },
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
                { icon: ShieldCheck, t: "Role-based secure access",       d: "Student, Instructor, Accountant, Admin" },
                { icon: TrendingUp,  t: "CEFR level progression tracking", d: "A1 → A2 → B1 → B2 → C1 → C2 with history" },
                { icon: BookOpen,    t: "Language skills assessment",       d: "Sprechen, Hören, Lesen, Schreiben, Grammatik" },
                { icon: Award,       t: "Certificates & Goethe prep",       d: "Official exam registration and certification" },
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

      {/* CEFR Levels */}
      <section id="levels" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl">CEFR Language Levels</h2>
            <p className="mt-2 text-muted-foreground">Our structured progression from complete beginner to mastery</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CEFR_LEVELS.map((lvl) => {
              const info = CEFR_LEVEL_INFO[lvl];
              return (
                <Card key={lvl} className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-display font-extrabold">{lvl}</span>
                      <Badge className={`text-[10px] border ${BAND_COLORS[info.band]}`}>{info.band}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{info.label.split("–")[1]?.trim()}</h3>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                    <div className="mt-4 text-xs text-muted-foreground">{info.durationWeeks} weeks · approx. 80–120 hours</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section id="programs" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl">Our Programmes</h2>
            <p className="mt-2 text-muted-foreground">Flexible pathways for every learner's goal</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COURSES.map((c) => (
              <Card key={c.code} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-3">{c.code}</Badge>
                  <h3 className="font-semibold mb-2">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                  <div className="mt-4 text-xs text-muted-foreground font-medium">{c.level}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section id="announcements" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display font-bold text-3xl mb-8">Latest News</h2>
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

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
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

      {/* Contact */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-display font-bold text-3xl mb-4">Get in touch</h2>
            <p className="text-muted-foreground mb-8">Enroll or enquire — our team responds within one business day.</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-center gap-2 text-muted-foreground"><MapPin className="size-4" />{INSTITUTION.address}</div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground"><Phone className="size-4" />{INSTITUTION.phone}</div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground"><Mail className="size-4" />{INSTITUTION.email}</div>
            </div>
            <Button asChild size="lg" className="mt-8 gradient-primary text-primary-foreground">
              <Link to="/login/student">Enroll now <ArrowRight className="size-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {INSTITUTION.name}. All rights reserved. · {INSTITUTION.motto}
      </footer>
    </div>
  );
}
