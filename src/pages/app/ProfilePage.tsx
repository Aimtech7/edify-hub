import React, { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { useCurrentUser } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STUDENTS, CEFR_LEVEL_INFO } from "@/lib/sample-data";
import { Mail, Phone, GraduationCap, User as UserIcon, Globe, Calendar, Award, Send, CheckCircle2 } from "lucide-react";
import type { CefrLevel } from "@/types";

export default function ProfilePage() {
  const user = useCurrentUser();
  const [showModal, setShowModal] = useState(false);
  const [newPhone, setNewPhone] = useState("+254 700 000000");
  const [newAddress, setNewAddress] = useState("Nairobi, Kenya");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;
  const student = STUDENTS.find((s) => s.admissionNo === user.admissionNo);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setShowModal(false);
      setSubmitted(false);
      alert("Profile update request submitted to Horizon Academic Registry successfully!");
    }, 1200);
  };

  return (
    <>
      <PageHeader
        title="My Profile"
        description="Personal information and learning record."
        action={<Button variant="outline" onClick={() => setShowModal(true)}>Request update</Button>}
      />
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Avatar card */}
        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <div className="size-20 mx-auto rounded-full gradient-primary text-primary-foreground grid place-items-center text-2xl font-bold">
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <h3 className="mt-4 font-semibold">{user.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{user.role === "teacher" ? "Instructor" : user.role}</p>
            {student && (
              <div className="mt-3">
                <Badge variant="outline" className="text-sm font-bold">{student.level}</Badge>
                <div className="text-xs text-muted-foreground mt-1">{CEFR_LEVEL_INFO[student.level].band} · {student.batch}</div>
              </div>
            )}
            <div className="mt-4 text-sm space-y-2 text-left">
              <Row icon={UserIcon} label="Username" value={user.username} />
              <Row icon={Mail}     label="Email"    value={user.email ?? "—"} />
              {student && <>
                <Row icon={GraduationCap} label="Level"      value={student.level} />
                <Row icon={Calendar}      label="Enrolled"   value={student.enrolledDate} />
                <Row icon={Phone}         label="Phone"      value={student.phone} />
              </>}
            </div>
          </CardContent>
        </Card>

        {/* Detail card */}
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">{student ? "Student information" : "Account details"}</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Item label="Full name"   value={user.name} />
              <Item label="Username"    value={user.username} />
              <Item label="Role"        value={user.role === "teacher" ? "Instructor" : user.role} />
              <Item label="Email"       value={user.email ?? "—"} />
              {student && <>
                <Item label="Student No."      value={student.admissionNo} />
                <Item label="Current Level"    value={`${student.level} — ${CEFR_LEVEL_INFO[student.level].label}`} />
                <Item label="Batch / Cohort"   value={student.batch} />
                <Item label="Instructor"       value={student.instructor} />
                <Item label="Intake"           value={(student as any).intake || "January 2026 Intake"} />
                <Item label="Career Pathway"   value={(student as any).careerPathway || "Ausbildung"} />
                <Item label="Academic Advisor" value={(student as any).advisor || "Unassigned"} />
                <Item label="Gender"           value={student.gender === "F" ? "Female" : "Male"} />
                <Item label="Nationality"      value={student.nationality} icon={<Globe className="size-3.5" />} />
                <Item label="Enrolled"         value={student.enrolledDate} />
                <Item label="Exp. completion"  value={student.expectedCompletion} />
              </>}
            </dl>

            {student && (
              <>
                <h3 className="font-semibold mt-8 mb-4 flex items-center gap-2"><Award className="size-4 text-primary" />CEFR Progression history</h3>
                <div className="space-y-2">
                  {student.progressionHistory.map((ev) => (
                    <div key={ev.level} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                      <div className={`size-9 rounded-full border-2 grid place-items-center text-xs font-bold flex-shrink-0
                        ${ev.status === "completed" ? "bg-success/15 border-success text-success" :
                          ev.status === "active"    ? "gradient-primary text-primary-foreground border-primary" :
                          "bg-muted border-border text-muted-foreground"}`}>
                        {ev.level}
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="font-medium">Level {ev.level} — {CEFR_LEVEL_INFO[ev.level as CefrLevel].label.split("–")[1]?.trim()}</div>
                        <div className="text-xs text-muted-foreground">
                          Enrolled: {ev.enrolledDate}
                          {ev.completedDate && ` · Completed: ${ev.completedDate}`}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {ev.finalScore !== undefined && <div className="font-semibold">{ev.finalScore}%</div>}
                        {ev.certificateNo && <div className="text-[10px] text-muted-foreground font-mono">{ev.certificateNo}</div>}
                        {ev.status === "active" && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Active</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-card-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> Request Profile Update
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto animate-bounce" />
                <p className="font-semibold text-lg">Submitting Request...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4 text-sm">
                <p className="text-xs text-muted-foreground">
                  Changes to official institutional records require verification by the Academic Registry or Human Resources.
                </p>
                <div>
                  <label className="block text-xs font-semibold mb-1">Updated Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Current Residential Address</label>
                  <input
                    type="text"
                    required
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Reason for Change / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Moved to a new apartment or changed mobile carrier..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="default" className="flex items-center gap-1.5">
                    <Send className="w-4 h-4" /> Submit Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-3.5" />
      <span className="text-xs">{label}:</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function Item({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
