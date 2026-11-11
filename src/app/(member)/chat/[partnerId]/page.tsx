'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import useChat from '@/hooks/useChat';
import { getPartnerName } from '@/app/actions/chat';
import useAuth from '@/hooks/useAuth';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MemberConversationPage() {
  const params = useParams();
  const partnerId = params.partnerId as string;
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useChat(partnerId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [partnerName, setPartnerName] = useState('');

  useEffect(() => {
    getPartnerName(partnerId).then(setPartnerName);
  }, [partnerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) return <LoadingSpinner />;

  const myId = user?.memberId ?? '';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-3.5rem)]">
      <div className="px-4 py-3 border-b bg-white">
        <h1 className="font-bold text-sm text-net-dark">
          {partnerName || 'メッセージ'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">メッセージを送信してください</p>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} isMine={msg.senderId === myId} />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={async (text) => { await sendMessage(partnerId, text); }} />
    </div>
  );
}
