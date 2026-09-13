import { Member, MemberLessonHistoryEntry, MemberKarteSummary } from '@/domain/models';
import { generateMockKarteSummary } from '@/lib/karte-generator';

export class MemberKarteUseCases {
  async generate(member: Member, history: MemberLessonHistoryEntry[]): Promise<MemberKarteSummary> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return generateMockKarteSummary(member, history);
  }
}
