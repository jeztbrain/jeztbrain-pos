import React, { useState } from 'react';
import { Banknote, Delete, LogOut } from 'lucide-react';
import { CURRENCY, SHORT_NAME } from '../config/brandConfig';
import { usePos } from '../context/PosContext';

/**
 * Blocking "Opening Cash Balance" prompt. Shown after login whenever no shift is open, so every
 * shift starts with a counted drawer float that the Z-report later reconciles against.
 */
export const OpeningCashModal: React.FC = () => {
  const { currentUser, openShift, logout } = usePos();
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const press = (k: string) => {
    setError(null);
    setAmount((prev) => {
      if (k === 'back') return prev.slice(0, -1);
      if (k === '.') return prev.includes('.') ? prev : `${prev || '0'}.`;
      const next = prev + k;
      const dec = next.split('.')[1];
      return dec && dec.length > 3 ? prev : next.length > 9 ? prev : next;
    });
  };

  const confirm = () => {
    const val = parseFloat(amount);
    if (amount === '' || !Number.isFinite(val) || val < 0) {
      setError('Enter the counted cash in the drawer (0.000 if empty).');
      return;
    }
    openShift(val);
  };

  return (
    <div className="no-print fixed inset-0 z-[70] bg-[#1E293B]/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden text-left">
        <div className="p-4 bg-[#C8102E] text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-black text-base uppercase tracking-wide">
              Open Shift &mdash; Opening Cash
            </h2>
            <p className="text-xs font-mono text-rose-100">
              {SHORT_NAME} • {currentUser?.name}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs font-mono text-stone-600">
            Count the cash in the drawer and enter the Opening Cash Balance. It is used to calculate the
            expected drawer cash at shift close.
          </p>

          <div className="px-4 py-3 rounded-2xl bg-stone-50 border-2 border-stone-200 text-right">
            <span className="font-mono font-black text-3xl text-stone-900 tabular-nums">
              {amount === '' ? '0.000' : amount}
            </span>
            <span className="ml-2 font-mono font-bold text-stone-500">{CURRENCY}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                className="min-h-[48px] rounded-xl bg-white hover:bg-stone-100 border border-stone-300 font-mono font-black text-lg text-stone-900 active:scale-95 transition flex items-center justify-center"
              >
                {k === 'back' ? <Delete className="w-5 h-5" /> : k}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              className="flex-1 py-3 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-display font-extrabold uppercase tracking-wider text-sm active:scale-[0.99]"
            >
              Start Shift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
