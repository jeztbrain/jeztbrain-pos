/**
 * Preload (CommonJS, sandboxed): exposes a minimal, explicit API to the React app as
 * window.posDesktop. No Node or Electron objects leak into the page.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('posDesktop', {
  isDesktop: true,
  // Runtime VITE_ and POS_ overrides read from .env files next to the .exe / in userData.
  env: ipcRenderer.sendSync('env:get-sync') || {},
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  listPrinters: () => ipcRenderer.invoke('printer:list'),
  getPrinterConfig: () => ipcRenderer.invoke('printer:get-config'),
  setPrinterConfig: (patch) => ipcRenderer.invoke('printer:set-config', patch),
  getPrinterStatus: () => ipcRenderer.invoke('printer:status'),
  /** payload: { text?: string, html?: string, deviceName?: string, copies?: number } */
  print: (payload) => ipcRenderer.invoke('printer:print', payload),
  // Auto-update: status = { state, version, percent, message }
  // state: disabled | idle | checking | downloading | downloaded | not-available | error
  getUpdateStatus: () => ipcRenderer.invoke('updater:get-status'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  onUpdateStatus: (callback) => {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on('updater:status', handler);
    return () => ipcRenderer.removeListener('updater:status', handler);
  },
});
