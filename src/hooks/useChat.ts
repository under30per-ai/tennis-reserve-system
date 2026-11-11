'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChatMessage, ChatThread } from '@/types';
import {
  sendMessage as sendMessageAction,
  getConversation,
  getConversationList,
  markMessagesAsRead as markMessagesAsReadAction,
  getUnreadMessageCount,
} from '@/app/actions/chat';

export default function useChat(partnerId?: string) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshThreads = useCallback(async () => {
    const [data, count] = await Promise.all([getConversationList(), getUnreadMessageCount()]);
    setThreads(data);
    setUnreadCount(count);
    setLoading(false);
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!partnerId) return;
    const data = await getConversation(partnerId);
    setMessages(data);
    setLoading(false);
  }, [partnerId]);

  useEffect(() => {
    if (partnerId) {
      refreshMessages();
      markMessagesAsReadAction(partnerId);
    } else {
      refreshThreads();
    }
  }, [partnerId, refreshMessages, refreshThreads]);

  // Polling for new messages
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      if (partnerId) {
        refreshMessages();
      } else {
        refreshThreads();
      }
    }, 10000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [partnerId, refreshMessages, refreshThreads]);

  const sendMessage = useCallback(
    async (receiverId: string, message: string) => {
      const result = await sendMessageAction(receiverId, message);
      if (partnerId) {
        await refreshMessages();
      }
      await refreshThreads();
      return result;
    },
    [partnerId, refreshMessages, refreshThreads]
  );

  const refreshUnreadCount = useCallback(async () => {
    const count = await getUnreadMessageCount();
    setUnreadCount(count);
  }, []);

  return {
    threads,
    messages,
    unreadCount,
    loading,
    sendMessage,
    refreshThreads,
    refreshMessages,
    refreshUnreadCount,
  };
}
