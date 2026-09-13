import { Member, Coach, Court, LessonSlot, LessonInstance, Reservation, LessonRecord, MemberLessonNote, AttendanceStatus, DayOfWeek } from '@/types';
import { STORAGE_KEYS, getItem, setItem, setAll } from './storage';
import { generateAllInstances } from './calendar-utils';
import { addWeeks, startOfWeek, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const SEED_VERSION = '4'; // Bump this to force re-seed on next load

export function seedDataIfNeeded(): void {
  if (typeof window === 'undefined') return;
  if (getItem(STORAGE_KEYS.IS_SEEDED) === SEED_VERSION) return;

  // Clear old data before re-seeding
  Object.values(STORAGE_KEYS).forEach(key => {
    if (key !== 'tennis_auth_user') localStorage.removeItem(key);
  });

  const courts = createCourts();
  const coaches = createCoaches();
  const members = createMembers();
  const lessonSlots = createLessonSlots(coaches, courts);

  setAll(STORAGE_KEYS.COURTS, courts);
  setAll(STORAGE_KEYS.COACHES, coaches);
  setAll(STORAGE_KEYS.MEMBERS, members);
  setAll(STORAGE_KEYS.LESSON_SLOTS, lessonSlots);

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const from = addWeeks(thisWeekStart, -3); // 3 weeks ago
  const to = addWeeks(thisWeekStart, 3);    // 3 weeks ahead
  const instances = generateAllInstances(lessonSlots, from, to);

  const reservations = createReservations(members, instances, lessonSlots);

  const today = format(now, 'yyyy-MM-dd');

  // Post-process: add cancelled reservations and cancelled lesson instances for demo
  addCancelledDataForDemo(instances, reservations, lessonSlots, members, today);

  setAll(STORAGE_KEYS.LESSON_INSTANCES, instances);
  setAll(STORAGE_KEYS.RESERVATIONS, reservations);

  const lessonRecords = createLessonRecords(reservations, instances, today);
  setAll(STORAGE_KEYS.LESSON_RECORDS, lessonRecords);

  setItem(STORAGE_KEYS.IS_SEEDED, SEED_VERSION);
}

function createCourts(): Court[] {
  return [
    { id: 'court-1', name: 'Aコート', type: 'indoor', surface: 'hard', capacity: 8, isActive: true },
    { id: 'court-2', name: 'Bコート', type: 'indoor', surface: 'carpet', capacity: 8, isActive: true },
    { id: 'court-3', name: 'Cコート', type: 'outdoor', surface: 'omni', capacity: 10, isActive: true },
    { id: 'court-4', name: 'Dコート', type: 'outdoor', surface: 'omni', capacity: 10, isActive: true },
  ];
}

function createCoaches(): Coach[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'coach-1', name: '田中 太郎', nameKana: 'タナカ タロウ',
      email: 'tanaka@tennis.jp', phone: '090-1111-1111',
      specialties: ['beginner', 'intermediate'], bio: 'テニス歴20年。初心者から中級者まで丁寧に指導します。',
      certifications: ['JTA公認コーチ'], avatarColor: '#3B82F6', isActive: true,
      createdAt: now, updatedAt: now,
    },
    {
      id: 'coach-2', name: '佐藤 花子', nameKana: 'サトウ ハナコ',
      email: 'sato@tennis.jp', phone: '090-2222-2222',
      specialties: ['intermediate', 'advanced'], bio: '元プロ選手。試合で勝てるテニスを教えます。',
      certifications: ['JTA公認コーチ', '元WTAランカー'], avatarColor: '#EC4899', isActive: true,
      createdAt: now, updatedAt: now,
    },
    {
      id: 'coach-3', name: '鈴木 一郎', nameKana: 'スズキ イチロウ',
      email: 'suzuki@tennis.jp', phone: '090-3333-3333',
      specialties: ['beginner', 'junior'], bio: 'ジュニア育成のスペシャリスト。楽しく上達を目指します。',
      certifications: ['JTA公認コーチ', 'ジュニア指導員'], avatarColor: '#22C55E', isActive: true,
      createdAt: now, updatedAt: now,
    },
    {
      id: 'coach-4', name: '高橋 優子', nameKana: 'タカハシ ユウコ',
      email: 'takahashi@tennis.jp', phone: '090-4444-4444',
      specialties: ['advanced'], bio: '戦術的なテニスを重視。上級者のレベルアップをサポートします。',
      certifications: ['JTA公認S級コーチ'], avatarColor: '#A855F7', isActive: true,
      createdAt: now, updatedAt: now,
    },
    {
      id: 'coach-5', name: '山本 健太', nameKana: 'ヤマモト ケンタ',
      email: 'yamamoto@tennis.jp', phone: '090-5555-5555',
      specialties: ['beginner', 'intermediate', 'junior'], bio: 'オールラウンドに指導可能。生徒に合わせた指導を心がけます。',
      certifications: ['JTA公認コーチ'], avatarColor: '#F97316', isActive: true,
      createdAt: now, updatedAt: now,
    },
  ];
}

function createMembers(): Member[] {
  const now = new Date().toISOString();
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

  const colors = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#F43F5E'];

  return names.map((n, i) => ({
    id: i === 0 ? 'member-demo' : `member-${i + 1}`,
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
    createdAt: now,
    updatedAt: now,
  }));
}

function createLessonSlots(coaches: Coach[], courts: Court[]): LessonSlot[] {
  const now = new Date().toISOString();
  const slots: Omit<LessonSlot, 'createdAt' | 'updatedAt'>[] = [
    { id: 'slot-1', title: '初級クラスA', level: 'beginner', coachId: 'coach-1', courtId: 'court-1', dayOfWeek: 1 as DayOfWeek, startTime: '10:00', endTime: '11:30', maxCapacity: 8, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { id: 'slot-2', title: '中級クラスA', level: 'intermediate', coachId: 'coach-1', courtId: 'court-2', dayOfWeek: 1 as DayOfWeek, startTime: '13:00', endTime: '14:30', maxCapacity: 8, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { id: 'slot-3', title: '上級クラスA', level: 'advanced', coachId: 'coach-2', courtId: 'court-1', dayOfWeek: 2 as DayOfWeek, startTime: '10:00', endTime: '11:30', maxCapacity: 6, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { id: 'slot-4', title: 'ジュニアクラスA', level: 'junior', coachId: 'coach-3', courtId: 'court-3', dayOfWeek: 2 as DayOfWeek, startTime: '16:00', endTime: '17:30', maxCapacity: 10, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { id: 'slot-5', title: '初級クラスB', level: 'beginner', coachId: 'coach-5', courtId: 'court-3', dayOfWeek: 3 as DayOfWeek, startTime: '10:00', endTime: '11:30', maxCapacity: 10, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { id: 'slot-6', title: '中級クラスB', level: 'intermediate', coachId: 'coach-2', courtId: 'court-1', dayOfWeek: 3 as DayOfWeek, startTime: '13:00', endTime: '14:30', maxCapacity: 8, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { id: 'slot-7', title: '上級クラスB', level: 'advanced', coachId: 'coach-4', courtId: 'court-2', dayOfWeek: 4 as DayOfWeek, startTime: '10:00', endTime: '11:30', maxCapacity: 6, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { id: 'slot-8', title: 'ジュニアクラスB', level: 'junior', coachId: 'coach-5', courtId: 'court-4', dayOfWeek: 4 as DayOfWeek, startTime: '16:00', endTime: '17:30', maxCapacity: 10, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { id: 'slot-9', title: '初級クラスC', level: 'beginner', coachId: 'coach-3', courtId: 'court-4', dayOfWeek: 5 as DayOfWeek, startTime: '10:00', endTime: '11:30', maxCapacity: 10, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { id: 'slot-10', title: '中級クラスC', level: 'intermediate', coachId: 'coach-1', courtId: 'court-1', dayOfWeek: 5 as DayOfWeek, startTime: '19:00', endTime: '20:30', maxCapacity: 8, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { id: 'slot-11', title: '初級 週末クラス', level: 'beginner', coachId: 'coach-5', courtId: 'court-3', dayOfWeek: 6 as DayOfWeek, startTime: '09:00', endTime: '10:30', maxCapacity: 10, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
    { id: 'slot-12', title: '上級 週末クラス', level: 'advanced', coachId: 'coach-4', courtId: 'court-1', dayOfWeek: 6 as DayOfWeek, startTime: '11:00', endTime: '12:30', maxCapacity: 6, isRecurring: true, recurrenceType: 'weekly', recurrenceStartDate: '2024-04-01', recurrenceEndDate: null, specificDate: null, monthlyWeekNumber: null, isActive: true },
  ];

  return slots.map(s => ({ ...s, createdAt: now, updatedAt: now }));
}

function createReservations(members: Member[], instances: LessonInstance[], slots: LessonSlot[]): Reservation[] {
  const now = new Date().toISOString();
  const reservations: Reservation[] = [];

  const levelMembers: Record<string, Member[]> = {
    beginner: members.filter(m => m.level === 'beginner'),
    intermediate: members.filter(m => m.level === 'intermediate'),
    advanced: members.filter(m => m.level === 'advanced'),
    junior: members.filter(m => m.level === 'junior'),
  };

  // Sort by date so past instances come first; reserve for up to 60 instances
  const sorted = [...instances].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  for (const instance of sorted.slice(0, 60)) {
    const slot = slots.find(s => s.id === instance.lessonSlotId);
    if (!slot) continue;

    const eligible = [...(levelMembers[slot.level] || [])].sort(() => Math.random() - 0.5);
    const count = Math.min(Math.floor(Math.random() * 4) + 2, eligible.length); // 2-5 members

    for (let i = 0; i < count; i++) {
      reservations.push({
        id: uuidv4(),
        memberId: eligible[i].id,
        lessonInstanceId: instance.id,
        status: 'confirmed',
        reservedAt: now,
        cancelledAt: null,
        transferFromInstanceId: null,
        transferToInstanceId: null,
        waitlistPosition: null,
        notes: '',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return reservations;
}

function createLessonRecords(reservations: Reservation[], instances: LessonInstance[], today: string): LessonRecord[] {
  const now = new Date().toISOString();
  const records: LessonRecord[] = [];

  const themes = [
    'フォアハンドストローク基礎',
    'バックハンドストローク強化',
    'サーブ＆リターン練習',
    'ボレー＆ネットプレー',
    'フットワークトレーニング',
    'ダブルス戦術',
    'シングルス戦術',
    'ラリー安定性向上',
    'スピンコントロール',
    'スライスショット習得',
    'アプローチショット練習',
    'ロブ＆スマッシュ',
    'ドロップショット練習',
    'ポジショニング改善',
    'メンタルトレーニング',
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
    'フォームが安定してきている',
    'ボールへの入り方が良い',
    'コースの打ち分けができている',
    'フットワークが改善されている',
    'リラックスして打てている',
    'サーブの確率が上がっている',
    'ネットプレーの判断が良い',
    'ラリーの安定感がある',
    '積極的にボールを追えている',
    '試合での集中力が高い',
  ];

  const improvementPointsList = [
    'バックハンドの安定性を高めたい',
    'もう少し早い準備を心がけたい',
    'サーブのトスの位置を安定させたい',
    'ネット際での判断力を向上させたい',
    'フットワークをもう少し軽くしたい',
    'ボールの深さのコントロールを改善したい',
    '試合中のメンタル面を強化したい',
    'スライスの精度を上げたい',
    'リターンの確率を上げたい',
    '体の回転を使ったスイングを意識したい',
  ];

  // Build map of instanceId -> reservations
  const instanceReservationMap = new Map<string, Reservation[]>();
  for (const r of reservations) {
    if (r.status !== 'confirmed') continue;
    const list = instanceReservationMap.get(r.lessonInstanceId) || [];
    list.push(r);
    instanceReservationMap.set(r.lessonInstanceId, list);
  }

  // Build map of instanceId -> instance for quick lookup
  const instanceMap = new Map<string, LessonInstance>();
  for (const inst of instances) {
    instanceMap.set(inst.id, inst);
  }

  // Only create records for past instances (date < today), sorted chronologically
  const pastInstanceIds = [...instanceReservationMap.keys()]
    .filter(id => {
      const inst = instanceMap.get(id);
      return inst && inst.date < today;
    })
    .sort((a, b) => {
      const instA = instanceMap.get(a)!;
      const instB = instanceMap.get(b)!;
      return instA.date.localeCompare(instB.date) || instA.startTime.localeCompare(instB.startTime);
    });

  // Create records for all past instances that have reservations
  for (let i = 0; i < pastInstanceIds.length; i++) {
    const instanceId = pastInstanceIds[i];
    const instanceReservations = instanceReservationMap.get(instanceId)!;

    const memberNotes: MemberLessonNote[] = instanceReservations.map(r => {
      const attendanceOptions: AttendanceStatus[] = ['present', 'present', 'present', 'present', 'late', 'absent'];
      const attendance = attendanceOptions[Math.floor(Math.random() * attendanceOptions.length)];
      const rating = attendance === 'absent' ? 3 : Math.floor(Math.random() * 3) + 3; // 3-5 for present/late

      return {
        memberId: r.memberId,
        attendance,
        performanceRating: rating,
        goodPoints: attendance !== 'absent' ? goodPointsList[Math.floor(Math.random() * goodPointsList.length)] : '',
        improvementPoints: attendance !== 'absent' ? improvementPointsList[Math.floor(Math.random() * improvementPointsList.length)] : '',
        memo: '',
      };
    });

    records.push({
      id: `record-${i + 1}`,
      lessonInstanceId: instanceId,
      theme: themes[i % themes.length],
      content: contents[i % contents.length],
      memberNotes,
      createdAt: now,
      updatedAt: now,
    });
  }

  return records;
}

/**
 * Post-process seed data to add realistic cancelled reservations and cancelled lesson instances.
 * Ensures the demo member (member-demo, beginner) has transfer-eligible data.
 */
function addCancelledDataForDemo(
  instances: LessonInstance[],
  reservations: Reservation[],
  slots: LessonSlot[],
  members: Member[],
  today: string
): void {
  const now = new Date().toISOString();
  const demoMemberId = 'member-demo';

  // Find beginner slot IDs
  const beginnerSlotIds = new Set(slots.filter(s => s.level === 'beginner').map(s => s.id));

  // Future beginner instances sorted by date
  const futureBeginnerInstances = instances
    .filter(i => i.date > today && beginnerSlotIds.has(i.lessonSlotId) && !i.isCancelled)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Instances where demo member already has a reservation
  const demoInstanceIds = new Set(
    reservations.filter(r => r.memberId === demoMemberId).map(r => r.lessonInstanceId)
  );

  // 1. Ensure demo member has reservations for at least 6 future beginner instances
  //    (3 for transfer sources + remaining stay confirmed)
  let guaranteedCount = 0;
  for (const inst of futureBeginnerInstances) {
    if (guaranteedCount >= 6) break;
    if (demoInstanceIds.has(inst.id)) {
      guaranteedCount++;
      continue;
    }
    reservations.push({
      id: uuidv4(),
      memberId: demoMemberId,
      lessonInstanceId: inst.id,
      status: 'confirmed',
      reservedAt: now,
      cancelledAt: null,
      transferFromInstanceId: null,
      transferToInstanceId: null,
      waitlistPosition: null,
      notes: '',
      createdAt: now,
      updatedAt: now,
    });
    demoInstanceIds.add(inst.id);
    guaranteedCount++;
  }

  // Get demo member's future confirmed reservations on beginner instances
  const demoFutureRes = reservations.filter(r =>
    r.memberId === demoMemberId &&
    r.status === 'confirmed' &&
    futureBeginnerInstances.some(i => i.id === r.lessonInstanceId)
  );

  // 2. Mark 2 reservations as member-cancelled (振替元: キャンセル済)
  for (let i = 0; i < 2 && i < demoFutureRes.length; i++) {
    demoFutureRes[i].status = 'cancelled';
    demoFutureRes[i].cancelledAt = now;
  }

  // 3. Mark 1 lesson instance as cancelled by admin (振替元: レッスン中止)
  //    Pick an instance where demo member has a confirmed reservation (index 2, not already cancelled)
  if (demoFutureRes.length > 2) {
    const targetInstanceId = demoFutureRes[2].lessonInstanceId;
    const targetInstance = instances.find(i => i.id === targetInstanceId);
    if (targetInstance) {
      targetInstance.isCancelled = true;
      targetInstance.cancelReason = '悪天候のため中止';
    }
  }
}
