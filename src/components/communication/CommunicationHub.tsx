import React, { useState } from 'react';

export interface PrivateMessage {
  id: number;
  sender_username: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  subject: string;
  participant_names: string[];
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
  onSendMessage?: (conversationId: number, content: string) => void;
  onSendBroadcast?: (title: string, message: string, channel: string) => void;
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({
  conversations = [],
  announcements = [],
  broadcasts = [],
  onSendMessage,
  onSendBroadcast,
}) => {
  const [activeTab, setActiveTab] = useState<'MESSAGES' | 'ANNOUNCEMENTS' | 'BROADCASTS'>('MESSAGES');
  const [selectedConvId, setSelectedConvId] = useState<number | null>(
    conversations.length > 0 ? conversations[0].id : null
  );
  const [replyText, setReplyText] = useState('');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState('EMAIL');

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConvId) return;
    if (onSendMessage) {
      onSendMessage(selectedConvId, replyText);
    }
    setReplyText('');
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
              Unifying campus direct messaging, role-filtered announcements, and multi-channel bulk dispatches.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs text-purple-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-time Dispatch Active
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px]">
          {/* Conversation List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Recent Threads</h3>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-3.5 rounded-xl cursor-pointer transition border ${
                  selectedConvId === conv.id
                    ? 'bg-purple-950/60 border-purple-500/50 text-white'
                    : 'bg-slate-800/40 border-transparent text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm truncate">{conv.subject || 'General Discussion'}</h4>
                  <span className="text-[10px] text-slate-500">{new Date(conv.updated_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  Participants: {conv.participant_names.join(', ')}
                </p>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="text-center py-16 text-slate-500 text-sm">No conversations yet.</div>
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
                    selectedConv.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender_username === 'You' || msg.sender_username.includes('admin')
                            ? 'items-end'
                            : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-sm shadow ${
                            msg.sender_username === 'You' || msg.sender_username.includes('admin')
                              ? 'bg-purple-600 text-white rounded-br-none'
                              : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                          }`}
                        >
                          <p>{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 px-1">
                          {msg.sender_username} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-24 text-slate-500 text-sm">No messages in this thread yet. Start typing below!</div>
                  )}
                </div>

                {/* Composer */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message to the group..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 text-white placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow transition"
                  >
                    Send 🚀
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
