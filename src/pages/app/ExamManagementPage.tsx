import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Plus, FileText, Download, CheckCircle2, Award, BarChart3, Upload, Edit3, Send } from 'lucide-react';
import { API_BASE_URL, TOKEN_KEYS } from '@/services/api-client';

export function ExamManagementPage() {
  const [activeTab, setActiveTab] = useState<'exams' | 'submissions' | 'reports'>('exams');
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Exam Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [examCode, setExamCode] = useState('');
  const [examType, setExamType] = useState('GOETHE_MOCK');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('1'); // Default level id or code
  const [duration, setDuration] = useState(120);
  const [maxMarks, setMaxMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(60);
  const [startTime, setStartTime] = useState('2026-07-01T09:00');
  const [endTime, setEndTime] = useState('2026-07-01T12:00');
  const [instructions, setInstructions] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  // Grading Modal
  const [gradingSub, setGradingSub] = useState<any | null>(null);
  const [marksGiven, setMarksGiven] = useState('');
  const [feedback, setFeedback] = useState('');
  const [markedScriptFile, setMarkedScriptFile] = useState<File | null>(null);
  const [markingStatus, setMarkingStatus] = useState('GRADED');
  const [savingGrade, setSavingGrade] = useState(false);

  // Moderation Modal
  const [moderatingSub, setModeratingSub] = useState<any | null>(null);
  const [modStatus, setModStatus] = useState('APPROVED');
  const [modNotes, setModNotes] = useState('');
  const [savingMod, setSavingMod] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    const headers = { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` };

    try {
      if (activeTab === 'exams') {
        const res = await fetch(`${API_BASE_URL}/odel/formal-exams/`, { headers });
        if (res.ok) {
          const data = await res.json();
          setExams(Array.isArray(data) ? data : data.results || []);
        }
      } else if (activeTab === 'submissions') {
        const res = await fetch(`${API_BASE_URL}/odel/formal-submissions/`, { headers });
        if (res.ok) {
          const data = await res.json();
          setSubmissions(Array.isArray(data) ? data : data.results || []);
        }
      } else if (activeTab === 'reports') {
        const res = await fetch(`${API_BASE_URL}/odel/formal-exams/reports/`, { headers });
        if (res.ok) setReports(await res.json());
      }
    } catch (e) {
      console.error("Error fetching admin exam data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const formData = new FormData();
      formData.append('title', title);
      formData.append('exam_code', examCode);
      formData.append('exam_type', examType);
      formData.append('description', description);
      formData.append('level', level);
      formData.append('duration_minutes', duration.toString());
      formData.append('maximum_marks', maxMarks.toString());
      formData.append('passing_marks', passingMarks.toString());
      formData.append('start_datetime', new Date(startTime).toISOString());
      formData.append('end_datetime', new Date(endTime).toISOString());
      formData.append('exam_instructions', instructions);
      formData.append('publish_status', 'PUBLISHED');
      if (pdfFile) formData.append('exam_paper_pdf', pdfFile);
      if (supportingFile) formData.append('supporting_files', supportingFile);

      const res = await fetch(`${API_BASE_URL}/odel/formal-exams/`, {
        method: 'POST',
        headers: { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        alert("✅ Formal Examination Published Successfully!");
        setShowCreateModal(false);
        fetchData();
      } else {
        const err = await res.json();
        alert("Error publishing exam: " + JSON.stringify(err));
      }
    } catch (e) {
      alert("Network failure publishing exam.");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub) return;
    setSavingGrade(true);
    try {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const formData = new FormData();
      formData.append('marks_obtained', marksGiven);
      formData.append('teacher_feedback', feedback);
      formData.append('marking_status', markingStatus);
      if (markedScriptFile) formData.append('marked_script', markedScriptFile);

      const res = await fetch(`${API_BASE_URL}/odel/formal-submissions/${gradingSub.id}/mark/`, {
        method: 'POST',
        headers: { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        alert("✅ Grade Evaluation Saved!");
        setGradingSub(null);
        fetchData();
      } else {
        alert("Error saving evaluation.");
      }
    } catch (e) {
      alert("Network failure.");
    } finally {
      setSavingGrade(false);
    }
  };

  const handleModerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingSub) return;
    setSavingMod(true);
    try {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE_URL}/odel/formal-submissions/${moderatingSub.id}/moderate/`, {
        method: 'POST',
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          moderation_status: modStatus,
          moderator_notes: modNotes
        })
      });

      if (res.ok) {
        alert("✅ Moderation Decision Recorded!");
        setModeratingSub(null);
        fetchData();
      } else {
        alert("Error saving moderation decision.");
      }
    } catch (e) {
      alert("Network failure during moderation.");
    } finally {
      setSavingMod(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Instructor Examination Control Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Author formal PDF exam papers, proctor student sessions, evaluate answer scripts, and publish verified marks.
          </p>
        </div>
        <Button variant="default" className="flex items-center gap-2 font-bold shadow-md" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" /> Publish New Exam Paper
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        {(['exams', 'submissions', 'reports'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 px-4 text-sm font-semibold capitalize border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'exams' && <FileText className="w-4 h-4"/>}
            {tab === 'submissions' && <CheckCircle2 className="w-4 h-4"/>}
            {tab === 'reports' && <BarChart3 className="w-4 h-4"/>}
            {tab === 'exams' ? 'Published Exam Papers' : tab === 'submissions' ? 'Student Submissions Queue' : 'Analytics & Performance Reports'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground animate-pulse">Loading examination records...</div>
      ) : activeTab === 'exams' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.length === 0 ? (
            <Card className="col-span-2 py-12 text-center border-dashed">
              <CardContent>
                <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-50 mb-2" />
                <p className="font-semibold">No formal examinations authored yet.</p>
                <p className="text-xs text-muted-foreground">Click "Publish New Exam Paper" above to upload your first Word/PDF exam paper.</p>
              </CardContent>
            </Card>
          ) : exams.map(ex => (
            <Card key={ex.id} className="border border-border hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">{ex.exam_code} • {ex.exam_type || 'GOETHE_MOCK'}</span>
                  <span className="text-muted-foreground">{ex.publish_status}</span>
                </div>
                <CardTitle className="text-lg font-bold">{ex.title}</CardTitle>
                <CardDescription className="text-xs">Level: {ex.level_code} • Duration: {ex.duration_minutes} Mins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs flex-1 flex flex-col justify-end">
                <div className="bg-muted/30 p-2.5 rounded-lg border border-border space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Submissions Received:</span> <strong className="text-primary font-bold">{ex.submissions_count} Scripts</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Passing Score:</span> <strong>{ex.passing_marks} / {ex.maximum_marks}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Schedule:</span> <span>{new Date(ex.start_datetime).toLocaleDateString()}</span></div>
                  {ex.checksum && (
                    <div className="text-[10px] text-muted-foreground truncate font-mono pt-1 border-t border-border mt-1">
                      SHA256: {ex.checksum.substring(0, 24)}...
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {ex.exam_paper_pdf && (
                    <a href={ex.exam_paper_pdf} target="_blank" rel="noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" /> View Paper
                      </Button>
                    </a>
                  )}
                  {ex.supporting_files && (
                    <a href={ex.supporting_files} target="_blank" rel="noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" /> Supporting Audio/Data
                      </Button>
                    </a>
                  )}
                  <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => setActiveTab('submissions')}>
                    Evaluate Scripts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeTab === 'submissions' ? (
        <Card className="border border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 pb-3 border-b border-border">
            <CardTitle className="text-base font-bold">Answer Scripts Queue</CardTitle>
            <CardDescription className="text-xs">Download student files, enter marks, attach marked feedback PDFs, and publish results.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {submissions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">No student scripts submitted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">Receipt / Student</th>
                      <th className="p-3">Examination</th>
                      <th className="p-3">Submitted At</th>
                      <th className="p-3">Status / Moderation</th>
                      <th className="p-3">Score / Grade</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {submissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <strong className="block font-mono text-primary">{sub.receipt_number}</strong>
                          <span className="text-muted-foreground">{sub.student_name} ({sub.admission_number})</span>
                          {sub.student_comments && (
                            <div className="text-[11px] text-muted-foreground italic mt-1 bg-muted/40 p-1 rounded border border-border">
                              "{sub.student_comments}"
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-medium">{sub.exam_code}: {sub.exam_title}</td>
                        <td className="p-3">
                          {new Date(sub.submitted_at).toLocaleString()}
                          {sub.is_late && <span className="ml-1.5 bg-destructive/20 text-destructive px-1.5 py-0.5 rounded text-[10px] font-bold">LATE</span>}
                        </td>
                        <td className="p-3 space-y-1">
                          <span className={`px-2 py-0.5 rounded font-semibold block w-fit ${
                            sub.marking_status === 'PUBLISHED' ? 'bg-success/20 text-success' :
                            sub.marking_status === 'GRADED' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'
                          }`}>
                            {sub.marking_status}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold block w-fit ${
                            sub.moderation_status === 'APPROVED' ? 'bg-success/10 text-success border border-success/30' :
                            sub.moderation_status === 'RETURNED' ? 'bg-destructive/10 text-destructive border border-destructive/30' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            Mod: {sub.moderation_status || 'PENDING'}
                          </span>
                        </td>
                        <td className="p-3 font-bold">
                          {sub.marks_obtained !== null ? `${sub.marks_obtained} (${sub.grade})` : '—'}
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          {sub.uploaded_file && (
                            <a href={sub.uploaded_file} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                                <Download className="w-3.5 h-3.5" /> Script
                              </Button>
                            </a>
                          )}
                          <Button variant="default" size="sm" className="h-7 px-2 text-xs inline-flex items-center gap-1" onClick={() => {
                            setGradingSub(sub);
                            setMarksGiven(sub.marks_obtained || '');
                            setFeedback(sub.teacher_feedback || '');
                            setMarkingStatus(sub.marking_status || 'GRADED');
                          }}>
                            <Edit3 className="w-3.5 h-3.5" /> Grade
                          </Button>
                          <Button variant="secondary" size="sm" className="h-7 px-2 text-xs inline-flex items-center gap-1" onClick={() => {
                            setModeratingSub(sub);
                            setModStatus(sub.moderation_status || 'APPROVED');
                            setModNotes(sub.moderator_notes || '');
                          }}>
                            <ShieldAlert className="w-3.5 h-3.5" /> Moderate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Reports Tab */
        reports && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border border-border p-4 text-center space-y-1">
                <span className="text-xs text-muted-foreground block">Total Authored Exams</span>
                <span className="text-2xl font-bold text-foreground">{reports.total_exams}</span>
              </Card>
              <Card className="border border-border p-4 text-center space-y-1">
                <span className="text-xs text-muted-foreground block">Total Scripts Received</span>
                <span className="text-2xl font-bold text-primary">{reports.total_submissions}</span>
              </Card>
              <Card className="border border-border p-4 text-center space-y-1">
                <span className="text-xs text-muted-foreground block">Overall Pass Rate</span>
                <span className="text-2xl font-bold text-success">{reports.pass_rate}%</span>
              </Card>
              <Card className="border border-border p-4 text-center space-y-1">
                <span className="text-xs text-muted-foreground block">Average Score</span>
                <span className="text-2xl font-bold text-foreground">{reports.average_score}</span>
              </Card>
            </div>

            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold">Institutional Performance Summary</CardTitle>
                <CardDescription className="text-xs">Aggregated metrics across Goethe mock tests and semester examinations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border"><span>Published Active Exams:</span> <strong>{reports.published_exams}</strong></div>
                <div className="flex justify-between py-2 border-b border-border"><span>Late Submissions Flagged:</span> <strong className="text-destructive">{reports.late_submissions}</strong></div>
                <div className="flex justify-between py-2 border-b border-border"><span>Evaluated & Graded Scripts:</span> <strong>{reports.graded_submissions}</strong></div>
                <div className="flex justify-between py-2 border-b border-border"><span>Students Passed (Score ≥ Passing):</span> <strong className="text-success">{reports.passed_count}</strong></div>
                <div className="flex justify-between py-2"><span>Students Failed:</span> <strong className="text-destructive">{reports.failed_count}</strong></div>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-card-foreground max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-primary"/> Publish Formal Examination</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground">✕</button>
            </div>
            <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
              <div><label className="font-semibold block mb-1">Exam Title</label><input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Goethe-Zertifikat B1 Mock Exam" className="w-full bg-background border border-border rounded p-2 text-foreground"/></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="font-semibold block mb-1">Exam Code</label><input required value={examCode} onChange={e=>setExamCode(e.target.value)} placeholder="HEX-2026-B1" className="w-full bg-background border border-border rounded p-2 text-foreground"/></div>
                <div>
                  <label className="font-semibold block mb-1">Exam Type</label>
                  <select value={examType} onChange={e=>setExamType(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-foreground">
                    <option value="PLACEMENT">Placement Test</option>
                    <option value="CAT">Continuous Assessment (CAT)</option>
                    <option value="MIDTERM">Midterm Examination</option>
                    <option value="FINAL">Final Semester Exam</option>
                    <option value="ORAL">Oral Examination</option>
                    <option value="LISTENING">Listening Assessment (Hören)</option>
                    <option value="SPEAKING">Speaking Assessment (Sprechen)</option>
                    <option value="READING">Reading Assessment (Lesen)</option>
                    <option value="WRITING">Writing Assessment (Schreiben)</option>
                    <option value="GOETHE_MOCK">Goethe-Zertifikat Mock Exam</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="font-semibold block mb-1">Level ID</label><input required value={level} onChange={e=>setLevel(e.target.value)} placeholder="1 (A1/B1)" className="w-full bg-background border border-border rounded p-2 text-foreground"/></div>
                <div><label className="font-semibold block mb-1">Duration (Mins)</label><input type="number" required value={duration} onChange={e=>setDuration(Number(e.target.value))} className="w-full bg-background border border-border rounded p-2 text-foreground"/></div>
                <div><label className="font-semibold block mb-1">Max Marks</label><input type="number" required value={maxMarks} onChange={e=>setMaxMarks(Number(e.target.value))} className="w-full bg-background border border-border rounded p-2 text-foreground"/></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="font-semibold block mb-1">Passing Marks</label><input type="number" required value={passingMarks} onChange={e=>setPassingMarks(Number(e.target.value))} className="w-full bg-background border border-border rounded p-2 text-foreground"/></div>
                <div><label className="font-semibold block mb-1">Start Date & Time</label><input type="datetime-local" required value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-foreground"/></div>
              </div>
              <div><label className="font-semibold block mb-1">End Date & Time</label><input type="datetime-local" required value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-foreground"/></div>
              <div><label className="font-semibold block mb-1">Description / Overview</label><input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Summary for knowledge base..." className="w-full bg-background border border-border rounded p-2 text-foreground"/></div>
              <div><label className="font-semibold block mb-1">Upload Official PDF Exam Paper</label><input type="file" accept=".pdf,.docx" onChange={e=>setPdfFile(e.target.files?.[0]||null)} className="w-full bg-background border border-border rounded p-2"/></div>
              <div><label className="font-semibold block mb-1">Supporting Audio/Data Files (ZIP/MP3 - Optional)</label><input type="file" accept=".zip,.mp3,.rar" onChange={e=>setSupportingFile(e.target.files?.[0]||null)} className="w-full bg-background border border-border rounded p-2"/></div>
              <div><label className="font-semibold block mb-1">Instructor Instructions</label><textarea rows={2} value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Proctoring notes..." className="w-full bg-background border border-border rounded p-2 text-foreground"/></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="ghost" onClick={()=>setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" disabled={creating} className="font-bold">{creating ? "Publishing..." : "Publish Examination"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-card-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2"><Edit3 className="w-5 h-5 text-primary"/> Evaluate Script: {gradingSub.receipt_number}</h3>
              <button onClick={() => setGradingSub(null)} className="text-muted-foreground">✕</button>
            </div>
            <form onSubmit={handleSaveGrade} className="space-y-3 text-xs">
              <div className="bg-muted/40 p-3 rounded space-y-1">
                <div><span>Student:</span> <strong className="text-foreground">{gradingSub.student_name}</strong></div>
                <div><span>Submitted File:</span> <a href={gradingSub.uploaded_file} target="_blank" rel="noreferrer" className="text-primary underline ml-1">Download Script</a></div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Marks Obtained (out of {gradingSub.examination?.maximum_marks || 100})</label>
                <input type="number" step="0.5" required value={marksGiven} onChange={e=>setMarksGiven(e.target.value)} placeholder="e.g. 85.0" className="w-full bg-background border border-border rounded p-2 text-foreground"/>
              </div>
              <div>
                <label className="font-semibold block mb-1">Instructor Feedback / Remarks</label>
                <textarea rows={3} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Gut gemacht! Excellent grammar structure..." className="w-full bg-background border border-border rounded p-2 text-foreground"/>
              </div>
              <div>
                <label className="font-semibold block mb-1">Evaluation Status</label>
                <select value={markingStatus} onChange={e=>setMarkingStatus(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-foreground">
                  <option value="UNDER_MARKING">Under Marking (Draft)</option>
                  <option value="GRADED">Graded (Ready for review)</option>
                  <option value="PUBLISHED">Published (Release to student)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Attach Marked Script PDF (Optional)</label>
                <input type="file" accept=".pdf" onChange={e=>setMarkedScriptFile(e.target.files?.[0]||null)} className="w-full bg-background border border-border rounded p-2"/>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="ghost" onClick={()=>setGradingSub(null)}>Cancel</Button>
                <Button type="submit" disabled={savingGrade} className="font-bold flex items-center gap-1.5"><Send className="w-3.5 h-3.5"/> {savingGrade ? "Saving..." : "Save & Release evaluation"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {moderatingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-card-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-warning"/> Quality Assurance & Moderation</h3>
              <button onClick={() => setModeratingSub(null)} className="text-muted-foreground">✕</button>
            </div>
            <form onSubmit={handleModerate} className="space-y-3 text-xs">
              <div className="bg-muted/40 p-3 rounded space-y-1">
                <div><span>Receipt:</span> <strong className="text-foreground">{moderatingSub.receipt_number}</strong></div>
                <div><span>Student:</span> <strong className="text-foreground">{moderatingSub.student_name}</strong></div>
                <div><span>Proposed Marks:</span> <strong className="text-primary">{moderatingSub.marks_obtained !== null ? `${moderatingSub.marks_obtained} (${moderatingSub.grade})` : 'Not Graded Yet'}</strong></div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Moderation Decision</label>
                <select value={modStatus} onChange={e=>setModStatus(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-foreground font-semibold">
                  <option value="APPROVED">APPROVE (Verify & Publish Grade)</option>
                  <option value="RETURNED">RETURN TO INSTRUCTOR (Needs Remarking)</option>
                  <option value="PENDING">PENDING (Keep under quality review)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Moderator Audit Notes / Justification</label>
                <textarea rows={3} required value={modNotes} onChange={e=>setModNotes(e.target.value)} placeholder="Checked against marking scheme. Score verified..." className="w-full bg-background border border-border rounded p-2 text-foreground"/>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="ghost" onClick={()=>setModeratingSub(null)}>Cancel</Button>
                <Button type="submit" disabled={savingMod} className="font-bold flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5"/> {savingMod ? "Recording..." : "Confirm Decision"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
