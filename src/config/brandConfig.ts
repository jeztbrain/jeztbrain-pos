/**
 * WHITE-LABEL BRAND CONFIGURATION (POS & ERP — Powered by JeztBrain)
 * -----------------------------------------------------------------
 * Edit ONLY this file to rebrand the entire POS for a new client:
 * header, login portal, thermal receipts, KOTs, print documents, browser tab title and
 * all currency labels read from these constants.
 *
 * Supabase credentials stay in `.env` (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
 */

/** Full legal / marketing brand name (receipts, tab title). */
export const BRAND_NAME = 'CHIKARRO FRIED CHICKEN';

/** Short brand name shown in compact UI (header, login, kitchen tickets). */
export const SHORT_NAME = 'CHIKARRO';

/** Currency code shown across UI, receipts and reports. Amounts use 3 decimals (KWD). */
export const CURRENCY = 'KWD';

/** Decimal places for money values (KWD = 3). */
export const CURRENCY_DECIMALS = 3;

/** Sub-title shown under the short name: whatever follows SHORT_NAME in BRAND_NAME. */
export const BRAND_TAGLINE: string = BRAND_NAME.toUpperCase().startsWith(SHORT_NAME.toUpperCase())
  ? BRAND_NAME.slice(SHORT_NAME.length).trim()
  : '';

/** Product line shown in footers. */
export const PRODUCT_NAME = `${SHORT_NAME} POS & ERP`;
export const POWERED_BY = 'Powered by JeztBrain';

/** Default receipt footer (can be overridden per-store in ERP > Receipt Customizer). */
export const DEFAULT_FOOTER_MESSAGE = `THANK YOU FOR DINING WITH ${SHORT_NAME}!`;

/** Kitchen-ticket header line. */
export const KOT_STATION_LABEL = `${SHORT_NAME} FRY & PREP STATION`;

/** localStorage namespace: change per client so cached state never leaks between brands. */
export const STORAGE_NAMESPACE = `JEZTBRAIN_${SHORT_NAME.replace(/\s+/g, '_')}_POS_ERP_STATE_V3`;

/**
 * Direct (silent) 80mm printing.
 * - PRINT_BRIDGE_URL: optional local print bridge (e.g. QZ Tray / node ESC-POS bridge).
 *   When set, receipts and KOTs are POSTed as ESC/POS-ready text and never open a dialog.
 *   Expected endpoints:  POST {url}/print  (JSON {job, copies, text})   GET {url}/health
 * - When empty, the browser print path is used. Launch Chrome/Edge with `--kiosk-printing`
 *   to make that path fully silent on the default 80mm printer.
 */
export const PRINT_BRIDGE_URL: string = (import.meta.env.VITE_PRINT_BRIDGE_URL as string) || '';
export const PRINTER_NAME: string = (import.meta.env.VITE_PRINTER_NAME as string) || '80mm Thermal';
export const RECEIPT_COLUMNS = 42;

/** Arabic brand name (used in bilingual UI copy and receipt subtitle). */
export const BRAND_NAME_AR = 'شيكارو';
