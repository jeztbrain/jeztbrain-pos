import React, { useEffect, useState } from 'react';
import { Printer, RefreshCw, X } from 'lucide-react';
import { usePos } from '../context/PosContext';

/** Desktop-only: choose the Windows printer used for silent 80mm printing and send a test slip. */
export const PrinterSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { showPrinterTestPrint } = usePrinterTest();
  const api = window.posDesktop;
  const [printers, setPrinters] = useState<PosDesktopPrinter[]>([]);
  const [deviceName, setDeviceName] = useState<string>('');
  const [paperWidth, setPaperWidth] = useState<number>(80);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const load = async () => {
    if (!api) return;
    setLoading(true);
    const [list, cfg] = await Promise.all([api.listPrinters(), api.getPrinterConfig()]);
    setPrinters(list.printers);
    setDeviceName(cfg.deviceName);
    setPaperWidth(cfg.paperWidthMm);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!api) return;
    await api.setPrinterConfig({ deviceName, paperWidthMm: paperWidth });
    setMsg('Printer saved.');
  };

  const test = async () => {
    if (!api) return;
    await api.setPrinterConfig({ deviceName, paperWidthMm: paperWidth });
    const res = await showPrinterTestPrint();
    setMsg(res.ok ? 'Test slip sent to the printer.' : `Test failed: ${res.error}`);
  };

  return (
    <div className="no-print fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden text-left">
        <div className="p-4 bg-[#1E293B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            <h3 className="font-display font-black text-sm uppercase tracking-wide">Thermal Printer Setup</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3 font-mono text-xs">
          <label className="block">
            <span className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Windows printer</span>
            <select
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-bold"
            >
              <option value="">System default printer</option>
              {printers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.displayName || p.name}
                  {p.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
            {!loading && printers.length === 0 && (
              <span className="block mt-1 text-rose-700 font-bold">No printers found. Install the printer driver in Windows.</span>
            )}
          </label>

          <label className="block">
            <span className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Paper width (mm)</span>
            <select
              value={paperWidth}
              onChange={(e) => setPaperWidth(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-bold"
            >
              <option value={80}>80 mm</option>
              <option value={58}>58 mm</option>
            </select>
          </label>

          {msg && <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 font-bold">{msg}</div>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={load} className="px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Rescan
            </button>
            <button type="button" onClick={test} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold uppercase">
              Test Print
            </button>
            <button type="button" onClick={save} className="flex-1 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-extrabold uppercase">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Sends a short test slip through the same silent path used for bills. */
function usePrinterTest() {
  const { receiptConfig } = usePos();
  return {
    showPrinterTestPrint: async (): Promise<{ ok: boolean; error?: string }> => {
      const api = window.posDesktop;
      if (!api) return { ok: false, error: 'Desktop app required' };
      const title = (receiptConfig.storeTitle || 'POS').toUpperCase();
      const text = [title, '*** PRINTER TEST ***', new Date().toLocaleString('en-GB'), 'If you can read this,', 'silent printing works.', ''].join('\n');
      return api.print({ text });
    },
  };
}
