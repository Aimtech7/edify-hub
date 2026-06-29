import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CommunicationHub } from '../../components/communication/CommunicationHub';
import { communicationService, Conversation, Announcement, BroadcastMessage } from '../../services/communicationService';
import { toast } from 'sonner';

export const CommunicationPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const prevUnreadCountRef = useRef<number>(0);

  const playNotificationSound = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  }, [isMuted]);

  const loadData = useCallback(async (showError = false) => {
    try {
      const [convs, anns, brds] = await Promise.all([
        communicationService.getConversations(searchQuery),
        communicationService.getAnnouncements(),
        communicationService.getBroadcasts(),
      ]);

      // Calculate total unreads
      const totalUnread = convs.reduce((acc, c) => acc + (c.unread_count || 0), 0);
      if (totalUnread > prevUnreadCountRef.current && prevUnreadCountRef.current !== 0) {
        playNotificationSound();
      }
      prevUnreadCountRef.current = totalUnread;

      setConversations(convs);
      setAnnouncements(anns);
      setBroadcasts(brds);
    } catch (error) {
      if (showError) {
        toast.error('Failed to connect to communication server');
      }
    }
  }, [searchQuery, playNotificationSound]);

  useEffect(() => {
    loadData(true);
    // Real-time synchronization loop (every 3 seconds)
    const interval = setInterval(() => {
      loadData(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSendMessage = async (convId: number, content: string, file?: File | null) => {
    try {
      await communicationService.sendMessage(convId, content, file);
      await loadData(false);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleSendBroadcast = async (title: string, message: string, channel: string) => {
    try {
      await communicationService.sendBroadcast(title, message, channel);
      toast.success(`Broadcast campaign queued via ${channel}!`);
      await loadData(false);
    } catch (error) {
      toast.error('Failed to dispatch broadcast');
    }
  };

  const handleMarkAsRead = async (convId: number) => {
    try {
      await communicationService.markAsRead(convId);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
      );
    } catch (e) {
      // ignore silently during sync
    }
  };

  const handleTogglePin = async (convId: number) => {
    try {
      const res = await communicationService.togglePin(convId);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, is_pinned: res.is_pinned } : c))
      );
      toast.success(res.is_pinned ? 'Conversation pinned' : 'Conversation unpinned');
    } catch (e) {
      toast.error('Failed to toggle pin status');
    }
  };

  const handleToggleArchive = async (convId: number) => {
    try {
      const res = await communicationService.toggleArchive(convId);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, is_archived: res.is_archived } : c))
      );
      toast.success(res.is_archived ? 'Conversation archived' : 'Conversation unarchived');
    } catch (e) {
      toast.error('Failed to archive conversation');
    }
  };

  return (
    <CommunicationHub
      conversations={conversations}
      announcements={announcements}
      broadcasts={broadcasts}
      onSendMessage={handleSendMessage}
      onSendBroadcast={handleSendBroadcast}
      onMarkAsRead={handleMarkAsRead}
      onTogglePin={handleTogglePin}
      onToggleArchive={handleToggleArchive}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isMuted={isMuted}
      onToggleMute={() => setIsMuted(!isMuted)}
    />
  );
};
