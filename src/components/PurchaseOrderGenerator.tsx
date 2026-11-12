import React, { useMemo, useState } from 'react';
import { Check, Copy, MessageCircle, ShoppingCart, X } from 'lucide-react';
import { BRAND_NAME } from '../config/brandConfig';
import { usePos } from '../context/PosContext';

interface PoLine {
  id: string;
  name: string;
  sku: string;
  unit: string;
  supplier: string;
  currentStock: number;
  suggestedQty: number;
}

/**
 * 1-click Purchase Order generator for low-stock raw ingredients.
 * Groups by supplier and formats WhatsApp-ready text (bold via *asterisks*).
 */
export const PurchaseOrderGenerator: React.FC = () => {
  const { lowStockIngredients, activeBranch, currentUser } = usePos();
  const [open, setOpen] = useState<boolean>(false);
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const lines: PoLine[] = useMemo(
    () =>
      lowStockIngredients.map((i) => {
        // Order back up to 2x the reorder level (never less than the reorder level itself).
        const target = Math.max(i.reorderLevel * 2 - i.currentStock, i.reorderLevel);
        return {
          id: i.id,
          name: i.name,
          sku: i.sku,
          unit: i.unit,
          supplier: i.supplier?.trim() || 'General Supplier',
          currentStock: i.currentStock,
          suggestedQty: Math.max(1, Math.ceil(target)),
        };
      }),
    [lowStockIngredients]
  );

  const bySupplier = useMemo(() => {
    const map = new Map<string, PoLine[]>();
    lines.forEach((l) => map.set(l.supplier, [...(map.get(l.supplier) || []), l]));
    return Array.from(map.entries());
  }, [lines]);

  const qtyOf = (l: PoLine): number => {
    const raw = qtyOverrides[l.id];
    const n = raw === undefined ? l.suggestedQty : parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const buildText = (supplier: string, items: PoLine[]): string => {
    const date = new Date().toLocaleDateString('en-GB');
    const out = [
      `*PURCHASE ORDER — ${BRAND_NAME}*`,
      `Branch: ${activeBranch.branchName || activeBranch.tenantName}`,
      `Date: ${date}`,
      `To: ${supplier}`,
      '',
      'Please supply the following items:',
    ];
    items
      .filter((l) => qtyOf(l) > 0)
      .forEach((l, idx) => out.push(`${idx + 1}. ${l.name} (${l.sku}) — *${qtyOf(l)} ${l.unit}*`));
    out.push('', `Ordered by: ${currentUser?.name || 'Store Manager'}`, 'Kindly confirm availability & delivery time. Thank you.');
    return out.join('\n');
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={lines.length === 0}
        title={lines.length === 0 ? 'No low-stock ingredients' : 'Generate WhatsApp purchase orders for low-stock items'}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-mono font-extrabold flex items-center gap-1.5 transition active:scale-95"
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        <span>Generate PO ({lines.length})</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-black text-base uppercase tracking-wide">
                  Purchase Orders &mdash; Low Stock
                </h3>
                <p className="text-xs font-mono text-emerald-100">
                  {lines.length} item(s) across {bySupplier.length} supplier(s). Adjust quantities, then send.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-4">
              {bySupplier.map(([supplier, items]) => {
                const text = buildText(supplier, items);
                return (
                  <div key={supplier} className="rounded-2xl border border-[#E8E1D5] overflow-hidden">
                    <div className="px-4 py-2.5 bg-[#FAF6F0] flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-extrabold text-sm text-stone-900">{supplier}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copy(supplier, text)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-50 text-xs font-mono font-bold flex items-center gap-1.5"
                        >
                          {copiedKey === supplier ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedKey === supplier ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5A] text-white text-xs font-mono font-extrabold flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Send via WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="text-[10px] text-stone-500 uppercase border-b border-stone-100">
                          <th className="py-1.5 px-3 text-left">Item</th>
                          <th className="py-1.5 px-3 text-right">On hand</th>
                          <th className="py-1.5 px-3 text-right w-32">Order qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {items.map((l) => (
                          <tr key={l.id}>
                            <td className="py-2 px-3">
                              <div className="font-bold text-stone-900">{l.name}</div>
                              <div className="text-[10px] text-stone-500">{l.sku}</div>
                            </td>
                            <td className="py-2 px-3 text-right text-rose-700 font-bold">
                              {l.currentStock} {l.unit}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={qtyOverrides[l.id] ?? String(l.suggestedQty)}
                                onChange={(e) =>
                                  setQtyOverrides((prev) => ({ ...prev, [l.id]: e.target.value }))
                                }
                                className="w-20 px-2 py-1 rounded-lg border border-stone-300 text-right font-bold focus:outline-none focus:border-emerald-600"
                              />
                              <span className="ml-1 text-stone-500">{l.unit}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <pre className="m-3 p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] whitespace-pre-wrap text-stone-700">
                      {text}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
