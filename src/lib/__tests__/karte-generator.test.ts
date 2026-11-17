import { describe, it, expect } from 'vitest';
import { generateMockKarteSummary } from '@/lib/karte-generator';
import type { Member, MemberLessonHistoryEntry, MemberLessonNote } from '@/types';

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'm1',
    name: '田中太郎',
    nameKana: 'タナカタロウ',
    email: 'tanaka@test.com',
    phone: '090-1234-5678',
    level: 'intermediate',
    membershipType: 'regular',
    joinDate: '2024-01-01',
    isActive: true,
    notes: '',
    avatarColor: '#3B82F6',
    remainingTransfers: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeNote(overrides: Partial<MemberLessonNote> = {}): MemberLessonNote {
  return {
    memberId: 'm1',
    attendance: 'present',
    performanceRating: 3,
    goodPoints: '',
    improvementPoints: '',
    memo: '',
    ...overrides,
  };
}

function makeHistoryEntry(
  date: string,
  note: Partial<MemberLessonNote> = {}
): MemberLessonHistoryEntry {
  return {
    record: {
      id: `r-${date}`,
      lessonInstanceId: `li-${date}`,
      theme: 'Test',
      content: 'Test',
      memberNotes: [makeNote(note)],
      createdAt: `${date}T00:00:00Z`,
      updatedAt: `${date}T00:00:00Z`,
    },
    lessonInstance: {
      id: `li-${date}`,
      lessonSlotId: 'ls1',
      date,
      coachId: 'c1',
      courtId: 'ct1',
      startTime: '10:00',
      endTime: '11:00',
      maxCapacity: 8,
      isCancelled: false,
      cancelReason: '',
      notes: '',
      createdAt: `${date}T00:00:00Z`,
    },
    lessonSlot: {
      id: 'ls1',
      title: 'Test',
      level: 'intermediate',
      coachId: 'c1',
      courtId: 'ct1',
      dayOfWeek: 1,
      startTime: '10:00',
      endTime: '11:00',
      maxCapacity: 8,
      isRecurring: true,
      recurrenceType: 'weekly',
      recurrenceStartDate: '2024-01-01',
      recurrenceEndDate: null,
      specificDate: null,
      monthlyWeekNumber: null,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    coach: {
      id: 'c1',
      name: 'Coach',
      nameKana: 'コーチ',
      email: 'coach@test.com',
      phone: '',
      specialties: ['intermediate'],
      bio: '',
      certifications: [],
      avatarColor: '#EF4444',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    court: {
      id: 'ct1',
      name: 'Court A',
      type: 'indoor',
      surface: 'hard',
      capacity: 4,
      isActive: true,
    },
    memberNote: makeNote(note),
  };
}

describe('generateMockKarteSummary', () => {
  const member = makeMember();

  it('returns default summary for empty history', () => {
    const result = generateMockKarteSummary(member, []);
    expect(result.attendanceRate).toBe(0);
    expect(result.averageRating).toBe(0);
    expect(result.totalLessons).toBe(0);
    expect(result.trend).toBe('stable');
    expect(result.progressSummary).toContain('レッスン記録がまだありません');
  });

  it('calculates attendance rate correctly', () => {
    const history = [
      makeHistoryEntry('2024-01-01', { attendance: 'present' }),
      makeHistoryEntry('2024-01-08', { attendance: 'absent' }),
      makeHistoryEntry('2024-01-15', { attendance: 'late' }),
      makeHistoryEntry('2024-01-22', { attendance: 'present' }),
    ];
    const result = generateMockKarteSummary(member, history);
    // 3 present/late out of 4 = 75%
    expect(result.attendanceRate).toBe(75);
  });

  it('calculates average rating from attended lessons only', () => {
    const history = [
      makeHistoryEntry('2024-01-01', { attendance: 'present', performanceRating: 4 }),
      makeHistoryEntry('2024-01-08', { attendance: 'absent', performanceRating: 1 }),
      makeHistoryEntry('2024-01-15', { attendance: 'present', performanceRating: 2 }),
    ];
    const result = generateMockKarteSummary(member, history);
    // Only present: (4 + 2) / 2 = 3.0
    expect(result.averageRating).toBe(3);
  });

  it('detects improving trend', () => {
    const history = [
      makeHistoryEntry('2024-01-01', { attendance: 'present', performanceRating: 1 }),
      makeHistoryEntry('2024-01-08', { attendance: 'present', performanceRating: 1 }),
      makeHistoryEntry('2024-01-15', { attendance: 'present', performanceRating: 5 }),
      makeHistoryEntry('2024-01-22', { attendance: 'present', performanceRating: 5 }),
    ];
    const result = generateMockKarteSummary(member, history);
    expect(result.trend).toBe('improving');
  });

  it('detects declining trend', () => {
    const history = [
      makeHistoryEntry('2024-01-01', { attendance: 'present', performanceRating: 5 }),
      makeHistoryEntry('2024-01-08', { attendance: 'present', performanceRating: 5 }),
      makeHistoryEntry('2024-01-15', { attendance: 'present', performanceRating: 1 }),
      makeHistoryEntry('2024-01-22', { attendance: 'present', performanceRating: 1 }),
    ];
    const result = generateMockKarteSummary(member, history);
    expect(result.trend).toBe('declining');
  });

  it('detects stable trend when ratings are similar', () => {
    const history = [
      makeHistoryEntry('2024-01-01', { attendance: 'present', performanceRating: 3 }),
      makeHistoryEntry('2024-01-08', { attendance: 'present', performanceRating: 3 }),
      makeHistoryEntry('2024-01-15', { attendance: 'present', performanceRating: 3 }),
      makeHistoryEntry('2024-01-22', { attendance: 'present', performanceRating: 3 }),
    ];
    const result = generateMockKarteSummary(member, history);
    expect(result.trend).toBe('stable');
  });

  it('recommends improvement when attendance is low', () => {
    const history = [
      makeHistoryEntry('2024-01-01', { attendance: 'present' }),
      makeHistoryEntry('2024-01-08', { attendance: 'absent' }),
      makeHistoryEntry('2024-01-15', { attendance: 'absent' }),
      makeHistoryEntry('2024-01-22', { attendance: 'absent' }),
    ];
    const result = generateMockKarteSummary(member, history);
    expect(result.recommendations.some((r) => r.includes('出席率'))).toBe(true);
  });

  it('recommends basics when rating is low', () => {
    const history = [
      makeHistoryEntry('2024-01-01', { attendance: 'present', performanceRating: 1 }),
      makeHistoryEntry('2024-01-08', { attendance: 'present', performanceRating: 2 }),
    ];
    const result = generateMockKarteSummary(member, history);
    expect(result.recommendations.some((r) => r.includes('基礎練習'))).toBe(true);
  });

  it('collects unique good points and improvement points', () => {
    const history = [
      makeHistoryEntry('2024-01-01', {
        attendance: 'present',
        goodPoints: 'フォアハンドが安定',
        improvementPoints: 'バックハンド要改善',
      }),
      makeHistoryEntry('2024-01-08', {
        attendance: 'present',
        goodPoints: 'フォアハンドが安定',
        improvementPoints: 'サーブのトス',
      }),
    ];
    const result = generateMockKarteSummary(member, history);
    expect(result.strengths).toContain('フォアハンドが安定');
    expect(result.challenges).toContain('バックハンド要改善');
    expect(result.challenges).toContain('サーブのトス');
  });

  it('includes level label in progress summary', () => {
    const result = generateMockKarteSummary(
      makeMember({ level: 'beginner', name: 'テスト' }),
      [makeHistoryEntry('2024-01-01', { attendance: 'present' })]
    );
    expect(result.progressSummary).toContain('初級');
  });

  it('sets totalLessons to history length', () => {
    const history = [
      makeHistoryEntry('2024-01-01'),
      makeHistoryEntry('2024-01-08'),
      makeHistoryEntry('2024-01-15'),
    ];
    const result = generateMockKarteSummary(member, history);
    expect(result.totalLessons).toBe(3);
  });
});
