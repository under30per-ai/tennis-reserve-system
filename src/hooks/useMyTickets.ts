'use client';

import { useState, useCallback, useEffect } from 'react';
import type { MemberTicketWithType, TicketUsage } from '@/types';
import {
  getMyTickets,
  useTicket as useTicketAction,
  getTicketUsageHistory,
} from '@/app/actions/tickets';

export default function useMyTickets() {
  const [tickets, setTickets] = useState<MemberTicketWithType[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getMyTickets();
    setTickets(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const useTicket = useCallback(
    async (memberTicketId: string, reservationId: string) => {
      const result = await useTicketAction(memberTicketId, reservationId);
      await refresh();
      return result;
    },
    [refresh]
  );

  const getUsageHistory = useCallback(
    async (memberTicketId: string): Promise<TicketUsage[]> => {
      return getTicketUsageHistory(memberTicketId);
    },
    []
  );

  return { tickets, loading, refresh, useTicket, getUsageHistory };
}
