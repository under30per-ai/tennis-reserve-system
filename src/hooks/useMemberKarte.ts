'use client';

import { useState, useCallback } from 'react';
import { Member, MemberLessonHistoryEntry, MemberKarteSummary } from '@/types';
import { generateMockKarteSummary } from '@/lib/karte-generator';

export default function useMemberKarte() {
  const [summary, setSummary] = useState<MemberKarteSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateKarte = useCallback(async (member: Member, history: MemberLessonHistoryEntry[]) => {
    setIsGenerating(true);
    setSummary(null);

    await new Promise(resolve => setTimeout(resolve, 1500));
    const result = generateMockKarteSummary(member, history);
    setSummary(result);
    setIsGenerating(false);
    return result;
  }, []);

  const clearKarte = useCallback(() => {
    setSummary(null);
  }, []);

  return { summary, isGenerating, generateKarte, clearKarte };
}
