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

/**
 * Parses Turkish or ISO date string (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD)
 */
export const parseCustomDate = (dateStr?: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // DD.MM.YYYY or DD/MM/YYYY
  const trMatch = trimmed.match(/^(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})$/);
  if (trMatch) {
    const day = parseInt(trMatch[1], 10);
    const month = parseInt(trMatch[2], 10) - 1;
    const year = parseInt(trMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[\.\/-](\d{1,2})[\.\/-](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  const standard = new Date(trimmed);
  return isNaN(standard.getTime()) ? null : standard;
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

/**
 * Calculates validity expiry date given training date and company danger class
 */
export const calculateExpiryDate = (
  trainingDateStr?: string,
  dangerClass?: DangerClass
): { expiryDisplay: string; expiryIso: string; years: number } => {
  const years = getValidityYears(dangerClass);
  const baseDate = parseCustomDate(trainingDateStr) || new Date();

  const targetDate = new Date(baseDate);
  targetDate.setFullYear(baseDate.getFullYear() + years);

  return {
    expiryDisplay: formatDateTR(targetDate),
    expiryIso: targetDate.toISOString(),
    years
  };
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
