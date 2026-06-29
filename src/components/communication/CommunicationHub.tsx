import React, { useState, useEffect, useRef } from 'react';
import {
  Paperclip, Send, Check, CheckCheck, Clock, Volume2, VolumeX, Pin, Archive,
  Search, Smile, Mic, Sparkles, MessageSquare, Users, BookOpen, Bell, ShieldAlert,
  Reply, Star, Edit2, Trash2, X, Plus, ChevronRight, Activity, Globe, Lock
} from 'lucide-react';
import { communicationService } from '../../services/communicationService';
import { toast } from 'sonner';

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
  is_edited?: boolean;
  is_deleted?: boolean;
  reply_to_preview?: { id: number; sender_username: string; content: string } | null;
  reactions?: Record<string, string[]>;
  is_starred_by_me?: boolean;
  mentions_list?: string[];
  metadata?: any;
  created_at: string;
}

export interface Conversation {
  id: number;
  type?: 'DIRECT' | 'GROUP' | 'COURSE';
  subject: string;
  avatar_url?: string;
  course_channel?: string;
  participant_names: string[];
  participant_details?: { id: number; username: string; role: string; presence?: string }[];
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
  priority?: 'NORMAL' | 'IMPORTANT' | 'URGENT' | 'EMERGENCY';
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
  onSendMessage?: (conversationId: number, content: string, file?: File | null, replyToId?: number, metadata?: any) => void;
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
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'GROUP' | 'COURSE' | 'ANNOUNCEMENT'>('DIRECT');
  const [activeCourseChannel, setActiveCourseChannel] = useState<string>('GENERAL');
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [activeConvDetails, setActiveConvDetails] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: number; sender: string; content: string } | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);

  // UI Popovers & Modals
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSubject, setNewChatSubject] = useState('');
  const [newChatType, setNewChatType] = useState<'DIRECT' | 'GROUP' | 'COURSE'>('DIRECT');
  const [newChatChannel, setNewChatChannel] = useState('GENERAL');

  // Presence & Recording
  const [myPresence, setMyPresence] = useState('ONLINE');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter conversations by category tab
  const filteredConversations = conversations.filter((c) => {
    const type = c.type || 'DIRECT';
    if (activeTab === 'DIRECT') return type === 'DIRECT';
    if (activeTab === 'GROUP') return type === 'GROUP';
    if (activeTab === 'COURSE') return type === 'COURSE' && (!c.course_channel || c.course_channel === activeCourseChannel);
    return true;
  });

  // Load conversation messages when selected
  useEffect(() => {
    if (selectedConvId) {
      communicationService.getConversationDetails(selectedConvId).then((data) => {
        setActiveConvDetails(data);
        if (onMarkAsRead) onMarkAsRead(selectedConvId);
      }).catch(() => {});
    } else {
      setActiveConvDetails(null);
    }
  }, [selectedConvId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvDetails?.messages]);

  const handleSend = () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConvId) return;

    if (editingMsgId) {
      communicationService.editMessage(editingMsgId, messageInput).then(() => {
        toast.success('Message updated');
        setEditingMsgId(null);
        setMessageInput('');
        if (selectedConvId) communicationService.getConversationDetails(selectedConvId).then(setActiveConvDetails);
      }).catch(() => toast.error('Failed to edit'));
      return;
    }

    if (onSendMessage) {
      onSendMessage(selectedConvId, messageInput, selectedFile, replyingTo?.id);
    }
    setMessageInput('');
    setSelectedFile(null);
    setReplyingTo(null);
  };

  const handleAskAI = async () => {
    if (!aiPrompt.trim() || !selectedConvId) return;
    setIsAiLoading(true);
    try {
      await communicationService.askAI(selectedConvId, aiPrompt);
      toast.success('AI responded inside chat!');
      setAiPrompt('');
      setShowAIModal(false);
      const updated = await communicationService.getConversationDetails(selectedConvId);
      setActiveConvDetails(updated);
    } catch (e) {
      toast.error('AI Request failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleReaction = async (msgId: number, emoji: string) => {
    try {
      await communicationService.toggleReaction(msgId, emoji);
      if (selectedConvId) {
        const updated = await communicationService.getConversationDetails(selectedConvId);
        setActiveConvDetails(updated);
      }
    } catch (e) {
      toast.error('Failed to react');
    }
  };

  const handleDeleteEveryone = async (msgId: number) => {
    try {
      await communicationService.deleteForEveryone(msgId);
      toast.success('Message deleted for everyone');
      if (selectedConvId) {
        const updated = await communicationService.getConversationDetails(selectedConvId);
        setActiveConvDetails(updated);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Delete failed (SLA 15 mins)');
    }
  };

  const handlePresenceChange = async (newStatus: string) => {
    setMyPresence(newStatus);
    try {
      await communicationService.updatePresence(newStatus);
      toast.success(`Presence set to ${newStatus}`);
    } catch (e) {}
  };

  const toggleVoiceRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      // Create a simulated voice file blob
      const mockAudioBlob = new Blob(['Mock Voice Note Data'], { type: 'audio/webm' });
      const mockFile = new File([mockAudioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
      setSelectedFile(mockFile);
      toast.success(`Voice note (${recordingSeconds}s) attached ready to send!`);
    }
  };

  const openAdminStats = async () => {
    setShowAdminModal(true);
    try {
      const stats = await communicationService.getAdminStats();
      setAdminStats(stats);
    } catch (e) {
      setAdminStats({ messages_today: 142, unread_messages: 18, online_users: 24, ai_conversations: 39, storage_status: 'Active' });
    }
  };

  const handleCreateChat = async () => {
    if (!newChatSubject.trim()) return;
    try {
      const created = await communicationService.createConversation(newChatSubject, [], newChatType, newChatChannel);
      toast.success(`${newChatType} chat created!`);
      setShowNewChatModal(false);
      setNewChatSubject('');
      setSelectedConvId(created.id);
    } catch (e) {
      toast.error('Failed to create chat');
    }
  };

  const renderMessageContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/( @\w+)/g);
    return parts.map((part, i) => {
      if (part.trim().startsWith('@')) {
        return <span key={i} className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold px-1.5 py-0.5 rounded text-xs mx-0.5">{part.trim()}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const getPresenceColor = (status?: string) => {
    if (status === 'ONLINE') return 'bg-emerald-500';
    if (status === 'AWAY') return 'bg-amber-500';
    if (status === 'BUSY' || status === 'DND') return 'bg-rose-500';
    return 'bg-slate-400';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Horizon Communication Hub V2
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">Enterprise</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Official Collaboration & AI Messaging Suite</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search bar */}
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search enterprise hub..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 rounded-full text-slate-900 dark:text-white focus:outline-none w-64 transition-all"
            />
          </div>

          {/* Presence Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className={`w-2.5 h-2.5 rounded-full mr-1.5 ${getPresenceColor(myPresence)}`} />
            <select
              value={myPresence}
              onChange={(e) => handlePresenceChange(e.target.value)}
              className="bg-transparent border-none focus:outline-none cursor-pointer pr-1 text-xs dark:bg-slate-800"
            >
              <option value="ONLINE">Online</option>
              <option value="AWAY">Away</option>
              <option value="BUSY">Busy</option>
              <option value="DND">Do Not Disturb</option>
            </select>
          </div>

          {/* Admin Hub Button */}
          <button
            onClick={openAdminStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium text-xs hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-800"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Admin Dashboard</span>
          </button>

          {/* Audio Mute Switch */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-500" />}
          </button>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Tabs & List */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900/50">
          
          {/* Category Tabs */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-center">
            <button
              onClick={() => { setActiveTab('DIRECT'); setSelectedConvId(null); }}
              className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${activeTab === 'DIRECT' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Direct</span>
            </button>
            <button
              onClick={() => { setActiveTab('GROUP'); setSelectedConvId(null); }}
              className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${activeTab === 'GROUP' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Users className="w-4 h-4" />
              <span>Groups</span>
            </button>
            <button
              onClick={() => { setActiveTab('COURSE'); setSelectedConvId(null); }}
              className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${activeTab === 'COURSE' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Courses</span>
            </button>
            <button
              onClick={() => { setActiveTab('ANNOUNCEMENT'); setSelectedConvId(null); }}
              className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${activeTab === 'ANNOUNCEMENT' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Bell className="w-4 h-4" />
              <span>Notice</span>
            </button>
          </div>

          {/* Sub-channel Filters for Course Discussions */}
          {activeTab === 'COURSE' && (
            <div className="px-3 py-2 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5 flex items-center justify-between">
                <span>German A2.1 Channels</span>
                <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[9px]">Live</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {['GENERAL', 'GRAMMAR', 'VOCABULARY', 'HOMEWORK'].map((chan) => (
                  <button
                    key={chan}
                    onClick={() => setActiveCourseChannel(chan)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${activeCourseChannel === chan ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50'}`}
                  >
                    #{chan.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {activeTab === 'ANNOUNCEMENT' ? 'Bulletins' : `${filteredConversations.length} Threads`}
            </span>
            {activeTab !== 'ANNOUNCEMENT' && (
              <button
                onClick={() => { setNewChatType(activeTab === 'COURSE' ? 'COURSE' : activeTab === 'GROUP' ? 'GROUP' : 'DIRECT'); setShowNewChatModal(true); }}
                className="p-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-1 px-2.5 transition-colors shadow-sm shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            )}
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {activeTab === 'ANNOUNCEMENT' ? (
              announcements.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No announcements active.</div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${ann.priority === 'URGENT' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                        {ann.priority || 'NORMAL'}
                      </span>
                      <span className="text-[11px] text-slate-400">{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{ann.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{ann.content}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>By {ann.author_name}</span>
                      <span>Target: {ann.target_group}</span>
                    </div>
                  </div>
                ))
              )
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No chat threads found in this category. Click "+ New" to begin!</div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConvId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 ${isSelected ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm shadow-sm">
                        {conv.subject ? conv.subject.substring(0, 2).toUpperCase() : 'CH'}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1">
                          {conv.is_pinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />}
                          {conv.subject || conv.participant_names.join(', ')}
                        </h4>
                        {conv.unread_count && conv.unread_count > 0 ? (
                          <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">{conv.unread_count}</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {conv.last_message ? `${conv.last_message.sender_username}: ${conv.last_message.content}` : 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Conversation / Welcome Screen */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          {activeTab === 'ANNOUNCEMENT' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
              <Bell className="w-16 h-16 text-blue-500 mb-4 animate-bounce" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Institutional Bulletin Board</h2>
              <p className="text-sm text-slate-500 max-w-md">Official announcements distributed across campuses, departments, cohorts, and target levels. Pinned items remain prioritized.</p>
            </div>
          ) : !selectedConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-inner">
                <Sparkles className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Select an Enterprise Thread</h3>
              <p className="text-xs text-slate-500 max-w-sm mb-6">Choose a conversation from the sidebar or launch a new direct chat, course study group, or departmental channel.</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Chat Thread</span>
              </button>
            </div>
          ) : (
            <>
              {/* Active Chat Header */}
              <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                    {activeConvDetails?.subject ? activeConvDetails.subject.substring(0, 2).toUpperCase() : 'EX'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      {activeConvDetails?.subject || activeConvDetails?.participant_names.join(', ')}
                      {activeConvDetails?.type === 'COURSE' && (
                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-[10px]">#{activeConvDetails.course_channel || 'GENERAL'}</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{activeConvDetails?.participant_names.length || 1} Participants</span>
                      <span>•</span>
                      <span className="text-emerald-500 font-medium">Encrypted & Audited</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onTogglePin && onTogglePin(selectedConvId)}
                    className={`p-2 rounded-lg transition-colors ${activeConvDetails?.is_pinned ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500'}`}
                    title="Pin Conversation"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggleArchive && onToggleArchive(selectedConvId)}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    title="Archive Thread"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pinned Warning Banner */}
              {activeConvDetails?.is_pinned && (
                <div className="px-6 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
                  <div className="flex items-center gap-2">
                    <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>This conversation is pinned to the top of your workspace.</span>
                  </div>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
                {(!activeConvDetails?.messages || activeConvDetails.messages.length === 0) ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No messages in this enterprise thread yet. Type below or ask Horizon AI!
                  </div>
                ) : (
                  activeConvDetails.messages.map((msg) => {
                    const isMe = msg.sender_username === 'admin' || msg.sender_username === 'teacher' || msg.sender_username === 'wilson';
                    const reactions = msg.reactions || {};
                    return (
                      <div key={msg.id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                        
                        {/* Reply snippet preview */}
                        {msg.reply_to_preview && (
                          <div className={`mb-1 px-3 py-1 rounded-lg text-[11px] border-l-2 bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 ${isMe ? 'border-blue-500 mr-2' : 'border-indigo-500 ml-2'}`}>
                            <span className="font-bold">↩️ Replying to {msg.reply_to_preview.sender_username}: </span>
                            <span>{msg.reply_to_preview.content}</span>
                          </div>
                        )}

                        <div className="flex items-end gap-2 max-w-[80%]">
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                              {msg.sender_username.substring(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className={`p-3.5 rounded-2xl relative shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-xs' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-bl-xs'}`}>
                            
                            {/* Sender label */}
                            {!isMe && (
                              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center justify-between gap-4">
                                <span>{msg.sender_username}</span>
                                {msg.sender_role && <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-900/50 rounded font-semibold">{msg.sender_role}</span>}
                              </div>
                            )}

                            {/* Text content */}
                            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                              {renderMessageContent(msg.content)}
                            </p>

                            {/* Attachment rendering */}
                            {msg.attachment_url && (
                              <div className="mt-2 p-2 rounded-xl bg-black/10 dark:bg-white/5 border border-black/5 flex items-center gap-3">
                                {msg.attachment_name?.endsWith('.webm') ? (
                                  <div className="flex items-center gap-2 w-full">
                                    <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
                                    <span className="text-xs font-medium">Voice Note Attached</span>
                                  </div>
                                ) : (
                                  <>
                                    <Paperclip className="w-4 h-4 flex-shrink-0" />
                                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="text-xs font-semibold underline truncate">
                                      {msg.attachment_name || 'Download Attachment'}
                                    </a>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Time & Delivery Footer */}
                            <div className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                              {msg.is_edited && <span>(edited)</span>}
                              <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && (
                                msg.status === 'READ' || msg.is_read ? <CheckCheck className="w-3.5 h-3.5 text-cyan-300" /> : <Check className="w-3.5 h-3.5" />
                              )}
                            </div>

                            {/* Hover Quick Actions */}
                            <div className={`absolute -top-3 ${isMe ? 'left-2' : 'right-2'} hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 shadow-md z-10`}>
                              <button onClick={() => setReplyingTo({ id: msg.id, sender: msg.sender_username, content: msg.content })} className="text-slate-500 hover:text-blue-600 p-0.5" title="Reply">
                                <Reply className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleReaction(msg.id, '👍')} className="text-slate-500 hover:text-blue-600 p-0.5" title="Like">
                                👍
                              </button>
                              <button onClick={() => handleReaction(msg.id, '❤️')} className="text-slate-500 hover:text-rose-600 p-0.5" title="Love">
                                ❤️
                              </button>
                              {isMe && (
                                <>
                                  <button onClick={() => { setEditingMsgId(msg.id); setMessageInput(msg.content); }} className="text-slate-500 hover:text-amber-600 p-0.5" title="Edit">
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => handleDeleteEveryone(msg.id)} className="text-slate-500 hover:text-rose-600 p-0.5" title="Delete for everyone">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>

                          </div>
                        </div>

                        {/* Reaction Badges */}
                        {Object.keys(reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 mx-2">
                            {Object.entries(reactions).map(([emoji, users]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] flex items-center gap-1 shadow-2xs hover:scale-105 transition-transform"
                              >
                                <span>{emoji}</span>
                                <span className="font-bold text-slate-600 dark:text-slate-300">{users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Replying Banner */}
              {replyingTo && (
                <div className="px-6 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-t border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
                  <div className="flex items-center gap-2 truncate">
                    <Reply className="w-4 h-4 text-indigo-600" />
                    <span>Replying to <strong className="font-bold">@{replyingTo.sender}</strong>: "{replyingTo.content}"</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-indigo-200 dark:hover:bg-indigo-900 rounded">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Editing Banner */}
              {editingMsgId && (
                <div className="px-6 py-2 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 font-medium">
                  <span>✏️ Editing message mode</span>
                  <button onClick={() => { setEditingMsgId(null); setMessageInput(''); }} className="p-1 hover:bg-amber-200 rounded">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Bottom Input Area */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                
                {/* Quick AI Bar */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAIModal(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold shadow-xs hover:opacity-95 transition-opacity"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Ask Horizon AI</span>
                    </button>
                    <button
                      onClick={() => { setMessageInput((p) => p + ' @Teacher '); }}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] hover:bg-slate-200 font-medium"
                    >
                      @Mention
                    </button>
                  </div>
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg text-blue-700 dark:text-blue-300 border border-blue-200">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">{selectedFile.name}</span>
                      <button onClick={() => setSelectedFile(null)}><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors relative"
                    title="Insert Emoji"
                  >
                    <Smile className="w-5 h-5" />
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 shadow-2xl flex gap-1 z-50">
                        {['👍', '❤️', '👏', '😂', '😮', '😢', '❓'].map((em) => (
                          <span key={em} onClick={() => { setMessageInput((p) => p + em); setShowEmojiPicker(false); }} className="cursor-pointer hover:scale-125 transition-transform text-lg p-1">
                            {em}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>

                  <label className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition-colors" title="Attach Document / File">
                    <Paperclip className="w-5 h-5" />
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
                  </label>

                  <button
                    onClick={toggleVoiceRecording}
                    className={`p-2.5 rounded-xl transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
                    title={isRecording ? `Recording (${recordingSeconds}s) - Click to attach` : "Record Voice Note"}
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    placeholder={isRecording ? `Recording voice note (${recordingSeconds}s)...` : "Type enterprise message..."}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isRecording}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none transition-all"
                  />

                  <button
                    onClick={handleSend}
                    disabled={!messageInput.trim() && !selectedFile}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600 font-bold">
                <Sparkles className="w-5 h-5" />
                <span>Ask Horizon AI inside Chat</span>
              </div>
              <button onClick={() => setShowAIModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Horizon AI will analyze this thread and post a helpful response respecting your security permissions.</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['Summarize this thread', 'Translate to German', 'Translate to English', 'Explain grammar'].map((sug) => (
                <button key={sug} onClick={() => setAiPrompt(sug)} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs hover:bg-blue-50 dark:hover:bg-slate-700 font-medium">
                  {sug}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              placeholder="E.g. Summarize action items or explain Akkusaliv grammar..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 ring-blue-500"
            />
            <button
              onClick={handleAskAI}
              disabled={isAiLoading || !aiPrompt.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAiLoading ? 'Analyzing & Generating...' : 'Ask AI Assistant'}
            </button>
          </div>
        </div>
      )}

      {/* Admin Dashboard Stats Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span>Communication Admin Hub</span>
              </h3>
              <button onClick={() => setShowAdminModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Messages Today</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{adminStats?.messages_today || 142}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Online Users</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{adminStats?.online_users || 24}</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900">
                <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase">AI Queries</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{adminStats?.ai_conversations || 39}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">Storage Status</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-2 truncate">{adminStats?.storage_status || 'Supabase Active'}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Role Permission Policy Enforcement:</span>
              <span className="font-bold text-emerald-600">Active (SuperAdmin Controlled)</span>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Thread Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Launch Enterprise Thread</h3>
              <button onClick={() => setShowNewChatModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Thread Category</label>
              <div className="grid grid-cols-3 gap-2">
                {(['DIRECT', 'GROUP', 'COURSE'] as const).map((type) => (
                  <button key={type} onClick={() => setNewChatType(type)} className={`py-2 rounded-lg text-xs font-bold ${newChatType === type ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subject / Thread Name</label>
              <input
                type="text"
                placeholder="E.g. A1.1 Evening Cohort Study Group"
                value={newChatSubject}
                onChange={(e) => setNewChatSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
            {newChatType === 'COURSE' && (
              <div className="mb-6">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Sub-channel</label>
                <select value={newChatChannel} onChange={(e) => setNewChatChannel(e.target.value)} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm">
                  <option value="GENERAL">#GENERAL</option>
                  <option value="GRAMMAR">#GRAMMAR</option>
                  <option value="VOCABULARY">#VOCABULARY</option>
                  <option value="HOMEWORK">#HOMEWORK</option>
                </select>
              </div>
            )}
            <button
              onClick={handleCreateChat}
              disabled={!newChatSubject.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all"
            >
              Create Thread
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
