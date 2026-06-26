import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Video, Music, FileText, Globe, CheckCircle2, ShieldAlert } from "lucide-react";
import { apiClient as api } from "@/services";

interface OdelCourse {
  id: number;
  title: string;
  code: string;
  description: string;
  is_published: boolean;
}

export default function OdelCoursesPage() {
  const [courses, setCourses] = useState<OdelCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/odel/courses/");
      setCourses(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to fetch ODEL courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/odel/courses/", {
        title: newTitle,
        code: newCode,
        description: newDesc,
        level: 1, // default fallback
        is_published: true
      });
      setShowModal(false);
      setNewTitle("");
      setNewCode("");
      setNewDesc("");
      fetchCourses();
    } catch (err) {
      alert("Fehler beim Erstellen des Kurses. Bitte Code überprüfen.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-purple-200 mb-3 border border-white/10">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>ODEL LMS Management</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
              Fernunterricht & E-Learning Kurse
            </h1>
            <p className="text-slate-300 mt-1 max-w-2xl text-sm">
              Verwalten Sie Online-Kurse, Modulhierarchien und alle 9 Medientypen (Video, Audio, PDF, SCORM, H5P) für Horizon-Studenten.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-sm shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-0.5 border border-purple-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Neuen Kurs anlegen</span>
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-200">Keine ODEL-Kurse vorhanden</h3>
          <p className="text-slate-400 text-sm mt-1">Klicken Sie oben auf "Neuen Kurs anlegen", um den E-Learning Katalog zu starten.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-xl"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 rounded-lg bg-purple-950/80 font-mono text-xs font-bold text-purple-300 border border-purple-800/50">
                    {course.code}
                  </span>
                  {course.is_published ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 text-xs font-medium border border-emerald-800/50">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Veröffentlicht</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-400 text-xs font-medium border border-amber-800/50">
                      Entwurf
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                  {course.title}
                </h3>
                <p className="text-slate-400 text-sm mt-2 line-clamp-3">
                  {course.description || "Keine Beschreibung verfügbar."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1" title="Video"><Video className="w-3.5 h-3.5 text-blue-400" /></span>
                  <span className="flex items-center gap-1" title="Audio"><Music className="w-3.5 h-3.5 text-pink-400" /></span>
                  <span className="flex items-center gap-1" title="PDF"><FileText className="w-3.5 h-3.5 text-amber-400" /></span>
                  <span className="flex items-center gap-1" title="SCORM/H5P"><Globe className="w-3.5 h-3.5 text-emerald-400" /></span>
                </div>
                <a
                  href={`/app/player?course=${course.id}`}
                  className="font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Inhalte verwalten &rarr;</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Neuen ODEL-Kurs anlegen</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kurs-Titel</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="z.B. ODEL Wirtschaftsdeutsch C1"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Eindeutiger Kurs-Code</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="z.B. ODEL-C1-WIRT"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Beschreibung</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Inhalte, Lernziele, Zielgruppe..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
