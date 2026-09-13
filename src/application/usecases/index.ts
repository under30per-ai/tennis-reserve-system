import {
  memberRepository,
  coachRepository,
  courtRepository,
  lessonSlotRepository,
  lessonInstanceRepository,
  reservationRepository,
  lessonRecordRepository,
  authRepository,
} from '@/infrastructure/repositories';

import { CourtUseCases } from './CourtUseCases';
import { CoachUseCases } from './CoachUseCases';
import { LessonSlotUseCases } from './LessonSlotUseCases';
import { MemberUseCases } from './MemberUseCases';
import { LessonInstanceUseCases } from './LessonInstanceUseCases';
import { LessonRecordUseCases } from './LessonRecordUseCases';
import { ReservationUseCases } from './ReservationUseCases';
import { DashboardUseCases } from './DashboardUseCases';
import { MemberKarteUseCases } from './MemberKarteUseCases';
import { AuthUseCases } from './AuthUseCases';

export const courtUseCases = new CourtUseCases(courtRepository);
export const coachUseCases = new CoachUseCases(coachRepository);
export const lessonSlotUseCases = new LessonSlotUseCases(lessonSlotRepository);
export const memberUseCases = new MemberUseCases(memberRepository);
export const lessonInstanceUseCases = new LessonInstanceUseCases(
  lessonInstanceRepository, lessonSlotRepository, coachRepository, courtRepository, reservationRepository,
);
export const lessonRecordUseCases = new LessonRecordUseCases(
  lessonRecordRepository, lessonInstanceRepository, lessonSlotRepository, coachRepository, courtRepository, reservationRepository,
);
export const reservationUseCases = new ReservationUseCases(
  reservationRepository, lessonInstanceRepository, lessonSlotRepository, memberRepository, coachRepository, courtRepository,
);
export const dashboardUseCases = new DashboardUseCases(
  lessonInstanceRepository, reservationRepository, memberRepository, coachRepository, lessonSlotRepository, courtRepository,
);
export const memberKarteUseCases = new MemberKarteUseCases();
export const authUseCases = new AuthUseCases(authRepository, memberRepository);
