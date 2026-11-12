import { PosOrderRecord } from '../types/pos';

/**
 * Single source of truth for "cancelled" orders (case-insensitive: 'CANCELLED', 'cancelled',
 * 'voided', 'refunded'). Every sales KPI, forecast and export filters through this.
 */
export const isCancelledOrder = (o: Pick<PosOrderRecord, 'status' | 'externalStatus'>): boolean => {
  const status = String(o.status || '').toLowerCase();
  const ext = String(o.externalStatus || '').toLowerCase();
  return (
    ['voided', 'cancelled', 'canceled', 'refunded'].includes(status) ||
    ['voided', 'cancelled', 'canceled', 'refunded'].includes(ext)
  );
};

export const isCompletedOrder = (o: Pick<PosOrderRecord, 'status' | 'externalStatus'>): boolean => {
  if (isCancelledOrder(o)) return false;
  const ext = String(o.externalStatus || '').toLowerCase();
  return String(o.status || '').toLowerCase() === 'completed' || ['completed', 'delivered', 'settled'].includes(ext);
};

export const orderStatusLabel = (o: Pick<PosOrderRecord, 'status' | 'externalStatus'>): string => {
  if (isCancelledOrder(o)) return 'CANCELLED';
  if (isCompletedOrder(o)) return 'COMPLETED';
  return String(o.externalStatus || o.status || '').toUpperCase();
};
