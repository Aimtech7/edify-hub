import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Send, Check, CheckCheck, Clock, Volume2, VolumeX, Pin, Archive, Search } from 'lucide-react';

export interface PrivateMessage {
  id: number;
  sender_username: string;
  sender_role?: string;
  content: string;
  attachment_url?: string | null;
  attachment_name?: string;
  attachment_size?: number;
  attachment_type?: string;
  status?: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  subject: string;
  participant_names: string[];
  participant_details?: { id: number; username: string; role: string }[];
  unread_count?: number;
  last_message?: {
    content: string;
    sender_username: string;
    created_at: string;
    status?: string;
  } | null;
  is_pinned?: boolean;
  is_archived?: boolean;
  updated_at: string;
  messages?: PrivateMessage[];
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  target_group: string;
  author_name: string;
  is_pinned: boolean;
  created_at: string;
}

export interface BroadcastMessage {
  id: number;
  title: string;
  message: string;
  channel: string;
  recipient_count: number;
  sent_by_name: string;
  sent_at: string;
}

export interface CommunicationHubProps {
  conversations?: Conversation[];
  announcements?: Announcement[];
  broadcasts?: BroadcastMessage[];
  onSendMessage?: (conversationId: number, content: string, file?: File | null) => void;
  onSendBroadcast?: (title: string, message: string, channel: string) => void;
  onMarkAsRead?: (conversationId: number) => void;
  onTogglePin?: (conversationId: number) => void;
  onToggleArchive?: (conversationId: number) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({
  conversations = [],
  announcements = [],
  broadcasts = [],
  onSendMessage,
  onSendBroadcast,
  onMarkAsRead,
  onTogglePin,
  onToggleArchive,
  searchQuery = '',
  onSearchChange,
  isMuted = false,
  onToggleMute,
}) => {
  const [activeTab, setActiveTab] = useState<'MESSAGES' | 'ANNOUNCEMENTS' | 'BROADCASTS'>('MESSAGES');
  const [selectedConvId, setSelectedConvId] = useState<number | null>(
    conversations.length > 0 ? conversations[0].id : null
  );
  const [replyText, setReplyText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState('EMAIL');

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  // Automatically mark read when a conversation is opened
  useEffect(() => {
    if (selectedConvId && onMarkAsRead) {
      const conv = conversations.find((c) => c.id === selectedConvId);
      if (conv && (conv.unread_count || 0) > 0) {
        onMarkAsRead(selectedConvId);
      }
    }
  }, [selectedConvId, conversations, onMarkAsRead]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyText.trim() && !selectedFile) || !selectedConvId) return;
    if (onSendMessage) {
      onSendMessage(selectedConvId, replyText, selectedFile);
    }
    setReplyText('');
    setSelectedFile(null);
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    if (onSendBroadcast) {
      onSendBroadcast(broadcastTitle, broadcastMsg, broadcastChannel);
    }
    setBroadcastTitle('');
    setBroadcastMsg('');
  };

  const renderStatusIcon = (status?: string) => {
    if (status === 'SENDING') return <Clock className="size-3.5 text-slate-400 inline ml-1 animate-spin" />;
    if (status === 'SENT') return <Check className="size-3.5 text-slate-400 inline ml-1" />;
    if (status === 'DELIVERED') return <CheckCheck className="size-3.5 text-slate-400 inline ml-1" />;
    if (status === 'READ') return <CheckCheck className="size-3.5 text-cyan-400 inline ml-1" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-8 rounded-2xl border border-purple-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
              💬 Enterprise Communication Suite
            </h1>
            <p className="text-sm text-slate-300 mt-2">
              Persistent messaging, real-time sync, file attachments, and broadcast dispatching.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onToggleMute && (
              <button
                onClick={onToggleMute}
                className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-purple-300 transition"
                title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-emerald-400" />}
              </button>
            )}
            <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs text-purple-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Real-time Database Sync Active
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-6 mt-8 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('MESSAGES')}
            className={`pb-3 px-2 font-semibold text-sm transition border-b-2 ${
              activeTab === 'MESSAGES'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📬 Direct Conversations ({conversations.length})
          </button>
          <button
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
            className={`pb-3 px-2 font-semibold text-sm transition border-b-2 ${
              activeTab === 'ANNOUNCEMENTS'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📢 Campus Bulletin ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('BROADCASTS')}
            className={`pb-3 px-2 font-semibold text-sm transition border-b-2 ${
              activeTab === 'BROADCASTS'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📡 Bulk Dispatcher ({broadcasts.length})
          </button>
        </div>
      </div>

      {/* Tab 1: MESSAGES */}
      {activeTab === 'MESSAGES' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-[680px]">
          {/* Conversation List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto flex flex-col gap-2">
            <div className="mb-3">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                  placeholder="Search threads or messages..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Recent Threads</h3>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-3.5 rounded-xl cursor-pointer transition border relative group ${
                  selectedConvId === conv.id
                    ? 'bg-purple-950/60 border-purple-500/50 text-white'
                    : 'bg-slate-800/40 border-transparent text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {conv.is_pinned && <Pin className="size-3 text-amber-400 shrink-0 fill-amber-400" />}
                    <h4 className="font-bold text-sm truncate">{conv.subject || 'General Discussion'}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-500">{new Date(conv.updated_at).toLocaleDateString()}</span>
                    {(conv.unread_count || 0) > 0 && (
                      <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  {conv.last_message ? (
                    <span>
                      <strong className="text-slate-300">{conv.last_message.sender_username}: </strong>
                      {conv.last_message.content || '📎 Attachment'}
                    </span>
                  ) : (
                    <span>Participants: {conv.participant_names.join(', ')}</span>
                  )}
                </p>

                {/* Hover Actions */}
                <div className="absolute right-2 bottom-2 hidden group-hover:flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700 shadow">
                  {onTogglePin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onTogglePin(conv.id); }}
                      title={conv.is_pinned ? 'Unpin' : 'Pin thread'}
                      className="text-slate-400 hover:text-amber-400 p-0.5"
                    >
                      <Pin className="size-3" />
                    </button>
                  )}
                  {onToggleArchive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleArchive(conv.id); }}
                      title={conv.is_archived ? 'Unarchive' : 'Archive thread'}
                      className="text-slate-400 hover:text-purple-400 p-0.5"
                    >
                      <Archive className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="text-center py-16 text-slate-500 text-sm">No conversations found.</div>
            )}
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between overflow-hidden">
            {selectedConv ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-white text-base">{selectedConv.subject || 'Conversation Thread'}</h3>
                    <p className="text-xs text-purple-300">Members: {selectedConv.participant_names.join(', ')}</p>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                  {selectedConv.messages && selectedConv.messages.length > 0 ? (
                    selectedConv.messages.map((msg) => {
                      const isMe = msg.sender_username === 'You' || msg.sender_username.includes('admin') || msg.sender_username.includes('austin');
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-md p-3.5 rounded-2xl text-sm shadow ${
                              isMe
                                ? 'bg-purple-600 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                            }`}
                          >
                            {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                            {msg.attachment_url && (
                              <div className="mt-2 p-2.5 rounded-xl bg-black/20 border border-white/10 flex items-center gap-2">
                                <span className="text-lg">📎</span>
                                <div className="overflow-hidden flex-1">
                                  <a
                                    href={msg.attachment_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold underline truncate block text-xs hover:text-purple-200"
                                  >
                                    {msg.attachment_name || 'Download Attachment'}
                                  </a>
                                  {msg.attachment_size ? (
                                    <span className="text-[10px] opacity-75">
                                      {(msg.attachment_size / 1024).toFixed(1)} KB
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 px-1 flex items-center">
                            <span>{msg.sender_username} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && renderStatusIcon(msg.status)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-24 text-slate-500 text-sm">No messages in this thread yet. Start typing below!</div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Selected File Preview */}
                {selectedFile && (
                  <div className="px-4 py-2 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between text-xs text-purple-300">
                    <span className="truncate">📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-white font-bold ml-2">✕</button>
                  </div>
                )}

                {/* Composer */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-3 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition"
                    title="Attach file (Image, PDF, Word, Audio, Video)"
                  >
                    <Paperclip className="size-4" />
                  </button>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message to the group..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 text-white placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() && !selectedFile}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow transition flex items-center gap-1.5"
                  >
                    Send <Send className="size-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Select a conversation on the left to view messages.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: ANNOUNCEMENTS */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="max-w-7xl mx-auto space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-slate-900 border rounded-xl p-6 transition ${
                ann.is_pinned ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/20 to-slate-900' : 'border-slate-800'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {ann.is_pinned && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                      📌 Pinned Notice
                    </span>
                  )}
                  <span className="bg-slate-800 text-purple-300 text-xs px-2.5 py-1 rounded font-mono border border-slate-700">
                    Target: {ann.target_group}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{new Date(ann.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">{ann.title}</h3>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">{ann.content}</p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-500">
                Posted by <span className="text-slate-400 font-semibold">{ann.author_name}</span>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-20 text-slate-500 text-sm">No campus bulletins published at this time.</div>
          )}
        </div>
      )}

      {/* Tab 3: BROADCASTS */}
      {activeTab === 'BROADCASTS' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dispatch Composer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              📡 Dispatch Broadcast
            </h3>
            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Dispatch Channel</label>
                <select
                  value={broadcastChannel}
                  onChange={(e) => setBroadcastChannel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="EMAIL">📧 Email Dispatch</option>
                  <option value="SMS">📱 SMS Gateway Dispatch</option>
                  <option value="WHATSAPP">💬 WhatsApp Business API</option>
                  <option value="PUSH">🔔 Web/Mobile Push Notification</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Campaign Title</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. End of Semester Examination Timetable"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Message Payload</label>
                <textarea
                  rows={4}
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Enter the broadcast notification message..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-sm shadow transition"
              >
                Queue Dispatch 🚀
              </button>
            </form>
          </div>

          {/* Dispatch Log */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Recent Campaign Logs</h3>
            {broadcasts.map((b) => (
              <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      {b.channel}
                    </span>
                    <span className="text-xs text-slate-400">Sent to {b.recipient_count} recipients</span>
                  </div>
                  <h4 className="font-bold text-white">{b.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{b.message}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="text-[10px] text-slate-500 block">{new Date(b.sent_at).toLocaleDateString()}</span>
                  <span className="text-xs text-emerald-400 font-bold mt-1 inline-block">✓ Dispatched</span>
                </div>
              </div>
            ))}
            {broadcasts.length === 0 && (
              <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 text-sm">
                No dispatch campaigns executed yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
