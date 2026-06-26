import React, { useState, useEffect } from "react";
import { PlayCircle, Lock, CheckCircle2, Video, Headphones, FileText, Presentation, Globe, Download, ChevronRight, BookOpen, AlertCircle } from "lucide-react";
import { apiClient as api } from "@/services";

interface Lesson {
  id: number;
  title: string;
  order: number;
  media_type: string;
  content_url: string;
  body_html: string;
  duration_seconds: number;
  is_unlocked: boolean;
}

interface Module {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

export default function LearningPlayerPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completedIds, setCompletedIds] = useState<number[]>([]);

  useEffect(() => {
    fetchCourseData();
  }, []);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/odel/modules/");
      const mods: Module[] = res.data.results || res.data || [];
      setModules(mods);

      // Select first unlocked lesson
      for (const m of mods) {
        if (m.lessons && m.lessons.length > 0) {
          setActiveLesson(m.lessons[0]);
          break;
        }
      }
    } catch (err) {
      console.error("Failed to load ODEL player data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    if (!lesson.is_unlocked && !completedIds.includes(lesson.id)) {
      alert("🔒 Diese Lektion ist gesperrt. Bitte absolvieren Sie zuerst die vorherige Lektion!");
      return;
    }
    setActiveLesson(lesson);
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson) return;
    try {
      setCompleting(true);
      await api.post(`/odel/lessons/${activeLesson.id}/record-progress/`, {
        time_spent_seconds: 180,
        is_completed: true
      });
      setCompletedIds((prev) => [...prev, activeLesson.id]);
      
      // Update local unlock status for dependent lessons
      setModules((prevMods) =>
        prevMods.map((mod) => ({
          ...mod,
          lessons: mod.lessons?.map((les) => {
            if (les.id === activeLesson.id + 1) {
              return { ...les, is_unlocked: true };
            }
            return les;
          })
        }))
      );

      alert("🎉 Lektion erfolgreich abgeschlossen! Nächste Inhalte wurden freigeschaltet.");
    } catch (err) {
      console.error("Failed to record lesson progress:", err);
      alert("Fortschritt konnte nicht gespeichert werden.");
    } finally {
      setCompleting(false);
    }
  };

  const renderMediaIcon = (type: string) => {
    switch (type) {
      case "VIDEO": return <Video className="w-4 h-4 text-blue-400" />;
      case "AUDIO": return <Headphones className="w-4 h-4 text-pink-400" />;
      case "PDF": return <FileText className="w-4 h-4 text-amber-400" />;
      case "PPT": return <Presentation className="w-4 h-4 text-purple-400" />;
      case "HTML": return <BookOpen className="w-4 h-4 text-indigo-400" />;
      default: return <Globe className="w-4 h-4 text-emerald-400" />;
    }
  };

  const renderMediaContent = () => {
    if (!activeLesson) return null;

    switch (activeLesson.media_type) {
      case "VIDEO":
      case "INTERACTIVE":
      case "SCORM":
      case "EXTERNAL_URL":
        return (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800">
            {activeLesson.content_url ? (
              <iframe
                src={activeLesson.content_url}
                className="w-full h-full border-0"
                allowFullScreen
                title={activeLesson.title}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">Keine URL hinterlegt</div>
            )}
          </div>
        );

      case "AUDIO":
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-slate-900 to-purple-950/40 rounded-2xl border border-slate-800 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center mb-6 animate-pulse">
              <Headphones className="w-10 h-10 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{activeLesson.title}</h3>
            <p className="text-slate-400 text-sm mb-8">Audio-Lerneinheit (Hörverstehen)</p>
            <audio controls src={activeLesson.content_url} className="w-full max-w-md" />
          </div>
        );

      case "PDF":
        return (
          <div className="w-full h-[650px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            <iframe src={activeLesson.content_url} className="w-full h-full border-0" title="PDF Viewer" />
          </div>
        );

      case "HTML":
        return (
          <div className="p-8 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: activeLesson.body_html || "<p>Kein Textinhalt vorhanden.</p>" }} />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl text-center">
            <Download className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">{activeLesson.title}</h3>
            <p className="text-slate-400 text-sm mb-6">Arbeitsmaterial zum Herunterladen</p>
            <a
              href={activeLesson.content_url || "#"}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-500 transition-colors inline-flex items-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Datei herunterladen</span>
            </a>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[80vh] animate-fadeIn">
      {/* Course Navigation Sidebar */}
      <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-full max-h-[85vh] overflow-hidden">
        <div className="pb-4 border-b border-slate-800">
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">ODEL-DEUTSCH-B2</span>
          <h2 className="text-lg font-extrabold text-white mt-1">Kurs-Curriculum</h2>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-6 pr-1 custom-scrollbar">
          {modules.map((mod) => (
            <div key={mod.id} className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center justify-between">
                <span>{mod.title}</span>
              </h4>
              <div className="space-y-1">
                {mod.lessons?.map((les) => {
                  const isActive = activeLesson?.id === les.id;
                  const isDone = completedIds.includes(les.id);
                  const isUnlocked = les.is_unlocked || isDone;

                  return (
                    <button
                      key={les.id}
                      onClick={() => handleLessonSelect(les)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                        isActive
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-semibold"
                          : isUnlocked
                          ? "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                          : "text-slate-500 bg-slate-950/40 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {renderMediaIcon(les.media_type)}
                        <span className="truncate">{les.title}</span>
                      </div>
                      <div>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : !isUnlocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        ) : (
                          <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-600"}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Learning Player Area */}
      <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
        <div>
          {activeLesson ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 px-6 py-4 rounded-2xl backdrop-blur-md">
                <div>
                  <span className="text-xs font-medium text-purple-400">Aktuelle Lektion</span>
                  <h1 className="text-2xl font-bold text-white mt-0.5">{activeLesson.title}</h1>
                </div>
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
                  {activeLesson.media_type}
                </span>
              </div>

              {renderMediaContent()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-800 bg-slate-900/50 text-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mb-3" />
              <h3 className="text-lg font-bold text-slate-300">Wählen Sie eine Lektion aus</h3>
              <p className="text-slate-500 text-sm mt-1">Klicken Sie links in der Navigation auf ein Modul, um den E-Learning Player zu starten.</p>
            </div>
          )}
        </div>

        {/* Action Bar */}
        {activeLesson && (
          <div className="sticky bottom-4 z-20 flex items-center justify-between bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Lernfortschritt wird aufgezeichnet</span>
            </div>
            <button
              disabled={completing || completedIds.includes(activeLesson.id)}
              onClick={handleCompleteLesson}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all ${
                completedIds.includes(activeLesson.id)
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-emerald-500/25 hover:-translate-y-0.5"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {completing
                  ? "Speichere..."
                  : completedIds.includes(activeLesson.id)
                  ? "Lektion abgeschlossen"
                  : "Als abgeschlossen markieren & Nächste freischalten"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
