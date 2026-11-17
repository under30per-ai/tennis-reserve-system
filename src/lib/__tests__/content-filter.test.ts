import { describe, it, expect } from 'vitest';
import { containsProhibitedContent } from '@/lib/content-filter';

describe('containsProhibitedContent', () => {
  // Clean inputs
  it('returns false for normal text', () => {
    expect(containsProhibitedContent('今日のレッスンは楽しかったです')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(containsProhibitedContent('')).toBe(false);
  });

  it('returns false for greeting', () => {
    expect(containsProhibitedContent('こんにちは、次回のレッスンについて質問があります。')).toBe(false);
  });

  // Profanity
  it('detects 死ね', () => {
    expect(containsProhibitedContent('死ね')).toBe(true);
  });

  it('detects バカ', () => {
    expect(containsProhibitedContent('バカ')).toBe(true);
  });

  it('detects クソ', () => {
    expect(containsProhibitedContent('クソ')).toBe(true);
  });

  // Normalization: spaces inserted to bypass filter
  it('detects spaced bypass: 死 ね', () => {
    expect(containsProhibitedContent('死 ね')).toBe(true);
  });

  it('detects separator bypass: し・ね', () => {
    expect(containsProhibitedContent('し・ね')).toBe(true);
  });

  // Full-width to half-width normalization
  it('detects full-width SEX → sex', () => {
    expect(containsProhibitedContent('ＳＥＸ')).toBe(true);
  });

  // Discriminatory
  it('detects discriminatory word', () => {
    expect(containsProhibitedContent('ガイジ')).toBe(true);
  });

  // Sexual
  it('detects sexual content', () => {
    expect(containsProhibitedContent('エロ動画')).toBe(true);
  });

  // Scam
  it('detects scam words', () => {
    expect(containsProhibitedContent('儲かる話があります')).toBe(true);
  });

  it('detects LINE交換', () => {
    expect(containsProhibitedContent('LINE交換しませんか')).toBe(true);
  });

  // Threats
  it('detects threat words', () => {
    expect(containsProhibitedContent('住所特定するぞ')).toBe(true);
  });

  it('detects 爆破', () => {
    expect(containsProhibitedContent('爆破予告')).toBe(true);
  });
});
