'use client';

import { useState, useCallback, useEffect } from 'react';
import type { TicketType, MemberTicketWithType } from '@/types';
import {
  getTicketTypes,
  getTicketTypeById,
  createTicketType,
  updateTicketType as updateTicketTypeAction,
  deleteTicketType as deleteTicketTypeAction,
  issueMemberTicket as issueMemberTicketAction,
  getAllMemberTickets,
} from '@/app/actions/tickets';

export default function useTickets(options?: { eagerLoad?: boolean }) {
  const eagerLoad = options?.eagerLoad ?? false;
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [memberTickets, setMemberTickets] = useState<MemberTicketWithType[]>([]);
  const [loading, setLoading] = useState(eagerLoad);

  const refresh = useCallback(async () => {
    const [types, tickets] = await Promise.all([getTicketTypes(), getAllMemberTickets()]);
    setTicketTypes(types);
    setMemberTickets(tickets);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!eagerLoad) return;
    refresh();
  }, [eagerLoad, refresh]);

  const getType = useCallback(async (id: string) => {
    return getTicketTypeById(id);
  }, []);

  const addTicketType = useCallback(
    async (data: Parameters<typeof createTicketType>[0]) => {
      const result = await createTicketType(data);
      await refresh();
      return result;
    },
    [refresh]
  );

  const updateTicketType = useCallback(
    async (id: string, data: Parameters<typeof updateTicketTypeAction>[1]) => {
      const result = await updateTicketTypeAction(id, data);
      await refresh();
      return result;
    },
    [refresh]
  );

  const deleteTicketType = useCallback(
    async (id: string) => {
      await deleteTicketTypeAction(id);
      await refresh();
    },
    [refresh]
  );

  const issueMemberTicket = useCallback(
    async (memberId: string, ticketTypeId: string) => {
      const result = await issueMemberTicketAction(memberId, ticketTypeId);
      await refresh();
      return result;
    },
    [refresh]
  );

  return {
    ticketTypes,
    memberTickets,
    loading,
    refresh,
    getType,
    addTicketType,
    updateTicketType,
    deleteTicketType,
    issueMemberTicket,
  };
}
