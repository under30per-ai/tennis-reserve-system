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

// ── Notification types ────────────────────────────────

export type NotificationType =
  | 'lesson_cancel'
  | 'reservation_confirm'
  | 'reservation_cancel'
  | 'waitlist_promoted'
  | 'transfer_complete'
  | 'event_new'
  | 'trial_approved'
  | 'ticket_expiring'
  | 'general';

export interface Notification {
  id: string;
  memberId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

// ── Ticket types ──────────────────────────────────────

export interface TicketType {
  id: string;
  name: string;
  description: string;
  lessonCount: number;
  validDays: number;
  price: number;
  isActive: boolean;
  createdAt: string;
}

export interface MemberTicket {
  id: string;
  memberId: string;
  ticketTypeId: string;
  remainingCount: number;
  purchasedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface MemberTicketWithType extends MemberTicket {
  ticketType: TicketType;
}

export interface TicketUsage {
  id: string;
  memberTicketId: string;
  reservationId: string;
  usedAt: string;
}

// ── Trial Lesson types ────────────────────────────────

export type TrialStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'no_show';

export interface TrialApplication {
  id: string;
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  preferredLevel: LessonLevel;
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: TrialStatus;
  adminNotes: string;
  reviewedAt: string | null;
  createdAt: string;
}

// ── Event types ───────────────────────────────────────

export type EventRegistrationStatus = 'registered' | 'cancelled' | 'waitlisted';

export interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  courtId: string | null;
  maxParticipants: number;
  targetLevel: LessonLevel | null;
  fee: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  memberId: string;
  status: EventRegistrationStatus;
  registeredAt: string;
  cancelledAt: string | null;
  notes: string;
}

export interface EventWithDetails extends Event {
  court: Court | null;
  registrations: EventRegistration[];
  currentParticipants: number;
  availableSpots: number;
}

// ── Chat types ────────────────────────────────────────

export type SenderRole = 'member' | 'admin';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: SenderRole;
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatThread {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

// ── Shop types ────────────────────────────────────────

export type ProductCategory = 'racket' | 'shoe' | 'apparel' | 'ball' | 'accessory' | 'string';
export type ShopOrderStatus = 'pending' | 'confirmed' | 'paid' | 'shipped' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'credit_card' | 'transfer' | 'mock';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type OrderSource = 'online' | 'pos';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stock: number;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopOrder {
  id: string;
  memberId: string;
  orderNumber: string;
  status: ShopOrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  totalAmount: number;
  notes: string;
  orderSource: OrderSource;
  posTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
}

export interface ShopOrderWithItems extends ShopOrder {
  items: ShopOrderItem[];
  memberName: string;
}

