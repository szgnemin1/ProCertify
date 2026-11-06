import { DangerClass } from '../types';

/**
 * Returns number of validity years based on danger class
 * Çok Tehlikeli -> 1 yıl
 * Tehlikeli     -> 2 yıl
 * Az Tehlikeli  -> 3 yıl
 */
export const getValidityYears = (dangerClass?: DangerClass): number => {
  switch (dangerClass) {
    case 'cok_tehlikeli':
      return 1;
    case 'tehlikeli':
      return 2;
    case 'az_tehlikeli':
      return 3;
    default:
      return 1;
  }
};

export const getDangerClassLabel = (dangerClass?: DangerClass): string => {
  switch (dangerClass) {
    case 'cok_tehlikeli':
      return 'Çok Tehlikeli (1 Yıl)';
    case 'tehlikeli':
      return 'Tehlikeli (2 Yıl)';
    case 'az_tehlikeli':
      return 'Az Tehlikeli (3 Yıl)';
    default:
      return 'Belirtilmemiş';
  }
};

export const getDangerClassBadgeClass = (dangerClass?: DangerClass): string => {
  switch (dangerClass) {
    case 'cok_tehlikeli':
      return 'bg-red-500/15 text-red-400 border border-red-500/30';
    case 'tehlikeli':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    case 'az_tehlikeli':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    default:
      return 'bg-slate-700 text-slate-300 border border-slate-600';
  }
};

const TR_MONTHS: Record<string, number> = {
  'ocak': 0, 'şubat': 1, 'subat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'mayis': 4,
  'haziran': 5, 'temmuz': 6, 'ağustos': 7, 'agustos': 7, 'eylül': 8, 'eylul': 8,
  'ekim': 9, 'kasım': 10, 'kasim': 10, 'aralık': 11, 'aralik': 11
};

export const TR_MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export interface ParsedDateInfo {
  raw: string;
  startDay: number;
  endDay: number;
  allDays: number[];
  month: number; // 0-indexed (0=Ocak, 11=Aralık)
  year: number;
  isMultiDay: boolean;
  startDate: Date;     // Earliest / first day of training (ilk gün)
  effectiveDate: Date; // Last day of training (bitiş günü)
  displaySummary: string; // e.g. "12 ve 13 Kasım 2026 (2 Günlük Eğitim)"
}

/**
 * Parses single or multi-day Turkish dates:
 * - (12.13/11/2026), 12.13/11/2026, 12.13.14/11/2026, 19.21.22/01/2026, 22.25.10.2026, 22-25/10/2026, 22,25/10/2026
 * - 12 ve 13 Kasım 2026, 12, 13 Kasım 2026, 12-13 Kasım 2026
 * - 22.10.2026 - 25.10.2026
 * - 25.10.2026, 25/10/2026, 25-10-2026
 * - 2026-10-25
 */
export const parseDateDetailed = (dateStr?: string): ParsedDateInfo | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const raw = dateStr.trim();
  if (!raw) return null;

  // Clean surrounding parentheses, brackets, braces, and quotes e.g. "(12.13/11/2026)" -> "12.13/11/2026"
  const cleaned = raw.replace(/^[\(\[\{'"“]+/, '').replace(/[\)\]\}'"”]+$/, '').trim();
  if (!cleaned) return null;

  let startDay: number | null = null;
  let endDay: number | null = null;
  let allDays: number[] = [];
  let month: number | null = null;
  let year: number | null = null;
  let isMultiDay = false;

  // 1. Multi-day Turkish format: (12.13/11/2026), 12.13/11/2026, 12.13.14/11/2026, 12-13/11/2026, 12,13/11/2026, 12, 13/11/2026, 12.13.11.2026, 12-13.11.2026
  const multiDayMatch = cleaned.match(/^((?:\d{1,2}[\.\-,\/]\s*)+)(\d{1,2})[\.\-\/](\d{2,4})$/);
  if (multiDayMatch) {
    const dayTokens = multiDayMatch[1].split(/[\.\-,\/]/).map(s => s.trim()).filter(Boolean).map(n => parseInt(n, 10));
    if (dayTokens.length >= 2) {
      allDays = Array.from(new Set(dayTokens)).sort((a, b) => a - b);
      startDay = allDays[0];
      endDay = allDays[allDays.length - 1];
      month = parseInt(multiDayMatch[2], 10) - 1;
      let yr = parseInt(multiDayMatch[3], 10);
      if (yr < 100) yr += 2000;
      year = yr;
      isMultiDay = true;
    }
  }

  // 2. Full range format: 12.11.2026 - 13.11.2026 or 12/11/2026 - 13/11/2026
  if (!year) {
    const rangeMatch = cleaned.match(/^(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{2,4})\s*[-–—]\s*(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{2,4})$/);
    if (rangeMatch) {
      const d1 = parseInt(rangeMatch[1], 10);
      const d2 = parseInt(rangeMatch[4], 10);
      startDay = Math.min(d1, d2);
      endDay = Math.max(d1, d2);
      allDays = [];
      for (let d = startDay; d <= endDay; d++) allDays.push(d);
      month = parseInt(rangeMatch[5], 10) - 1;
      let yr = parseInt(rangeMatch[6], 10);
      if (yr < 100) yr += 2000;
      year = yr;
      isMultiDay = true;
    }
  }

  // 3. Multi-day or single with Turkish month name: "12 ve 13 Kasım 2026", "12, 13 Kasım 2026", "12, 13, 14 Kasım 2026", "12-13 Kasım 2026", "25 Kasım 2026"
  if (!year) {
    const textMultiMatch = cleaned.match(/^(?:((?:\d{1,2}(?:\s*[-–—,.]|\s+ve\s+|\s+ile\s+)\s*)+\d{1,2})|(\d{1,2}))\s+([a-zA-ZçğıöşüÇĞİÖŞÜ]+)\s+(\d{2,4})$/);
    if (textMultiMatch) {
      const daysStr = textMultiMatch[1] || textMultiMatch[2];
      const parsedDays = daysStr.split(/[-–—,.]|\s+ve\s+|\s+ile\s+/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      const mStr = textMultiMatch[3].toLocaleLowerCase('tr-TR');
      if (TR_MONTHS[mStr] !== undefined && parsedDays.length > 0) {
        allDays = Array.from(new Set(parsedDays)).sort((a, b) => a - b);
        startDay = allDays[0];
        endDay = allDays[allDays.length - 1];
        month = TR_MONTHS[mStr];
        let yr = parseInt(textMultiMatch[4], 10);
        if (yr < 100) yr += 2000;
        year = yr;
        isMultiDay = allDays.length > 1;
      }
    }
  }

  // 4. Standard single date: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
  if (!year) {
    const singleMatch = cleaned.match(/^(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{2,4})$/);
    if (singleMatch) {
      endDay = parseInt(singleMatch[1], 10);
      startDay = endDay;
      allDays = [endDay];
      month = parseInt(singleMatch[2], 10) - 1;
      let yr = parseInt(singleMatch[3], 10);
      if (yr < 100) yr += 2000;
      year = yr;
      isMultiDay = false;
    }
  }

  // 5. ISO single date: YYYY-MM-DD
  if (!year) {
    const isoMatch = cleaned.match(/^(\d{4})[\.\/-](\d{1,2})[\.\/-](\d{1,2})/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10) - 1;
      endDay = parseInt(isoMatch[3], 10);
      startDay = endDay;
      allDays = [endDay];
      isMultiDay = false;
    }
  }

  // 6. Fallback year match: any 4-digit year 20xx
  if (!year) {
    const yearMatch = cleaned.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      year = parseInt(yearMatch[1], 10);
      const nums = cleaned.match(/\b(\d{1,2})\b/g);
      if (nums && nums.length >= 2) {
        const d1 = parseInt(nums[0], 10);
        const d2 = parseInt(nums[nums.length - 2], 10);
        startDay = Math.min(d1, d2);
        endDay = Math.max(d1, d2);
        allDays = [startDay, endDay];
        month = 0;
        isMultiDay = nums.length > 2 || startDay !== endDay;
      }
    }
  }

  if (!year || isNaN(year)) {
    const std = new Date(raw);
    if (!isNaN(std.getTime())) {
      const d = std.getDate();
      const m = std.getMonth();
      const y = std.getFullYear();
      return {
        raw,
        startDay: d,
        endDay: d,
        allDays: [d],
        month: m,
        year: y,
        isMultiDay: false,
        startDate: std,
        effectiveDate: std,
        displaySummary: `${d} ${TR_MONTH_NAMES[m] || ''} ${y} (1 Gün)`
      };
    }
    return null;
  }

  const safeStartDay = startDay && startDay >= 1 && startDay <= 31 ? startDay : (endDay || 1);
  const safeEndDay = endDay && endDay >= 1 && endDay <= 31 ? endDay : safeStartDay;
  if (allDays.length === 0) allDays = [safeStartDay, safeEndDay];
  allDays = Array.from(new Set(allDays)).sort((a, b) => a - b);

  const safeMonth = month !== null && month >= 0 && month <= 11 ? month : 0;
  const startDate = new Date(year, safeMonth, safeStartDay, 12, 0, 0);
  const effectiveDate = new Date(year, safeMonth, safeEndDay, 12, 0, 0);

  const monthName = TR_MONTH_NAMES[safeMonth] || `${safeMonth + 1}. Ay`;
  let displaySummary = '';
  if (isMultiDay && allDays.length > 1) {
    if (allDays.length === 2) {
      displaySummary = `${allDays[0]} ve ${allDays[1]} ${monthName} ${year} (2 Günlük Eğitim)`;
    } else {
      const listStr = allDays.slice(0, -1).join(', ') + ' ve ' + allDays[allDays.length - 1];
      displaySummary = `${listStr} ${monthName} ${year} (${allDays.length} Günlük Eğitim)`;
    }
  } else {
    displaySummary = `${safeEndDay} ${monthName} ${year} (1 Gün)`;
  }

  return {
    raw,
    startDay: safeStartDay,
    endDay: safeEndDay,
    allDays,
    month: safeMonth,
    year,
    isMultiDay,
    startDate,
    effectiveDate,
    displaySummary
  };
};

/**
 * Parses Turkish or ISO date string and returns effective Date object (or null)
 */
export const parseCustomDate = (dateStr?: string): Date | null => {
  const detailed = parseDateDetailed(dateStr);
  return detailed ? detailed.effectiveDate : null;
};

/**
 * Formats a Date object to Turkish DD.MM.YYYY
 */
export const formatDateTR = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export interface ExpiryCalculationResult {
  expiryDisplay: string;
  expirySingleDisplay: string;
  expiryIso: string;
  years: number;
  isMultiDay: boolean;
  parsedInfo: ParsedDateInfo | null;
}

/**
 * Calculates validity expiry date given training date and company danger class
 * Handles multi-day dates like 22.25/10/2026:
 * - expiryDisplay: 22.25/10/2027 (replaces year on original string)
 * - expirySingleDisplay: 25.10.2027 (effective completion day)
 * - expiryIso: 2027-10-25T12:00:00.000Z
 */
export const calculateExpiryDate = (
  trainingDateStr?: string,
  dangerClass?: DangerClass,
  preferSingleDayFormat: boolean = false
): ExpiryCalculationResult => {
  const years = getValidityYears(dangerClass);
  const parsed = parseDateDetailed(trainingDateStr);

  if (!parsed) {
    const fallbackDate = new Date();
    fallbackDate.setFullYear(fallbackDate.getFullYear() + years);
    const dayStr = String(fallbackDate.getDate()).padStart(2, '0');
    const monthStr = String(fallbackDate.getMonth() + 1).padStart(2, '0');
    const formatted = `${dayStr}.${monthStr}.${fallbackDate.getFullYear()}`;
    return {
      expiryDisplay: formatted,
      expirySingleDisplay: formatted,
      expiryIso: fallbackDate.toISOString(),
      years,
      isMultiDay: false,
      parsedInfo: null
    };
  }

  const baseDay = parsed.endDay || parsed.startDay;
  const targetYear = parsed.year + years;
  const targetEffective = new Date(targetYear, parsed.month, baseDay, 12, 0, 0);

  const padDay = String(baseDay).padStart(2, '0');
  const padMonth = String(parsed.month + 1).padStart(2, '0');
  const singleDateDisplay = `${padDay}.${padMonth}.${targetYear}`;

  let rangeDisplay = parsed.raw;
  // Replace the original year in the string with targetYear
  const lastIdx = parsed.raw.lastIndexOf(String(parsed.year));
  if (lastIdx !== -1) {
    rangeDisplay = parsed.raw.slice(0, lastIdx) + String(targetYear) + parsed.raw.slice(lastIdx + String(parsed.year).length);
  } else {
    rangeDisplay = singleDateDisplay;
  }

  return {
    expiryDisplay: (parsed.isMultiDay && !preferSingleDayFormat) ? rangeDisplay : singleDateDisplay,
    expirySingleDisplay: singleDateDisplay,
    expiryIso: targetEffective.toISOString(),
    years,
    isMultiDay: parsed.isMultiDay,
    parsedInfo: parsed
  };
};

export interface EarliestDateResult {
  date: Date;
  formatted: string; // "19.01.2026"
  raw: string;
  key?: string;
  day: number;
  month: number; // 1-indexed (1..12)
  year: number;
}

/**
 * Extracts all valid dates found in a text string.
 * Supports comma-separated, range, slash, multi-day, and standard dates.
 */
export const extractDatesFromString = (str: string): { date: Date; formatted: string; raw: string }[] => {
  if (!str || typeof str !== 'string') return [];
  const results: { date: Date; formatted: string; raw: string }[] = [];

  // Try parsing the whole string first (handles multi-day like "(12.13/11/2026)", "12, 13/11/2026", "12 ve 13 Kasım 2026")
  const wholeParsed = parseDateDetailed(str);
  if (wholeParsed) {
    results.push({
      date: wholeParsed.startDate,
      formatted: formatDateTR(wholeParsed.startDate),
      raw: str
    });
    if (wholeParsed.isMultiDay && wholeParsed.effectiveDate.getTime() !== wholeParsed.startDate.getTime()) {
      results.push({
        date: wholeParsed.effectiveDate,
        formatted: formatDateTR(wholeParsed.effectiveDate),
        raw: str
      });
    }
    return results;
  }
  
  // Split on delimiters that separate distinct dates (commas, semicolons, newlines, "ve", "and", "ile")
  const segments = str.split(/[,;\n\r]+|\s+(?:ve|and|ile)\s+/i).map(s => s.trim()).filter(Boolean);
  
  for (const seg of segments) {
    const parsed = parseDateDetailed(seg);
    if (parsed) {
      const fmtStart = formatDateTR(parsed.startDate);
      if (!results.some(r => r.formatted === fmtStart)) {
        results.push({
          date: parsed.startDate,
          formatted: fmtStart,
          raw: seg
        });
      }
      if (parsed.isMultiDay && parsed.effectiveDate.getTime() !== parsed.startDate.getTime()) {
        const fmtEnd = formatDateTR(parsed.effectiveDate);
        if (!results.some(r => r.formatted === fmtEnd)) {
          results.push({
            date: parsed.effectiveDate,
            formatted: fmtEnd,
            raw: seg
          });
        }
      }
    }
  }

  // Regex fallback: find standalone DD.MM.YYYY or YYYY-MM-DD
  const regexMatches = str.matchAll(/\b(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})\b/g);
  for (const m of regexMatches) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    if (d >= 1 && d <= 31 && mo >= 0 && mo <= 11 && y >= 1950 && y <= 2100) {
      const dt = new Date(y, mo, d, 12, 0, 0);
      const fmt = formatDateTR(dt);
      if (!results.some(r => r.formatted === fmt)) {
        results.push({ date: dt, formatted: fmt, raw: m[0] });
      }
    }
  }

  return results;
};

/**
 * Finds the chronologically earliest (first day) training date from multiple candidates.
 * E.g., if one cert is 21.01.2026, another 22.01.2026, another 19.01.2026,
 * this function returns 19.01.2026 as the earliest date.
 */
export const findEarliestTrainingDate = (
  candidates: (string | { key?: string; value?: string } | null | undefined)[]
): EarliestDateResult | null => {
  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) return null;

  const allFound: { date: Date; formatted: string; raw: string; key?: string }[] = [];

  for (const item of candidates) {
    if (!item) continue;
    const rawVal = typeof item === 'string' ? item : item.value;
    const key = typeof item === 'object' ? item.key : undefined;

    if (!rawVal || typeof rawVal !== 'string') continue;

    const extracted = extractDatesFromString(rawVal);
    for (const ext of extracted) {
      allFound.push({
        ...ext,
        key
      });
    }
  }

  if (allFound.length === 0) return null;

  // Sort ascending: smallest timestamp (earliest date / ilk gün) first
  allFound.sort((a, b) => a.date.getTime() - b.date.getTime());

  const earliest = allFound[0];
  return {
    date: earliest.date,
    formatted: earliest.formatted,
    raw: earliest.raw,
    key: earliest.key,
    day: earliest.date.getDate(),
    month: earliest.date.getMonth() + 1,
    year: earliest.date.getFullYear()
  };
};

/**
 * Checks if a field label indicates a validity/expiration date
 */
export const isValidityDateField = (label: string): boolean => {
  if (!label) return false;
  const l = label.toLowerCase();
  return (
    l.includes('gecerlilik') || 
    l.includes('geçerlilik') || 
    l.includes('bitis') || 
    l.includes('bitiş') ||
    l.includes('son geçer') ||
    l.includes('son gecer')
  );
};

/**
 * Scores a field label on how likely it represents the training reference date
 * Higher score = higher priority
 */
export const scoreDateFieldForTraining = (label: string): number => {
  if (!label) return 0;
  const l = label.toLowerCase();
  if (isValidityDateField(l)) return -1; // Expiry fields are never training reference dates

  if (l.includes('başlangıç') || l.includes('baslangic') || l.includes('başlama') || l.includes('baslama') || l.includes('start')) return 110;
  if (l.includes('eğitim bitiş') || l.includes('egitim bitis')) return 100;
  if (l.includes('eğitim tarihi') || l.includes('egitim tarihi')) return 95;
  if (l.includes('eğitim') || l.includes('egitim')) return 85;
  if (l.includes('kurs') || l.includes('seminer')) return 80;
  if (l.includes('düzenleme') || l.includes('duzenleme') || l.includes('veriliş') || l.includes('verilis')) return 65;
  if (l.includes('sınav') || l.includes('sinav')) return 50;
  if (l.includes('tarih') || l.includes('date')) return 40;
  return 0;
};

/**
 * Picks the best training date field from available field labels
 */
export const findBestTrainingDateField = (
  availableFields: string[],
  preferredKey?: string
): string | null => {
  if (preferredKey && availableFields.includes(preferredKey)) {
    return preferredKey;
  }

  const validCandidates = availableFields
    .map(f => ({ field: f, score: scoreDateFieldForTraining(f) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return validCandidates.length > 0 ? validCandidates[0].field : null;
};

export type CertificateStatus = 'valid' | 'expiring_soon' | 'expired';

/**
 * Returns certificate validity status based on expiryDate
 * - expired: date < now
 * - expiring_soon: within next 30 days
 * - valid: > 30 days left
 */
export const getCertificateStatus = (expiryDateStr?: string): CertificateStatus => {
  if (!expiryDateStr) return 'valid';
  const expiry = parseCustomDate(expiryDateStr);
  if (!expiry) return 'valid';

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiryMidnight = new Date(expiry);
  expiryMidnight.setHours(0, 0, 0, 0);

  const diffTime = expiryMidnight.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'valid';
};

export const getDaysRemaining = (expiryDateStr?: string): number => {
  if (!expiryDateStr) return 0;
  const expiry = parseCustomDate(expiryDateStr);
  if (!expiry) return 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiryMidnight = new Date(expiry);
  expiryMidnight.setHours(0, 0, 0, 0);

  const diffTime = expiryMidnight.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusBadge = (status: CertificateStatus, daysRemaining?: number) => {
  switch (status) {
    case 'expired':
      return {
        label: 'Süresi Doldu',
        className: 'bg-red-500/15 text-red-400 border border-red-500/30'
      };
    case 'expiring_soon':
      return {
        label: daysRemaining !== undefined ? `${daysRemaining} Gün Kaldı` : 'Süresi Yaklaşıyor',
        className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
      };
    case 'valid':
    default:
      return {
        label: daysRemaining !== undefined ? `Geçerli (${daysRemaining} Gün)` : 'Geçerli',
        className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      };
  }
};
