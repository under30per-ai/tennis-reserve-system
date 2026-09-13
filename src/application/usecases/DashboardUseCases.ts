import {
  DashboardStats,
  LessonInstanceWithDetails,
  ReservationWithDetails,
} from '@/domain/models';
import {
  ILessonInstanceRepository,
  IReservationRepository,
  IMemberRepository,
  ICoachRepository,
  ILessonSlotRepository,
  ICourtRepository,
} from '@/domain/repositories';
import { format, subDays } from 'date-fns';

export class DashboardUseCases {
  constructor(
    private instanceRepo: ILessonInstanceRepository,
    private reservationRepo: IReservationRepository,
    private memberRepo: IMemberRepository,
    private coachRepo: ICoachRepository,
    private slotRepo: ILessonSlotRepository,
    private courtRepo: ICourtRepository,
  ) {}

  getStats(): DashboardStats {
    const today = format(new Date(), 'yyyy-MM-dd');
    const instances = this.instanceRepo.getAll();
    const reservations = this.reservationRepo.getAll();
    const members = this.memberRepo.getAll();
    const coaches = this.coachRepo.getAll();

    const todayInstances = instances.filter(i => i.date === today && !i.isCancelled);
    const todayReservations = reservations.filter(r => {
      const instance = instances.find(i => i.id === r.lessonInstanceId);
      return instance?.date === today && r.status === 'confirmed';
    });

    const totalCapacity = todayInstances.reduce((sum, i) => sum + i.maxCapacity, 0);
    const reservationRate = totalCapacity > 0 ? Math.round((todayReservations.length / totalCapacity) * 100) : 0;

    const upcomingLessonsToday: LessonInstanceWithDetails[] = todayInstances
      .map(instance => {
        const slot = this.slotRepo.getById(instance.lessonSlotId);
        const coach = this.coachRepo.getById(instance.coachId);
        const court = this.courtRepo.getById(instance.courtId);
        if (!slot || !coach || !court) return null;
        const instReservations = reservations.filter(r => r.lessonInstanceId === instance.id);
        const confirmed = instReservations.filter(r => r.status === 'confirmed');
        const waitlisted = instReservations.filter(r => r.status === 'waitlisted');
        return {
          ...instance, lessonSlot: slot, coach, court, reservations: instReservations,
          currentBookings: confirmed.length, waitlistCount: waitlisted.length,
          availableSpots: Math.max(0, instance.maxCapacity - confirmed.length),
        };
      })
      .filter((i): i is LessonInstanceWithDetails => i !== null)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const recentReservations: ReservationWithDetails[] = reservations
      .sort((a, b) => b.reservedAt.localeCompare(a.reservedAt))
      .slice(0, 10)
      .map(r => {
        const instance = this.instanceRepo.getById(r.lessonInstanceId);
        if (!instance) return null;
        const slot = this.slotRepo.getById(instance.lessonSlotId);
        const member = this.memberRepo.getById(r.memberId);
        const coach = this.coachRepo.getById(instance.coachId);
        const court = this.courtRepo.getById(instance.courtId);
        if (!slot || !member || !coach || !court) return null;
        return { ...r, member, lessonInstance: instance, lessonSlot: slot, coach, court };
      })
      .filter((r): r is ReservationWithDetails => r !== null);

    const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const count = reservations.filter(r => {
        const inst = instances.find(inst => inst.id === r.lessonInstanceId);
        return inst?.date === date && r.status === 'confirmed';
      }).length;
      return { date, count };
    });

    return {
      todayLessonCount: todayInstances.length,
      totalMembers: members.filter(m => m.isActive).length,
      totalCoaches: coaches.filter(c => c.isActive).length,
      todayReservationCount: todayReservations.length,
      reservationRate,
      upcomingLessonsToday,
      recentReservations,
      weeklyTrend,
    };
  }
}
