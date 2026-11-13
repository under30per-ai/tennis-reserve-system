/**
 * 不適切なコンテンツを検出するフィルター
 * チャットメッセージなどユーザー入力テキストに対して使用
 */

// 暴言・侮辱
const PROHIBITED_WORDS_JP = [
  '死ね', '殺す', '殺してやる', 'ころす', 'しね',
  'バカ', 'ばか', '馬鹿', 'アホ', 'あほ', '阿呆',
  'クソ', 'くそ', '糞', 'クズ', 'くず', '屑',
  'ゴミ', 'ごみ', 'カス', 'かす', 'ボケ', 'ぼけ',
  'きもい', 'キモい', 'キモイ', '気持ち悪い',
  'うざい', 'ウザい', 'ウザイ', 'うぜえ',
  'ブス', 'ぶす', 'デブ', 'でぶ', 'ハゲ', 'はげ',
  '消えろ', 'きえろ', '失せろ', 'うせろ',
];

// 差別的表現
const DISCRIMINATORY_WORDS = [
  'ガイジ', 'がいじ', '池沼', '知障',
  'チョン', 'シナ人',
  '部落', 'えた', 'ひにん',
];

// 性的表現
const SEXUAL_WORDS = [
  'セックス', 'SEX', 'sex',
  'エロ', 'えろ', 'エッチ', 'えっち',
  'オナニー', 'おなにー',
  'レイプ', 'れいぷ', '強姦',
  '援交', '援助交際', 'パパ活', 'ママ活',
  '風俗', 'ソープ', 'デリヘル',
  'ちんこ', 'まんこ', 'おっぱい',
];

// 詐欺・勧誘
const SCAM_WORDS = [
  '儲かる', '稼げる', '副業',
  '投資で', '仮想通貨で',
  'ネットワークビジネス', 'マルチ商法', 'ねずみ講',
  'LINE交換', 'ライン交換',
  '出会い系', 'マッチングアプリ',
];

// 脅迫・暴力
const THREAT_WORDS = [
  '爆破', '放火', '通報するぞ',
  '訴えるぞ', '訴えてやる',
  '住所特定', '晒す', 'さらす',
  '待ち伏せ', 'つきまとう', 'ストーカー',
];

const ALL_PROHIBITED_WORDS = [
  ...PROHIBITED_WORDS_JP,
  ...DISCRIMINATORY_WORDS,
  ...SEXUAL_WORDS,
  ...SCAM_WORDS,
  ...THREAT_WORDS,
];

/**
 * テキストに不適切なコンテンツが含まれているか判定する
 * 全角/半角、大文字/小文字を正規化してからチェック
 */
export function containsProhibitedContent(text: string): boolean {
  // 正規化: 全角英数→半角、大文字→小文字
  const normalized = text
    .normalize('NFKC')
    .toLowerCase()
    // スペースや記号の挿入による回避を防止（例: 「死 ね」「し・ね」）
    .replace(/[\s　・•‥…\-_＿.。,、!！?？]/g, '');

  for (const word of ALL_PROHIBITED_WORDS) {
    const normalizedWord = word.normalize('NFKC').toLowerCase().replace(/[\s　]/g, '');
    if (normalized.includes(normalizedWord)) {
      return true;
    }
  }

  return false;
}
