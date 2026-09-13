import { LessonInstance, LessonInstanceWithDetails } from '@/domain/models';
import { ILessonInstanceRepository, ILessonSlotRepository, ICoachRepository, ICourtRepository, IReservationRepository } from '@/domain/repositories';

export class LessonInstanceUseCases {
  constructor(
    private instanceRepo: ILessonInstanceRepository,
    private slotRepo: ILessonSlotRepository,
    private coachRepo: ICoachRepository,
    private courtRepo: ICourtRepository,
    private reservationRepo: IReservationRepository,
  ) {}

  getAll(): LessonInstance[] {
    return this.instanceRepo.getAll();
  }

  getById(id: string): LessonInstance | null {
    return this.instanceRepo.getById(id);
  }

  getByDate(date: string): LessonInstance[] {
    return this.instanceRepo.getByDate(date);
  }

  getByDateRange(from: string, to: string): LessonInstance[] {
    return this.instanceRepo.getByDateRange(from, to);
  }

  getWithDetails(instanceId: string): LessonInstanceWithDetails | null {
    const instance = this.instanceRepo.getById(instanceId);
    if (!instance) return null;

    const slot = this.slotRepo.getById(instance.lessonSlotId);
    const coach = this.coachRepo.getById(instance.coachId);
    const court = this.courtRepo.getById(instance.courtId);
    if (!slot || !coach || !court) return null;

    const reservations = this.reservationRepo.getByInstanceId(instanceId);
    const confirmed = reservations.filter(r => r.status === 'confirmed');
    const waitlisted = reservations.filter(r => r.status === 'waitlisted');

    return {
      ...instance,
      lessonSlot: slot,
      coach,
      court,
      reservations,
      currentBookings: confirmed.length,
      waitlistCount: waitlisted.length,
      availableSpots: Math.max(0, instance.maxCapacity - confirmed.length),
    };
  }

  getWithDetailsForDate(date: string, allInstances: LessonInstance[], includeCancelled = false): LessonInstanceWithDetails[] {
    return allInstances
      .filter(i => i.date === date && (includeCancelled || !i.isCancelled))
      .map(i => this.getWithDetails(i.id))
      .filter((i): i is LessonInstanceWithDetails => i !== null)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  cancel(id: string, reason: string): void {
    this.instanceRepo.update(id, { isCancelled: true, cancelReason: reason } as Partial<LessonInstance>);
  }
}
