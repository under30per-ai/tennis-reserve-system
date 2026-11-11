'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FamilyGroupWithMembers, FamilyRelationship } from '@/types';
import {
  listFamilyGroups,
  getFamilyGroup,
  createFamilyGroup as createFamilyGroupAction,
  addFamilyMember as addFamilyMemberAction,
  removeFamilyMember as removeFamilyMemberAction,
  deleteFamilyGroup as deleteFamilyGroupAction,
} from '@/app/actions/families';

export default function useFamilies(options?: { eagerLoad?: boolean }) {
  const eagerLoad = options?.eagerLoad ?? false;
  const [groups, setGroups] = useState<FamilyGroupWithMembers[]>([]);
  const [loading, setLoading] = useState(eagerLoad);

  const refresh = useCallback(async () => {
    const data = await listFamilyGroups();
    setGroups(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!eagerLoad) return;
    refresh();
  }, [eagerLoad, refresh]);

  const getGroup = useCallback(async (id: string) => {
    return getFamilyGroup(id);
  }, []);

  const createFamilyGroup = useCallback(
    async (name: string, primaryMemberId: string) => {
      const result = await createFamilyGroupAction(name, primaryMemberId);
      await refresh();
      return result;
    },
    [refresh]
  );

  const addFamilyMember = useCallback(
    async (familyGroupId: string, memberId: string, relationship: FamilyRelationship) => {
      const result = await addFamilyMemberAction(familyGroupId, memberId, relationship);
      await refresh();
      return result;
    },
    [refresh]
  );

  const removeFamilyMember = useCallback(
    async (familyGroupMemberId: string) => {
      await removeFamilyMemberAction(familyGroupMemberId);
      await refresh();
    },
    [refresh]
  );

  const deleteFamilyGroup = useCallback(
    async (id: string) => {
      await deleteFamilyGroupAction(id);
      await refresh();
    },
    [refresh]
  );

  return { groups, loading, refresh, getGroup, createFamilyGroup, addFamilyMember, removeFamilyMember, deleteFamilyGroup };
}
