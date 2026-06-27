import React from 'react';
import { CommunicationHub } from '../../components/communication/CommunicationHub';

export const CommunicationPage: React.FC = () => {
  const sampleConversations = [
    {
      id: 1,
      subject: 'German C1 Exam Preparation Group',
      participant_names: ['Herr Müller', 'Anita Soila', 'Victor Kiplagat'],
      updated_at: new Date().toISOString(),
      messages: [
        {
          id: 101,
          sender_username: 'Herr Müller',
          content: 'Guten Morgen! Bitte vergesst nicht, den Aufsatz bis Freitag einzureichen.',
          is_read: true,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 102,
          sender_username: 'Anita Soila',
          content: 'Alles klar Herr Müller, vielen Dank für die Erinnerung!',
          is_read: true,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    },
    {
      id: 2,
      subject: 'ODEL Technical Support',
      participant_names: ['Admin Support', 'Bilha Andeka'],
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      messages: [
        {
          id: 103,
          sender_username: 'Bilha Andeka',
          content: 'Hello, I cannot access Video Lesson 3 on the portal.',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    }
  ];

  const sampleAnnouncements = [
    {
      id: 1,
      title: 'Goethe-Institut Exam Registration Now Open',
      content: 'Registration for the upcoming B2 and C1 German proficiency examinations is now officially open. Please contact the admissions office or register via your student portal before the deadline.',
      target_group: 'ALL',
      author_name: 'Registrar Office',
      is_pinned: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Instructor Curriculum Revision Meeting',
      content: 'All German language department instructors are requested to attend the quarterly syllabus alignment review session on Wednesday at 2 PM.',
      target_group: 'TEACHERS',
      author_name: 'Academic Director',
      is_pinned: false,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  const sampleBroadcasts = [
    {
      id: 1,
      title: 'Semester Fee Payment Reminder Dispatch',
      message: 'Dear Student, this is a reminder that the tuition fee installment balance is due by the 30th of this month.',
      channel: 'SMS',
      recipient_count: 142,
      sent_by_name: 'Finance Officer',
      sent_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const handleSendMessage = (convId: number, content: string) => {
    alert(`Message sent to thread #${convId}: "${content}"`);
  };

  const handleSendBroadcast = (title: string, message: string, channel: string) => {
    alert(`Broadcast queued via ${channel}: "${title}"`);
  };

  return (
    <CommunicationHub
      conversations={sampleConversations}
      announcements={sampleAnnouncements}
      broadcasts={sampleBroadcasts}
      onSendMessage={handleSendMessage}
      onSendBroadcast={handleSendBroadcast}
    />
  );
};
