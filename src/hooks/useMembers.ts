'use client';

import { useState, useCallback, useEffect } from 'react';
import { Member, LessonLevel } from '@/types';
import {
  getMembers as fetchMembers,
  getMemberById,
  getMembersByIds as fetchMembersByIds,
  createMember,
  updateMember as updateMemberAction,
  deleteMember as deleteMemberAction,
} from '@/app/actions/members';

interface UseMembersOptions {
  eagerLoad?: boolean;
}

export default function useMembers(options?: UseMembersOptions) {
  const eagerLoad = options?.eagerLoad ?? false;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(eagerLoad);

  const refresh = useCallback(async () => {
    const data = await fetchMembers();
    setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!eagerLoad) return;
    fetchMembers().then(data => {
      setMembers(data);
      setLoading(false);
    });
  }, [eagerLoad]);

  const getMember = useCallback(async (id: string) => {
    return getMemberById(id);
  }, []);

  const getMembersByIdsBatch = useCallback(async (ids: string[]) => {
    return fetchMembersByIds(ids);
  }, []);

  const addMember = useCallback(
    async (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'> & { password: string }) => {
      const member = await createMember(data);
      await refresh();
      return member;
    },
    [refresh]
  );

  const updateMember = useCallback(
    async (id: string, data: Partial<Member>) => {
      const result = await updateMemberAction(id, data);
      await refresh();
      return result;
    },
    [refresh]
  );

  const deleteMember = useCallback(
    async (id: string) => {
      await deleteMemberAction(id);
      await refresh();
    },
    [refresh]
  );

  const searchMembers = useCallback(
    (query: string) => {
      const q = query.toLowerCase();
      return members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.nameKana.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      );
    },
    [members]
  );

  const getMembersByLevel = useCallback(
    (level: LessonLevel) => {
      return members.filter((m) => m.level === level && m.isActive);
    },
    [members]
  );

  return {
    members,
    loading,
    getMember,
    getMembersByIdsBatch,
    addMember,
    updateMember,
    deleteMember,
    searchMembers,
    getMembersByLevel,
    refresh,
  };
}
