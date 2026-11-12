import {
  BRAND_NAME,
  CURRENCY,
  DEFAULT_FOOTER_MESSAGE,
  KOT_STATION_LABEL,
  POWERED_BY,
  PRINT_BRIDGE_URL,
  RECEIPT_COLUMNS,
} from '../config/brandConfig';
import { PosOrderRecord, ReceiptStoreConfig } from '../types/pos';

export type PrintDocType = 'KOT' | 'INVOICE' | 'BOTH';
export type PrinterStatus = 'connected' | 'disconnected' | 'checking';
export interface PrintJob {
  job: 'INVOICE' | 'KOT';
  text: string;
}

const W = RECEIPT_COLUMNS;
const money = (v: number) => (Number.isFinite(v) ? v : 0).toFixed(3);
const center = (t: string) => {
  const s = t.slice(0, W);
  return ' '.repeat(Math.max(0, Math.floor((W - s.length) / 2))) + s;
};
const row = (l: string, r: string) => {
  const gap = Math.max(1, W - l.length - r.length);
  return l.slice(0, Math.max(0, W - r.length - 1)) + ' '.repeat(gap) + r;
};
const rule = (c = '-') => c.repeat(W);

function lineBlock(order: PosOrderRecord, withPrices: boolean): string[] {
  const out: string[] = [];
  order.items.forEach((it) => {
    out.push(
      withPrices
        ? row(`${it.quantity}x ${it.titleEn}`, money(it.unitPriceKwd * it.quantity))
        : `${it.quantity}x ${it.titleEn}`
    );
    it.comboSubItems?.forEach((s) => out.push(`   + ${s.quantity * it.quantity}x ${s.nameEn}`));
    const notes = it.customization?.kitchenNotes;
    if (notes) out.push(`   NOTE: ${notes}`);
  });
  return out;
}

export function buildReceiptText(order: PosOrderRecord, cfg: ReceiptStoreConfig): string {
  const voided = order.status === 'voided' || order.status === 'cancelled';
  const l: string[] = [];
  l.push(center((cfg.storeTitle || BRAND_NAME).toUpperCase()));
  if (cfg.addressLine1) l.push(center(cfg.addressLine1));
  if (cfg.addressLine2) l.push(center(cfg.addressLine2));
  if (cfg.phone) l.push(center(`TEL: ${cfg.phone}`));
  l.push(rule('='));
  if (voided) {
    l.push(center('*** VOIDED / CANCELLED BILL ***'));
    if (order.voidReason) l.push(center(`Reason: ${order.voidReason}`));
    l.push(rule());
  }
  l.push(row(`INVOICE: ${order.invoiceNo}`, `TOKEN #${order.tokenNo}`));
  l.push(new Date(order.createdAt).toLocaleString('en-GB'));
  l.push(`CHANNEL: ${order.channel.toUpperCase()}${order.tableNo ? ` / ${order.tableNo}` : ''}`);
  l.push(`CASHIER: ${order.cashierName}`);
  if (order.customerName) l.push(`CUSTOMER: ${order.customerName} ${order.customerPhone || ''}`.trim());
  l.push(rule());
  l.push(...lineBlock(order, true));
  l.push(rule());
  l.push(row('SUBTOTAL', money(order.subtotalKwd)));
  if (order.discountKwd > 0) l.push(row('DISCOUNT', `-${money(order.discountKwd)}`));
  if (order.deliveryFeeKwd > 0) l.push(row('DELIVERY', money(order.deliveryFeeKwd)));
  l.push(row(`TOTAL (${CURRENCY})`, money(voided ? -order.grandTotalKwd : order.grandTotalKwd)));
  l.push(row('PAYMENT', order.paymentMethod.toUpperCase().replace('_', ' ')));
  if (order.paymentMethod === 'cash' && order.cashTenderedKwd > 0) {
    l.push(row('CASH TENDERED', money(order.cashTenderedKwd)));
    l.push(row('CHANGE DUE', money(order.changeDueKwd)));
  }
  l.push(rule('='));
  l.push(center(cfg.footerMessage || DEFAULT_FOOTER_MESSAGE));
  if (cfg.websiteDomain) l.push(center(cfg.websiteDomain));
  l.push(center(POWERED_BY));
  return l.join('\n');
}

export function buildKotText(order: PosOrderRecord): string {
  const voided = order.status === 'voided' || order.status === 'cancelled';
  const l: string[] = [];
  l.push(center(voided ? '*** CANCELLED KOT ***' : '*** KITCHEN ORDER TICKET ***'));
  l.push(center(KOT_STATION_LABEL));
  l.push(rule('='));
  l.push(row(`TOKEN #${order.tokenNo}`, order.invoiceNo));
  l.push(`${order.channel.toUpperCase()}${order.tableNo ? ` / TABLE ${order.tableNo}` : ''}`);
  l.push(new Date(order.createdAt).toLocaleTimeString('en-GB'));
  l.push(rule());
  l.push(...lineBlock(order, false));
  l.push(rule('='));
  return l.join('\n');
}

export function buildPrintJobs(
  order: PosOrderRecord,
  docType: PrintDocType,
  cfg: ReceiptStoreConfig
): PrintJob[] {
  const jobs: PrintJob[] = [];
  if (docType === 'KOT' || docType === 'BOTH') jobs.push({ job: 'KOT', text: buildKotText(order) });
  if (docType === 'INVOICE' || docType === 'BOTH')
    jobs.push({ job: 'INVOICE', text: buildReceiptText(order, cfg) });
  return jobs;
}

/** True when running inside the Electron desktop app (preload exposes window.posDesktop). */
export const isDesktopApp = (): boolean =>
  typeof window !== 'undefined' && !!window.posDesktop?.isDesktop;

/** Direct printing is available via the desktop app (preferred) or a configured print bridge. */
export const isDirectPrintAvailable = (): boolean => isDesktopApp() || isPrintBridgeConfigured();

/** Silent print through the Electron main process (webContents.print silent:true). */
async function sendToDesktopPrinter(jobs: PrintJob[]): Promise<boolean> {
  try {
    for (const j of jobs) {
      const res = await window.posDesktop!.print({ text: j.text });
      if (!res.ok) {
        console.warn('[Desktop Print] failed:', res.error);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn('[Desktop Print] exception:', err);
    return false;
  }
}

/** Sends jobs to the best available silent printer path. Resolves false if none succeeded. */
export async function sendDirectPrint(jobs: PrintJob[]): Promise<boolean> {
  if (isDesktopApp()) return sendToDesktopPrinter(jobs);
  return sendToPrintBridge(jobs);
}

const bridgeBase = () => PRINT_BRIDGE_URL.trim().replace(/\/$/, '');
export const isPrintBridgeConfigured = (): boolean => bridgeBase().length > 0;

/** Sends jobs to the local print bridge (no dialog). Resolves false if the bridge is unreachable. */
export async function sendToPrintBridge(jobs: PrintJob[]): Promise<boolean> {
  if (!isPrintBridgeConfigured()) return false;
  try {
    for (const j of jobs) {
      const res = await fetch(`${bridgeBase()}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job: j.job, copies: 1, text: j.text, cut: true }),
      });
      if (!res.ok) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Printer health: bridge /health when configured; otherwise the system printer (browser) path is assumed ready. */
export async function checkPrinterStatus(): Promise<PrinterStatus> {
  if (isDesktopApp()) {
    try {
      const st = await window.posDesktop!.getPrinterStatus();
      return st.connected ? 'connected' : 'disconnected';
    } catch {
      return 'disconnected';
    }
  }
  if (!isPrintBridgeConfigured()) return 'connected';
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3000);
    const res = await fetch(`${bridgeBase()}/health`, { signal: ctl.signal });
    clearTimeout(t);
    return res.ok ? 'connected' : 'disconnected';
  } catch {
    return 'disconnected';
  }
}
