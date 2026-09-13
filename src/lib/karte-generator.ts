import { Member, MemberLessonHistoryEntry, MemberKarteSummary } from '@/types';

export function generateMockKarteSummary(
  member: Member,
  history: MemberLessonHistoryEntry[]
): MemberKarteSummary {
  if (history.length === 0) {
    return {
      memberId: member.id,
      generatedAt: new Date().toISOString(),
      attendanceRate: 0,
      averageRating: 0,
      totalLessons: 0,
      progressSummary: 'レッスン記録がまだありません。',
      strengths: [],
      challenges: [],
      recommendations: ['レッスンに参加して記録を蓄積しましょう。'],
      trend: 'stable',
    };
  }

  // Calculate attendance rate
  const presentCount = history.filter(
    h => h.memberNote.attendance === 'present' || h.memberNote.attendance === 'late'
  ).length;
  const attendanceRate = Math.round((presentCount / history.length) * 100);

  // Calculate average rating (only for attended lessons)
  const attendedNotes = history.filter(
    h => h.memberNote.attendance === 'present' || h.memberNote.attendance === 'late'
  );
  const averageRating = attendedNotes.length > 0
    ? Math.round((attendedNotes.reduce((sum, h) => sum + h.memberNote.performanceRating, 0) / attendedNotes.length) * 10) / 10
    : 0;

  // Collect unique good points and improvement points
  const goodPoints = [...new Set(
    history
      .map(h => h.memberNote.goodPoints)
      .filter(p => p.trim() !== '')
  )];
  const improvementPoints = [...new Set(
    history
      .map(h => h.memberNote.improvementPoints)
      .filter(p => p.trim() !== '')
  )];

  // Determine trend by comparing recent 5 vs earlier ratings
  const sorted = [...attendedNotes].sort(
    (a, b) => a.lessonInstance.date.localeCompare(b.lessonInstance.date)
  );
  let trend: 'improving' | 'stable' | 'declining' = 'stable';

  if (sorted.length >= 4) {
    const recentCount = Math.min(5, Math.floor(sorted.length / 2));
    const recent = sorted.slice(-recentCount);
    const earlier = sorted.slice(0, -recentCount);

    const recentAvg = recent.reduce((s, h) => s + h.memberNote.performanceRating, 0) / recent.length;
    const earlierAvg = earlier.reduce((s, h) => s + h.memberNote.performanceRating, 0) / earlier.length;
    const diff = recentAvg - earlierAvg;

    if (diff >= 0.5) trend = 'improving';
    else if (diff <= -0.5) trend = 'declining';
  }

  // Generate template-based summaries
  const trendLabels = { improving: '上昇傾向', stable: '安定', declining: '停滞気味' };
  const levelLabel = { beginner: '初級', intermediate: '中級', advanced: '上級', junior: 'ジュニア' }[member.level];

  const progressSummary = `${member.name}さんは${levelLabel}クラスに所属し、これまで${history.length}回のレッスンに記録があります。` +
    `出席率は${attendanceRate}%、平均評価は${averageRating}点（5点満点）で、全体的に${trendLabels[trend]}です。`;

  const strengths = goodPoints.length > 0
    ? goodPoints.slice(0, 5)
    : ['継続的にレッスンに参加している点'];

  const challenges = improvementPoints.length > 0
    ? improvementPoints.slice(0, 5)
    : ['特に記録された課題はありません'];

  const recommendations: string[] = [];
  if (attendanceRate < 70) {
    recommendations.push('出席率の改善が望まれます。定期的な参加を心がけましょう。');
  }
  if (averageRating < 3) {
    recommendations.push('基礎練習に重点を置き、フォームの確認を行いましょう。');
  }
  if (trend === 'declining') {
    recommendations.push('最近の評価が低下傾向にあります。コーチに相談してトレーニング内容を見直しましょう。');
  }
  if (trend === 'improving') {
    recommendations.push('着実に上達しています。この調子で練習を続けましょう。');
  }
  if (recommendations.length === 0) {
    recommendations.push('現在のペースで練習を継続しましょう。');
  }

  return {
    memberId: member.id,
    generatedAt: new Date().toISOString(),
    attendanceRate,
    averageRating,
    totalLessons: history.length,
    progressSummary,
    strengths,
    challenges,
    recommendations,
    trend,
  };
}
