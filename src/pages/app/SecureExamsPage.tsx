import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Clock, FileText, Upload, CheckCircle2, AlertTriangle, Lock, Eye, Download, Send } from 'lucide-react';
import { API_BASE_URL, TOKEN_KEYS } from '@/services/api-client';

interface FormalExam {
  id: number;
  title: string;
  exam_code: string;
  course_name: string;
  level_code: string;
  duration_minutes: number;
  maximum_marks: string;
  passing_marks: string;
  exam_instructions: string;
  submission_instructions: string;
  allowed_file_types: string;
  start_datetime: string;
  end_datetime: string;
  exam_paper_pdf: string | null;
  user_submission: any | null;
  active_session: any | null;
}

export function SecureExamsPage() {
  const [exams, setExams] = useState<FormalExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active' | 'completed' | 'missed'>('active');
  const [selectedExam, setSelectedExam] = useState<FormalExam | null>(null);
  const [inConfirmationRoom, setInConfirmationRoom] = useState(false);
  const [inExamSession, setInExamSession] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  // Timer & alerts
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Upload submission state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [studentComments, setStudentComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const studentName = localStorage.getItem('user_name') || 'Student';
  const admissionNumber = localStorage.getItem('user_username') || 'ADM-2026';

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE_URL}/odel/formal-exams/`, {
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setExams(Array.isArray(data) ? data : data.results || []);
      }
    } catch (e) {
      console.error("Failed to fetch formal examinations:", e);
    } finally {
      setLoading(false);
    }
  };

  // Integrity monitor: Visibility change
  useEffect(() => {
    if (!inExamSession || !selectedExam) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setAlertMessage("⚠️ Focus Violation Detected! Leaving the exam window is recorded in institutional telemetry.");
        try {
          const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
          await fetch(`${API_BASE_URL}/odel/formal-exams/${selectedExam.id}/log-event/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
            },
            body: JSON.stringify({ event_type: 'focus_change' })
          });
        } catch (e) {
          console.error("Failed to log focus violation:", e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [inExamSession, selectedExam]);

  // Countdown timer logic
  useEffect(() => {
    if (!inExamSession || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setAlertMessage("🛑 Examination Time Expired! Please submit your answer script immediately.");
          return 0;
        }
        const next = prev - 1;
        if (next === 30 * 60) setAlertMessage("⏳ 30 minutes remaining.");
        if (next === 10 * 60) setAlertMessage("⚠️ 10 minutes remaining! Ensure answers are saved.");
        if (next === 5 * 60) setAlertMessage("🚨 5 minutes remaining! Finalize your upload.");
        if (next === 1 * 60) setAlertMessage("🔥 1 minute remaining!");
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [inExamSession, timeLeftSeconds]);

  const handleOpenConfirmation = (exam: FormalExam) => {
    const now = new Date();
    const start = new Date(exam.start_datetime);
    if (now < start) {
      alert(`🔒 Examination Locked! This paper opens on ${start.toLocaleString()}.`);
      return;
    }
    setSelectedExam(exam);
    setInConfirmationRoom(true);
    setSubmissionReceipt(exam.user_submission || null);
  };

  const handleStartSession = async () => {
    if (!selectedExam) return;
    try {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE_URL}/odel/formal-exams/${selectedExam.id}/start-session/`, {
        method: 'POST',
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSessionData(data);
        setInConfirmationRoom(false);
        setInExamSession(true);
        setTimeLeftSeconds(selectedExam.duration_minutes * 60);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to start session.");
      }
    } catch (e) {
      console.error("Error launching session:", e);
    }
  };

  const handleSubmitScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam || !uploadFile) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const formData = new FormData();
      formData.append('uploaded_file', uploadFile);
      formData.append('student_comments', studentComments);

      const res = await fetch(`${API_BASE_URL}/odel/formal-exams/${selectedExam.id}/submit-script/`, {
        method: 'POST',
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setSubmissionReceipt(data);
        setAlertMessage("✅ Answer script uploaded successfully! Receipt generated.");
        fetchExams();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Upload failed. Please check file formatting.");
      }
    } catch (e) {
      setErrorMsg("Network error during submission upload.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  const now = new Date();
  const filteredExams = exams.filter(ex => {
    const start = new Date(ex.start_datetime);
    const end = new Date(ex.end_datetime);
    if (activeTab === 'upcoming') return now < start && !ex.user_submission;
    if (activeTab === 'active') return now >= start && now <= end && !ex.user_submission;
    if (activeTab === 'completed') return ex.user_submission !== null;
    if (activeTab === 'missed') return now > end && !ex.user_submission;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary animate-pulse" />
            Horizon Secure Examination Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Official institutional evaluations with proctored PDF distribution and encrypted submission vaults.
          </p>
        </div>
        {inExamSession && (
          <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-primary/30 shadow-md">
            <Clock className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: '4s' }} />
            <div>
              <span className="text-xs text-muted-foreground block">Time Remaining</span>
              <span className="text-lg font-mono font-bold text-foreground">{formatTime(timeLeftSeconds)}</span>
            </div>
          </div>
        )}
      </div>

      {alertMessage && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between text-sm animate-bounce">
          <span className="font-medium text-primary">{alertMessage}</span>
          <button onClick={() => setAlertMessage(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}

      {/* Confirmation Room Modal */}
      {inConfirmationRoom && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl text-card-foreground">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lock className="w-6 h-6 text-primary" /> Examination Confirmation Room
              </h2>
              <button onClick={() => setInConfirmationRoom(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="space-y-4 text-sm bg-background p-4 rounded-xl border border-border">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground block text-xs">Paper Title</span><strong className="text-base">{selectedExam.title}</strong></div>
                <div><span className="text-muted-foreground block text-xs">Exam Code</span><strong className="text-base font-mono">{selectedExam.exam_code}</strong></div>
                <div><span className="text-muted-foreground block text-xs">CEFR Level</span><strong className="text-base">{selectedExam.level_code}</strong></div>
                <div><span className="text-muted-foreground block text-xs">Duration</span><strong className="text-base">{selectedExam.duration_minutes} Minutes</strong></div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-primary flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4" /> Proctored Session Guidelines
              </h4>
              <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <li>Your IP address, device telemetry, and browser timestamp will be logged.</li>
                <li>Navigating away or switching tabs constitutes an academic integrity violation and will be flagged.</li>
                <li>Downloaded PDF examination papers are digitally stamped with your unique watermark.</li>
                <li>Ensure stable connectivity before clicking confirmation. Timer cannot be paused.</li>
              </ul>
            </div>

            {selectedExam.exam_instructions && (
              <div className="text-xs p-3 bg-muted/40 rounded-lg border border-border">
                <span className="font-semibold block mb-1">Instructor Instructions:</span>
                {selectedExam.exam_instructions}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="ghost" onClick={() => setInConfirmationRoom(false)}>Cancel / Return</Button>
              <Button variant="default" onClick={handleStartSession} className="flex items-center gap-2 font-bold px-6">
                <CheckCircle2 className="w-5 h-5" /> I Confirm & Launch Examination
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Exam Session View */}
      {inExamSession && selectedExam ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Watermarked PDF Viewer */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden border-2 border-primary/20 shadow-xl relative">
              <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between py-3">
                <div>
                  <CardTitle className="text-base font-bold">{selectedExam.exam_code}: {selectedExam.title}</CardTitle>
                  <CardDescription className="text-xs">Secure Proctored PDF Viewer</CardDescription>
                </div>
                {selectedExam.exam_paper_pdf && (
                  <a href={selectedExam.exam_paper_pdf} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                      <Download className="w-3.5 h-3.5" /> Download Paper
                    </Button>
                  </a>
                )}
              </CardHeader>
              <CardContent className="p-0 relative min-h-[600px] bg-neutral-900 flex items-center justify-center">
                {/* WATERMARK OVERLAY */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex flex-wrap items-center justify-center opacity-15 select-none z-20 gap-12 p-8">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="transform -rotate-45 text-white font-bold text-lg whitespace-nowrap tracking-wider">
                      {studentName} • {admissionNumber} • {selectedExam.exam_code} • OFFICIAL HORIZON EXAM
                    </div>
                  ))}
                </div>

                {selectedExam.exam_paper_pdf ? (
                  <iframe
                    src={`${selectedExam.exam_paper_pdf}#toolbar=0`}
                    className="w-full h-[650px] border-0 z-10 relative"
                    title="Examination Paper"
                  />
                ) : (
                  <div className="text-center p-12 space-y-3 text-white z-10">
                    <FileText className="w-16 h-16 text-primary mx-auto opacity-70" />
                    <p className="text-lg font-semibold">Official Paper Document Vault</p>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto">
                      Please refer to the instructor instructions or download the secure paper package using the top button.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Submission Vault & Instructions */}
          <div className="space-y-6">
            <Card className="border border-border shadow-md">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" /> Submission Vault
                </CardTitle>
                <CardDescription className="text-xs">Upload your completed answer script before the countdown expires.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {submissionReceipt ? (
                  <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
                    <h4 className="font-bold text-success text-sm">Submission Receipt Generated</h4>
                    <p className="font-mono text-xs font-bold text-foreground bg-background p-2 rounded border border-border">
                      {submissionReceipt.receipt_number}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Timestamp: {new Date(submissionReceipt.submitted_at).toLocaleString()}
                    </p>
                    <div className="flex justify-center gap-2 pt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        submissionReceipt.moderation_status === 'APPROVED' ? 'bg-success/20 text-success' :
                        submissionReceipt.moderation_status === 'RETURNED' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'
                      }`}>
                        QA Status: {submissionReceipt.moderation_status || 'PENDING'}
                      </span>
                    </div>
                    {submissionReceipt.marking_status === 'GRADED' || submissionReceipt.marking_status === 'PUBLISHED' ? (
                      <div className="pt-2 border-t border-border mt-2 text-left">
                        <span className="text-xs font-bold block">Score: {submissionReceipt.marks_obtained} / {selectedExam.maximum_marks} ({submissionReceipt.grade})</span>
                        {submissionReceipt.teacher_feedback && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{submissionReceipt.teacher_feedback}"</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] inline-block bg-primary/20 text-primary px-2 py-0.5 rounded font-medium mt-1">Pending Evaluation</span>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitScript} className="space-y-4">
                    {errorMsg && <p className="text-xs text-destructive font-semibold">{errorMsg}</p>}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Select Answer File ({selectedExam.allowed_file_types})</label>
                      <input
                        type="file"
                        required
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="w-full text-xs bg-background border border-border rounded-lg p-2 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Student Comments / Notes (Optional)</label>
                      <textarea
                        rows={2}
                        value={studentComments}
                        onChange={(e) => setStudentComments(e.target.value)}
                        placeholder="Any notes for the examiner regarding your upload..."
                        className="w-full text-xs bg-background border border-border rounded-lg p-2 text-foreground"
                      />
                    </div>
                    {uploadFile && (
                      <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded">
                        Selected: <strong className="text-foreground">{uploadFile.name}</strong> ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                    <Button type="submit" disabled={submitting || !uploadFile} className="w-full font-bold flex items-center gap-2">
                      {submitting ? "Uploading Script..." : <><Send className="w-4 h-4" /> Submit Official Script</>}
                    </Button>
                  </form>
                )}

                <div className="pt-2 border-t border-border text-xs space-y-1 text-muted-foreground">
                  <span className="font-semibold text-foreground block">Submission Instructions:</span>
                  <p>{selectedExam.submission_instructions || "Please ensure all scanned pages are clear and consolidated into a single document before submission."}</p>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full text-xs" onClick={() => { setInExamSession(false); setSelectedExam(null); }}>
              Leave Exam Window
            </Button>
          </div>
        </div>
      ) : (
        /* Standard Dashboard Tabs */
        <div className="space-y-4">
          <div className="flex border-b border-border gap-2">
            {(['active', 'upcoming', 'completed', 'missed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 px-4 text-sm font-semibold capitalize border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab} Examinations ({exams.filter(ex => {
                  const s = new Date(ex.start_datetime);
                  const e = new Date(ex.end_datetime);
                  if (tab === 'upcoming') return now < s && !ex.user_submission;
                  if (tab === 'active') return now >= s && now <= e && !ex.user_submission;
                  if (tab === 'completed') return ex.user_submission !== null;
                  if (tab === 'missed') return now > e && !ex.user_submission;
                  return true;
                }).length})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground animate-pulse">Loading formal examination schedules...</div>
          ) : filteredExams.length === 0 ? (
            <Card className="py-12 text-center border-dashed">
              <CardContent className="space-y-2">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                <p className="font-semibold text-base">No {activeTab} formal examinations found.</p>
                <p className="text-xs text-muted-foreground">When official Goethe or semester exam papers are published, they will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExams.map(exam => {
                const start = new Date(exam.start_datetime);
                const end = new Date(exam.end_datetime);
                const isOngoing = now >= start && now <= end;

                return (
                  <Card key={exam.id} className="border border-border hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">{exam.exam_code}</span>
                        <span className="text-muted-foreground">{exam.level_code} Level</span>
                      </div>
                      <CardTitle className="text-lg font-bold">{exam.title}</CardTitle>
                      <CardDescription className="text-xs">{exam.course_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs flex-1 flex flex-col justify-end">
                      <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-lg border border-border">
                        <div><span className="text-muted-foreground block">Duration:</span> <strong className="text-foreground">{exam.duration_minutes} Mins</strong></div>
                        <div><span className="text-muted-foreground block">Max Score:</span> <strong className="text-foreground">{exam.maximum_marks} Marks</strong></div>
                        <div className="col-span-2"><span className="text-muted-foreground block">Window:</span> <strong className="text-foreground">{start.toLocaleDateString()} ({start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})</strong></div>
                      </div>

                      {exam.user_submission ? (
                        <div className="p-2.5 rounded bg-success/10 border border-success/30 flex items-center justify-between">
                          <span className="font-bold text-success flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Submitted</span>
                          <span className="font-mono text-[11px] font-bold">{exam.user_submission.receipt_number}</span>
                        </div>
                      ) : isOngoing ? (
                        <Button variant="default" className="w-full font-bold flex items-center gap-1.5" onClick={() => handleOpenConfirmation(exam)}>
                          <Eye className="w-4 h-4" /> Enter Secure Room & Launch
                        </Button>
                      ) : now < start ? (
                        <Button variant="outline" disabled className="w-full text-xs">
                          Opens in {Math.ceil((start.getTime() - now.getTime()) / (1000 * 3600))} Hours
                        </Button>
                      ) : (
                        <Button variant="ghost" disabled className="w-full text-xs text-destructive font-semibold">
                          Examination Closed
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
