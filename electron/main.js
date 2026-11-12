/**
 * CHIKARRO POS & ERP (Powered by JeztBrain) - Electron main process.
 *
 * - Maximized, menu-less kiosk-style window (set POS_KIOSK=1 for true full-screen kiosk).
 * - Dev: loads the Vite dev server. Prod: loads the built static files from dist/.
 * - IPC: silent direct-to-hardware 80mm printing (no system print dialog).
 *
 * This file is an ES module because package.json declares "type": "module".
 * The preload script is CommonJS (preload.cjs) because sandboxed preloads must be.
 */
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import dotenv from 'dotenv';
import isDev from 'electron-is-dev';
import electronUpdater from 'electron-updater'; // CommonJS package: default import in ESM

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
const KIOSK = process.env.POS_KIOSK === '1';
const PRINT_TIMEOUT_MS = 20000;

let mainWindow = null;

// ---------------------------------------------------------------------------
// Diagnostics log (userData/pos-desktop.log) - first place to look when login/sync fails
// ---------------------------------------------------------------------------
const logPath = () => path.join(app.getPath('userData'), 'pos-desktop.log');
function log(...parts) {
  const line = `[${new Date().toISOString()}] ${parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ')}
`;
  try {
    fs.mkdirSync(path.dirname(logPath()), { recursive: true });
    fs.appendFileSync(logPath(), line, 'utf8');
  } catch {
    // never let logging crash the POS
  }
}
process.on('uncaughtException', (err) => log('uncaughtException', String(err?.stack || err)));
process.on('unhandledRejection', (err) => log('unhandledRejection', String(err?.stack || err)));

// ---------------------------------------------------------------------------
// Runtime environment (.env)
// Vite already inlines VITE_* values from the project .env at BUILD time. This adds a RUNTIME
// override so the installed .exe can be pointed at another Supabase project (white-label /
// per-client setup) without rebuilding. Files read, later ones win:
//   1. <folder of the .exe>/.env      2. <userData>/.env      3. real environment variables
// Only VITE_* and POS_* keys are exposed to the renderer.
// ---------------------------------------------------------------------------
function loadRuntimeEnv() {
  const files = [
    path.join(path.dirname(process.execPath), '.env'),
    path.join(app.getPath('userData'), '.env'),
  ];
  if (isDev) files.unshift(path.join(__dirname, '..', '.env'));
  const merged = {};
  for (const f of files) {
    try {
      if (fs.existsSync(f)) {
        Object.assign(merged, dotenv.parse(fs.readFileSync(f)));
        log('env: loaded', f);
      }
    } catch (err) {
      log('env: failed to read', f, String(err));
    }
  }
  for (const [k, v] of Object.entries(process.env)) {
    if (/^(VITE_|POS_)/.test(k) && v) merged[k] = v;
  }
  const exposed = {};
  for (const [k, v] of Object.entries(merged)) {
    if (/^(VITE_|POS_)/.test(k)) exposed[k] = String(v).trim();
  }
  return exposed;
}
let runtimeEnv = {};

// ---------------------------------------------------------------------------
// Printer configuration (persisted in the user data directory)
// ---------------------------------------------------------------------------
const configPath = () => path.join(app.getPath('userData'), 'printer-config.json');

function readPrinterConfig() {
  const defaults = {
    // Empty deviceName = the Windows default printer. Set the exact Windows printer name,
    // e.g. "EPSON TM-T88VI Receipt", from the POS or via the POS_PRINTER_NAME env var.
    deviceName: process.env.POS_PRINTER_NAME || '',
    paperWidthMm: 80,
    copies: 1,
  };
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(configPath(), 'utf8')) };
  } catch {
    return defaults;
  }
}

function writePrinterConfig(patch) {
  const next = { ...readPrinterConfig(), ...patch };
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

// ---------------------------------------------------------------------------
// Main window
// ---------------------------------------------------------------------------
function createWindow() {
  Menu.setApplicationMenu(null); // hide the default Windows menu bar

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    show: false,
    backgroundColor: '#FAF6F0',
    autoHideMenuBar: true,
    fullscreen: KIOSK,
    kiosk: KIOSK,
    title: 'CHIKARRO POS',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev,
      // Security: keep Chromium's same-origin policy ON. Supabase REST/Realtime send
      // Access-Control-Allow-Origin: * so no CORS workaround (webSecurity:false) is needed.
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.once('ready-to-show', () => {
    if (!KIOSK) mainWindow.maximize();
    mainWindow.show();
  });

  // Keep the POS on its own origin; open any external link in the default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const internal = isDev ? url.startsWith(DEV_SERVER_URL) : url.startsWith('file://');
    if (!internal) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  // Block accidental reloads and DevTools shortcuts in production.
  if (!isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      const k = input.key.toLowerCase();
      if (
        input.type === 'keyDown' &&
        (k === 'f12' || k === 'f5' || (input.control && input.shift && k === 'i') || (input.control && k === 'r'))
      ) {
        event.preventDefault();
      }
    });
  }

  // Surface renderer problems (CORS/CSP/network/auth) in the diagnostics log.
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => log('did-fail-load', code, desc, url));
  mainWindow.webContents.on('render-process-gone', (_e, details) => log('render-process-gone', details));
  mainWindow.webContents.on('console-message', (event) => {
    const { level, message } = event;
    const isError = level === 3 || level === 'error';
    const isWarn = level === 2 || level === 'warning';
    if (isError || isWarn) log('renderer', isError ? 'error' : 'warn', String(message).slice(0, 500));
  });
  mainWindow.webContents.once('did-finish-load', () => log('window loaded', mainWindow?.webContents.getURL()));

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// Auto-updates (electron-updater + GitHub Releases)
// - Checks on startup (after the POS has loaded) and every 4 hours.
// - Downloads in the background; the cashier keeps working.
// - When ready, the renderer shows "Restart now / Later". If they pick Later the update is
//   installed automatically the next time the app is closed.
// Packaged builds only: a dev run has no app-update.yml.
// ---------------------------------------------------------------------------
const { autoUpdater } = electronUpdater;
const UPDATE_CHECK_DELAY_MS = 10 * 1000;
const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
let updateStatus = { state: app.isPackaged ? 'idle' : 'disabled', version: null, percent: 0, message: '' };

function setUpdateStatus(patch) {
  updateStatus = { ...updateStatus, ...patch };
  log('updater', updateStatus);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', updateStatus);
  }
}

async function checkForUpdates(manual = false) {
  if (!app.isPackaged) {
    setUpdateStatus({ state: 'disabled', message: 'Updates are disabled in development builds.' });
    return updateStatus;
  }
  if (['checking', 'downloading', 'downloaded'].includes(updateStatus.state)) return updateStatus;
  try {
    await autoUpdater.checkForUpdates();
  } catch (err) {
    setUpdateStatus({ state: 'error', message: String(err?.message || err).slice(0, 300) });
  }
  return updateStatus;
}

function initAutoUpdater() {
  if (!app.isPackaged) return;
  autoUpdater.logger = { info: (m) => log('updater:info', m), warn: (m) => log('updater:warn', m), error: (m) => log('updater:error', m), debug: () => {} };
  autoUpdater.autoDownload = true; // seamless: fetch in the background
  autoUpdater.autoInstallOnAppQuit = true; // "Later" still installs on next close
  autoUpdater.allowPrerelease = false;

  autoUpdater.on('checking-for-update', () => setUpdateStatus({ state: 'checking', message: 'Checking for updates...' }));
  autoUpdater.on('update-available', (info) =>
    setUpdateStatus({ state: 'downloading', version: info.version, percent: 0, message: `Downloading version ${info.version}...` })
  );
  autoUpdater.on('update-not-available', () =>
    setUpdateStatus({ state: 'not-available', message: 'You are on the latest version.' })
  );
  autoUpdater.on('download-progress', (p) =>
    setUpdateStatus({ state: 'downloading', percent: Math.round(p.percent || 0), message: 'Downloading update...' })
  );
  autoUpdater.on('update-downloaded', (info) =>
    setUpdateStatus({ state: 'downloaded', version: info.version, percent: 100, message: `Version ${info.version} is ready to install.` })
  );
  autoUpdater.on('error', (err) =>
    setUpdateStatus({ state: 'error', message: String(err?.message || err).slice(0, 300) })
  );

  setTimeout(() => checkForUpdates(), UPDATE_CHECK_DELAY_MS);
  setInterval(() => checkForUpdates(), UPDATE_CHECK_INTERVAL_MS);
}

ipcMain.handle('updater:get-status', () => updateStatus);
ipcMain.handle('updater:check', () => checkForUpdates(true));
ipcMain.handle('updater:install', () => {
  if (updateStatus.state !== 'downloaded') return { ok: false, error: 'No downloaded update' };
  // isSilent=true: no installer UI; forceRunAfter=true: relaunch the POS when finished.
  setImmediate(() => autoUpdater.quitAndInstall(true, true));
  return { ok: true };
});

// Synchronous so the renderer can configure the Supabase client at module-load time.
ipcMain.on('env:get-sync', (event) => {
  event.returnValue = runtimeEnv;
});

// Single instance: a second launch focuses the running POS instead of opening another.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    runtimeEnv = loadRuntimeEnv();
    log('app ready', { version: app.getVersion(), packaged: app.isPackaged, envKeys: Object.keys(runtimeEnv) });
    createWindow();
    initAutoUpdater();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

// ---------------------------------------------------------------------------
// Silent thermal printing (IPC)
// ---------------------------------------------------------------------------
const escapeHtml = (t) =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Wraps plain 80mm receipt text (fixed-width columns) in a thermal-friendly HTML page. */
function textToReceiptHtml(text, paperWidthMm) {
  const printable = Math.max(48, paperWidthMm - 8);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: ${paperWidthMm}mm auto; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { width: ${printable}mm; padding: 2mm 2mm 6mm 2mm; }
    pre { margin: 0; font-family: Consolas, 'Courier New', monospace; font-size: 11px;
          line-height: 1.25; color: #000; white-space: pre-wrap; word-break: break-word; }
  </style></head><body><pre>${escapeHtml(text)}</pre></body></html>`;
}

/**
 * Prints one document through a hidden window with { silent: true } so Windows never shows
 * the print dialog. Resolves { ok, error? }.
 */
function printSilently({ html, text, deviceName, copies }) {
  const cfg = readPrinterConfig();
  const target = (deviceName ?? cfg.deviceName ?? '').trim();
  const body = html || textToReceiptHtml(text || '', cfg.paperWidthMm);

  return new Promise((resolve) => {
    const win = new BrowserWindow({
      show: false,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
    });
    let settled = false;
    let timer = null;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!win.isDestroyed()) win.destroy();
      resolve(result);
    };
    timer = setTimeout(() => finish({ ok: false, error: 'Print timed out' }), PRINT_TIMEOUT_MS);

    win.webContents.once('did-fail-load', (_e, _code, desc) =>
      finish({ ok: false, error: `Render failed: ${desc}` })
    );
    win.webContents.once('did-finish-load', () => {
      win.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: target || undefined, // undefined = system default printer
          copies: Math.max(1, Number(copies || cfg.copies || 1)),
          margins: { marginType: 'none' },
        },
        (success, failureReason) =>
          finish(success ? { ok: true } : { ok: false, error: failureReason || 'Print failed' })
      );
    });
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(body));
  });
}

async function listPrinters() {
  const wc = mainWindow?.webContents ?? BrowserWindow.getAllWindows()[0]?.webContents;
  if (!wc) return [];
  const printers = await wc.getPrintersAsync();
  return printers.map((p) => ({
    name: p.name,
    displayName: p.displayName,
    isDefault: !!p.isDefault,
    status: p.status,
  }));
}

ipcMain.handle('printer:list', async () => {
  try {
    return { ok: true, printers: await listPrinters() };
  } catch (err) {
    return { ok: false, printers: [], error: String(err?.message || err) };
  }
});

ipcMain.handle('printer:get-config', () => readPrinterConfig());

ipcMain.handle('printer:set-config', (_e, patch) => {
  const clean = {};
  if (typeof patch?.deviceName === 'string') clean.deviceName = patch.deviceName.trim();
  if (Number.isFinite(patch?.paperWidthMm)) clean.paperWidthMm = Math.min(112, Math.max(48, patch.paperWidthMm));
  if (Number.isFinite(patch?.copies)) clean.copies = Math.min(5, Math.max(1, Math.round(patch.copies)));
  return writePrinterConfig(clean);
});

/** Connected = the configured printer exists in Windows (or, if none configured, a default exists). */
ipcMain.handle('printer:status', async () => {
  try {
    const cfg = readPrinterConfig();
    const printers = await listPrinters();
    if (printers.length === 0) return { connected: false, reason: 'No printers installed' };
    if (cfg.deviceName) {
      const found = printers.find((p) => p.name === cfg.deviceName);
      return found
        ? { connected: true, deviceName: found.name }
        : { connected: false, reason: `Printer "${cfg.deviceName}" not found` };
    }
    const def = printers.find((p) => p.isDefault) || printers[0];
    return { connected: true, deviceName: def.name };
  } catch (err) {
    return { connected: false, reason: String(err?.message || err) };
  }
});

ipcMain.handle('printer:print', async (_e, payload) => {
  if (!payload || (typeof payload.text !== 'string' && typeof payload.html !== 'string')) {
    return { ok: false, error: 'Invalid print payload' };
  }
  return printSilently({
    text: payload.text,
    html: payload.html,
    deviceName: typeof payload.deviceName === 'string' ? payload.deviceName : undefined,
    copies: payload.copies,
  });
});

ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  isDev,
  platform: process.platform,
}));
