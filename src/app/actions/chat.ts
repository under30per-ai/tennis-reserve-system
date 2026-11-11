'use server';

import { db } from '@/db';
import { chatMessages, members } from '@/db/schema';
import { toChatMessage, toMember } from '@/db/mappers';
import { eq, and, or, desc, count } from 'drizzle-orm';
import type { ChatMessage, ChatThread, SenderRole } from '@/domain/models';
import { requireAuth } from '@/app/actions/auth';

export async function sendMessage(
  receiverId: string,
  message: string
): Promise<ChatMessage> {
  const user = await requireAuth();
  const senderId = user.role === 'admin' ? 'admin' : user.memberId!;
  const senderRole: SenderRole = user.role === 'admin' ? 'admin' : 'member';

  const rows = await db
    .insert(chatMessages)
    .values({
      senderId,
      senderRole,
      receiverId,
      message,
    })
    .returning();
  return toChatMessage(rows[0]);
}

export async function getConversation(partnerId: string): Promise<ChatMessage[]> {
  const user = await requireAuth();
  const myId = user.role === 'admin' ? 'admin' : user.memberId!;

  const rows = await db
    .select()
    .from(chatMessages)
    .where(
      or(
        and(eq(chatMessages.senderId, myId), eq(chatMessages.receiverId, partnerId)),
        and(eq(chatMessages.senderId, partnerId), eq(chatMessages.receiverId, myId))
      )
    )
    .orderBy(chatMessages.createdAt);
  return rows.map(toChatMessage);
}

export async function getConversationList(): Promise<ChatThread[]> {
  const user = await requireAuth();
  const myId = user.role === 'admin' ? 'admin' : user.memberId!;

  const rows = await db
    .select()
    .from(chatMessages)
    .where(
      or(eq(chatMessages.senderId, myId), eq(chatMessages.receiverId, myId))
    )
    .orderBy(desc(chatMessages.createdAt));

  const messages = rows.map(toChatMessage);
  const threadMap = new Map<string, { messages: ChatMessage[]; unread: number }>();

  for (const msg of messages) {
    const partnerId = msg.senderId === myId ? msg.receiverId : msg.senderId;
    if (!threadMap.has(partnerId)) {
      threadMap.set(partnerId, { messages: [], unread: 0 });
    }
    const thread = threadMap.get(partnerId)!;
    thread.messages.push(msg);
    if (!msg.isRead && msg.receiverId === myId) {
      thread.unread++;
    }
  }

  // Fetch partner names
  const partnerIds = [...threadMap.keys()].filter((id) => id !== 'admin');
  const memberRows =
    partnerIds.length > 0
      ? await db.select().from(members).where(
          or(...partnerIds.map((id) => eq(members.id, id)))
        )
      : [];
  const memberMap = new Map(memberRows.map((r) => [r.id, toMember(r)]));

  const threads: ChatThread[] = [];
  for (const [partnerId, data] of threadMap) {
    const lastMsg = data.messages[0];
    const partnerName =
      partnerId === 'admin' ? '管理者' : memberMap.get(partnerId)?.name ?? '不明';
    threads.push({
      partnerId,
      partnerName,
      lastMessage: lastMsg.message,
      lastMessageAt: lastMsg.createdAt,
      unreadCount: data.unread,
    });
  }

  return threads.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export async function markMessagesAsRead(partnerId: string): Promise<void> {
  const user = await requireAuth();
  const myId = user.role === 'admin' ? 'admin' : user.memberId!;

  await db
    .update(chatMessages)
    .set({ isRead: true })
    .where(
      and(
        eq(chatMessages.senderId, partnerId),
        eq(chatMessages.receiverId, myId),
        eq(chatMessages.isRead, false)
      )
    );
}

export async function getPartnerName(partnerId: string): Promise<string> {
  await requireAuth();
  if (partnerId === 'admin') return '管理者';
  const rows = await db.select({ name: members.name }).from(members).where(eq(members.id, partnerId));
  return rows.length > 0 ? rows[0].name : '不明';
}

export async function getUnreadMessageCount(): Promise<number> {
  const user = await requireAuth();
  const myId = user.role === 'admin' ? 'admin' : user.memberId!;

  const rows = await db
    .select({ value: count() })
    .from(chatMessages)
    .where(
      and(eq(chatMessages.receiverId, myId), eq(chatMessages.isRead, false))
    );
  return rows[0]?.value ?? 0;
}
