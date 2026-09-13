'use client';

import { useState, useCallback } from 'react';
import { Member, MemberLessonHistoryEntry, MemberKarteSummary } from '@/types';
import { memberKarteUseCases } from '@/application/usecases';

export default function useMemberKarte() {
  const [summary, setSummary] = useState<MemberKarteSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateKarte = useCallback(async (member: Member, history: MemberLessonHistoryEntry[]) => {
    setIsGenerating(true);
    setSummary(null);

    const result = await memberKarteUseCases.generate(member, history);
    setSummary(result);
    setIsGenerating(false);
    return result;
  }, []);

  const clearKarte = useCallback(() => {
    setSummary(null);
  }, []);

  return { summary, isGenerating, generateKarte, clearKarte };
}
