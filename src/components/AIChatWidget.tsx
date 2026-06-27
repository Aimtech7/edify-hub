import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  actions?: Array<{ action: string; label: string; url: string }>;
  logId?: number;
  feedbackGiven?: 'HELPFUL' | 'NOT_HELPFUL';
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Guten Tag! Welcome to the **Horizon AI Assistant**. I am empowered by live institutional RAG to answer your academic, financial, and admissions questions. How can I assist you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: q
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/chat/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: q })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply || 'No response generated.',
          actions: data.actions || [],
          logId: data.log_id
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: '⚠️ **Connection Error**: Unable to reach Horizon RAG AI Engine. Please check your network or try again shortly.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (msgId: string, logId: number, rating: 'HELPFUL' | 'NOT_HELPFUL') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedbackGiven: rating } : m))
    );

    try {
      await fetch('/api/ai/feedback/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: logId, rating })
      });
    } catch (e) {
      console.error('Feedback failed', e);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-[#0F172A] via-[#DC2626] to-[#0F172A] text-white p-4 rounded-full shadow-2xl border-2 border-[#EAB308] hover:scale-105 transition-transform flex items-center gap-2 group"
          title="Horizon AI RAG Assistant"
        >
          <span className="text-2xl animate-bounce">🤖</span>
          <span className="font-extrabold text-sm pr-1 hidden group-hover:inline transition-all text-[#EAB308]">Horizon AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 border-2 border-[#0F172A] dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[550px] animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#DC2626]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="font-black text-sm text-white tracking-wide">HORIZON <span className="text-[#EAB308]">AI RAG</span></h3>
                <p className="text-[10px] text-slate-300">Enterprise Database & KB Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMessages([messages[0]])}
                className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded"
                title="Clear Chat"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-300 hover:text-white font-bold text-lg px-2"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="bg-slate-100 dark:bg-slate-800 p-2 flex gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-700 text-xs whitespace-nowrap scrollbar-none">
            <button onClick={() => handleSend('What is my fee balance?')} className="bg-white dark:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-600 hover:border-[#DC2626] font-semibold text-slate-700 dark:text-slate-200 transition">💰 My Balance</button>
            <button onClick={() => handleSend('Check my attendance rate')} className="bg-white dark:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-600 hover:border-[#DC2626] font-semibold text-slate-700 dark:text-slate-200 transition">📅 Attendance</button>
            <button onClick={() => handleSend('Admissions requirements')} className="bg-white dark:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-600 hover:border-[#DC2626] font-semibold text-slate-700 dark:text-slate-200 transition">📝 Admissions</button>
            <button onClick={() => handleSend('Goethe exam prep')} className="bg-white dark:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-600 hover:border-[#DC2626] font-semibold text-slate-700 dark:text-slate-200 transition">🎓 Exams</button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm bg-slate-50 dark:bg-slate-900/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#0F172A] text-white rounded-br-none font-medium'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                </div>

                {/* Suggested Navigation Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                    {msg.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (act.url.startsWith('/admin')) {
                            window.location.href = act.url;
                          } else {
                            navigate(act.url);
                          }
                        }}
                        className="bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition"
                      >
                        <span>⚡</span> {act.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Feedback rating */}
                {msg.sender === 'ai' && msg.logId && (
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 pl-1">
                    <span>Was this helpful?</span>
                    <button
                      onClick={() => handleFeedback(msg.id, msg.logId!, 'HELPFUL')}
                      disabled={!!msg.feedbackGiven}
                      className={`hover:text-emerald-500 ${msg.feedbackGiven === 'HELPFUL' ? 'text-emerald-500 font-bold' : ''}`}
                    >
                      👍
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, msg.logId!, 'NOT_HELPFUL')}
                      disabled={!!msg.feedbackGiven}
                      className={`hover:text-rose-500 ${msg.feedbackGiven === 'NOT_HELPFUL' ? 'text-rose-500 font-bold' : ''}`}
                    >
                      👎
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-500 text-xs font-semibold animate-pulse">
                  <span>🤖 Analyzing database records...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about fees, courses..."
              className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#DC2626] text-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50 text-[#EAB308] font-bold px-4 py-2 rounded-xl text-xs transition shadow"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
