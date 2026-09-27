import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import {
  eachDayOfInterval,
  getDay,
  differenceInWeeks,
  getDate,
  format,
  addWeeks,
  startOfWeek,
  parseISO,
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

interface SlotData {
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'junior';
  coachId: string;
  courtId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isRecurring: boolean;
  recurrenceType: 'weekly' | 'none' | 'biweekly' | 'monthly';
  recurrenceStartDate: string;
  recurrenceEndDate: string | null;
  specificDate: string | null;
  monthlyWeekNumber: number | null;
  isActive: boolean;
}

interface InstanceData {
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
}

interface ReservationData {
  id: string;
  memberId: string;
  lessonInstanceId: string;
  status: 'confirmed' | 'cancelled' | 'waitlisted' | 'transferred';
  reservedAt: Date;
  cancelledAt: Date | null;
  transferFromInstanceId: string | null;
  transferToInstanceId: string | null;
  waitlistPosition: number | null;
  notes: string;
}

async function seed() {
  console.log('Seeding database...');

  // Delete existing data in reverse FK order
  await db.delete(schema.lessonRecords);
  await db.delete(schema.reservations);
  await db.delete(schema.lessonInstances);
  await db.delete(schema.lessonSlots);
  await db.delete(schema.members);
  await db.delete(schema.coaches);
  await db.delete(schema.courts);

  // ── Courts ──
  const courtData = [
    { id: uuidv4(), name: 'Aコート', type: 'indoor' as const, surface: 'hard' as const, capacity: 8, isActive: true },
    { id: uuidv4(), name: 'Bコート', type: 'indoor' as const, surface: 'carpet' as const, capacity: 8, isActive: true },
    { id: uuidv4(), name: 'Cコート', type: 'outdoor' as const, surface: 'omni' as const, capacity: 10, isActive: true },
    { id: uuidv4(), name: 'Dコート', type: 'outdoor' as const, surface: 'omni' as const, capacity: 10, isActive: true },
  ];
  await db.insert(schema.courts).values(courtData);
  const courtIds = courtData.map(c => c.id);
  console.log(`  Inserted ${courtData.length} courts`);

  // ── Coaches ──
  const coachData = [
    {
      id: uuidv4(), name: '田中 太郎', nameKana: 'タナカ タロウ',
      email: 'tanaka@tennis.jp', phone: '090-1111-1111',
      specialties: ['beginner', 'intermediate'], bio: 'テニス歴20年。初心者から中級者まで丁寧に指導します。',
      certifications: ['JTA公認コーチ'], avatarColor: '#3B82F6', isActive: true,
    },
    {
      id: uuidv4(), name: '佐藤 花子', nameKana: 'サトウ ハナコ',
      email: 'sato@tennis.jp', phone: '090-2222-2222',
      specialties: ['intermediate', 'advanced'], bio: '元プロ選手。試合で勝てるテニスを教えます。',
      certifications: ['JTA公認コーチ', '元WTAランカー'], avatarColor: '#EC4899', isActive: true,
    },
    {
      id: uuidv4(), name: '鈴木 一郎', nameKana: 'スズキ イチロウ',
      email: 'suzuki@tennis.jp', phone: '090-3333-3333',
      specialties: ['beginner', 'junior'], bio: 'ジュニア育成のスペシャリスト。楽しく上達を目指します。',
      certifications: ['JTA公認コーチ', 'ジュニア指導員'], avatarColor: '#22C55E', isActive: true,
    },
    {
      id: uuidv4(), name: '高橋 優子', nameKana: 'タカハシ ユウコ',
      email: 'takahashi@tennis.jp', phone: '090-4444-4444',
      specialties: ['advanced'], bio: '戦術的なテニスを重視。上級者のレベルアップをサポートします。',
      certifications: ['JTA公認S級コーチ'], avatarColor: '#A855F7', isActive: true,
    },
    {
      id: uuidv4(), name: '山本 健太', nameKana: 'ヤマモト ケンタ',
      email: 'yamamoto@tennis.jp', phone: '090-5555-5555',
      specialties: ['beginner', 'intermediate', 'junior'], bio: 'オールラウンドに指導可能。生徒に合わせた指導を心がけます。',
      certifications: ['JTA公認コーチ'], avatarColor: '#F97316', isActive: true,
    },
  ];
  await db.insert(schema.coaches).values(coachData);
  const coachIds = coachData.map(c => c.id);
  console.log(`  Inserted ${coachData.length} coaches`);

  // ── Members ──
  const colors = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#F43F5E'];
  const names = [
    { name: '山田 太一', kana: 'ヤマダ タイチ', level: 'beginner' as const, type: 'regular' as const },
    { name: '中村 美咲', kana: 'ナカムラ ミサキ', level: 'intermediate' as const, type: 'regular' as const },
    { name: '小林 健', kana: 'コバヤシ ケン', level: 'advanced' as const, type: 'regular' as const },
    { name: '加藤 さくら', kana: 'カトウ サクラ', level: 'beginner' as const, type: 'student' as const },
    { name: '伊藤 大輔', kana: 'イトウ ダイスケ', level: 'intermediate' as const, type: 'regular' as const },
    { name: '渡辺 由美', kana: 'ワタナベ ユミ', level: 'beginner' as const, type: 'senior' as const },
    { name: '松本 翔太', kana: 'マツモト ショウタ', level: 'junior' as const, type: 'student' as const },
    { name: '井上 恵子', kana: 'イノウエ ケイコ', level: 'intermediate' as const, type: 'regular' as const },
    { name: '木村 隆', kana: 'キムラ タカシ', level: 'advanced' as const, type: 'regular' as const },
    { name: '林 優花', kana: 'ハヤシ ユウカ', level: 'junior' as const, type: 'family' as const },
    { name: '斉藤 正人', kana: 'サイトウ マサト', level: 'beginner' as const, type: 'trial' as const },
    { name: '藤田 あゆみ', kana: 'フジタ アユミ', level: 'intermediate' as const, type: 'regular' as const },
    { name: '岡田 光一', kana: 'オカダ コウイチ', level: 'beginner' as const, type: 'senior' as const },
    { name: '長谷川 理恵', kana: 'ハセガワ リエ', level: 'advanced' as const, type: 'regular' as const },
    { name: '村田 翼', kana: 'ムラタ ツバサ', level: 'junior' as const, type: 'student' as const },
    { name: '近藤 悠太', kana: 'コンドウ ユウタ', level: 'intermediate' as const, type: 'regular' as const },
    { name: '石井 真由', kana: 'イシイ マユ', level: 'beginner' as const, type: 'family' as const },
    { name: '前田 剛', kana: 'マエダ ツヨシ', level: 'advanced' as const, type: 'regular' as const },
    { name: '小川 愛', kana: 'オガワ アイ', level: 'intermediate' as const, type: 'student' as const },
    { name: '後藤 慎一', kana: 'ゴトウ シンイチ', level: 'beginner' as const, type: 'regular' as const },
  ];

  const memberData = names.map((n, i) => ({
    id: uuidv4(),
    name: n.name,
    nameKana: n.kana,
    email: i === 0 ? 'member@tennis.jp' : `member${i + 1}@example.com`,
    phone: `090-${String(1000 + i).padStart(4, '0')}-${String(1000 + i).padStart(4, '0')}`,
    level: n.level,
    membershipType: n.type,
    joinDate: '2024-04-01',
    isActive: true,
    notes: '',
    password: i === 0 ? 'member' : 'password',
    avatarColor: colors[i % colors.length],
    remainingTransfers: 3,
  }));
  await db.insert(schema.members).values(memberData);
  const demoMemberId = memberData[0].id;
  console.log(`  Inserted ${memberData.length} members (demo: ${memberData[0].email})`);

  // ── Lesson Slots ──
  const slotDefs: Omit<SlotData, 'id'>[] = [
    { title: '初級クラスA', level: 'beginner', coachId: coachIds[0], courtId: courtIds[0], dayOfWeek: 1, startTime: '10:00', endTime: '11:30', maxCapacity: 8, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { title: '中級クラスA', level: 'intermediate', coachId: coachIds[0], courtId: courtIds[1], dayOfWeek: 1, startTime: '13:00', endTime: '14:30', maxCapacity: 8, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { title: '上級クラスA', level: 'advanced', coachId: coachIds[1], courtId: courtIds[0], dayOfWeek: 2, startTime: '10:00', endTime: '11:30', maxCapacity: 6, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { title: 'ジュニアクラスA', level: 'junior', coachId: coachIds[2], courtId: courtIds[2], dayOfWeek: 2, startTime: '16:00', endTime: '17:30', maxCapacity: 10, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { title: '初級クラスB', level: 'beginner', coachId: coachIds[4], courtId: courtIds[2], dayOfWeek: 3, startTime: '10:00', endTime: '11:30', maxCapacity: 10, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { title: '中級クラスB', level: 'intermediate', coachId: coachIds[1], courtId: courtIds[0], dayOfWeek: 3, startTime: '13:00', endTime: '14:30', maxCapacity: 8, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { title: '上級クラスB', level: 'advanced', coachId: coachIds[3], courtId: courtIds[1], dayOfWeek: 4, startTime: '10:00', endTime: '11:30', maxCapacity: 6, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { title: 'ジュニアクラスB', level: 'junior', coachId: coachIds[4], courtId: courtIds[3], dayOfWeek: 4, startTime: '16:00', endTime: '17:30', maxCapacity: 10, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { title: '初級クラスC', level: 'beginner', coachId: coachIds[2], courtId: courtIds[3], dayOfWeek: 5, startTime: '10:00', endTime: '11:30', maxCapacity: 10, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { title: '中級クラスC', level: 'intermediate', coachId: coachIds[0], courtId: courtIds[0], dayOfWeek: 5, startTime: '19:00', endTime: '20:30', maxCapacity: 8, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { title: '初級 週末クラス', level: 'beginner', coachId: coachIds[4], courtId: courtIds[2], dayOfWeek: 6, startTime: '09:00', endTime: '10:30', maxCapacity: 10, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { title: '上級 週末クラス', level: 'advanced', coachId: coachIds[3], courtId: courtIds[0], dayOfWeek: 6, startTime: '11:00', endTime: '12:30', maxCapacity: 6, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
  ];

  const slotData: SlotData[] = slotDefs.map(s => ({ ...s, id: uuidv4() }));
  await db.insert(schema.lessonSlots).values(slotData);
  console.log(`  Inserted ${slotData.length} lesson slots`);

  // ── Generate Instances ──
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const fromDate = addWeeks(thisWeekStart, -3);
  const toDate = addWeeks(thisWeekStart, 3);

  const instanceDataList: InstanceData[] = [];
  for (const slot of slotData) {
    if (!slot.isActive) continue;
    if (slot.recurrenceType === 'none') {
      if (slot.specificDate) {
        const specificDate = parseISO(slot.specificDate);
        if (specificDate >= fromDate && specificDate <= toDate) {
          instanceDataList.push({
            id: uuidv4(), lessonSlotId: slot.id, date: slot.specificDate,
            coachId: slot.coachId, courtId: slot.courtId, startTime: slot.startTime,
            endTime: slot.endTime, maxCapacity: slot.maxCapacity,
            isCancelled: false, cancelReason: '', notes: '',
          });
        }
      }
      continue;
    }
    const days = eachDayOfInterval({ start: fromDate, end: toDate });
    for (const day of days) {
      if (getDay(day) !== slot.dayOfWeek) continue;
      if (slot.recurrenceType === 'biweekly') {
        const startDate = parseISO(slot.recurrenceStartDate);
        const weeksDiff = differenceInWeeks(day, startDate);
        if (weeksDiff % 2 !== 0) continue;
      }
      if (slot.recurrenceType === 'monthly' && slot.monthlyWeekNumber != null) {
        const weekOfMonth = Math.ceil(getDate(day) / 7);
        if (weekOfMonth !== slot.monthlyWeekNumber) continue;
      }
      instanceDataList.push({
        id: uuidv4(), lessonSlotId: slot.id, date: format(day, 'yyyy-MM-dd'),
        coachId: slot.coachId, courtId: slot.courtId, startTime: slot.startTime,
        endTime: slot.endTime, maxCapacity: slot.maxCapacity,
        isCancelled: false, cancelReason: '', notes: '',
      });
    }
  }

  // Insert instances in batches
  for (let i = 0; i < instanceDataList.length; i += 50) {
    await db.insert(schema.lessonInstances).values(instanceDataList.slice(i, i + 50));
  }
  console.log(`  Inserted ${instanceDataList.length} lesson instances`);

  // ── Reservations ──
  const levelMembers: Record<string, typeof memberData> = {
    beginner: memberData.filter(m => m.level === 'beginner'),
    intermediate: memberData.filter(m => m.level === 'intermediate'),
    advanced: memberData.filter(m => m.level === 'advanced'),
    junior: memberData.filter(m => m.level === 'junior'),
  };

  const sorted = [...instanceDataList].sort((a, b) =>
    a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
  );

  const reservationDataList: ReservationData[] = [];
  const nowDate = new Date();

  for (const instance of sorted.slice(0, 60)) {
    const slot = slotData.find(s => s.id === instance.lessonSlotId);
    if (!slot) continue;

    const eligible = [...(levelMembers[slot.level] || [])].sort(() => Math.random() - 0.5);
    const count = Math.min(Math.floor(Math.random() * 4) + 2, eligible.length);

    for (let i = 0; i < count; i++) {
      reservationDataList.push({
        id: uuidv4(),
        memberId: eligible[i].id,
        lessonInstanceId: instance.id,
        status: 'confirmed',
        reservedAt: nowDate,
        cancelledAt: null,
        transferFromInstanceId: null,
        transferToInstanceId: null,
        waitlistPosition: null,
        notes: '',
      });
    }
  }

  // Demo data for transfer testing
  const today = format(now, 'yyyy-MM-dd');
  const beginnerSlotIds = new Set(slotData.filter(s => s.level === 'beginner').map(s => s.id));
  const futureBeginnerInstances = instanceDataList
    .filter(i => i.date > today && beginnerSlotIds.has(i.lessonSlotId) && !i.isCancelled)
    .sort((a, b) => a.date.localeCompare(b.date));

  const demoInstanceIds = new Set(
    reservationDataList.filter(r => r.memberId === demoMemberId).map(r => r.lessonInstanceId)
  );

  let guaranteedCount = 0;
  for (const inst of futureBeginnerInstances) {
    if (guaranteedCount >= 6) break;
    if (demoInstanceIds.has(inst.id)) {
      guaranteedCount++;
      continue;
    }
    reservationDataList.push({
      id: uuidv4(),
      memberId: demoMemberId,
      lessonInstanceId: inst.id,
      status: 'confirmed',
      reservedAt: nowDate,
      cancelledAt: null,
      transferFromInstanceId: null,
      transferToInstanceId: null,
      waitlistPosition: null,
      notes: '',
    });
    demoInstanceIds.add(inst.id);
    guaranteedCount++;
  }

  const demoFutureRes = reservationDataList.filter(r =>
    r.memberId === demoMemberId &&
    r.status === 'confirmed' &&
    futureBeginnerInstances.some(i => i.id === r.lessonInstanceId)
  );

  // Mark 2 as member-cancelled
  for (let i = 0; i < 2 && i < demoFutureRes.length; i++) {
    demoFutureRes[i].status = 'cancelled';
    demoFutureRes[i].cancelledAt = nowDate;
  }

  // Mark 1 instance as admin-cancelled
  if (demoFutureRes.length > 2) {
    const targetInstance = instanceDataList.find(i => i.id === demoFutureRes[2].lessonInstanceId);
    if (targetInstance) {
      targetInstance.isCancelled = true;
      targetInstance.cancelReason = '悪天候のため中止';
    }
  }

  // Update instances that were mutated
  // (Since we haven't inserted reservations yet, and instances were already inserted,
  // we need to update the cancelled instance)
  for (const inst of instanceDataList) {
    if (inst.isCancelled) {
      const { eq } = await import('drizzle-orm');
      await db.update(schema.lessonInstances)
        .set({ isCancelled: true, cancelReason: inst.cancelReason })
        .where(eq(schema.lessonInstances.id, inst.id));
    }
  }

  // Insert reservations in batches
  for (let i = 0; i < reservationDataList.length; i += 50) {
    await db.insert(schema.reservations).values(reservationDataList.slice(i, i + 50));
  }
  console.log(`  Inserted ${reservationDataList.length} reservations`);

  // ── Lesson Records ──
  const themes = [
    'フォアハンドストローク基礎', 'バックハンドストローク強化', 'サーブ＆リターン練習',
    'ボレー＆ネットプレー', 'フットワークトレーニング', 'ダブルス戦術', 'シングルス戦術',
    'ラリー安定性向上', 'スピンコントロール', 'スライスショット習得', 'アプローチショット練習',
    'ロブ＆スマッシュ', 'ドロップショット練習', 'ポジショニング改善', 'メンタルトレーニング',
  ];

  const contents = [
    'ウォームアップ後、基本フォームの確認。球出しドリルで反復練習。最後にラリーで実践。',
    'クロスラリーを中心にコースの打ち分けを練習。試合形式のポイント練習も実施。',
    '1球目のリターンに重点を置き、サーブの種類に応じた対応を練習。',
    'ネットダッシュからのボレー練習。ロー・ハイボレーの打ち分け。',
    '基礎的なステップの確認後、実戦的なフットワークドリルを実施。',
    'ペアでのポジショニングを確認し、ポーチの判断基準を練習。',
    'サービスゲームの組み立て方を中心に戦術練習。',
    '長いラリーを続けることを目標に、深いボールのコントロールを練習。',
    'トップスピンの回転量を意識したドリル。高い打点での処理も練習。',
    'バックハンドスライスの安定性向上。低いボールの処理を反復練習。',
    'ベースラインからネットへの移行を滑らかに行う練習。',
    'ロブの高さと距離のコントロール。オーバーヘッドスマッシュの確実性向上。',
    'ネット際のタッチ感覚を養う練習。ドロップショットのタイミングと角度。',
    'コート内のポジション取りを意識したシチュエーション練習。',
    'プレッシャー下でのショット選択を意識したポイント練習。',
  ];

  const goodPointsList = [
    'フォームが安定してきている', 'ボールへの入り方が良い', 'コースの打ち分けができている',
    'フットワークが改善されている', 'リラックスして打てている', 'サーブの確率が上がっている',
    'ネットプレーの判断が良い', 'ラリーの安定感がある', '積極的にボールを追えている',
    '試合での集中力が高い',
  ];

  const improvementPointsList = [
    'バックハンドの安定性を高めたい', 'もう少し早い準備を心がけたい',
    'サーブのトスの位置を安定させたい', 'ネット際での判断力を向上させたい',
    'フットワークをもう少し軽くしたい', 'ボールの深さのコントロールを改善したい',
    '試合中のメンタル面を強化したい', 'スライスの精度を上げたい',
    'リターンの確率を上げたい', '体の回転を使ったスイングを意識したい',
  ];

  const instanceResMap = new Map<string, ReservationData[]>();
  for (const r of reservationDataList) {
    if (r.status !== 'confirmed') continue;
    const list = instanceResMap.get(r.lessonInstanceId) || [];
    list.push(r);
    instanceResMap.set(r.lessonInstanceId, list);
  }

  const instanceMap = new Map<string, InstanceData>();
  for (const inst of instanceDataList) {
    instanceMap.set(inst.id, inst);
  }

  const pastInstanceIds = [...instanceResMap.keys()]
    .filter(id => {
      const inst = instanceMap.get(id);
      return inst && inst.date < today;
    })
    .sort((a, b) => {
      const instA = instanceMap.get(a)!;
      const instB = instanceMap.get(b)!;
      return instA.date.localeCompare(instB.date) || instA.startTime.localeCompare(instB.startTime);
    });

  const recordDataList = [];
  const attendanceOptions = ['present', 'present', 'present', 'present', 'late', 'absent'] as const;

  for (let i = 0; i < pastInstanceIds.length; i++) {
    const instanceId = pastInstanceIds[i];
    const instanceReservations = instanceResMap.get(instanceId)!;

    const memberNotes = instanceReservations.map(r => {
      const attendance = attendanceOptions[Math.floor(Math.random() * attendanceOptions.length)];
      const rating = attendance === 'absent' ? 3 : Math.floor(Math.random() * 3) + 3;
      return {
        memberId: r.memberId,
        attendance,
        performanceRating: rating,
        goodPoints: attendance !== 'absent' ? goodPointsList[Math.floor(Math.random() * goodPointsList.length)] : '',
        improvementPoints: attendance !== 'absent' ? improvementPointsList[Math.floor(Math.random() * improvementPointsList.length)] : '',
        memo: '',
      };
    });

    recordDataList.push({
      lessonInstanceId: instanceId,
      theme: themes[i % themes.length],
      content: contents[i % contents.length],
      memberNotes,
    });
  }

  for (let i = 0; i < recordDataList.length; i += 50) {
    await db.insert(schema.lessonRecords).values(recordDataList.slice(i, i + 50));
  }
  console.log(`  Inserted ${recordDataList.length} lesson records`);

  console.log('Seeding complete!');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
