import React, { useState } from 'react';
import { Delete, KeyRound, ShieldAlert, X } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { playTerminalSound } from '../utils/formatters';

export const ManagerOverrideModal: React.FC = () => {
  const { overrideModalConfig, closeManagerOverride, verifyManagerPin } = usePos();

  const [pin, setPin] = useState<string>('');
  const [reason, setReason] = useState<string>('Manager Approved VIP / Courtesy');
  const [error, setError] = useState<string | null>(null);

  if (!overrideModalConfig) return null;

  const handleDigit = (d: string) => {
    playTerminalSound('tap');
    setError(null);
    if (pin.length < 4) {
      setPin((prev) => prev + d);
    }
  };

  const handleAuthorize = (overridePin?: string) => {
    const codeToTest = overridePin ?? pin;
    const mgr = verifyManagerPin(codeToTest);
    if (!mgr) {
      playTerminalSound('error');
      setError('Invalid Manager/Admin PIN.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter an authorization note for the audit log.');
      return;
    }
    playTerminalSound('paid');
    overrideModalConfig.onAuthorized(mgr, reason.trim());
    setPin('');
    setError(null);
    closeManagerOverride();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-slate-900">
                Manager Authorization Required
              </h3>
              <p className="text-xs font-mono text-slate-500 font-semibold">
                {overrideModalConfig.title}
              </p>
            </div>
          </div>
          <button
            onClick={closeManagerOverride}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Reason Input */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1.5">
              {overrideModalConfig.reasonPrompt}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter note for audit log..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#C8102E] focus:bg-white"
            />
          </div>


          {/* 4-Digit Display */}
          <div className="flex items-center justify-center gap-3 py-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center font-mono text-xl font-extrabold ${
                  pin.length > i
                    ? 'bg-[#C8102E] border-[#C8102E] text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {pin.length > i ? '•' : ''}
              </div>
            ))}
          </div>

          {/* Touch PIN Pad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(d)}
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 font-mono text-xl font-bold text-slate-900 shadow-sm transition"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-mono text-xs font-bold text-slate-600"
            >
              CLR
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 font-mono text-xl font-bold text-slate-900 shadow-sm transition"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono font-bold text-rose-700 text-center">
              {error}
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={closeManagerOverride}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleAuthorize()}
              className="flex-1 py-3 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-display font-extrabold text-xs uppercase tracking-wider shadow-sm transition"
            >
              Authorize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
