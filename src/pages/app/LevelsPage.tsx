import { useState } from "react";
import { useCurrentUser } from "@/components/app-shell";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { STUDENTS, CEFR_LEVELS, CEFR_LEVEL_INFO, BATCHES } from "@/lib/sample-data";
import { TrendingUp, Users, Award, Clock, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Student, CefrLevel } from "@/types";

const LEVEL_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
function nextLevel(lvl: CefrLevel): CefrLevel | null {
  const i = LEVEL_ORDER.indexOf(lvl);
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null;
}

const BAND_BG: Record<string, string> = {
  Beginner:     "border-blue-200  bg-blue-50   text-blue-700",
  Intermediate: "border-amber-200 bg-amber-50  text-amber-700",
  Advanced:     "border-green-200 bg-green-50  text-green-700",
};

export default function LevelsPage() {
  const user = useCurrentUser();
  if (!user) return null;
  if (user.role === "student") return <StudentProgress />;
  return <InstructorLevels editable={user.role === "teacher" || user.role === "admin"} />;
}

/* ─────────────────── Student view ─────────────────── */
function StudentProgress() {
  const user = useCurrentUser()!;
  const me = STUDENTS.find((s) => s.admissionNo === user.admissionNo) ?? STUDENTS[0];
  const completed = me.progressionHistory.filter((e) => e.status === "completed").length;
  const levelInfo = CEFR_LEVEL_INFO[me.level];

  return (
    <>
      <PageHeader title="My Language Progress" description={`CEFR level progression · ${me.admissionNo}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Current Level"   value={me.level}          hint={levelInfo.band}              tone="info"    icon={<TrendingUp className="size-5" />} />
        <StatCard label="Levels Passed"   value={`${completed} / 6`} hint="CEFR path completed"        tone="success" icon={<Award className="size-5" />} />
        <StatCard label="Current Batch"   value={me.batch}                                                             icon={<Users className="size-5" />} />
        <StatCard label="Est. Completion" value={me.expectedCompletion}                                 tone="warning" icon={<Clock className="size-5" />} />
      </div>

      {/* CEFR path */}
      <Card className="shadow-card mb-6">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-6">Your CEFR journey</h3>
          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-border -z-0" />
            <div className="flex justify-between relative z-10">
              {LEVEL_ORDER.map((lvl) => {
                const event = me.progressionHistory.find((e) => e.level === lvl);
                const status = event?.status ?? "upcoming";
                return (
                  <div key={lvl} className="flex flex-col items-center gap-2 w-16">
                    <div className={`size-10 rounded-full border-2 grid place-items-center text-xs font-bold shadow-sm
                      ${status === "completed" ? "bg-success/15 border-success text-success" :
                        status === "active"    ? "gradient-primary text-primary-foreground border-transparent shadow-md" :
                        "bg-background border-border text-muted-foreground"}`}>
                      {status === "completed" ? <CheckCircle2 className="size-5" /> : lvl}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold">{lvl}</div>
                      <div className="text-[10px] text-muted-foreground">{CEFR_LEVEL_INFO[lvl].band.split(" ")[0]}</div>
                      {status === "completed" && event?.finalScore !== undefined && (
                        <div className="text-[10px] text-success font-medium">{event.finalScore}%</div>
                      )}
                      {status === "active" && (
                        <Badge className="text-[9px] px-1.5 mt-0.5 bg-primary/10 text-primary border-primary/20">Now</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed history */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Progression history</h3>
          <div className="space-y-3">
            {me.progressionHistory.map((ev) => {
              const info = CEFR_LEVEL_INFO[ev.level];
              return (
                <div key={ev.level} className={`p-4 rounded-xl border ${ev.status === "active" ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`size-10 rounded-full border-2 grid place-items-center text-sm font-bold flex-shrink-0
                      ${ev.status === "completed" ? "bg-success/15 border-success text-success" :
                        ev.status === "active"    ? "gradient-primary text-primary-foreground border-transparent" :
                        "bg-muted border-border text-muted-foreground"}`}>
                      {ev.status === "completed" ? "✓" : ev.level}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Level {ev.level}</span>
                        <Badge className={`text-[10px] border ${BAND_BG[info.band]}`}>{info.band}</Badge>
                        {ev.status === "active" && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">In progress</Badge>}
                        {ev.status === "completed" && <Badge className="text-[10px] bg-success/10 text-success border-success/20">Completed</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Enrolled: <strong className="text-foreground">{ev.enrolledDate}</strong></span>
                        {ev.completedDate && <span>Completed: <strong className="text-foreground">{ev.completedDate}</strong></span>}
                        {ev.finalScore !== undefined && <span>Final score: <strong className="text-foreground">{ev.finalScore}%</strong></span>}
                        {ev.certificateNo && <span>Cert: <strong className="font-mono text-foreground">{ev.certificateNo}</strong></span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/* ─────────────────── Instructor / Admin view ─────────────────── */
function InstructorLevels({ editable }: { editable: boolean }) {
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [promoteTarget, setPromoteTarget] = useState<Student | null>(null);

  const list = filterLevel === "all" ? STUDENTS : STUDENTS.filter((s) => s.level === filterLevel);

  const handlePromote = () => {
    if (!promoteTarget) return;
    const next = nextLevel(promoteTarget.level);
    if (next) {
      toast.success(`${promoteTarget.name} promoted from ${promoteTarget.level} → ${next}`);
    }
    setPromoteTarget(null);
  };

  // Summary: students per level
  const countByLevel = LEVEL_ORDER.reduce<Record<CefrLevel, number>>(
    (acc, l) => ({ ...acc, [l]: STUDENTS.filter((s) => s.level === l).length }),
    {} as Record<CefrLevel, number>
  );

  return (
    <>
      <PageHeader
        title="Language Levels"
        description="Manage CEFR level groups, track progression, and promote students."
      />

      {/* Level overview cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {LEVEL_ORDER.map((lvl) => {
          const info = CEFR_LEVEL_INFO[lvl];
          const batches = BATCHES[lvl];
          return (
            <button
              key={lvl}
              onClick={() => setFilterLevel(filterLevel === lvl ? "all" : lvl)}
              className={`rounded-xl border p-4 text-left transition-all shadow-sm hover:shadow-md ${
                filterLevel === lvl ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card"
              }`}
            >
              <div className="text-xl font-display font-extrabold">{lvl}</div>
              <div className={`text-[10px] mt-0.5 px-1.5 py-0.5 rounded border inline-block ${BAND_BG[info.band]}`}>{info.band}</div>
              <div className="text-2xl font-bold mt-2">{countByLevel[lvl]}</div>
              <div className="text-xs text-muted-foreground">students</div>
              <div className="text-[10px] text-muted-foreground mt-1">{batches.length} batch{batches.length !== 1 ? "es" : ""}</div>
            </button>
          );
        })}
      </div>

      {/* Promotion eligibility summary */}
      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Enrolled"    value={STUDENTS.length}                              icon={<Users className="size-5" />} />
        <StatCard label="Promotion Ready"   value={STUDENTS.filter((s) => s.progressionHistory.some((e) => e.status === "completed" && e.finalScore && e.finalScore >= 75)).length} tone="success" icon={<Award className="size-5" />} />
        <StatCard label="C2 (Mastery)"      value={countByLevel["C2"]}                           tone="info"    icon={<TrendingUp className="size-5" />} />
        <StatCard label="Needs attention"   value={STUDENTS.filter((s) => s.totalFees - s.paid > 0).length} tone="warning" icon={<AlertCircle className="size-5" />} />
      </div>

      {/* Batch filter */}
      <Card className="shadow-card mb-4">
        <CardContent className="p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter by level:</label>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-52"><SelectValue placeholder="All levels" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels ({STUDENTS.length} students)</SelectItem>
              {LEVEL_ORDER.map((l) => (
                <SelectItem key={l} value={l}>Level {l} — {CEFR_LEVEL_INFO[l].band} ({countByLevel[l]})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto text-sm text-muted-foreground">{list.length} student{list.length !== 1 ? "s" : ""}</div>
        </CardContent>
      </Card>

      {/* Student table */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student No.</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Levels done</TableHead>
                <TableHead>Next level</TableHead>
                {editable && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((s) => {
                const info     = CEFR_LEVEL_INFO[s.level];
                const next     = nextLevel(s.level);
                const done     = s.progressionHistory.filter((e) => e.status === "completed").length;
                const lastScore = s.progressionHistory.find((e) => e.level === s.level)?.finalScore;

                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold flex-shrink-0">
                          {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{s.name}</div>
                          <div className="text-[11px] text-muted-foreground">{s.nationality}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{s.level}</span>
                        <Badge className={`text-[10px] border ${BAND_BG[info.band]}`}>{info.band}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.batch}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.instructor}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.enrolledDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {LEVEL_ORDER.slice(0, done).map((l) => (
                          <div key={l} className="size-5 rounded-full bg-success/15 border border-success/30 grid place-items-center" title={l}>
                            <span className="text-[8px] font-bold text-success">{l}</span>
                          </div>
                        ))}
                        {done === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {next
                        ? <Badge variant="outline" className="text-xs">{next}</Badge>
                        : <span className="text-xs text-muted-foreground">Mastery</span>}
                    </TableCell>
                    {editable && (
                      <TableCell className="text-right">
                        {next ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-primary border-primary/30 hover:bg-primary/5"
                            onClick={() => setPromoteTarget(s)}
                          >
                            <ChevronRight className="size-3.5 mr-1" />Promote
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-success">
                            <Award className="size-3.5 mr-1" />Certify
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={editable ? 9 : 8} className="text-center text-muted-foreground py-8">
                    No students in this level.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-level detail accordion */}
      {filterLevel !== "all" && (
        <Card className="shadow-card mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1">Level {filterLevel} — Batches</h3>
            <p className="text-sm text-muted-foreground mb-4">{CEFR_LEVEL_INFO[filterLevel as CefrLevel].description}</p>
            <div className="flex flex-wrap gap-2">
              {BATCHES[filterLevel as CefrLevel].map((batch) => {
                const cnt = STUDENTS.filter((s) => s.level === filterLevel && s.batch === batch).length;
                return (
                  <div key={batch} className="border border-border rounded-lg px-4 py-3 bg-muted/20">
                    <div className="text-xs text-muted-foreground">Batch</div>
                    <div className="font-semibold">{batch}</div>
                    <div className="text-xs text-muted-foreground">{cnt} student{cnt !== 1 ? "s" : ""}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promote dialog */}
      <Dialog open={!!promoteTarget} onOpenChange={() => setPromoteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote student</DialogTitle>
            <DialogDescription>
              Confirm promotion of <strong>{promoteTarget?.name}</strong> from Level{" "}
              <strong>{promoteTarget?.level}</strong> to Level{" "}
              <strong>{promoteTarget ? nextLevel(promoteTarget.level) : ""}</strong>.
            </DialogDescription>
          </DialogHeader>
          {promoteTarget && (
            <div className="py-2 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Student:</span><span className="font-medium">{promoteTarget.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Student No.:</span><span className="font-mono">{promoteTarget.admissionNo}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Current Level:</span><span className="font-bold">{promoteTarget.level}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Promoted to:</span><span className="font-bold text-success">{nextLevel(promoteTarget.level)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Instructor:</span><span>{promoteTarget.instructor}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteTarget(null)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handlePromote}>
              <TrendingUp className="size-4 mr-2" />Confirm promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
