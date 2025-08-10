// 밀리초 시간 단위 상수
export const TIME_MULTIPLIERS = {
  s: 1000, // 초
  m: 60 * 1000, // 분
  h: 60 * 60 * 1000, // 시간
  d: 24 * 60 * 60 * 1000, // 일
  w: 7 * 24 * 60 * 60 * 1000, // 주
} as const;

export type TimeUnit = keyof typeof TIME_MULTIPLIERS;

/**
 * 시간 문자열을 밀리초로 변환
 * @param timeStr 시간 문자열 (예: '1h', '7d', '30s')
 * @returns 밀리초
 */
export function parseTimeToMs(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([smhdw])$/);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] as TimeUnit;

  return value * TIME_MULTIPLIERS[unit];
}
