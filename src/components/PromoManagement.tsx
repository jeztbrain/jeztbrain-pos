import React, { useState } from 'react';
import { BadgePercent, Power, Users } from 'lucide-react';
import { CURRENCY } from '../config/brandConfig';
import { usePos } from '../context/PosContext';
import { PromoCode } from '../types/pos';
import { formatDateTimeKW, formatKWD } from '../utils/formatters';

/** Admin: create / activate / deactivate promo codes (stored in Supabase `promo_codes`; never deleted). */
export const PromoManagement: React.FC = () => {
  const { promoCodes, createPromoCode } = usePos();

  const [code, setCode] = useState<string>('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<string>('');
  const [minOrder, setMinOrder] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [expires, setExpires] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanCode = code.trim().toUpperCase();
    const val = parseFloat(value);
    if (!/^[A-Z0-9_-]{3,32}$/.test(cleanCode)) {
      setError('Code must be 3-32 characters: letters, numbers, - or _');
      return;
    }
    if (!val || val <= 0) {
      setError('Enter a discount value greater than zero');
      return;
    }
    if (type === 'percentage' && val > 100) {
      setError('Percentage cannot exceed 100');
      return;
    }
    if (promoCodes.some((p) => p.code === cleanCode)) {
      setError('A promo with this code already exists');
      return;
    }
    setSaving(true);
    const ok = await createPromoCode({
      code: cleanCode,
      type,
      value: val,
      minOrderKwd: parseFloat(minOrder) || 0,
      maxUses: maxUses.trim() ? Math.max(1, parseInt(maxUses, 10) || 1) : null,
      expiresAt: expires ? new Date(`${expires}T23:59:59`).toISOString() : null,
      isActive: true,
    });
    setSaving(false);
    if (ok) {
      setCode('');
      setValue('');
      setMinOrder('');
      setMaxUses('');
      setExpires('');
    }
  };

  const toggleActive = (p: PromoCode) =>
    createPromoCode({
      id: p.id,
      code: p.code,
      type: p.type,
      value: p.value,
      minOrderKwd: p.minOrderKwd,
      maxUses: p.maxUses,
      expiresAt: p.expiresAt,
      isActive: !p.isActive,
    });

  const inputCls =
    'w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#C8102E]';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      <form
        onSubmit={submit}
        className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-3 self-start"
      >
        <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
          <BadgePercent className="w-4 h-4 text-[#C8102E]" />
          Create Promo Code
        </h3>

        <label className="block text-[11px] font-mono font-bold text-slate-600">
          CODE
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. WELCOME10"
            className={`${inputCls} mt-1 uppercase`}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          {(['percentage', 'fixed'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2 rounded-xl text-xs font-mono font-extrabold border transition ${
                type === t
                  ? 'bg-[#C8102E] text-white border-[#C8102E]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {t === 'percentage' ? 'Percentage %' : `Fixed ${CURRENCY}`}
            </button>
          ))}
        </div>

        <label className="block text-[11px] font-mono font-bold text-slate-600">
          VALUE ({type === 'percentage' ? '%' : CURRENCY})
          <input
            type="number"
            step="any"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-[11px] font-mono font-bold text-slate-600">
            MIN ORDER ({CURRENCY})
            <input
              type="number"
              step="any"
              min="0"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="0.000"
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="block text-[11px] font-mono font-bold text-slate-600">
            MAX USES
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              className={`${inputCls} mt-1`}
            />
          </label>
        </div>

        <label className="block text-[11px] font-mono font-bold text-slate-600">
          EXPIRES (optional)
          <input
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </label>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] disabled:opacity-50 text-white text-xs font-display font-extrabold uppercase tracking-wider"
        >
          {saving ? 'Saving...' : 'Save Promo Code'}
        </button>
      </form>

      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5">
        <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-3">
          Promo Codes ({promoCodes.length})
        </h3>
        {promoCodes.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400">
            No promo codes yet. Create one to enable &ldquo;Apply Promo&rdquo; at the POS cart.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-200 text-left">
                  <th className="py-2 px-2">Code</th>
                  <th className="py-2 px-2">Discount</th>
                  <th className="py-2 px-2">Min order</th>
                  <th className="py-2 px-2">Used</th>
                  <th className="py-2 px-2">Expires</th>
                  <th className="py-2 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promoCodes.map((p) => {
                  const expired = p.expiresAt ? new Date(p.expiresAt).getTime() < Date.now() : false;
                  const exhausted = p.maxUses !== null && p.usedCount >= p.maxUses;
                  return (
                    <tr key={p.id} className={p.isActive && !expired && !exhausted ? '' : 'opacity-60'}>
                      <td className="py-2.5 px-2 font-extrabold text-slate-900">{p.code}</td>
                      <td className="py-2.5 px-2 font-bold text-[#C8102E]">
                        {p.type === 'percentage' ? `${p.value}%` : `${formatKWD(p.value)}`}
                      </td>
                      <td className="py-2.5 px-2">{p.minOrderKwd > 0 ? formatKWD(p.minOrderKwd) : '—'}</td>
                      <td className="py-2.5 px-2">
                        {p.usedCount}
                        {p.maxUses !== null ? ` / ${p.maxUses}` : ''}
                      </td>
                      <td className="py-2.5 px-2">{p.expiresAt ? formatDateTimeKW(p.expiresAt) : '—'}</td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => toggleActive(p)}
                          title={p.isActive ? 'Deactivate' : 'Activate'}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase inline-flex items-center gap-1 ${
                            p.isActive && !expired && !exhausted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {expired ? 'Expired' : exhausted ? 'Used up' : p.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/** CRM: customers auto-saved from POS bills with lifetime orders / spend (Supabase `customers`). */
export const CustomersCrm: React.FC = () => {
  const { customers } = usePos();
  const [q, setQ] = useState<string>('');
  const list = customers.filter((c) => {
    const s = q.trim().toLowerCase();
    return !s || c.name.toLowerCase().includes(s) || c.phone.includes(s);
  });
  const totalSpent = customers.reduce((s, c) => s + c.totalSpentKwd, 0);
  const repeat = customers.filter((c) => c.totalOrders > 1).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-[#C8102E]" />
          Customers &amp; Loyalty ({customers.length})
        </h3>
        <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
          <span>
            Lifetime spend: <strong className="text-slate-900">{formatKWD(totalSpent)}</strong>
          </span>
          <span>
            Repeat customers: <strong className="text-slate-900">{repeat}</strong>
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or phone..."
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono w-52 focus:outline-none focus:border-[#C8102E]"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400">
          No customers yet. Customers are saved automatically when a bill is paid with a phone number.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-200 text-left">
                <th className="py-2 px-2">Customer</th>
                <th className="py-2 px-2">Phone</th>
                <th className="py-2 px-2">Address</th>
                <th className="py-2 px-2 text-right">Orders</th>
                <th className="py-2 px-2 text-right">Total spent</th>
                <th className="py-2 px-2 text-right">Avg ticket</th>
                <th className="py-2 px-2">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 px-2 font-bold text-slate-900">{c.name || '—'}</td>
                  <td className="py-2.5 px-2">{c.phone}</td>
                  <td className="py-2.5 px-2 max-w-[220px] truncate" title={c.address}>
                    {c.address || '—'}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">{c.totalOrders}</td>
                  <td className="py-2.5 px-2 text-right font-extrabold text-[#C8102E]">
                    {formatKWD(c.totalSpentKwd)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {formatKWD(c.totalOrders > 0 ? c.totalSpentKwd / c.totalOrders : 0)}
                  </td>
                  <td className="py-2.5 px-2">{c.lastOrderAt ? formatDateTimeKW(c.lastOrderAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
