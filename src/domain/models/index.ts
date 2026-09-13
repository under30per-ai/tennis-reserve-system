export type LessonLevel = 'beginner' | 'intermediate' | 'advanced' | 'junior';
export type MembershipType = 'regular' | 'student' | 'senior' | 'family' | 'trial';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ReservationStatus = 'confirmed' | 'cancelled' | 'waitlisted' | 'transferred';
export type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly';
export type CourtType = 'indoor' | 'outdoor';
export type CourtSurface = 'hard' | 'clay' | 'omni' | 'carpet';

export interface Member {
  id: string;
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  level: LessonLevel;
  membershipType: MembershipType;
  joinDate: string;
  isActive: boolean;
  notes: string;
  password: string;
  avatarColor: string;
  remainingTransfers: number;
  createdAt: string;
  updatedAt: string;
}

export interface Coach {
  id: string;
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  specialties: LessonLevel[];
  bio: string;
  certifications: string[];
  avatarColor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  surface: CourtSurface;
  capacity: number;
  isActive: boolean;
}

export interface LessonSlot {
  id: string;
  title: string;
  level: LessonLevel;
  coachId: string;
  courtId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceStartDate: string;
  recurrenceEndDate: string | null;
  specificDate: string | null;
  monthlyWeekNumber: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonInstance {
  id: string;
  lessonSlotId: string;
  date: string;
  coachId: string;
  courtId: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isCancelled: boolean;
  cancelReason: string;
  notes: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  memberId: string;
  lessonInstanceId: string;
  status: ReservationStatus;
  reservedAt: string;
  cancelledAt: string | null;
  transferFromInstanceId: string | null;
  transferToInstanceId: string | null;
  waitlistPosition: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonSlotWithDetails extends LessonSlot {
  coach: Coach;
  court: Court;
  currentBookings: number;
  waitlistCount: number;
}

export interface ReservationWithDetails extends Reservation {
  member: Member;
  lessonInstance: LessonInstance;
  lessonSlot: LessonSlot;
  coach: Coach;
  court: Court;
}

export interface LessonInstanceWithDetails extends LessonInstance {
  lessonSlot: LessonSlot;
  coach: Coach;
  court: Court;
  reservations: Reservation[];
  currentBookings: number;
  waitlistCount: number;
  availableSpots: number;
}

export interface DashboardStats {
  todayLessonCount: number;
  totalMembers: number;
  totalCoaches: number;
  todayReservationCount: number;
  reservationRate: number;
  upcomingLessonsToday: LessonInstanceWithDetails[];
  recentReservations: ReservationWithDetails[];
  weeklyTrend: { date: string; count: number }[];
}

export interface AuthUser {
  id: string;
  name: string;
  role: 'member' | 'admin';
  memberId?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// Lesson Record & Member Karte types

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface MemberLessonNote {
  memberId: string;
  attendance: AttendanceStatus;
  performanceRating: number; // 1-5
  goodPoints: string;
  improvementPoints: string;
  memo: string;
}

export interface LessonRecord {
  id: string;
  lessonInstanceId: string;
  theme: string;
  content: string;
  memberNotes: MemberLessonNote[];
  createdAt: string;
  updatedAt: string;
}

export interface LessonRecordWithDetails extends LessonRecord {
  lessonInstance: LessonInstance;
  lessonSlot: LessonSlot;
  coach: Coach;
  court: Court;
}

export interface MemberKarteSummary {
  memberId: string;
  generatedAt: string;
  attendanceRate: number;
  averageRating: number;
  totalLessons: number;
  progressSummary: string;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  trend: 'improving' | 'stable' | 'declining';
}

export interface MemberLessonHistoryEntry {
  record: LessonRecord;
  lessonInstance: LessonInstance;
  lessonSlot: LessonSlot;
  coach: Coach;
  court: Court;
  memberNote: MemberLessonNote;
}
