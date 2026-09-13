import { LocalStorageMemberRepository } from './LocalStorageMemberRepository';
import { LocalStorageCoachRepository } from './LocalStorageCoachRepository';
import { LocalStorageCourtRepository } from './LocalStorageCourtRepository';
import { LocalStorageLessonSlotRepository } from './LocalStorageLessonSlotRepository';
import { LocalStorageLessonInstanceRepository } from './LocalStorageLessonInstanceRepository';
import { LocalStorageReservationRepository } from './LocalStorageReservationRepository';
import { LocalStorageLessonRecordRepository } from './LocalStorageLessonRecordRepository';
import { LocalStorageAuthRepository } from './LocalStorageAuthRepository';

export const memberRepository = new LocalStorageMemberRepository();
export const coachRepository = new LocalStorageCoachRepository();
export const courtRepository = new LocalStorageCourtRepository();
export const lessonSlotRepository = new LocalStorageLessonSlotRepository();
export const lessonInstanceRepository = new LocalStorageLessonInstanceRepository();
export const reservationRepository = new LocalStorageReservationRepository();
export const lessonRecordRepository = new LocalStorageLessonRecordRepository();
export const authRepository = new LocalStorageAuthRepository();
