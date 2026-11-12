import React, { useState } from 'react';
import { Check, Minus, Plus, Utensils, X } from 'lucide-react';
import { usePos } from '../context/PosContext';
import {
  DRINK_SELECTION_OPTIONS,
  PAID_ADDON_OPTIONS,
  SIDE_UPGRADE_OPTIONS,
} from '../data/seedData';
import {
  CartItemCustomization,
  ComboOffer,
  DrinkOption,
  MenuItem,
  PaidAddonOption,
  PrepStyle,
  SideUpgradeOption,
} from '../types/pos';
import { formatKWD, playTerminalSound, roundKWD } from '../utils/formatters';

interface Props {
  targetItem: MenuItem | null;
  targetCombo: ComboOffer | null;
  onClose: () => void;
  onConfirmItem?: (item: MenuItem, customization: CartItemCustomization, qty: number) => void;
  onConfirmCombo?: (combo: ComboOffer, customization: CartItemCustomization, qty: number) => void;
  onConfirm?: (customization: CartItemCustomization) => void;
}

const QUICK_KITCHEN_NOTES = [
  '** SPICY **',
  'NO MAYO',
  'EXTRA CRISPY',
  'NO LETTUCE',
  'ALL BREAST',
  'EXTRA VOLCANO',
];

export const ItemCustomizationModal: React.FC<Props> = ({
  targetItem,
  targetCombo,
  onClose,
  onConfirmItem,
  onConfirmCombo,
  onConfirm,
}) => {
  const { language } = usePos();
  const isEnglish = language === 'en';

  const isCombo = Boolean(targetCombo) || Boolean(targetItem?.isCombo);

  const [prepStyle, setPrepStyle] = useState<PrepStyle>('Regular');
  const [sideChoice, setSideChoice] = useState<SideUpgradeOption | null>(
    isCombo ? SIDE_UPGRADE_OPTIONS[0] : null
  );
  const [drinkChoice, setDrinkChoice] = useState<DrinkOption | null>(
    isCombo ? DRINK_SELECTION_OPTIONS[0] : null
  );
  const [selectedAddons, setSelectedAddons] = useState<PaidAddonOption[]>([]);
  const [kitchenNotes, setKitchenNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  if (!targetItem && !targetCombo) return null;

  const basePriceKwd = targetItem ? targetItem.priceKwd : targetCombo!.comboPriceKwd;
  const titleEn = targetItem ? targetItem.nameEn : targetCombo!.headingEn;
  const titleAr = targetItem ? targetItem.nameAr : targetCombo!.headingAr;

  const sideDelta = sideChoice ? sideChoice.priceDeltaKwd : 0;
  const drinkDelta = drinkChoice ? drinkChoice.priceDeltaKwd : 0;
  const addonsSumKwd = selectedAddons.reduce((s, a) => s + a.priceKwd, 0);
  const unitTotalKwd = roundKWD(
    basePriceKwd + sideDelta + drinkDelta + addonsSumKwd
  );
  const grandLineTotalKwd = roundKWD(unitTotalKwd * quantity);

  const toggleAddon = (addon: PaidAddonOption) => {
    playTerminalSound('tap');
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const toggleQuickNote = (note: string) => {
    playTerminalSound('tap');
    if (kitchenNotes.includes(note)) {
      setKitchenNotes((prev) =>
        prev
          .replace(note, '')
          .replace(/,\s*,/g, ',')
          .replace(/^,\s*|,\s*$/g, '')
          .trim()
      );
    } else {
      setKitchenNotes((prev) => (prev ? `${prev}, ${note}` : note));
    }
  };

  const handleConfirm = () => {
    const customization: CartItemCustomization = {
      prepStyle,
      sideChoice: sideChoice || undefined,
      drinkChoice: drinkChoice || undefined,
      addons: selectedAddons,
      kitchenNotes: kitchenNotes.trim(),
    };

    if (onConfirm) {
      onConfirm(customization);
    } else if (targetItem && onConfirmItem) {
      onConfirmItem(targetItem, customization, quantity);
    } else if (targetCombo && onConfirmCombo) {
      onConfirmCombo(targetCombo, customization, quantity);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#E8E1D5] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#FAF6F0] border-b border-[#E8E1D5] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[11px] font-extrabold uppercase">
                {targetCombo ? `COMBO ${targetCombo.code}` : `SKU ${targetItem?.sku}`}
              </span>
              <span className="text-xs font-mono font-bold text-stone-500">
                Base Price: {formatKWD(basePriceKwd)}
              </span>
            </div>
            <h3 className="text-base md:text-lg font-display font-bold text-[#1E293B] mt-0.5">
              {titleEn}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* 1. Preparation Style */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 font-bold mb-1.5">
              1. Chicken Style / Preparation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Spicy', 'Regular', 'Mixed'] as PrepStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => {
                    playTerminalSound('tap');
                    setPrepStyle(style);
                  }}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    prepStyle === style
                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-xs'
                      : 'bg-[#FAF6F0] text-stone-800 border-[#E8E1D5] hover:bg-white'
                  }`}
                >
                  <span>{style.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Side Choice / Upgrade */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-stone-600 font-bold">
                2. Side Choice / Upgrade
              </label>
              {!isCombo && (
                <span className="text-[10px] font-mono text-stone-400">
                  Optional for Single Items
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  playTerminalSound('tap');
                  setSideChoice(null);
                }}
                className={`p-2.5 rounded-xl border text-left transition ${
                  sideChoice === null
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-[#FAF6F0] text-[#1E293B] border-[#E8E1D5] hover:bg-white'
                }`}
              >
                <div className="font-bold text-xs truncate">No Side / Single Item</div>
                <div className="font-mono text-[10px] mt-0.5 opacity-80">+0.000 KWD</div>
              </button>
              {SIDE_UPGRADE_OPTIONS.map((side) => {
                const active = sideChoice?.id === side.id;
                return (
                  <button
                    key={side.id}
                    type="button"
                    onClick={() => {
                      playTerminalSound('tap');
                      setSideChoice(side);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      active
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-[#FAF6F0] text-[#1E293B] border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{side.nameEn}</div>
                    <div className="font-mono text-[10px] mt-0.5">
                      {side.priceDeltaKwd > 0 ? `+${formatKWD(side.priceDeltaKwd)}` : 'INCLUDED'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Soft Drink Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-stone-600 font-bold">
                3. Beverage Selection
              </label>
              {!isCombo && (
                <span className="text-[10px] font-mono text-stone-400">
                  Optional for Single Items
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  playTerminalSound('tap');
                  setDrinkChoice(null);
                }}
                className={`p-2 rounded-xl border text-left transition ${
                  drinkChoice === null
                    ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                    : 'bg-[#FAF6F0] text-[#1E293B] border-[#E8E1D5] hover:bg-white'
                }`}
              >
                <div className="font-bold text-xs truncate">No Beverage / Drink</div>
                <div className="font-mono text-[10px] opacity-80 mt-0.5">+0.000 KWD</div>
              </button>
              {DRINK_SELECTION_OPTIONS.map((drk) => {
                const active = drinkChoice?.id === drk.id;
                return (
                  <button
                    key={drk.id}
                    type="button"
                    onClick={() => {
                      playTerminalSound('tap');
                      setDrinkChoice(drk);
                    }}
                    className={`p-2 rounded-xl border text-left transition ${
                      active
                        ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                        : 'bg-[#FAF6F0] text-[#1E293B] border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{drk.nameEn}</div>
                    <div className="font-mono text-[10px] opacity-80 mt-0.5">
                      {drk.priceDeltaKwd > 0 ? `+${formatKWD(drk.priceDeltaKwd)}` : 'INCLUDED'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Paid Add-Ons */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 font-bold mb-1.5">
              4. Extra Sauces &amp; Add-ons
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAID_ADDON_OPTIONS.map((addon) => {
                const selected = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon)}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      selected
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                        : 'bg-[#FAF6F0] text-[#1E293B] border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <div className="truncate font-semibold">{addon.nameEn}</div>
                      <div className="font-mono text-[10px] text-emerald-700">
                        +{formatKWD(addon.priceKwd)}
                      </div>
                    </div>
                    {selected && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Kitchen Notes */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 font-bold mb-1.5">
              5. Special Kitchen Notes
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_KITCHEN_NOTES.map((note) => {
                const active = kitchenNotes.includes(note);
                return (
                  <button
                    key={note}
                    type="button"
                    onClick={() => toggleQuickNote(note)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition ${
                      active
                        ? 'bg-[#1E293B] text-white border-[#1E293B]'
                        : 'bg-[#FAF6F0] text-stone-700 border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    {note}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={kitchenNotes}
              onChange={(e) => setKitchenNotes(e.target.value)}
              placeholder="Custom instructions (e.g. All Breast Pieces, Extra Crispy)..."
              className="w-full px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono text-[#1E293B] focus:outline-none focus:border-[#C8102E]"
            />
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-5 py-3.5 bg-[#FAF6F0] border-t border-[#E8E1D5] flex items-center justify-between gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-1.5 bg-white border border-[#E8E1D5] rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-800 font-bold"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-mono text-base font-extrabold text-[#1E293B]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-800 font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-[#E8E1D5] text-xs font-bold text-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-display font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-xs transition"
            >
              <span>ADD TO CART</span>
              <span className="font-mono">({formatKWD(grandLineTotalKwd)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
