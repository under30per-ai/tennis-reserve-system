export function validateEmail(email: string): string | null {
  if (!email) return 'メールアドレスを入力してください';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '有効なメールアドレスを入力してください';
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName}を入力してください`;
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null;
  if (!/^[0-9-]+$/.test(phone)) return '有効な電話番号を入力してください';
  return null;
}

export function validateTime(time: string): string | null {
  if (!time) return '時間を入力してください';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return '有効な時間を入力してください (HH:mm)';
  return null;
}

export function validateTimeRange(startTime: string, endTime: string): string | null {
  if (!startTime || !endTime) return null;
  if (startTime >= endTime) return '終了時間は開始時間より後に設定してください';
  return null;
}

export function validateCapacity(capacity: number): string | null {
  if (!capacity || capacity < 1) return '定員は1以上を設定してください';
  if (capacity > 100) return '定員は100以下を設定してください';
  return null;
}
