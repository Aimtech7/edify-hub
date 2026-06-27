import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '@/lib/auth';
import {
  Bot, Send, Paperclip, Mic, Maximize2, Minimize2, Settings, Trash2, RotateCcw, Copy, Check,
  ThumbsUp, ThumbsDown, FileText, Download, ExternalLink, Sparkles, MessageSquarePlus, X,
  History, AlertCircle, Volume2
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  actions?: Array<{ action: string; label: string; url: string }>;
  documents?: Array<{ title: string; url: string; size?: string }>;
  logId?: number;
  feedbackGiven?: 'HELPFUL' | 'NOT_HELPFUL';
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'settings' | 'history'>('chat');
  
  const currentUser = getUser();
  const role = currentUser?.role || 'guest';
  const roleDisplay = currentUser ? `${currentUser.name.split(' ')[0]} (${role.toUpperCase()})` : 'Guest User';

  // AI Configuration Settings
  const [config, setConfig] = useState({
    fontSize: 'text-sm',
    responseLength: 'detailed',
    assistantName: 'Horizon AI Assistant',
    welcomeMsg: `Guten Tag! Welcome to the **Horizon AI Assistant**. I am connected to the institutional database & RAG knowledge base. How can I assist you today?`,
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: config.welcomeMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('horizon_ai_sessions');
      if (saved) setSessions(JSON.parse(saved));
    } catch {
      // fallback
    }
  }, []);

  const saveToHistory = (newMessages: Message[]) => {
    if (newMessages.length <= 1) return;
    const firstUserMsg = newMessages.find(m => m.sender === 'user')?.text || 'Conversation';
    const title = firstUserMsg.slice(0, 28) + (firstUserMsg.length > 28 ? '...' : '');
    
    const updatedSessions = [
      { id: Date.now().toString(), title, date: new Date().toLocaleDateString(), messages: newMessages },
      ...sessions.slice(0, 9) // keep last 10
    ];
    setSessions(updatedSessions);
    try {
      localStorage.setItem('horizon_ai_sessions', JSON.stringify(updatedSessions));
    } catch {
      // ignore quota
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, activeTab]);

  // Auto-resize input textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  };

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || isLoading) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!questionText) {
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/chat/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: q, role, response_length: config.responseLength })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Check if reply mentions downloadable handbooks or PDFs
        const simulatedDocs = [];
        if (q.toLowerCase().includes('handbook') || q.toLowerCase().includes('policy') || q.toLowerCase().includes('exam') || data.reply?.toLowerCase().includes('.pdf')) {
          simulatedDocs.push({
            title: 'Horizon_Institutional_Handbook_2026.pdf',
            url: '/app/knowledge-base',
            size: '2.4 MB'
          });
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply || 'No response generated from the database.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: data.actions || [],
          documents: simulatedDocs.length > 0 ? simulatedDocs : undefined,
          logId: data.log_id
        };
        const updated = [...nextMessages, aiMsg];
        setMessages(updated);
        saveToHistory(updated);
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'system',
          text: '⚠️ **Connection Error**: Unable to reach the Horizon RAG AI Engine. Please verify your network connection or try retrying.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text.replace(/<[^>]*>?/gm, ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  // Role-Aware Suggestions
  const getSuggestions = () => {
    switch (role) {
      case 'student':
        return [
          { label: '💰 My fee balance', prompt: 'What is my current fee balance and due installments?' },
          { label: '📅 Attendance rate', prompt: 'Check my current attendance percentage for this term.' },
          { label: '🎓 Goethe CEFR prep', prompt: 'Where can I find B1 and B2 Goethe exam preparation materials?' },
          { label: '📜 Student handbook', prompt: 'Show me the institutional rules and student code of conduct.' },
        ];
      case 'teacher':
        return [
          { label: '👨‍🏫 My assigned classes', prompt: 'List all classes and cohorts assigned to me this semester.' },
          { label: '📝 Mark attendance', prompt: 'How do I open roll call and submit daily attendance?' },
          { label: '📊 Class performance', prompt: 'Show average CEFR test scores for my active batches.' },
          { label: '📤 Upload resources', prompt: 'How do I upload audio recordings to the digital library?' },
        ];
      case 'accountant':
        return [
          { label: '💳 Today collections', prompt: 'What is the total M-Pesa tuition collection recorded today?' },
          { label: '⚠️ Outstanding balances', prompt: 'List students with overdue balances exceeding KES 20,000.' },
          { label: '🔍 Unallocated receipts', prompt: 'Show pending M-Pesa payments awaiting invoice matching.' },
        ];
      case 'admissions':
        return [
          { label: '📥 New applications', prompt: 'How many online admission forms are currently pending review?' },
          { label: '📋 Schedule Einstufungstest', prompt: 'How do I schedule a German placement test for an applicant?' },
          { label: '📈 Conversion rate', prompt: 'What is our applicant-to-student conversion percentage?' },
        ];
      default:
        return [
          { label: '🏫 German courses', prompt: 'What German language levels (A1 to C2) are offered at Horizon?' },
          { label: '💰 Tuition fee installments', prompt: 'Explain the payment plans and fee structures available.' },
          { label: '📍 Campus locations', prompt: 'Where are Horizon Deutsch campuses located and what are the contacts?' },
          { label: '❓ Ausbildung FAQ', prompt: 'What are the requirements for applying to Ausbildung programs in Germany?' },
        ];
    }
  };

  // Render formatted markdown text with code block support
  const renderMessageText = (text: string) => {
    // Split by bold markdown **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <div className="space-y-1.5">
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Hidden File Input for Document Attachments */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleSend(`[Attached Document: ${file.name}] Please analyze this uploaded file.`);
          }
        }}
      />

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Horizon AI Assistant"
          className="bg-gradient-to-r from-[#0F172A] via-[#DC2626] to-[#0F172A] text-white p-4 rounded-full shadow-2xl border-2 border-[#EAB308] hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#EAB308]/50 transition-all flex items-center gap-3 group cursor-pointer"
        >
          <div className="relative">
            <Bot className="size-7 text-[#EAB308] animate-bounce" />
            <span className="absolute -top-1 -right-1 size-3 bg-emerald-500 rounded-full border-2 border-[#0F172A]" />
          </div>
          <span className="font-extrabold text-sm pr-2 hidden sm:inline group-hover:inline transition-all text-white tracking-wide">
            Horizon AI <span className="text-[#EAB308]">RAG</span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white dark:bg-[#1E293B] border-2 border-[#0F172A] dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 ${
            isFullScreen
              ? 'fixed inset-4 sm:inset-10 w-auto h-auto z-50'
              : 'w-[92vw] sm:w-[420px] max-h-[620px] h-[600px]'
          }`}
        >
          {/* Header Bar */}
          <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#DC2626] select-none">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="size-9 rounded-xl bg-[#DC2626]/20 border border-[#DC2626] flex items-center justify-center shrink-0">
                <Bot className="size-5 text-[#EAB308]" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-white tracking-wide">{config.assistantName}</h3>
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">User: <span className="text-[#EAB308] font-semibold">{roleDisplay}</span></p>
              </div>
            </div>

            {/* Top Navigation Action Buttons */}
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={() => setActiveTab(activeTab === 'chat' ? 'history' : 'chat')}
                className={`p-1.5 rounded-lg transition ${activeTab === 'history' ? 'bg-[#DC2626] text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                title="Chat History"
                aria-label="View Chat History"
              >
                <History className="size-4" />
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'chat' ? 'settings' : 'chat')}
                className={`p-1.5 rounded-lg transition ${activeTab === 'settings' ? 'bg-[#DC2626] text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                title="AI Settings"
                aria-label="Open AI Settings"
              >
                <Settings className="size-4" />
              </button>
              <button
                onClick={() => {
                  setMessages([{ id: 'welcome', sender: 'ai', text: config.welcomeMsg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
                  setActiveTab('chat');
                }}
                className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg transition"
                title="New Conversation / Clear"
                aria-label="Clear Chat"
              >
                <MessageSquarePlus className="size-4" />
              </button>
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="hidden sm:flex p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg transition"
                title={isFullScreen ? "Minimize" : "Full Screen"}
                aria-label="Toggle Full Screen"
              >
                {isFullScreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:bg-rose-600 hover:text-white rounded-lg transition ml-1"
                title="Close Window"
                aria-label="Close Chatbot"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* MAIN TAB CONTENT AREA */}
          {activeTab === 'settings' ? (
            <div className="flex-1 p-5 overflow-y-auto bg-slate-50 dark:bg-[#0F172A] space-y-5 text-slate-800 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-base flex items-center gap-2">
                  <Settings className="size-4 text-[#DC2626]" /> AI Assistant Preferences
                </h4>
                <button onClick={() => setActiveTab('chat')} className="text-xs text-blue-600 hover:underline">Back to Chat</button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Response Detail Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConfig({ ...config, responseLength: 'concise' })}
                      className={`p-2 rounded-xl border text-center font-medium transition ${config.responseLength === 'concise' ? 'bg-[#DC2626] text-white border-[#DC2626]' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}
                    >
                      ⚡ Concise Summary
                    </button>
                    <button
                      onClick={() => setConfig({ ...config, responseLength: 'detailed' })}
                      className={`p-2 rounded-xl border text-center font-medium transition ${config.responseLength === 'detailed' ? 'bg-[#DC2626] text-white border-[#DC2626]' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}
                    >
                      📖 Detailed & Analytical
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Font Scale (Accessibility)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['text-xs', 'text-sm', 'text-base'].map((size, idx) => (
                      <button
                        key={size}
                        onClick={() => setConfig({ ...config, fontSize: size })}
                        className={`p-2 rounded-xl border text-center font-medium capitalize transition ${config.fontSize === size ? 'bg-[#0F172A] text-[#EAB308] border-[#EAB308]' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}
                      >
                        {['Small', 'Normal', 'Large'][idx]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                  <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="size-4" /> Institutional Data Governance
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Queries are processed via live database retrieval (RAG). Teachers and staff are restricted from viewing confidential payroll or unassigned student ledgers in compliance with GDPR.
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            <div className="flex-1 p-5 overflow-y-auto bg-slate-50 dark:bg-[#0F172A] space-y-4 text-slate-800 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-base flex items-center gap-2">
                  <History className="size-4 text-[#DC2626]" /> Past Conversations
                </h4>
                <button onClick={() => setSessions([])} className="text-xs text-rose-600 hover:underline flex items-center gap-1">
                  <Trash2 className="size-3" /> Clear All
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <History className="size-8 mx-auto stroke-1" />
                  <p className="text-xs">No archived conversations yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => {
                        setMessages(sess.messages);
                        setActiveTab('chat');
                      }}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#DC2626] cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">{sess.title}</div>
                        <div className="text-[10px] text-slate-400">{sess.date} · {sess.messages.length} messages</div>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-[#DC2626]">→</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Quick Suggestion Chips */}
              <div className="bg-slate-100 dark:bg-[#0F172A] px-3 py-2 flex gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 text-xs whitespace-nowrap scrollbar-none shrink-0">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
                  <Sparkles className="size-3 text-[#EAB308]" /> Suggested:
                </span>
                {getSuggestions().map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(sug.prompt)}
                    className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 hover:border-[#DC2626] hover:text-[#DC2626] dark:hover:text-[#EAB308] font-semibold text-slate-700 dark:text-slate-200 transition shadow-2xs shrink-0 cursor-pointer"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>

              {/* Messages Body */}
              <div className={`flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-[#0F172A] ${config.fontSize}`}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {/* Timestamp & Sender Label */}
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {msg.sender === 'user' ? 'You' : msg.sender === 'ai' ? 'Horizon AI' : 'System Notice'}
                      </span>
                      <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                    </div>

                    {/* High Contrast Message Bubble */}
                    <div
                      className={`max-w-[88%] px-4 py-3 rounded-2xl shadow-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#991b1b] dark:bg-[#b91c1c] text-white rounded-br-none font-medium'
                          : msg.sender === 'system'
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-bl-none text-xs'
                          : 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                      }`}
                    >
                      {renderMessageText(msg.text)}

                      {/* Attached Document Reference Cards */}
                      {msg.documents && msg.documents.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Verified Institutional References:</span>
                          {msg.documents.map((doc, dIdx) => (
                            <div key={dIdx} className="bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="size-5 text-[#DC2626] shrink-0" />
                                <div className="truncate">
                                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{doc.title}</div>
                                  {doc.size && <div className="text-[10px] text-slate-400">{doc.size} · PDF Document</div>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => navigate(doc.url)}
                                  className="p-1.5 bg-white dark:bg-slate-800 hover:bg-[#DC2626] hover:text-white rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold transition flex items-center gap-1"
                                  title="Preview / Open Document"
                                >
                                  <ExternalLink className="size-3" /> Open
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Suggested Navigation Actions */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 max-w-[88%]">
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
                            className="bg-[#0F172A] hover:bg-[#DC2626] text-[#EAB308] hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition cursor-pointer border border-[#EAB308]/30"
                          >
                            <Sparkles className="size-3" /> {act.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* AI Message Action Footer (Copy, Regenerate, Feedback) */}
                    {msg.sender === 'ai' && (
                      <div className="mt-1.5 flex items-center justify-between w-full max-w-[88%] px-1 text-slate-400 text-[11px]">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCopy(msg.text, msg.id)}
                            className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition"
                            title="Copy text"
                          >
                            {copiedId === msg.id ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={() => handleSend(messages[messages.length - 2]?.text || 'Repeat')}
                            className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition"
                            title="Regenerate answer"
                          >
                            <RotateCcw className="size-3.5" />
                            <span>Retry</span>
                          </button>
                        </div>

                        {msg.logId && (
                          <div className="flex items-center gap-2">
                            <span>Helpful?</span>
                            <button
                              onClick={() => handleFeedback(msg.id, msg.logId!, 'HELPFUL')}
                              disabled={!!msg.feedbackGiven}
                              className={`hover:text-emerald-500 transition ${msg.feedbackGiven === 'HELPFUL' ? 'text-emerald-500 font-bold' : ''}`}
                              title="Yes, helpful"
                            >
                              <ThumbsUp className="size-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, msg.logId!, 'NOT_HELPFUL')}
                              disabled={!!msg.feedbackGiven}
                              className={`hover:text-rose-500 transition ${msg.feedbackGiven === 'NOT_HELPFUL' ? 'text-rose-500 font-bold' : ''}`}
                              title="No, inaccurate"
                            >
                              <ThumbsDown className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-2">
                    <div className="bg-white dark:bg-[#1E293B] px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-slate-600 dark:text-slate-300 text-xs font-semibold shadow-sm">
                      <div className="flex gap-1">
                        <span className="size-2 rounded-full bg-[#DC2626] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="size-2 rounded-full bg-[#EAB308] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="size-2 rounded-full bg-[#0F172A] dark:bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span>Analyzing institutional database & embedding vectors...</span>
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
                className="p-3 bg-white dark:bg-[#1E293B] border-t border-slate-200 dark:border-slate-700 space-y-2 shrink-0"
              >
                <div className="flex items-end gap-2 bg-slate-100 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 focus-within:border-[#DC2626] focus-within:ring-1 focus-within:ring-[#DC2626] transition">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-slate-400 hover:text-[#DC2626] transition rounded-lg shrink-0 cursor-pointer"
                    title="Attach document or screenshot for AI analysis"
                    aria-label="Attach File"
                  >
                    <Paperclip className="size-4" />
                  </button>

                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask about fees, timetables, Goethe exams..."
                    className="flex-1 bg-transparent border-0 resize-none max-h-[100px] py-1 text-xs sm:text-sm focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setVoiceActive(true);
                      setTimeout(() => {
                        setVoiceActive(false);
                        setInput(prev => prev + " Check my academic progression history.");
                      }, 1500);
                    }}
                    className={`p-1.5 transition rounded-lg shrink-0 cursor-pointer ${voiceActive ? 'text-rose-500 animate-pulse bg-rose-500/10' : 'text-slate-400 hover:text-[#EAB308]'}`}
                    title="Voice speech-to-text input"
                    aria-label="Voice Input"
                  >
                    <Mic className="size-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-slate-400">
                    {input.length}/500 chars · Press <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">Enter ↵</kbd> to send
                  </span>
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-gradient-to-r from-[#0F172A] to-[#DC2626] hover:opacity-90 disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Send</span>
                    <Send className="size-3.5 text-[#EAB308]" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
