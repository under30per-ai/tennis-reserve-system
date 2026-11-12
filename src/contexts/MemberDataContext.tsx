'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import useAuth from '@/hooks/useAuth';
import { getMemberById } from '@/app/actions/members';
import { getMemberReservations as fetchMemberReservations } from '@/app/actions/reservations';
import type { Member, ReservationWithDetails } from '@/types';

interface MemberDataContextValue {
  member: Member | null;
  reservations: ReservationWithDetails[];
  loading: boolean;
  refreshMember: () => Promise<void>;
  refreshReservations: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const MemberDataContext = createContext<MemberDataContextValue | null>(null);

const CACHE_TTL = 5 * 60 * 1000; // 5分

export function MemberDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const memberFetchedAt = useRef<number>(0);
  const reservationsFetchedAt = useRef<number>(0);

  const memberId = user?.memberId;

  const refreshMember = useCallback(async () => {
    if (!memberId) return;
    const m = await getMemberById(memberId);
    setMember(m);
    memberFetchedAt.current = Date.now();
  }, [memberId]);

  const refreshReservations = useCallback(async () => {
    if (!memberId) return;
    const r = await fetchMemberReservations(memberId);
    setReservations(r);
    reservationsFetchedAt.current = Date.now();
  }, [memberId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshMember(), refreshReservations()]);
  }, [refreshMember, refreshReservations]);

  // 初回取得 + TTL切れ時の再取得
  useEffect(() => {
    if (!memberId) return;

    const now = Date.now();
    const memberStale = now - memberFetchedAt.current > CACHE_TTL;
    const reservationsStale = now - reservationsFetchedAt.current > CACHE_TTL;

    if (!memberStale && !reservationsStale) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const promises: Promise<void>[] = [];
    if (memberStale) promises.push(refreshMember());
    if (reservationsStale) promises.push(refreshReservations());
    Promise.all(promises).finally(() => setLoading(false));
  }, [memberId, refreshMember, refreshReservations]);

  return (
    <MemberDataContext.Provider value={{ member, reservations, loading, refreshMember, refreshReservations, refreshAll }}>
      {children}
    </MemberDataContext.Provider>
  );
}

export function useMemberData(): MemberDataContextValue {
  const ctx = useContext(MemberDataContext);
  if (!ctx) throw new Error('useMemberData must be used within MemberDataProvider');
  return ctx;
}
