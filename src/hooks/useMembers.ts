'use client';

import { useState, useEffect, useCallback } from 'react';
import { Member, LessonLevel } from '@/types';
import { memberUseCases } from '@/application/usecases';

export default function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);

  const refresh = useCallback(() => {
    setMembers(memberUseCases.getAll());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getMember = useCallback((id: string) => memberUseCases.getById(id), []);

  const addMember = useCallback((data: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'>) => {
    const member = memberUseCases.create(data);
    refresh();
    return member;
  }, [refresh]);

  const updateMember = useCallback((id: string, data: Partial<Member>) => {
    const result = memberUseCases.update(id, data);
    refresh();
    return result;
  }, [refresh]);

  const deleteMember = useCallback((id: string) => {
    memberUseCases.remove(id);
    refresh();
  }, [refresh]);

  const searchMembers = useCallback((query: string) => {
    const q = query.toLowerCase();
    return members.filter(m => m.name.toLowerCase().includes(q) || m.nameKana.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [members]);

  const getMembersByLevel = useCallback((level: LessonLevel) => {
    return members.filter(m => m.level === level && m.isActive);
  }, [members]);

  return { members, getMember, addMember, updateMember, deleteMember, searchMembers, getMembersByLevel, refresh };
}
