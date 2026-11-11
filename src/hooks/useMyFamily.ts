'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FamilyGroupWithMembers } from '@/types';
import { getMyFamilyGroup } from '@/app/actions/families';

export default function useMyFamily() {
  const [familyGroup, setFamilyGroup] = useState<FamilyGroupWithMembers | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getMyFamilyGroup();
    setFamilyGroup(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { familyGroup, loading, refresh };
}
