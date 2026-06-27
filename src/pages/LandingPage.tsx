import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INSTITUTION, COURSES, TESTIMONIALS, ANNOUNCEMENTS, CEFR_LEVELS, CEFR_LEVEL_INFO } from "@/lib/sample-data";
import { GraduationCap, ShieldCheck, Sparkles, BookOpen, Users, Award, Phone, Mail, MapPin, ArrowRight, Calendar, TrendingUp, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/services/api-client";

const BAND_COLORS: Record<string, string> = {
  Beginner:     "bg-blue-100 text-blue-700 border-blue-200",
  Intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  Advanced:     "bg-green-100 text-green-700 border-green-200",
};

export default function LandingPage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Attempt to load live profile from backend, fallback to constants
    apiClient.get('/core/institution/profile/').then(res => {
      setProfile(res.data);
    }).catch(() => {
      // Ignore
    });
  }, []);

  const instName = profile?.name || INSTITUTION.name;
  const instPhone = profile?.phone_primary || INSTITUTION.phone;
  const instEmail = profile?.email_primary || INSTITUTION.email;
  const instAddress = profile?.physical_address || INSTITUTION.address;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-secondary text-secondary-foreground border-b border-border shadow-md">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Horizon DTI Logo" className="h-10 w-auto object-contain bg-white rounded p-1" />
            <div className="leading-tight">
              <div className="font-display font-bold text-base tracking-wide">HORIZON DTI</div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Deutsch Training Institute</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-secondary-foreground/80">
            <a href="#about"         className="hover:text-accent transition-colors">About Us</a>
            <a href="#levels"        className="hover:text-accent transition-colors">Language Levels</a>
            <a href="#programs"      className="hover:text-accent transition-colors">Career Pathways</a>
            <a href="#campuses"      className="hover:text-accent transition-colors">Campuses</a>
            <a href="#contact"       className="hover:text-accent transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hover:text-accent hover:bg-white/10"><Link to="/login/student">Student Portal</Link></Button>
            <Button asChild variant="ghost" size="sm" className="hover:text-accent hover:bg-white/10"><Link to="/login/parent">Parent Portal</Link></Button>
            <Button asChild variant="ghost" size="sm" className="hover:text-accent hover:bg-white/10"><Link to="/login/staff">Staff Portal</Link></Button>
            <Button asChild size="sm" className="bg-primary hover:bg-primary-glow text-primary-foreground font-bold shadow-sm"><Link to="/login/admin">Admin</Link></Button>
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
              <Sparkles className="size-3.5 mr-1.5" /> Official German Certification Center
            </Badge>
            <h1 className="font-display font-extrabold text-5xl md:text-6xl leading-[1.05] tracking-tight">
              Mastering German,{" "}
              <span className="text-primary">Opening Worlds</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              HORIZON DEUTSCH TRAINING INSTITUTE offers structured German language training from A1 to C2. Prepare for your future in Germany with our expert instructors and comprehensive career pathways.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary-glow text-primary-foreground shadow-elevated font-bold">
                <Link to="/admissions">Admissions Portal <ArrowRight className="size-4 ml-2" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"><a href="#programs">Explore Pathways</a></Button>
            </div>
          </div>
          <div className="lg:col-span-5 hidden lg:block">
            <div className="rounded-2xl bg-card border border-border shadow-elevated p-6 space-y-4">
              {[
                { icon: ShieldCheck, t: "Official Exam Prep",       d: "Goethe, ÖSD, TELC preparation" },
                { icon: TrendingUp,  t: "Career Pathways", d: "Ausbildung, Au Pair, Study in Germany" },
                { icon: BookOpen,    t: "Digital Library",       d: "Access to rich learning resources" },
                { icon: Award,       t: "Verifiable Certificates",       d: "QR-code enabled authentic certificates" },
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

      {/* About Us */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="font-display font-bold text-3xl mb-4">About HORIZON DTI</h2>
          <p className="max-w-3xl mx-auto text-muted-foreground leading-relaxed text-lg">
            We are the premier German language training institute in the region, dedicated to equipping individuals with the linguistic skills and cultural knowledge necessary to thrive in German-speaking countries. Our rigorous curriculum, aligned with the Common European Framework of Reference (CEFR), is taught by highly qualified instructors utilizing modern pedagogies and immersive techniques.
          </p>
        </div>
      </section>

      {/* CEFR Levels */}
      <section id="levels" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl">German Language Levels</h2>
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

      {/* Career Pathways */}
      <section id="programs" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl">Career Pathways in Germany</h2>
            <p className="mt-2 text-muted-foreground">We offer end-to-end guidance for your professional journey</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Ausbildung (Vocational)", desc: "Dual vocational training programs in Germany. Earn while you learn with our dedicated placement support." },
              { title: "Au Pair", desc: "Cultural exchange programs for young adults. We help you find a trusted host family in Germany." },
              { title: "Study in Germany", desc: "University admission support, visa guidance, and academic pathway planning for Bachelors and Masters." },
              { title: "Healthcare Pathway", desc: "Specialized language training and licensing support for Nurses and Medical Professionals." },
              { title: "Hospitality Pathway", desc: "Direct placements into the German hospitality and tourism sector." },
              { title: "Skilled Worker Visa", desc: "Fast-track language integration for experienced professionals seeking employment." },
            ].map((p, i) => (
               <Card key={i} className="shadow-card border-t-4 border-t-primary">
                 <CardContent className="p-6">
                   <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                   <p className="text-sm text-muted-foreground">{p.desc}</p>
                 </CardContent>
               </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Campuses & Facilities */}
      <section id="campuses" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="font-display font-bold text-3xl">Our Campuses</h2>
              <p className="mt-2 text-muted-foreground">State-of-the-art facilities across the country</p>
            </div>
            <Button variant="outline">Schedule a Tour</Button>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
             {["Ambwere Centre", "KNP Campus", "Bungoma Town Campus", "CTI Campus", "Virtual / Online"].map((camp, i) => (
                <div key={i} className="p-6 rounded-xl border border-border bg-card flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors">
                  <MapPin className="size-6 text-primary mb-3" />
                  <div className="font-semibold">{camp}</div>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* Testimonials & Success Stories */}
      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display font-bold text-3xl mb-8 text-center">Student Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="shadow-card">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground italic">"{t.quote}"</p>
                  <div className="mt-4">
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-primary font-medium">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display font-bold text-3xl mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 text-left">
            {[
              {q: "When is the next intake?", a: "We have multiple intakes throughout the year including January, March, June, and September. Please contact admissions for specific cohort start dates."},
              {q: "Do you assist with visa applications?", a: "Yes! Our Academic Advisors provide comprehensive guidance on visa requirements for Ausbildung, Study, and Au Pair pathways."},
              {q: "How long does it take to reach B2?", a: "Typically, an intensive progression from A1 to B2 takes approximately 8 to 10 months of dedicated study."},
            ].map((f, i) => (
              <div key={i} className="p-5 rounded-lg border border-border bg-card">
                <div className="font-semibold flex items-center gap-2"><HelpCircle className="size-4 text-primary" /> {f.q}</div>
                <div className="text-sm text-muted-foreground mt-2 pl-6">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Admissions */}
      <section id="contact" className="py-20 bg-secondary text-secondary-foreground border-t-8 border-primary">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-display font-bold text-3xl mb-4 text-accent">Start Your Journey Today</h2>
            <p className="text-secondary-foreground/80 mb-8">Enroll or enquire — our admissions team responds within one business day.</p>
            <div className="space-y-3 text-sm mb-10">
              <div className="flex items-center justify-center gap-2"><MapPin className="size-4 text-accent" />{instAddress}</div>
              <div className="flex items-center justify-center gap-2"><Phone className="size-4 text-accent" />{instPhone}</div>
              <div className="flex items-center justify-center gap-2"><Mail className="size-4 text-accent" />{instEmail}</div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary-glow text-primary-foreground font-bold">
                <Link to="/admissions">Admissions Portal</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-secondary hover:bg-secondary-foreground hover:text-secondary border-secondary-foreground/20">
                <a href={`mailto:${instEmail}`}>Email Us</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground bg-background">
        © {new Date().getFullYear()} {instName}. All rights reserved. {profile?.tagline && `· ${profile.tagline}`}
      </footer>
    </div>
  );
}
