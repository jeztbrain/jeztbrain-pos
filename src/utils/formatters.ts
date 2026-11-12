import { CURRENCY } from '../config/brandConfig';
import type { CartLineItem, MenuItem } from '../types/pos';
export function roundKWD(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 1000) / 1000;
}

export function formatKWD(val: number, withCurrency = true): string {
  const safe = Number.isFinite(val) ? val : 0;
  const formatted = safe.toFixed(3);
  return withCurrency ? `${formatted} ${CURRENCY}` : formatted;
}

export function formatTimeKW(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function formatDateTimeKW(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export const CHANNEL_META: Record<
  'dine_in' | 'takeaway' | 'chikarro_web' | 'keeta',
  { label: string; shortLabel: string; badgeClass: string; defaultFeeKwd: number }
> = {
  dine_in: {
    label: 'Dine-In',
    shortLabel: 'Dine-In',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    defaultFeeKwd: 0.0,
  },
  takeaway: {
    label: 'Takeaway',
    shortLabel: 'Takeaway',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
    defaultFeeKwd: 0.0,
  },
  chikarro_web: {
    label: 'Web Direct',
    shortLabel: 'Web Direct',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
    defaultFeeKwd: 0.5,
  },
  keeta: {
    label: 'Keeta',
    shortLabel: 'Keeta',
    badgeClass: 'bg-yellow-50 text-yellow-900 border-yellow-400 font-bold',
    defaultFeeKwd: 0.0,
  },
};

export const PAYMENT_METHOD_LABELS: Record<
  'cash' | 'knet' | 'wamd' | 'payment_link' | 'split' | 'aggregator_prepaid' | 'staff_credit',
  string
> = {
  cash: `Cash (${CURRENCY} Notes)`,
  knet: 'K-Net Terminal',
  wamd: 'Wamd Instant Transfer',
  payment_link: 'K-Net Payment Link',
  split: 'Split (Cash + K-Net)',
  aggregator_prepaid: 'Aggregator Prepaid',
  staff_credit: 'Staff Credit (Salary Deduction)',
};

// Synthesized hardware audio alerts (Zero external asset dependency)
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playTerminalSound(type: 'tap' | 'webOrder' | 'paid' | 'error' | 'override'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'tap') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'webOrder') {
      // High-priority 3-note futuristic dispatch chime
      const notes = [587.33, 880, 1174.66];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.11);
        gain.gain.setValueAtTime(0.12, now + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.11);
        osc.stop(now + idx * 0.11 + 0.26);
      });
    } else if (type === 'paid') {
      const notes = [523.25, 659.25, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.19);
      });
    } else if (type === 'override' || type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.setValueAtTime(180, now + 0.09);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    }
  } catch {
    // Ignore audio context locks on initial un-interacted render
  }
}

/**
 * Detects whether a cart line represents a combo deal, meal, bucket, or family bundle.
 */
export function isComboLine(line: CartLineItem, catalog?: MenuItem[]): boolean {
  if (line.type === 'COMBO' || line.isCombo) return true;
  const linkedItem = catalog?.find((m) => m.id === line.refId || m.sku === line.skuOrCode);
  if (linkedItem?.isCombo) return true;
  const titleLower = (line.titleEn || linkedItem?.nameEn || '').toLowerCase();
  if (/(combo|deal|meal|bucket|box|feast|platter|pack)/i.test(titleLower)) return true;
  if (
    linkedItem?.categoryId === '879809c5-bf5b-4aa4-a497-85549906c7a3' ||
    linkedItem?.categoryId === 'ff643ddf-60db-4c7a-9703-0fc77954bac6' ||
    linkedItem?.categoryId === 'deals'
  ) {
    return true;
  }
  return false;
}

/**
 * Extracts and normalizes built-in sub-items for true combos (Family Meal, Burger Combos, Buckets).
 * Extracts from structured `comboSubItems`, `comboIncludes`, or `description` with full fidelity.
 */
export function getComboComponents(
  line: CartLineItem,
  catalog?: MenuItem[]
): string[] {
  // 1. Structured comboSubItems from ComboOffer
  if (line.comboSubItems && line.comboSubItems.length > 0) {
    return line.comboSubItems.map(
      (sub) => `${sub.quantity * (line.quantity || 1)}x ${sub.nameEn}`
    );
  }

  // 2. Structured comboIncludes on line
  if (Array.isArray(line.comboIncludes) && line.comboIncludes.length > 0) {
    return line.comboIncludes;
  }

  // Find linked item from live catalog if available
  const linkedItem = catalog?.find(
    (m) => m.id === line.refId || m.sku === line.skuOrCode
  );

  // 3. Structured comboIncludes on linked catalog item
  if (Array.isArray(linkedItem?.comboIncludes) && linkedItem.comboIncludes.length > 0) {
    return linkedItem.comboIncludes;
  }

  // 4. Parse description string (e.g. "12 Pcs Chicken + Large Fries + Coleslaw + 4 Buns + 1.25L Pepsi")
  const rawDesc = (line.description || linkedItem?.description || '').trim();
  if (rawDesc.length > 0) {
    const parts = rawDesc
      .split(/\||\+|\•|\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const isCombo = isComboLine(line, catalog);
    if (
      parts.length > 1 ||
      (parts.length === 1 && /(fries|drink|pepsi|coke|sauce|coleslaw|pcs|pieces|bun|rice)/i.test(parts[0])) ||
      isCombo
    ) {
      return parts;
    }
  }

  return [];
}

