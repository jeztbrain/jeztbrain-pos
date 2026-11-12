/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PRINT_BRIDGE_URL?: string;
  readonly VITE_PRINTER_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


interface PosDesktopPrinter {
  name: string;
  displayName: string;
  isDefault: boolean;
  status: number;
}

interface PosUpdateStatus {
  state: 'disabled' | 'idle' | 'checking' | 'downloading' | 'downloaded' | 'not-available' | 'error';
  version: string | null;
  percent: number;
  message: string;
}

/** Exposed by electron/preload.cjs when running inside the desktop (.exe) app. */
interface PosDesktopApi {
  isDesktop: true;
  /** Runtime VITE_ / POS_ overrides loaded by the main process from .env files. */
  env?: Record<string, string>;
  getAppInfo: () => Promise<{ version: string; isDev: boolean; platform: string }>;
  listPrinters: () => Promise<{ ok: boolean; printers: PosDesktopPrinter[]; error?: string }>;
  getPrinterConfig: () => Promise<{ deviceName: string; paperWidthMm: number; copies: number }>;
  setPrinterConfig: (
    patch: Partial<{ deviceName: string; paperWidthMm: number; copies: number }>
  ) => Promise<{ deviceName: string; paperWidthMm: number; copies: number }>;
  getPrinterStatus: () => Promise<{ connected: boolean; deviceName?: string; reason?: string }>;
  getUpdateStatus: () => Promise<PosUpdateStatus>;
  checkForUpdates: () => Promise<PosUpdateStatus>;
  installUpdate: () => Promise<{ ok: boolean; error?: string }>;
  onUpdateStatus: (callback: (status: PosUpdateStatus) => void) => () => void;
  print: (payload: {
    text?: string;
    html?: string;
    deviceName?: string;
    copies?: number;
  }) => Promise<{ ok: boolean; error?: string }>;
}

interface Window {
  posDesktop?: PosDesktopApi;
}
