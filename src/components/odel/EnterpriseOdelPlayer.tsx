import React, { useState } from 'react';

interface Lesson {
  id: number;
  title: string;
  media_type: string;
  content_url?: string;
  body_html?: string;
  code_snippet?: string;
  duration_seconds: number;
}

interface EnterpriseOdelPlayerProps {
  courseTitle: string;
  lessons: Lesson[];
  onProgressRecord: (lessonId: number, timeSpent: number, isCompleted: boolean) => void;
  virtualClassLink?: string;
}

export const EnterpriseOdelPlayer: React.FC<EnterpriseOdelPlayerProps> = ({
  courseTitle,
  lessons,
  onProgressRecord,
  virtualClassLink
}) => {
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'FORUM' | 'ASSIGNMENT' | 'CBT_QUIZ'>('CONTENT');
  const [timeSpent, setTimeSpent] = useState(0);

  const activeLesson = lessons[activeLessonIndex] || null;

  const handleCompleteLesson = () => {
    if (activeLesson) {
      onProgressRecord(activeLesson.id, timeSpent + 60, true);
      if (activeLessonIndex < lessons.length - 1) {
        setActiveLessonIndex(activeLessonIndex + 1);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-900 text-white font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
          <h2 className="text-xl font-bold tracking-wide text-amber-400">{courseTitle}</h2>
          <p className="text-xs text-slate-400 mt-1">Enterprise LMS & ODEL Platform</p>
          {virtualClassLink && (
            <a
              href={virtualClassLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block w-full bg-emerald-600 hover:bg-emerald-500 text-center py-2 px-3 rounded text-sm font-semibold shadow transition duration-150 animate-pulse"
            >
              📹 Join Live Classroom
            </a>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {lessons.map((lesson, idx) => {
            const isActive = idx === activeLessonIndex;
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonIndex(idx)}
                className={`w-full text-left px-3 py-2.5 rounded text-sm flex items-center justify-between transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span className="truncate">
                  {idx + 1}. {lesson.title}
                </span>
                <span className="text-xs opacity-75 px-1.5 py-0.5 rounded bg-black/20 uppercase">
                  {lesson.media_type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        {activeLesson ? (
          <>
            {/* Top Bar Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900 px-6 space-x-6">
              <button
                onClick={() => setActiveTab('CONTENT')}
                className={`py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'CONTENT'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📖 Lesson Content
              </button>
              <button
                onClick={() => setActiveTab('FORUM')}
                className={`py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'FORUM'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                💬 Discussion Forum
              </button>
              <button
                onClick={() => setActiveTab('ASSIGNMENT')}
                className={`py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'ASSIGNMENT'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📝 Assignments
              </button>
              <button
                onClick={() => setActiveTab('CBT_QUIZ')}
                className={`py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'CBT_QUIZ'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ CBT Quiz
              </button>
            </div>

            {/* Viewer Pane */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-2xl font-bold">{activeLesson.title}</h1>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                    Duration: {Math.floor(activeLesson.duration_seconds / 60)} mins
                  </span>
                </div>

                {activeTab === 'CONTENT' && (
                  <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-inner min-h-[400px]">
                    {activeLesson.media_type === 'VIDEO' && (
                      <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                        {activeLesson.content_url ? (
                          <iframe
                            src={activeLesson.content_url}
                            title={activeLesson.title}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        ) : (
                          <div className="text-center text-slate-500">
                            <p className="text-4xl mb-2">▶️</p>
                            <p>HTML5 Video Lecture Viewer</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeLesson.media_type === 'AUDIO' && (
                      <div className="p-8 bg-slate-800/60 rounded-lg flex flex-col items-center justify-center">
                        <p className="text-5xl mb-4 animate-bounce">🎧</p>
                        <audio controls className="w-full max-w-md mt-4">
                          <source src={activeLesson.content_url} />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    {activeLesson.media_type === 'PDF' && (
                      <div className="h-[600px] bg-slate-800 rounded flex flex-col items-center justify-center p-4">
                        <p className="text-4xl mb-2">📄</p>
                        <p className="text-sm text-slate-400 mb-4">Enterprise PDF Document Viewer</p>
                        <a
                          href={activeLesson.content_url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded font-bold text-sm shadow"
                        >
                          Download / View PDF in Fullscreen
                        </a>
                      </div>
                    )}

                    {activeLesson.media_type === 'PPT' && (
                      <div className="h-[500px] bg-slate-800 rounded flex flex-col items-center justify-center">
                        <p className="text-5xl mb-2">📊</p>
                        <p className="text-sm text-slate-400">PowerPoint Presentation Viewer</p>
                      </div>
                    )}

                    {activeLesson.media_type === 'CODE_SNIPPET' && (
                      <pre className="p-4 bg-black/80 rounded-lg font-mono text-sm overflow-x-auto text-emerald-400 border border-slate-800">
                        <code>{activeLesson.code_snippet || '// No code provided'}</code>
                      </pre>
                    )}

                    {activeLesson.media_type === 'HTML' && (
                      <div
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: activeLesson.body_html || '<p>No content</p>' }}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'FORUM' && (
                  <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <h3 className="text-lg font-bold text-amber-400 mb-4">💬 Lesson Q&A Board</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-800/80 rounded-lg border border-slate-700">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span className="font-bold text-amber-300">Staff Instructor</span>
                          <span>Pinned • 2 hrs ago</span>
                        </div>
                        <p className="text-sm">Welcome to this lesson! Please post any questions regarding German grammar rules below.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ASSIGNMENT' && (
                  <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <h3 className="text-lg font-bold text-amber-400 mb-2">📝 Lesson Assignment</h3>
                    <p className="text-sm text-slate-300 mb-6">Complete the exercises attached and submit your response below.</p>
                    <textarea
                      placeholder="Type rich text response or notes here..."
                      className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-sm focus:outline-none focus:border-amber-400"
                    />
                    <button className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded font-bold text-sm shadow">
                      Submit Assignment
                    </button>
                  </div>
                )}

                {activeTab === 'CBT_QUIZ' && (
                  <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-center py-12">
                    <p className="text-4xl mb-3">⚡</p>
                    <h3 className="text-xl font-bold mb-2">Computer Based Assessment</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                      30 Minute Timer • Random Question Bank • Auto Submit • Immediate Grading
                    </p>
                    <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-lg font-bold shadow-lg text-base">
                      Start CBT Quiz Attempt
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Action Bar */}
              <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Learning Analytics: Tracking Watch Percentage & Time Spent
                </span>
                <button
                  onClick={handleCompleteLesson}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 rounded-lg font-bold text-sm shadow transition duration-150"
                >
                  Mark Lesson Completed & Continue ➔
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Select a lesson from the sidebar to start learning.
          </div>
        )}
      </div>
    </div>
  );
};
