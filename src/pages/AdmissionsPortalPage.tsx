import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiClient } from "@/services/api-client";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  User,
  Phone,
  GraduationCap,
  Languages,
  BookOpen,
  Briefcase,
  FileText,
  ClipboardCheck,
  Loader2,
} from "lucide-react";

/* ───────────────── Constants ───────────────── */
const STORAGE_KEY = "horizon_dti_admissions_draft";

const STEPS = [
  { label: "Personal Info", icon: User },
  { label: "Contact Info", icon: Phone },
  { label: "Education", icon: GraduationCap },
  { label: "Language", icon: Languages },
  { label: "Study Preferences", icon: BookOpen },
  { label: "Career Pathway", icon: Briefcase },
  { label: "Documents", icon: FileText },
  { label: "Review & Submit", icon: ClipboardCheck },
] as const;

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const EDUCATION_OPTIONS = [
  "Primary School (KCPE)",
  "Secondary School (KCSE)",
  "Certificate",
  "Diploma",
  "Degree (Bachelor's)",
  "Master's Degree",
  "PhD / Doctorate",
  "Other",
];
const GERMAN_LEVELS = ["None", "A1", "A1.1", "A1.2", "A2", "A2.1", "A2.2", "B1", "B1.1", "B1.2", "B2", "B2.1", "B2.2", "C1", "C2"];
const CAMPUSES = ["Ambwere Centre", "KNP Campus", "Bungoma Town Campus", "CTI Campus", "Virtual / Online"];
const STUDY_MODES = ["Full-Time (Morning)", "Part-Time (Evening)", "Weekend Classes", "Online Only"];
const SCHEDULES = ["Morning (8AM–12PM)", "Afternoon (1PM–5PM)", "Evening (5PM–8PM)", "Saturday Only", "Flexible / Online"];
const INTAKES = ["January Intake", "March Intake", "June Intake", "September Intake"];
const CAREER_PATHWAYS = ["Ausbildung (Vocational Training)", "Au Pair", "Study in Germany", "Healthcare Pathway", "Hospitality Pathway", "Skilled Worker Visa", "Not sure yet"];
const REFERRAL_SOURCES = ["Social Media", "Friend / Family", "Website", "Radio / TV", "School / College", "Agent / Partner", "Other"];

/* ───────────────── Types ───────────────── */
interface FormData {
  // Step 1
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  national_id: string;
  // Step 2
  phone: string;
  alt_phone: string;
  email: string;
  county: string;
  town: string;
  postal_address: string;
  // Step 3
  highest_education: string;
  current_occupation: string;
  employer: string;
  professional_background: string;
  // Step 4
  previous_experience: boolean;
  current_german_level: string;
  // Step 5
  preferred_campus: string;
  study_mode: string;
  preferred_intake: string;
  preferred_schedule: string;
  // Step 6
  career_pathway: string;
  referral_source: string;
}

const INITIAL_FORM: FormData = {
  first_name: "",
  middle_name: "",
  last_name: "",
  gender: "",
  date_of_birth: "",
  nationality: "Kenyan",
  national_id: "",
  phone: "",
  alt_phone: "",
  email: "",
  county: "",
  town: "",
  postal_address: "",
  highest_education: "",
  current_occupation: "",
  employer: "",
  professional_background: "",
  previous_experience: false,
  current_german_level: "None",
  preferred_campus: "",
  study_mode: "",
  preferred_intake: "",
  preferred_schedule: "",
  career_pathway: "",
  referral_source: "",
};

/* ───────────────── Component ───────────────── */
export default function AdmissionsPortalPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...INITIAL_FORM, ...JSON.parse(saved) } : INITIAL_FORM;
  });
  const [files, setFiles] = useState<Record<string, File | null>>({
    id_passport_document: null,
    passport_photo: null,
    academic_certificates: null,
    additional_documents: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleFile = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  /* ── Step Validation ── */
  const validateStep = (s: number): string | null => {
    switch (s) {
      case 0:
        if (!form.first_name.trim()) return "First name is required.";
        if (!form.last_name.trim()) return "Last name is required.";
        if (!form.gender) return "Gender is required.";
        if (!form.date_of_birth) return "Date of birth is required.";
        return null;
      case 1:
        if (!form.phone.trim()) return "Phone number is required.";
        if (!form.email.trim()) return "Email is required.";
        if (!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email address.";
        return null;
      case 2:
        if (!form.highest_education) return "Education level is required.";
        return null;
      case 3:
        return null; // optional
      case 4:
        if (!form.preferred_campus) return "Please select a campus.";
        if (!form.study_mode) return "Please select a study mode.";
        return null;
      case 5:
        if (!form.career_pathway) return "Please select a career pathway.";
        return null;
      case 6:
        return null; // documents optional at application time
      default:
        return null;
    }
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  /* ── Submit ── */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === "boolean") payload.append(k, v ? "true" : "false");
        else payload.append(k, String(v));
      });
      Object.entries(files).forEach(([k, f]) => {
        if (f) payload.append(k, f);
      });
      await apiClient.post("/students/admissions/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      localStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === "object"
          ? Object.values(err.response.data).flat().join(", ")
          : "Submission failed. Please try again.");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success State ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-lg w-full text-center shadow-elevated">
          <CardContent className="p-10 space-y-5">
            <div className="mx-auto size-16 rounded-full bg-success/15 grid place-items-center">
              <CheckCircle2 className="size-8 text-success" />
            </div>
            <h1 className="text-2xl font-display font-bold">Application Submitted!</h1>
            <p className="text-muted-foreground">
              Thank you, <strong>{form.first_name}</strong>. Your application has been received
              and is now in the <Badge variant="secondary">Admissions Queue</Badge>. Our team will
              review your documents and contact you shortly.
            </p>
            <div className="pt-4 flex flex-wrap gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
              <Button asChild className="bg-primary text-primary-foreground">
                <Link to="/login/student">Student Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Render Steps ── */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* Official German Flag Color Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0F172A] via-[#DC2626] to-[#EAB308]" />
      <header className="sticky top-0 z-40 bg-[#0F172A] text-white border-b border-white/10 shadow-md">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Horizon DTI Logo"
              className="h-10 w-auto object-contain bg-white rounded p-1"
            />
            <div className="leading-tight">
              <div className="font-display font-bold text-base tracking-wide text-white">HORIZON DTI</div>
              <div className="text-[11px] uppercase tracking-wider text-[#EAB308] font-semibold">
                Admissions Portal
              </div>
            </div>
          </Link>
          <Button
            asChild
            size="sm"
            className="bg-[#DC2626] hover:bg-[#b91c1c] text-white font-bold border border-[#EAB308]/30"
          >
            <Link to="/login/student">Already enrolled? Sign in</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Stepper */}
        <nav className="mb-10" aria-label="Application Steps">
          <ol className="flex items-center gap-1 overflow-x-auto pb-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <li key={i} className="flex items-center gap-1 flex-shrink-0">
                  {i > 0 && (
                    <div
                      className={`hidden sm:block w-6 h-0.5 ${
                        isDone ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                  <button
                    onClick={() => {
                      if (isDone) setStep(i);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isDone
                        ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                    disabled={!isDone && !isActive}
                  >
                    {isDone ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Icon className="size-3.5" />
                    )}
                    <span className="hidden md:inline">{s.label}</span>
                    <span className="md:hidden">{i + 1}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step Content */}
        <Card className="shadow-elevated border-t-4 border-t-primary">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-display font-bold mb-1">
              Step {step + 1}: {STEPS[step].label}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {step === 0 && "Tell us about yourself."}
              {step === 1 && "How can we reach you?"}
              {step === 2 && "Your educational and professional background."}
              {step === 3 && "Have you studied German before?"}
              {step === 4 && "Where and how would you like to study?"}
              {step === 5 && "What is your intended career pathway?"}
              {step === 6 && "Upload your supporting documents (you can add these later too)."}
              {step === 7 && "Review your application before submitting."}
            </p>

            {/* ──── Step 0: Personal Info ──── */}
            {step === 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    placeholder="e.g. John"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input
                    id="middle_name"
                    value={form.middle_name}
                    onChange={(e) => updateField("middle_name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    placeholder="e.g. Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gender">
                    Gender <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dob">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => updateField("date_of_birth", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={form.nationality}
                    onChange={(e) => updateField("nationality", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="national_id">National ID / Passport Number</Label>
                  <Input
                    id="national_id"
                    value={form.national_id}
                    onChange={(e) => updateField("national_id", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ──── Step 1: Contact Info ──── */}
            {step === 1 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="alt_phone">Alternative Phone</Label>
                  <Input
                    id="alt_phone"
                    type="tel"
                    value={form.alt_phone}
                    onChange={(e) => updateField("alt_phone", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="county">County / Region</Label>
                  <Input
                    id="county"
                    value={form.county}
                    onChange={(e) => updateField("county", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="town">Town / City</Label>
                  <Input
                    id="town"
                    value={form.town}
                    onChange={(e) => updateField("town", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="postal_address">Postal Address</Label>
                  <Textarea
                    id="postal_address"
                    value={form.postal_address}
                    onChange={(e) => updateField("postal_address", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* ──── Step 2: Education ──── */}
            {step === 2 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="highest_education">
                    Highest Level of Education <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.highest_education}
                    onValueChange={(v) => updateField("highest_education", v)}
                  >
                    <SelectTrigger id="highest_education">
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_OPTIONS.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="current_occupation">Current Occupation</Label>
                  <Input
                    id="current_occupation"
                    value={form.current_occupation}
                    onChange={(e) => updateField("current_occupation", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="employer">Employer / Institution</Label>
                  <Input
                    id="employer"
                    value={form.employer}
                    onChange={(e) => updateField("employer", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="professional_background">
                    Professional Background (brief)
                  </Label>
                  <Textarea
                    id="professional_background"
                    value={form.professional_background}
                    onChange={(e) => updateField("professional_background", e.target.value)}
                    rows={3}
                    placeholder="Briefly describe your professional experience..."
                  />
                </div>
              </div>
            )}

            {/* ──── Step 3: Language ──── */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">
                    Have you studied German before?
                  </Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="prev_exp"
                        checked={form.previous_experience === true}
                        onChange={() => updateField("previous_experience", true)}
                        className="accent-primary"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="prev_exp"
                        checked={form.previous_experience === false}
                        onChange={() => updateField("previous_experience", false)}
                        className="accent-primary"
                      />
                      No
                    </label>
                  </div>
                </div>
                {form.previous_experience && (
                  <div className="space-y-1.5 max-w-xs">
                    <Label htmlFor="current_german_level">Current German Level</Label>
                    <Select
                      value={form.current_german_level}
                      onValueChange={(v) => updateField("current_german_level", v)}
                    >
                      <SelectTrigger id="current_german_level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {GERMAN_LEVELS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* ──── Step 4: Study Preferences ──── */}
            {step === 4 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_campus">
                    Preferred Campus <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.preferred_campus}
                    onValueChange={(v) => updateField("preferred_campus", v)}
                  >
                    <SelectTrigger id="preferred_campus">
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPUSES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="study_mode">
                    Study Mode <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.study_mode}
                    onValueChange={(v) => updateField("study_mode", v)}
                  >
                    <SelectTrigger id="study_mode">
                      <SelectValue placeholder="Select study mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_MODES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_intake">Preferred Intake</Label>
                  <Select
                    value={form.preferred_intake}
                    onValueChange={(v) => updateField("preferred_intake", v)}
                  >
                    <SelectTrigger id="preferred_intake">
                      <SelectValue placeholder="Select intake" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTAKES.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_schedule">Preferred Schedule</Label>
                  <Select
                    value={form.preferred_schedule}
                    onValueChange={(v) => updateField("preferred_schedule", v)}
                  >
                    <SelectTrigger id="preferred_schedule">
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ──── Step 5: Career Pathway ──── */}
            {step === 5 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="career_pathway">
                    Career Pathway <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.career_pathway}
                    onValueChange={(v) => updateField("career_pathway", v)}
                  >
                    <SelectTrigger id="career_pathway">
                      <SelectValue placeholder="Select pathway" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAREER_PATHWAYS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="referral_source">How did you hear about us?</Label>
                  <Select
                    value={form.referral_source}
                    onValueChange={(v) => updateField("referral_source", v)}
                  >
                    <SelectTrigger id="referral_source">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {REFERRAL_SOURCES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ──── Step 6: Documents ──── */}
            {step === 6 && (
              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  { key: "id_passport_document", label: "National ID / Passport Copy" },
                  { key: "passport_photo", label: "Passport-size Photo" },
                  { key: "academic_certificates", label: "Academic Certificates" },
                  { key: "additional_documents", label: "Additional Documents (optional)" },
                ].map((doc) => (
                  <div key={doc.key} className="space-y-1.5">
                    <Label htmlFor={doc.key}>{doc.label}</Label>
                    <Input
                      id={doc.key}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) =>
                        handleFile(doc.key, e.target.files?.[0] || null)
                      }
                      className="file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-medium cursor-pointer"
                    />
                    {files[doc.key] && (
                      <p className="text-xs text-success flex items-center gap-1">
                        <Check className="size-3" /> {files[doc.key]!.name}
                      </p>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Accepted formats: JPG, PNG, PDF, DOC. Max 5 MB per file. You can also upload
                  documents later from your student portal.
                </p>
              </div>
            )}

            {/* ──── Step 7: Review ──── */}
            {step === 7 && (
              <div className="space-y-6">
                {[
                  {
                    title: "Personal Information",
                    items: [
                      ["Full Name", `${form.first_name} ${form.middle_name} ${form.last_name}`.trim()],
                      ["Gender", form.gender],
                      ["Date of Birth", form.date_of_birth],
                      ["Nationality", form.nationality],
                      ["National ID", form.national_id || "—"],
                    ],
                  },
                  {
                    title: "Contact Information",
                    items: [
                      ["Phone", form.phone],
                      ["Alt Phone", form.alt_phone || "—"],
                      ["Email", form.email],
                      ["Location", [form.town, form.county].filter(Boolean).join(", ") || "—"],
                    ],
                  },
                  {
                    title: "Education & Background",
                    items: [
                      ["Education", form.highest_education],
                      ["Occupation", form.current_occupation || "—"],
                      ["Employer", form.employer || "—"],
                    ],
                  },
                  {
                    title: "German Language",
                    items: [
                      ["Previous Experience", form.previous_experience ? "Yes" : "No"],
                      ["Current Level", form.current_german_level],
                    ],
                  },
                  {
                    title: "Study Preferences",
                    items: [
                      ["Campus", form.preferred_campus],
                      ["Mode", form.study_mode],
                      ["Intake", form.preferred_intake || "—"],
                      ["Schedule", form.preferred_schedule || "—"],
                    ],
                  },
                  {
                    title: "Career Pathway",
                    items: [
                      ["Pathway", form.career_pathway],
                      ["Referral", form.referral_source || "—"],
                    ],
                  },
                  {
                    title: "Documents",
                    items: [
                      ["ID / Passport", files.id_passport_document?.name || "Not uploaded"],
                      ["Photo", files.passport_photo?.name || "Not uploaded"],
                      ["Certificates", files.academic_certificates?.name || "Not uploaded"],
                      ["Additional", files.additional_documents?.name || "Not uploaded"],
                    ],
                  },
                ].map((section) => (
                  <div key={section.title}>
                    <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">
                      {section.title}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                      {section.items.map(([label, value]) => (
                        <div key={label} className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-sm">
                  <p className="font-medium text-accent-foreground">
                    By submitting this application, I confirm that the information provided is
                    true and accurate. I understand that my application will be reviewed by the
                    Horizon DTI Admissions Team.
                  </p>
                </div>
              </div>
            )}

            {/* ──── Navigation ──── */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={step === 0}
                className="gap-1.5"
              >
                <ArrowLeft className="size-4" /> Back
              </Button>

              <span className="text-xs text-muted-foreground hidden sm:inline">
                Step {step + 1} of {STEPS.length}
              </span>

              {step < STEPS.length - 1 ? (
                <Button onClick={goNext} className="gap-1.5 bg-primary text-primary-foreground">
                  Next <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-1.5 bg-primary hover:bg-primary-glow text-primary-foreground font-bold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      Submit Application <Check className="size-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Auto-save indicator */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Your progress is automatically saved to this browser.
        </p>
      </div>
    </div>
  );
}
