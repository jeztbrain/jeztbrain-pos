import React, { useMemo, useState } from 'react';
import { CURRENCY } from '../config/brandConfig';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { ExportButtons } from './ExportButtons';
import { PredictiveAnalyticsWidget } from './PredictiveAnalyticsWidget';
import { PosOrderRecord } from '../types/pos';
import { isCancelledOrder, isCompletedOrder } from '../utils/orderStatus';
import {
  CHANNEL_META,
  formatDateTimeKW,
  formatKWD,
  PAYMENT_METHOD_LABELS,
  roundKWD,
} from '../utils/formatters';

interface SalesHistoryModalProps {
  onClose: () => void;
}

const VOID_REASONS = [
  'Customer Changed Mind / Left',
  'Cashier Input Mistake / Wrong Items',
  'Order Double-Billed',
  'Food Quality / Customer Dispute',
];

/**
 * Full-screen Transaction History & Sales Audit dashboard.
 * All figures are derived from live Supabase orders (orders / pos_orders / web_orders and
 * their line items) held in `posOrders`; nothing is hardcoded.
 */
export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({ onClose }) => {
  const {
    posOrders,
    voidSettledOrder,
    verifyManagerPin,
    triggerDirectPrint,
    dailyGrossSalesKwd,
    refetchCloudCatalog,
    isCloudSyncing,
  } = usePos();

  const [range, setRange] = useState<'today' | 'all'>('today');
  const [query, setQuery] = useState<string>('');
  const [orderToCancel, setOrderToCancel] = useState<PosOrderRecord | null>(null);
  const [reason, setReason] = useState<string>(VOID_REASONS[0]);
  const [notes, setNotes] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Executive KPIs: always today's live orders.
  const kpis = useMemo(() => {
    const todayKey = new Date().toDateString();
    let cancelledKwd = 0;
    let cancelledCount = 0;
    let completedCount = 0;
    let openCount = 0;
    let itemsSold = 0;
    const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();

    posOrders.forEach((o) => {
      if (new Date(o.createdAt).toDateString() !== todayKey) return;
      if (isCancelledOrder(o)) {
        cancelledKwd += o.grandTotalKwd;
        cancelledCount += 1;
        return;
      }
      if (isCompletedOrder(o)) completedCount += 1;
      else openCount += 1;

      o.items.forEach((line) => {
        itemsSold += line.quantity;
        const key = `${line.type}:${line.refId}`;
        const cur = itemMap.get(key) || { name: line.titleEn, qty: 0, revenue: 0 };
        cur.qty += line.quantity;
        cur.revenue += line.unitPriceKwd * line.quantity;
        itemMap.set(key, cur);
      });
    });

    return {
      cancelledKwd: roundKWD(cancelledKwd),
      cancelledCount,
      completedCount,
      openCount,
      itemsSold,
      distinctItems: itemMap.size,
      topItems: Array.from(itemMap.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 6),
    };
  }, [posOrders]);

  const visibleOrders = useMemo(() => {
    const todayKey = new Date().toDateString();
    const q = query.trim().toLowerCase();
    return posOrders
      .filter((o) => range === 'all' || new Date(o.createdAt).toDateString() === todayKey)
      .filter((o) => {
        if (!q) return true;
        return (
          o.invoiceNo.toLowerCase().includes(q) ||
          String(o.tokenNo).includes(q) ||
          (o.cashierName || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          o.items.some((i) => i.titleEn.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posOrders, range, query]);

  const closeCancelDialog = () => {
    setOrderToCancel(null);
    setNotes('');
    setPin('');
    setError(null);
    setReason(VOID_REASONS[0]);
  };

  const confirmCancel = () => {
    if (!orderToCancel) return;
    const manager = verifyManagerPin(pin);
    if (!manager) {
      setError('Invalid Manager or Admin PIN.');
      return;
    }
    const fullReason = notes.trim() ? `${reason} - ${notes.trim()}` : reason;
    // Soft-cancel only: status is set to cancelled in Supabase (no DELETE) and the
    // 80mm cancellation receipt is spooled.
    if (voidSettledOrder(orderToCancel.invoiceNo, fullReason, manager.name)) {
      closeCancelDialog();
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 bg-[#FAF6F0] flex flex-col text-left overflow-y-auto">
      {/* Top bar */}
      <div className="px-5 py-3 bg-[#C8102E] text-white flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg tracking-wide uppercase leading-tight">
              Total Sales &mdash; Transaction History &amp; Sales Audit
            </h2>
            <p className="text-xs font-mono text-rose-100">
              Live from Supabase &bull; {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetchCloudCatalog()}
            disabled={isCloudSyncing}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-60 text-xs font-mono font-bold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white text-[#C8102E] hover:bg-rose-50 text-xs font-mono font-black flex items-center gap-1.5 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Executive KPI cards (today) */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <div className="rounded-2xl bg-white border border-emerald-200 shadow-sm p-5">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider">
              Today&apos;s Gross Sales
            </span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="mt-2 font-display font-black text-4xl text-emerald-900 tabular-nums">
            {formatKWD(dailyGrossSalesKwd)}
            <span className="ml-1.5 text-base font-mono font-bold text-emerald-700">{CURRENCY}</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-stone-500">
            Excludes cancelled &amp; staff-credit bills
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-rose-200 shadow-sm p-5">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider">
              Cancelled / Voided
            </span>
            <XCircle className="w-5 h-5" />
          </div>
          <div className="mt-2 font-display font-black text-4xl text-rose-900 tabular-nums">
            {formatKWD(kpis.cancelledKwd)}
            <span className="ml-1.5 text-base font-mono font-bold text-rose-700">{CURRENCY}</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-stone-500">
            {kpis.cancelledCount} cancelled bill{kpis.cancelledCount === 1 ? '' : 's'} today
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-sky-200 shadow-sm p-5">
          <div className="flex items-center justify-between text-sky-700">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider">
              Completed Orders
            </span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="mt-2 font-display font-black text-4xl text-sky-900 tabular-nums">
            {kpis.completedCount}
          </div>
          <div className="mt-1 text-[11px] font-mono text-stone-500">
            {kpis.openCount} still open (pending / cooking)
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-amber-200 shadow-sm p-5">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider">
              Item Movement
            </span>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="mt-2 font-display font-black text-4xl text-amber-900 tabular-nums">
            {kpis.itemsSold}
            <span className="ml-1.5 text-base font-mono font-bold text-amber-700">items sold</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-stone-500">
            {kpis.distinctItems} distinct product{kpis.distinctItems === 1 ? '' : 's'} today
          </div>
        </div>
      </div>

      {kpis.topItems.length > 0 && (
        <div className="px-4 pb-3 shrink-0">
          <div className="rounded-2xl bg-white border border-[#E8E1D5] shadow-sm p-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-stone-500 mr-1">
              Top movers today
            </span>
            {kpis.topItems.map((it) => (
              <span
                key={it.name}
                className="px-2.5 py-1 rounded-full bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono text-stone-800"
              >
                <strong>{it.qty}&times;</strong> {it.name} &bull; {formatKWD(roundKWD(it.revenue))}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-3 shrink-0">
        <PredictiveAnalyticsWidget />
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-white border-y border-[#E8E1D5] flex flex-wrap items-center gap-2 shrink-0">
        <div className="flex rounded-lg overflow-hidden border border-[#E8E1D5] text-xs font-mono font-bold">
          {(['today', 'all'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 transition ${
                range === r ? 'bg-[#C8102E] text-white' : 'bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {r === 'today' ? 'Today' : 'All Time'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoice, token, cashier, customer, item..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-stone-50 border border-[#E8E1D5] text-xs font-mono focus:outline-none focus:border-[#C8102E]"
          />
        </div>
        <div className="text-xs font-mono text-stone-500">{visibleOrders.length} bills</div>
        <ExportButtons orders={visibleOrders} rangeLabel={range === 'today' ? `Today (${new Date().toLocaleDateString('en-GB')})` : 'All Time'} />
      </div>

      {/* Detailed bills list */}
      <div className="overflow-x-auto bg-white min-h-[320px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white">
            <tr className="border-b border-stone-200 text-[11px] font-mono text-stone-500 uppercase">
              <th className="py-2.5 px-4">Invoice / Token</th>
              <th className="py-2.5 px-3">Time / Cashier</th>
              <th className="py-2.5 px-3">Channel / Tender</th>
              <th className="py-2.5 px-3">Items</th>
              <th className="py-2.5 px-3">Total ({CURRENCY})</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {visibleOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center font-mono text-stone-400">
                  No Data &mdash; no bills found{range === 'today' ? ' for today' : ''} (0.000 {CURRENCY}).
                </td>
              </tr>
            ) : (
              visibleOrders.map((ord) => {
                const cancelled = isCancelledOrder(ord);
                return (
                  <tr key={ord.id} className={cancelled ? 'bg-rose-50/40' : 'hover:bg-stone-50'}>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-stone-900">{ord.invoiceNo}</div>
                      <div className="font-mono text-[11px] text-[#C8102E] font-extrabold">
                        TOKEN #{ord.tokenNo}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-[11px] text-stone-600">
                        {formatDateTimeKW(ord.createdAt)}
                      </div>
                      <div className="text-[11px] font-semibold text-stone-800">{ord.cashierName}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div className="font-bold uppercase text-stone-700">
                        {CHANNEL_META[ord.channel]?.label || ord.channel}
                        {ord.tableNo && ` (T-${ord.tableNo})`}
                      </div>
                      <div className="text-stone-500 uppercase">
                        {PAYMENT_METHOD_LABELS[ord.paymentMethod] || ord.paymentMethod}
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-[280px]">
                      <div
                        className="text-[11px] text-stone-700 truncate"
                        title={ord.items.map((i) => `${i.quantity}x ${i.titleEn}`).join(', ')}
                      >
                        {ord.items.map((i) => `${i.quantity}x ${i.titleEn}`).join(', ')}
                      </div>
                    </td>
                    <td
                      className={`py-3 px-3 font-mono font-extrabold text-sm ${
                        cancelled ? 'text-stone-400 line-through' : 'text-[#C8102E]'
                      }`}
                    >
                      {formatKWD(ord.grandTotalKwd)}
                    </td>
                    <td className="py-3 px-3">
                      {cancelled ? (
                        <div>
                          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                            CANCELLED
                          </span>
                          {ord.voidReason && (
                            <div
                              className="mt-1 text-[10px] text-stone-500 max-w-[180px] truncate"
                              title={ord.voidReason}
                            >
                              {ord.voidReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                          {isCompletedOrder(ord) ? 'SETTLED' : ord.externalStatus || ord.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {cancelled ? (
                          <button
                            type="button"
                            onClick={() => triggerDirectPrint(ord, 'INVOICE')}
                            title="Reprint cancellation receipt"
                            className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-800 hover:text-white text-stone-700 transition flex items-center gap-1 font-mono text-[10px] font-extrabold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Reprint Void Slip</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToCancel(ord);
                              setError(null);
                              setPin('');
                            }}
                            title="Cancel / Void this bill (deducts from Total Sales)"
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 border border-amber-300 transition flex items-center gap-1 font-mono text-[10px] font-extrabold"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cancel / Void Bill</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cancel / Void confirmation */}
      {orderToCancel && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden text-left">
            <div className="p-4 bg-[#C8102E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5" />
                <h3 className="font-display font-black text-sm uppercase tracking-wide">
                  Cancel Bill #{orderToCancel.invoiceNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCancelDialog}
                aria-label="Close"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex justify-between">
                <span className="text-stone-500 font-bold">Amount deducted from Total Sales:</span>
                <strong className="text-[#C8102E] text-sm">
                  -{formatKWD(orderToCancel.grandTotalKwd)} KWD
                </strong>
              </div>

              <label className="block">
                <span className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Reason</span>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-bold"
                >
                  {VOID_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes (optional)"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:border-[#C8102E]"
              />

              <input
                type="password"
                autoComplete="new-password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pin.trim()) confirmCancel();
                }}
                placeholder="Manager / Admin PIN"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border-2 border-stone-300 text-center font-extrabold tracking-widest focus:outline-none focus:border-[#C8102E]"
              />

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#C8102E]" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-2.5 leading-relaxed">
                The bill is soft-cancelled (status set to Cancelled in Supabase &mdash; never deleted),
                stock is restored, and an 80mm cancellation receipt is printed.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeCancelDialog}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                >
                  Keep Bill
                </button>
                <button
                  type="button"
                  disabled={!pin.trim()}
                  onClick={confirmCancel}
                  className="flex-1 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] disabled:opacity-40 text-white font-black uppercase flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  <span>Cancel &amp; Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
