'use client';

import { useCRUD } from '@/hooks/useCRUD';
import type { Event } from '@/types';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent as updateEventAction,
  deleteEvent as deleteEventAction,
} from '@/app/actions/events';

export default function useEvents(options?: { eagerLoad?: boolean }) {
  const { items, loading, refresh, getById, add, update, remove } = useCRUD<
    Event,
    Parameters<typeof createEvent>[0],
    Parameters<typeof updateEventAction>[1]
  >(
    {
      getAll: getEvents,
      getById: getEventById,
      create: createEvent,
      update: updateEventAction,
      remove: deleteEventAction,
    },
    { eagerLoad: options?.eagerLoad ?? false }
  );

  return {
    events: items,
    loading,
    refresh,
    getEvent: getById!,
    addEvent: add!,
    updateEvent: update!,
    deleteEvent: remove!,
  };
}
