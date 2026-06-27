import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STUDENTS, CEFR_LEVELS, CEFR_LEVEL_INFO, currency } from "@/lib/sample-data";
import { Search, TrendingUp, UserPlus, Download, ChevronLeft, ChevronRight, Eye, ArrowUpDown, X, Phone, Mail, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const BAND_COLORS: Record<string, string> = {
  Beginner:     "bg-blue-50 text-blue-700 border-blue-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced:     "bg-green-50 text-green-700 border-green-200",
};

export default function StudentsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  const [q, setQ] = useState("");
  const [lvl, setLvl] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<"name" | "level" | "admissionNo">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const pageSize = 8;

  // Filter & Sort
  const filteredList = useMemo(() => {
    return STUDENTS.filter((s) => {
      const matchLvl = lvl === "all" || s.level === lvl;
      const matchStatus = status === "all" || (status === "active" ? s.paid > 0 : true);
      const query = q.toLowerCase();
      const matchQ = !q || s.name.toLowerCase().includes(query) || s.admissionNo.toLowerCase().includes(query);
      return matchLvl && matchStatus && matchQ;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [q, lvl, status, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page]);

  const toggleSort = (field: "name" | "level" | "admissionNo") => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const exportCSV = () => {
    const headers = isTeacher 
      ? ["Student No", "Name", "Level", "Batch", "Instructor", "Enrolled Date"]
      : ["Student No", "Name", "Level", "Batch", "Instructor", "Enrolled Date", "Total Fees", "Paid", "Balance"];
    
    const rows = filteredList.map(s => isTeacher ? [
      s.admissionNo, s.name, s.level, s.batch, s.instructor, s.enrolledDate
    ] : [
      s.admissionNo, s.name, s.level, s.batch, s.instructor, s.enrolledDate, s.totalFees, s.paid, s.totalFees - s.paid
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `horizon_students_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader
        title="Students Directory"
        description="Search, filter, and manage enrolled learners across all CEFR proficiency bands."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
              <Download className="size-4" /> Export CSV
            </Button>
            {!isTeacher && (
              <Button className="gradient-primary text-primary-foreground gap-1.5 size-sm sm:size-default">
                <UserPlus className="size-4" /> Enroll Student
              </Button>
            )}
          </div>
        }
      />

      {/* Level summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CEFR_LEVELS.map((l) => {
          const cnt = STUDENTS.filter((s) => s.level === l).length;
          return (
            <button
              key={l}
              onClick={() => { setLvl(lvl === l ? "all" : l); setPage(1); }}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                lvl === l ? "gradient-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {l} <span className="opacity-70">· {cnt}</span>
            </button>
          );
        })}
      </div>

      <Card className="shadow-card mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              value={q} 
              onChange={(e) => { setQ(e.target.value); setPage(1); }} 
              placeholder="Search by name, student no, or phone…" 
              className="pl-9" 
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Select value={lvl} onValueChange={(v) => { setLvl(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Level filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All CEFR Levels</SelectItem>
                {CEFR_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>{l} — {CEFR_LEVEL_INFO[l].band}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Enrolled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card relative">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                  <div className="flex items-center gap-1">Student <ArrowUpDown className="size-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("admissionNo")}>
                  <div className="flex items-center gap-1">Student No. <ArrowUpDown className="size-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("level")}>
                  <div className="flex items-center gap-1">Level <ArrowUpDown className="size-3" /></div>
                </TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Enrolled</TableHead>
                {!isTeacher && <TableHead className="text-right">Fee Balance</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedList.map((s) => {
                const info = CEFR_LEVEL_INFO[s.level];
                const bal = s.totalFees - s.paid;
                return (
                  <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                          {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="font-semibold">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.nationality}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{s.level}</span>
                        <Badge className={`text-[10px] border ${BAND_COLORS[info.band]}`}>{info.band}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.batch}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.instructor}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.enrolledDate}</TableCell>
                    {!isTeacher && (
                      <TableCell className={`text-right font-medium ${bal > 0 ? "text-warning font-bold" : "text-success"}`}>
                        {currency(bal)}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(s)}>
                          <Eye className="size-3.5 mr-1" /> Profile
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedList.length === 0 && (
                <TableRow><TableCell colSpan={isTeacher ? 7 : 8} className="text-center text-muted-foreground py-12">No matching students found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
            <div className="text-xs text-muted-foreground">
              Showing <strong>{((page - 1) * pageSize) + 1}</strong> to <strong>{Math.min(page * pageSize, filteredList.length)}</strong> of <strong>{filteredList.length}</strong> students
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="size-8" 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-xs px-2 font-medium">Page {page} of {totalPages}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="size-8" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Profile Modal Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full shadow-elevated bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#0F172A] via-[#DC2626] to-[#EAB308] h-3" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-lg">
                    {selectedStudent.name.split(" ").map((n: any) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">{selectedStudent.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground">{selectedStudent.admissionNo}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => setSelectedStudent(null)}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="space-y-3 py-2 border-y border-border text-sm">
                <div className="flex justify-between py-1"><span className="text-muted-foreground">CEFR Proficiency</span><Badge>{selectedStudent.level}</Badge></div>
                <div className="flex justify-between py-1"><span className="text-muted-foreground">Assigned Batch</span><span className="font-medium">{selectedStudent.batch}</span></div>
                <div className="flex justify-between py-1"><span className="text-muted-foreground">Lead Instructor</span><span className="font-medium">{selectedStudent.instructor}</span></div>
                <div className="flex justify-between py-1"><span className="text-muted-foreground">Enrollment Date</span><span className="font-medium">{selectedStudent.enrolledDate}</span></div>
                <div className="flex justify-between py-1"><span className="text-muted-foreground">Nationality</span><span className="font-medium">{selectedStudent.nationality}</span></div>
                {!isTeacher && (
                  <>
                    <div className="flex justify-between py-1"><span className="text-muted-foreground">Total Course Fees</span><span className="font-medium">{currency(selectedStudent.totalFees)}</span></div>
                    <div className="flex justify-between py-1"><span className="text-muted-foreground">Amount Paid</span><span className="text-success font-medium">{currency(selectedStudent.paid)}</span></div>
                    <div className="flex justify-between py-1"><span className="text-muted-foreground">Current Balance</span><span className="text-warning font-bold">{currency(selectedStudent.totalFees - selectedStudent.paid)}</span></div>
                  </>
                )}
              </div>

              <div className="mt-6 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedStudent(null)}>Close</Button>
                <Button className="gradient-primary text-primary-foreground"><TrendingUp className="size-4 mr-2" /> View Academic Progress</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
