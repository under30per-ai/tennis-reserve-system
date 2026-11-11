'use client';

import { useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t bg-white">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="メッセージを入力..."
        className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-court-green"
      />
      <button
        type="submit"
        disabled={!message.trim() || sending}
        className="bg-court-green text-white rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-court-green/90 transition-colors"
      >
        送信
      </button>
    </form>
  );
}
