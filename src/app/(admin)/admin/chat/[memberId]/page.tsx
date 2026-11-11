'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import useChat from '@/hooks/useChat';
import { getPartnerName } from '@/app/actions/chat';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminConversationPage() {
  const params = useParams();
  const memberId = params.memberId as string;
  const { messages, loading, sendMessage } = useChat(memberId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [partnerName, setPartnerName] = useState('会員');

  useEffect(() => {
    getPartnerName(memberId).then(setPartnerName);
  }, [memberId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="px-4 py-3 border-b bg-white">
        <h1 className="font-bold text-sm text-net-dark">{partnerName}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">メッセージを送信してください</p>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} isMine={msg.senderRole === 'admin'} />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={async (text) => { await sendMessage(memberId, text); }} />
    </div>
  );
}
