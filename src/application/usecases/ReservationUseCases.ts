import {
  Reservation,
  ReservationWithDetails,
} from '@/domain/models';
import {
  IReservationRepository,
  ILessonInstanceRepository,
  ILessonSlotRepository,
  IMemberRepository,
  ICoachRepository,
  ICourtRepository,
} from '@/domain/repositories';

export class ReservationUseCases {
  constructor(
    private reservationRepo: IReservationRepository,
    private instanceRepo: ILessonInstanceRepository,
    private slotRepo: ILessonSlotRepository,
    private memberRepo: IMemberRepository,
    private coachRepo: ICoachRepository,
    private courtRepo: ICourtRepository,
  ) {}

  getAll(): Reservation[] {
    return this.reservationRepo.getAll();
  }

  makeReservation(memberId: string, lessonInstanceId: string): Reservation {
    const instance = this.instanceRepo.getById(lessonInstanceId);
    if (!instance) throw new Error('レッスンが見つかりません');

    const existingReservations = this.reservationRepo.getActiveByInstanceId(lessonInstanceId);

    const alreadyReserved = existingReservations.find(r => r.memberId === memberId);
    if (alreadyReserved) throw new Error('既に予約済みです');

    const confirmedCount = existingReservations.filter(r => r.status === 'confirmed').length;
    const isWaitlisted = confirmedCount >= instance.maxCapacity;
    const waitlistPosition = isWaitlisted
      ? existingReservations.filter(r => r.status === 'waitlisted').length + 1
      : null;

    return this.reservationRepo.create({
      memberId,
      lessonInstanceId,
      status: isWaitlisted ? 'waitlisted' : 'confirmed',
      reservedAt: new Date().toISOString(),
      cancelledAt: null,
      transferFromInstanceId: null,
      transferToInstanceId: null,
      waitlistPosition,
      notes: '',
    });
  }

  cancelReservation(reservationId: string): void {
    const reservation = this.reservationRepo.getById(reservationId);
    if (!reservation) return;

    this.reservationRepo.update(reservationId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    });

    // Promote first waitlisted
    if (reservation.status === 'confirmed') {
      const waitlisted = this.reservationRepo.getByInstanceId(reservation.lessonInstanceId)
        .filter(r => r.status === 'waitlisted')
        .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));

      if (waitlisted.length > 0) {
        this.reservationRepo.update(waitlisted[0].id, {
          status: 'confirmed',
          waitlistPosition: null,
        });
      }
    }
  }

  transferReservation(memberId: string, fromInstanceId: string, toInstanceId: string): Reservation {
    // Read fresh data to avoid stale state
    const allReservations = this.reservationRepo.getAll();
    const original = allReservations.find(r =>
      r.memberId === memberId && r.lessonInstanceId === fromInstanceId &&
      (r.status === 'confirmed' || r.status === 'cancelled')
    );
    if (original) {
      this.reservationRepo.update(original.id, {
        status: 'transferred',
        transferToInstanceId: toInstanceId,
      });
    }

    const newReservation = this.reservationRepo.create({
      memberId,
      lessonInstanceId: toInstanceId,
      status: 'confirmed',
      reservedAt: new Date().toISOString(),
      cancelledAt: null,
      transferFromInstanceId: fromInstanceId,
      transferToInstanceId: null,
      waitlistPosition: null,
      notes: '振替予約',
    });

    // Decrement remaining transfers
    const member = this.memberRepo.getById(memberId);
    if (member && member.remainingTransfers > 0) {
      this.memberRepo.update(memberId, {
        remainingTransfers: member.remainingTransfers - 1,
      });
    }

    return newReservation;
  }

  getMemberReservations(memberId: string, reservations: Reservation[]): ReservationWithDetails[] {
    return reservations
      .filter(r => r.memberId === memberId)
      .map(r => this.enrichReservation(r))
      .filter((r): r is ReservationWithDetails => r !== null)
      .sort((a, b) => b.lessonInstance.date.localeCompare(a.lessonInstance.date));
  }

  getForInstance(instanceId: string, reservations: Reservation[]): Reservation[] {
    return reservations.filter(r => r.lessonInstanceId === instanceId && (r.status === 'confirmed' || r.status === 'waitlisted'));
  }

  getAllWithDetails(reservations: Reservation[]): ReservationWithDetails[] {
    return reservations
      .map(r => this.enrichReservation(r))
      .filter((r): r is ReservationWithDetails => r !== null)
      .sort((a, b) => b.reservedAt.localeCompare(a.reservedAt));
  }

  private enrichReservation(r: Reservation): ReservationWithDetails | null {
    const instance = this.instanceRepo.getById(r.lessonInstanceId);
    if (!instance) return null;
    const slot = this.slotRepo.getById(instance.lessonSlotId);
    const member = this.memberRepo.getById(r.memberId);
    const coach = this.coachRepo.getById(instance.coachId);
    const court = this.courtRepo.getById(instance.courtId);
    if (!slot || !member || !coach || !court) return null;
    return { ...r, member, lessonInstance: instance, lessonSlot: slot, coach, court };
  }
}
