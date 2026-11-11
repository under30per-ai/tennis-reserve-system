'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Event } from '@/types';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent as updateEventAction,
  deleteEvent as deleteEventAction,
} from '@/app/actions/events';

export default function useEvents(options?: { eagerLoad?: boolean }) {
  const eagerLoad = options?.eagerLoad ?? false;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(eagerLoad);

  const refresh = useCallback(async () => {
    const data = await getEvents();
    setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!eagerLoad) return;
    refresh();
  }, [eagerLoad, refresh]);

  const getEvent = useCallback(async (id: string) => {
    return getEventById(id);
  }, []);

  const addEvent = useCallback(
    async (data: Parameters<typeof createEvent>[0]) => {
      const result = await createEvent(data);
      await refresh();
      return result;
    },
    [refresh]
  );

  const updateEvent = useCallback(
    async (id: string, data: Parameters<typeof updateEventAction>[1]) => {
      const result = await updateEventAction(id, data);
      await refresh();
      return result;
    },
    [refresh]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      await deleteEventAction(id);
      await refresh();
    },
    [refresh]
  );

  return { events, loading, refresh, getEvent, addEvent, updateEvent, deleteEvent };
}
