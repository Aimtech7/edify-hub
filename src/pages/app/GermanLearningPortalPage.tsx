import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Video,
  Award,
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  Play,
  ExternalLink,
  Bot,
  Send,
  ShieldCheck,
  RefreshCw,
  Calendar,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  germanOdelService,
  GermanLevel,
  VirtualClassSession,
  AICoachResponse,
  AcademicTranscript,
} from "@/services/germanOdelService";

export default function GermanLearningPortalPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "virtual" | "player" | "ai" | "transcripts">("catalog");
  const [levels, setLevels] = useState<GermanLevel[]>([]);
  const [virtualClasses, setVirtualClasses] = useState<VirtualClassSession[]>([]);
  const [transcript, setTranscript] = useState<AcademicTranscript | null>(null);
  const [loading, setLoading] = useState(true);

  // AI Coach State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiIntent, setAiIntent] = useState("GRAMMAR");
  const [aiLevel, setAiLevel] = useState("B1.1");
  const [aiHistory, setAiHistory] = useState<Array<{ q: string; r: AICoachResponse }>>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Selected lesson in player
  const [selectedLesson, setSelectedLesson] = useState<{
    title: string;
    type: "VIDEO" | "PDF";
    url: string;
    desc: string;
  }>({
    title: "Lektion 1: Einführung in den Konjunktiv II (Video Lecture)",
    type: "VIDEO",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    desc: "Comprehensive review of Konjunktiv II hypothetical structures with Herr Müller.",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lvls, vcs, trn] = await Promise.all([
        germanOdelService.getLevels(),
        germanOdelService.getVirtualClasses(),
        germanOdelService.getTranscript().catch(() => null),
      ]);
      setLevels(lvls);
      setVirtualClasses(vcs);
      if (trn) setTranscript(trn);
    } catch (err) {
      console.error("Failed to load German portal telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (vc: VirtualClassSession) => {
    try {
      await germanOdelService.recordAttendance(vc.id, 0);
      window.open(vc.join_link, "_blank");
    } catch (e) {
      window.open(vc.join_link, "_blank");
    }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await germanOdelService.askAICoach({
        intent: aiIntent,
        prompt: aiPrompt,
        level: aiLevel,
      });
      setAiHistory((prev) => [{ q: aiPrompt, r: res }, ...prev]);
      setAiPrompt("");
    } catch (err) {
      console.error("AI Coach inquiry failed", err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          <span className="text-lg font-medium">Loading Horizon German ODEL Platform...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="inline-block w-3 h-3 rounded-full bg-red-600"></span>
              <span className="inline-block w-3 h-3 rounded-full bg-black border border-slate-600"></span>
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
                Horizon Enterprise ODEL Suite
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              German Language Teaching & Virtual Learning Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Complete CEFR progression from Grundstufe A1.1 to Großes Deutsches Sprachdiplom C2 with native Zoom & BigBlueButton integration and AI language coaching.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-lg">
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-xs text-slate-400 block">CEFR Levels</span>
              <span className="text-xl font-bold text-amber-400">{levels.length || 11}</span>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-xs text-slate-400 block">Virtual Sessions</span>
              <span className="text-xl font-bold text-emerald-400">{virtualClasses.length || 2}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-xs text-slate-400 block">Learning Modes</span>
              <span className="text-xl font-bold text-indigo-400">5</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-6 flex flex-wrap gap-2">
          {[
            { id: "catalog", label: "CEFR Course Catalog (A1.1 - C2)", icon: BookOpen },
            { id: "virtual", label: "Virtual Classrooms (Zoom / BBB)", icon: Video },
            { id: "player", label: "Interactive Lesson Player", icon: Play },
            { id: "ai", label: "German AI Tutor & Coach", icon: Sparkles },
            { id: "transcripts", label: "Transcripts & Formal Exams", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm ${
                  isActive
                    ? "bg-amber-500 text-slate-950 font-bold shadow-amber-500/20"
                    : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-800/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-amber-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab 1: CEFR Course Catalog */}
        {activeTab === "catalog" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Curated CEFR Progression Path (Goethe & TELC Compliant)
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Explore structured curricula designed for Physical, Hybrid, Online, Weekend, and Self-Paced learning modes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels.map((lvl) => (
                <div
                  key={lvl.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
                        CEFR {lvl.cefr_category}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        {lvl.duration_weeks} Weeks
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      {lvl.code} — {lvl.name}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">{lvl.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Prerequisite: <strong className="text-slate-300">{lvl.parent_level || "None (Entry)"}</strong>
                    </span>
                    <button
                      onClick={() => setActiveTab("player")}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      Enter Course <Play className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Virtual Classrooms */}
        {activeTab === "virtual" && (
          <div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-emerald-400" />
                  Live Zoom & BigBlueButton Virtual Classrooms
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Students join seamlessly with single-click authentication. Automatic telemetry tracks Join Time, Duration, and Attendance %.
                </p>
              </div>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Refresh Telemetry
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {virtualClasses.map((vc) => (
                <div
                  key={vc.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-xs border ${
                        vc.platform === "Zoom"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      }`}
                    >
                      {vc.platform === "Zoom" ? "Zoom Enterprise" : "BigBlueButton (BBB)"}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        vc.status === "LIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${vc.status === "LIVE" ? "bg-emerald-400" : "bg-slate-500"}`} />
                      {vc.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{vc.cohort}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> {vc.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> {vc.start_time} - {vc.end_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" /> Waiting Room: {vc.waiting_room ? "Enabled" : "Off"}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 mb-6 flex flex-col gap-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Meeting ID:</span>
                      <strong className="text-slate-200">{vc.meeting_id}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Passcode:</span>
                      <strong className="text-slate-200">{vc.passcode}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleJoinClass(vc)}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all text-sm"
                    >
                      Join Online Class <ExternalLink className="w-4 h-4" />
                    </button>
                    {vc.host_link && (
                      <a
                        href={vc.host_link}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-medium py-2.5 px-4 rounded-lg text-sm flex items-center gap-1.5 border border-slate-700"
                      >
                        Start Host Room
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Lesson Player */}
        {activeTab === "player" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
                  {selectedLesson.type === "VIDEO" ? "Video Lecture Stream" : "Interactive PDF Resource"}
                </span>
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Progress Synced to SIS
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">{selectedLesson.title}</h2>

              {selectedLesson.type === "VIDEO" ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 shadow-inner mb-4 relative flex items-center justify-center">
                  <video controls className="w-full h-full object-cover" src={selectedLesson.url}>
                    Your browser does not support HTML5 video.
                  </video>
                </div>
              ) : (
                <div className="aspect-video bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center justify-center p-6 text-center mb-4">
                  <FileText className="w-16 h-16 text-amber-400 mb-3 animate-bounce" />
                  <h4 className="text-lg font-bold text-white mb-1">Official Course Worksheet & Exercises</h4>
                  <p className="text-xs text-slate-400 max-w-md mb-4">
                    Download or view the verified PDF document containing grammar drills and writing prompts.
                  </p>
                  <a
                    href={selectedLesson.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg"
                  >
                    Open Document in Viewer <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              <p className="text-slate-300 text-sm leading-relaxed">{selectedLesson.desc}</p>
            </div>

            {/* Playlist / Syllabus */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Module Syllabus (B1.1)
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      title: "Lektion 1: Einführung in den Konjunktiv II (Video Lecture)",
                      type: "VIDEO",
                      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                      desc: "Comprehensive review of Konjunktiv II hypothetical structures with Herr Müller.",
                    },
                    {
                      title: "Lektion 2: Übungsblatt Konjunktiv II (PDF Worksheet)",
                      type: "PDF",
                      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                      desc: "Complete exercises 1 to 5 on hypothetical job interviews.",
                    },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedLesson(item as any)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                        selectedLesson.title === item.title
                          ? "bg-amber-500/10 border-amber-500/50 text-white"
                          : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span className="p-2 rounded bg-slate-800 text-amber-400 mt-0.5">
                        {item.type === "VIDEO" ? <Play className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </span>
                      <div>
                        <div className="font-semibold text-sm line-clamp-1">{item.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.type} Resource • Verified</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 mt-6 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-400">
                <strong className="text-white block mb-1">Need assignment assistance?</strong>
                Ask the German AI Coach on the next tab for instant Goethe grammar support.
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: German AI Tutor */}
        {activeTab === "ai" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-400" /> German AI Learning Coach
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Tailored conversational tutor trained on official Goethe-Zertifikat and TELC assessment guidelines. Ask grammar questions or request vocabulary breakdowns.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">CEFR Target Level</label>
                    <select
                      value={aiLevel}
                      onChange={(e) => setAiLevel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      {levels.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.code} — {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Inquiry Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["GRAMMAR", "VOCABULARY", "TRANSLATE", "EXAM_PREP"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAiIntent(m)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            aiIntent === m
                              ? "bg-amber-500/10 border-amber-500 text-amber-400"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mt-6 text-xs text-slate-400">
                <span className="text-amber-400 font-bold block mb-0.5">Quick Example Prompt:</span>
                &quot;Explain how to construct Nebensätze with weil and dass.&quot;
              </div>
            </div>

            {/* AI Console Chat Box */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-[520px]">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {aiHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <Sparkles className="w-12 h-12 text-amber-500/40 mb-3" />
                    <h4 className="text-base font-bold text-slate-300">Your AI Language Assistant is Ready</h4>
                    <p className="text-xs max-w-sm mt-1">
                      Type your German language question below. Try asking for sentence structure rules or Goethe exam mock questions!
                    </p>
                  </div>
                ) : (
                  aiHistory.map((h, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-end">
                        <div className="bg-amber-500 text-slate-950 font-medium px-4 py-2.5 rounded-2xl rounded-tr-none text-sm max-w-md shadow">
                          {h.q}
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-slate-950 border border-slate-800 text-slate-200 px-5 py-4 rounded-2xl rounded-tl-none text-sm max-w-xl shadow-lg whitespace-pre-wrap">
                          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-400 border-b border-slate-800 pb-1.5">
                            <Bot className="w-4 h-4" /> Horizon German AI Coach ({h.r.level})
                          </div>
                          {h.r.response}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAskAI} className="flex gap-2 pt-3 border-t border-slate-800">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={`Ask AI Coach about German grammar, vocabulary, or translation (${aiLevel})...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow-lg transition-colors"
                >
                  {aiLoading ? "Thinking..." : "Send"} <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 5: Transcripts & Official Exams */}
        {activeTab === "transcripts" && (
          <div className="space-y-6">
            {transcript ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20 inline-block mb-2">
                      Verified Institutional Record
                    </span>
                    <h2 className="text-2xl font-bold text-white">Official Academic Transcript & Competency Record</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Transcript ID: <strong className="text-slate-300 font-mono">{transcript.transcript_id}</strong> • Generated: {new Date(transcript.generated_at).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg"
                  >
                    <FileText className="w-4 h-4" /> Export Verified PDF
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block">Admission Number</span>
                    <strong className="text-lg text-white font-mono">{transcript.student_info.admission_number}</strong>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block">Student Name</span>
                    <strong className="text-lg text-white">{transcript.student_info.full_name}</strong>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block">Current Level</span>
                    <strong className="text-lg text-amber-400 font-bold">{transcript.student_info.current_level}</strong>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block">Fee Clearance</span>
                    <strong
                      className={`text-lg font-bold ${
                        transcript.academic_metrics.fee_clearance_status === "CLEARED"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {transcript.academic_metrics.fee_clearance_status}
                    </strong>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Examination & Placement History
                </h3>

                <div className="overflow-x-auto bg-slate-950 rounded-lg border border-slate-800">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs uppercase font-semibold">
                        <th className="p-3.5">Exam Code</th>
                        <th className="p-3.5">Title</th>
                        <th className="p-3.5">Level</th>
                        <th className="p-3.5">Score</th>
                        <th className="p-3.5">Grade / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {transcript.examination_history.length > 0 ? (
                        transcript.examination_history.map((ex, i) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            <td className="p-3.5 font-mono text-amber-400 font-medium">{ex.exam_code}</td>
                            <td className="p-3.5">{ex.title}</td>
                            <td className="p-3.5 font-bold">{ex.level}</td>
                            <td className="p-3.5">
                              {ex.marks_obtained !== null ? `${ex.marks_obtained} / ${ex.maximum_marks}` : "Pending"}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                {ex.grade}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500">
                            No formal examination history recorded yet. Complete your level placement test to issue record.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-xl mx-auto">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Transcript Telemetry Syncing</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Enroll in a German language level or complete an official Goethe mock assessment to activate transcript generation.
                </p>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm"
                >
                  Re-check Records
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
