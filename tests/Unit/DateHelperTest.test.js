const DateHelper = require('#helpers/dateHelper');

describe('DateHelper Unit Tests', () => {
  test('returns configured application timezone from env or default', () => {
    const tz = DateHelper.getAppTimezone();
    expect(tz).toBeDefined();
    expect(typeof tz).toBe('string');
  });

  test('toUTCISO converts date to ISO 8601 UTC string ending in Z', () => {
    const now = new Date('2026-09-08T12:00:00.000Z');
    const iso = DateHelper.toUTCISO(now);
    expect(iso).toBe('2026-09-08T12:00:00.000Z');
  });

  test('toUTCISO throws on invalid date', () => {
    expect(() => DateHelper.toUTCISO('invalid-date')).toThrow('Invalid date provided');
  });

  test('formatAppDate formats date correctly in Asia/Kolkata (IST)', () => {
    // 2026-09-08 06:30:00 UTC is 2026-09-08 12:00:00 IST (+05:30)
    const utcDate = new Date('2026-09-08T06:30:00.000Z');
    const formatted = DateHelper.formatAppDate(utcDate, {}, 'Asia/Kolkata');
    expect(formatted).toContain('Sep 08, 2026');
    expect(formatted).toContain('12:00:00 PM');
    expect(formatted).toContain('GMT+5:30');
  });

  test('addMinutes accurately adds duration without mutating original date', () => {
    const start = new Date('2026-09-08T12:00:00.000Z');
    const after15Min = DateHelper.addMinutes(start, 15);

    expect(after15Min.toISOString()).toBe('2026-09-08T12:15:00.000Z');
    expect(start.toISOString()).toBe('2026-09-08T12:00:00.000Z');
  });

  test('addHours and addDays calculate offsets correctly in UTC', () => {
    const start = new Date('2026-09-08T12:00:00.000Z');
    const after2Hours = DateHelper.addHours(start, 2);
    const after3Days = DateHelper.addDays(start, 3);

    expect(after2Hours.toISOString()).toBe('2026-09-08T14:00:00.000Z');
    expect(after3Days.toISOString()).toBe('2026-09-11T12:00:00.000Z');
  });

  test('isExpired correctly flags past dates and active future dates', () => {
    const past = new Date(Date.now() - 10000);
    const future = new Date(Date.now() + 10000);

    expect(DateHelper.isExpired(past)).toBe(true);
    expect(DateHelper.isExpired(future)).toBe(false);
  });
});
