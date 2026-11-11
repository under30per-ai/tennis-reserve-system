'use client';

import type { ChatMessage } from '@/types';
import { formatDate } from '@/lib/utils';

interface ChatBubbleProps {
  message: ChatMessage;
  isMine: boolean;
}

export default function ChatBubble({ message, isMine }: ChatBubbleProps) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
        isMine
          ? 'bg-court-green text-white rounded-br-md'
          : 'bg-gray-100 text-net-gray rounded-bl-md'
      }`}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
          {formatDate(message.createdAt, 'HH:mm')}
        </p>
      </div>
    </div>
  );
}
