import React, { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { BRAND_TAGLINE, POWERED_BY, SHORT_NAME } from '../config/brandConfig';
import { usePos } from '../context/PosContext';

/**
 * One-time administrator setup, shown only when no staff account exists anywhere
 * (Supabase `staff_users` empty/missing and nothing saved on this terminal).
 */
export const FirstRunAdminSetup: React.FC = () => {
  const { createInitialAdmin, staffDirectory, refetchCloudCatalog } = usePos();
  const [name, setName] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createInitialAdmin({ name, pin, password });
    if (!res.ok) setError(res.error || 'Could not create the administrator account.');
  };

  const inputCls =
    'w-full px-3.5 py-3 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-sm font-mono text-[#1E293B] focus:outline-none focus:border-[#C8102E]';

  return (
    <div className="min-h-screen w-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-4 text-left select-none">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E1D5] shadow-xl p-6 sm:p-8 space-y-5">
        <div className="text-center">
          <div className="font-display font-black text-3xl tracking-tight text-[#C8102E] leading-none">{SHORT_NAME}</div>
          {BRAND_TAGLINE && (
            <div className="text-xs font-black tracking-widest text-[#EAB308] uppercase mt-1.5">{BRAND_TAGLINE}</div>
          )}
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <ShieldCheck className="w-5 h-5 shrink-0 text-amber-700" />
          <p className="font-mono leading-relaxed">
            {staffDirectory.status === 'table_missing'
              ? 'Connected to Supabase, but the staff_users table does not exist in this project (run supabase_staff_users.sql to create it).'
              : 'Connected to Supabase, but no usable staff accounts came back from staff_users. Either the table is empty, rows have no PIN, or Row Level Security is hiding them from the app key (add a SELECT policy - see supabase_staff_users.sql).'}{' '}
            Create the administrator account to get started. It is stored on this terminal; more staff can be added from the ERP.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3" autoComplete="off">
          <label className="block text-[11px] font-mono font-bold text-stone-600 uppercase">
            Administrator name
            <input value={name} onChange={(e) => { setName(e.target.value); setError(null); }} className={`${inputCls} mt-1`} />
          </label>
          <label className="block text-[11px] font-mono font-bold text-stone-600 uppercase">
            PIN (4-6 digits)
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(null); }}
              className={`${inputCls} mt-1 tracking-widest`}
            />
          </label>
          <label className="block text-[11px] font-mono font-bold text-stone-600 uppercase">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className={`${inputCls} mt-1`}
            />
          </label>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">{error}</div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-display font-extrabold uppercase tracking-wider text-sm flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Create Administrator &amp; Sign In
          </button>
        </form>

        <button
          type="button"
          onClick={() => refetchCloudCatalog()}
          className="w-full text-center text-[11px] font-mono text-stone-500 hover:text-stone-800"
        >
          Tap to re-check Supabase for existing accounts
        </button>

        <div className="pt-3 border-t border-[#E8E1D5] text-center text-xs font-mono font-bold tracking-wider text-stone-600">
          {POWERED_BY}
        </div>
      </div>
    </div>
  );
};
