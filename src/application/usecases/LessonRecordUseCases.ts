import {
  LessonRecord,
  LessonRecordWithDetails,
  MemberLessonHistoryEntry,
  Reservation,
} from '@/domain/models';
import {
  ILessonRecordRepository,
  ILessonInstanceRepository,
  ILessonSlotRepository,
  ICoachRepository,
  ICourtRepository,
  IReservationRepository,
} from '@/domain/repositories';

export class LessonRecordUseCases {
  constructor(
    private recordRepo: ILessonRecordRepository,
    private instanceRepo: ILessonInstanceRepository,
    private slotRepo: ILessonSlotRepository,
    private coachRepo: ICoachRepository,
    private courtRepo: ICourtRepository,
    private reservationRepo: IReservationRepository,
  ) {}

  getAll(): LessonRecord[] {
    return this.recordRepo.getAll();
  }

  getForInstance(instanceId: string): LessonRecord | null {
    return this.recordRepo.getByInstanceId(instanceId);
  }

  create(data: Omit<LessonRecord, 'id' | 'createdAt' | 'updatedAt'>, existingRecords: LessonRecord[]): LessonRecord {
    const existing = existingRecords.find(r => r.lessonInstanceId === data.lessonInstanceId);
    if (existing) throw new Error('このレッスンの記録は既に存在します');
    return this.recordRepo.create(data);
  }

  update(id: string, data: Partial<LessonRecord>): LessonRecord | null {
    return this.recordRepo.update(id, data);
  }

  getWithDetails(id: string, records: LessonRecord[]): LessonRecordWithDetails | null {
    const record = records.find(r => r.id === id);
    if (!record) return null;

    const instance = this.instanceRepo.getById(record.lessonInstanceId);
    if (!instance) return null;

    const slot = this.slotRepo.getById(instance.lessonSlotId);
    const coach = this.coachRepo.getById(instance.coachId);
    const court = this.courtRepo.getById(instance.courtId);
    if (!slot || !coach || !court) return null;

    return { ...record, lessonInstance: instance, lessonSlot: slot, coach, court };
  }

  getMemberHistory(memberId: string, records: LessonRecord[]): MemberLessonHistoryEntry[] {
    const entries: MemberLessonHistoryEntry[] = [];

    for (const record of records) {
      const memberNote = record.memberNotes.find(n => n.memberId === memberId);
      if (!memberNote) continue;

      const instance = this.instanceRepo.getById(record.lessonInstanceId);
      if (!instance) continue;

      const slot = this.slotRepo.getById(instance.lessonSlotId);
      const coach = this.coachRepo.getById(instance.coachId);
      const court = this.courtRepo.getById(instance.courtId);
      if (!slot || !coach || !court) continue;

      entries.push({ record, lessonInstance: instance, lessonSlot: slot, coach, court, memberNote });
    }

    return entries.sort((a, b) => b.lessonInstance.date.localeCompare(a.lessonInstance.date));
  }

  getReservationsForInstance(instanceId: string): Reservation[] {
    return this.reservationRepo.getActiveByInstanceId(instanceId);
  }
}
