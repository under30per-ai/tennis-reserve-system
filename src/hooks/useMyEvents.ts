'use client';

import { useState, useCallback, useEffect } from 'react';
import type { EventWithDetails, EventRegistration } from '@/types';
import {
  getUpcomingEvents,
  getMyEventRegistrations,
  registerForEvent as registerForEventAction,
  cancelEventRegistration as cancelEventRegistrationAction,
  getEventWithDetails,
} from '@/app/actions/events';

export default function useMyEvents() {
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithDetails[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [events, regs] = await Promise.all([
      getUpcomingEvents(),
      getMyEventRegistrations(),
    ]);
    setUpcomingEvents(events);
    setMyRegistrations(regs);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getEvent = useCallback(async (id: string) => {
    return getEventWithDetails(id);
  }, []);

  const registerForEvent = useCallback(
    async (eventId: string) => {
      const result = await registerForEventAction(eventId);
      await refresh();
      return result;
    },
    [refresh]
  );

  const cancelRegistration = useCallback(
    async (registrationId: string) => {
      await cancelEventRegistrationAction(registrationId);
      await refresh();
    },
    [refresh]
  );

  return { upcomingEvents, myRegistrations, loading, refresh, getEvent, registerForEvent, cancelRegistration };
}
