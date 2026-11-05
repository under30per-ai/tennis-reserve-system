import { LessonLevel, MembershipType, ReservationStatus, CourtType, CourtSurface, AttendanceStatus, RecurrenceType, NotificationType, TrialStatus, EventRegistrationStatus, FamilyRelationship } from '@/types';

export const LEVEL_LABELS: Record<LessonLevel, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
  junior: 'ジュニア',
};

export const MEMBERSHIP_LABELS: Record<MembershipType, string> = {
  regular: '一般会員',
  student: '学生会員',
  senior: 'シニア会員',
  family: 'ファミリー会員',
  trial: '体験会員',
};

export const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  confirmed: '確定',
  cancelled: 'キャンセル済',
  waitlisted: 'キャンセル待ち',
  transferred: '振替済',
};

export const COURT_TYPE_LABELS: Record<CourtType, string> = {
  indoor: 'インドア',
  outdoor: 'アウトドア',
};

export const COURT_SURFACE_LABELS: Record<CourtSurface, string> = {
  hard: 'ハードコート',
  clay: 'クレーコート',
  omni: 'オムニコート',
  carpet: 'カーペットコート',
};

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

export const LEVEL_COLORS: Record<LessonLevel, { bg: string; text: string; border: string }> = {
  beginner: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400' },
  intermediate: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-400' },
  advanced: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-400' },
  junior: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-400' },
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: '出席',
  absent: '欠席',
  late: '遅刻',
  excused: '振替欠席',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string }> = {
  present: { bg: 'bg-green-100', text: 'text-green-800' },
  absent: { bg: 'bg-red-100', text: 'text-red-800' },
  late: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  excused: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export const PERFORMANCE_RATING_LABELS: Record<number, string> = {
  1: '要努力',
  2: 'もう少し',
  3: '普通',
  4: '良い',
  5: '素晴らしい',
};

export const CANCEL_REASONS = [
  { value: 'rain', label: '雨天中止' },
  { value: 'coach_illness', label: 'コーチの体調不良' },
  { value: 'facility_maintenance', label: '施設メンテナンス' },
  { value: 'insufficient_participants', label: '参加者不足' },
  { value: 'natural_disaster', label: '自然災害' },
  { value: 'other', label: 'その他' },
];

export const CANCEL_REASON_LABELS: Record<string, string> = Object.fromEntries(
  CANCEL_REASONS.map(r => [r.value, r.label])
);

export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  none: '単発',
  weekly: '毎週',
  biweekly: '隔週',
  monthly: '月次',
};

export const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#A855F7',
  '#EC4899', '#F43F5E',
];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  lesson_cancel: 'レッスン中止',
  reservation_confirm: '予約確定',
  reservation_cancel: '予約キャンセル',
  waitlist_promoted: 'キャンセル待ち繰上げ',
  transfer_complete: '振替完了',
  event_new: '新規イベント',
  trial_approved: '体験レッスン承認',
  ticket_expiring: 'チケット期限',
  general: 'お知らせ',
};

export const TRIAL_STATUS_LABELS: Record<TrialStatus, string> = {
  pending: '審査待ち',
  approved: '承認済',
  rejected: '不承認',
  completed: '完了',
  no_show: '未参加',
};

export const TRIAL_STATUS_COLORS: Record<TrialStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  no_show: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export const EVENT_REGISTRATION_STATUS_LABELS: Record<EventRegistrationStatus, string> = {
  registered: '参加登録済',
  cancelled: 'キャンセル済',
  waitlisted: 'キャンセル待ち',
};

export const FAMILY_RELATIONSHIP_LABELS: Record<FamilyRelationship, string> = {
  primary: '本人',
  spouse: '配偶者',
  child: '子',
  parent: '親',
  sibling: '兄弟姉妹',
};
