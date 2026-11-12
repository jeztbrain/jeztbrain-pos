import React, { useState } from 'react';
import { CURRENCY, DEFAULT_FOOTER_MESSAGE, KOT_STATION_LABEL, POWERED_BY } from '../config/brandConfig';
import { ChefHat, Printer, Receipt, X } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { PosOrderRecord } from '../types/pos';
import {
  CHANNEL_META,
  formatDateTimeKW,
  formatKWD,
  getComboComponents,
  isComboLine,
  PAYMENT_METHOD_LABELS,
  roundKWD,
} from '../utils/formatters';

export const CustomerReceipt80mmPaper: React.FC<{ order: PosOrderRecord }> = ({
  order,
}) => {
  const { activeBranch, receiptConfig } = usePos();

  // Smart Combo Breakdown Rule: Print detailed bundle sub-items ONLY if order is strictly a single combo (qty 1)
  const isSingleComboOrder =
    order.items.length === 1 &&
    order.items[0].type === 'COMBO' &&
    order.items[0].quantity === 1;

  const isDineIn = order.channel === 'dine_in';
  const isStaffCredit = order.isStaffPurchase || order.paymentMethod === 'staff_credit';

  return (
    <div className="w-[302px] mx-auto bg-white text-black font-mono text-[11px] leading-snug p-4 shadow-2xl border border-slate-300 select-text">
      {/* Brand Header — Bound directly to Admin Receipt Customizer */}
      <div className="text-center border-b-2 border-dashed border-black pb-2.5">
        <div className="text-base font-extrabold tracking-tight uppercase">
          {receiptConfig.storeTitle || activeBranch.tenantName}
        </div>
        {receiptConfig.subtitleAr && (
          <div className="text-xs font-bold">{receiptConfig.subtitleAr}</div>
        )}
        {receiptConfig.addressLine1 && (
          <div className="text-[10px] mt-0.5">{receiptConfig.addressLine1}</div>
        )}
        {receiptConfig.addressLine2 && (
          <div className="text-[10px]">{receiptConfig.addressLine2}</div>
        )}
        <div className="text-[10px] font-bold mt-0.5">
          {receiptConfig.phone ? `TEL: ${receiptConfig.phone}` : ''}
          {receiptConfig.phone && receiptConfig.websiteDomain ? ' • ' : ''}
          {receiptConfig.websiteDomain}
        </div>
      </div>

      {/* VOIDED CANCELLATION NOTICE */}
      {(order.status === 'voided' || order.status === 'cancelled') && (
        <div className="my-2 p-2 bg-black text-white text-center">
          <div className="text-xs font-black tracking-widest uppercase">
            *** VOIDED / CANCELLED BILL ***
          </div>
          <div className="text-[10px] font-bold mt-0.5 uppercase tracking-wide">
            OFFICIAL CANCELLATION &amp; REFUND RECEIPT
          </div>
          {order.voidReason && (
            <div className="text-[10px] font-bold mt-0.5">
              REASON: {order.voidReason}
            </div>
          )}
          <div className="text-[9px] mt-0.5">
            AUTHORIZED BY: {order.voidedBy || 'SUPERVISOR'}
            {order.voidedAt ? ` • ${formatDateTimeKW(order.voidedAt)}` : ''}
          </div>
        </div>
      )}

      {/* Staff Purchase / Credit Ledger Notification Badge */}
      {isStaffCredit && (
        <div className="my-2 p-1.5 bg-black text-white text-center rounded-none">
          <div className="text-xs font-extrabold uppercase tracking-wider">
            *** STAFF CREDIT PURCHASE ***
          </div>
          <div className="text-[10px] font-bold">
            STAFF: {order.staffCreditRecipientName || order.customerName}
          </div>
          <div className="text-[9px]">
            SALARY DEDUCTION / INTERNAL LEDGER RECORD
          </div>
        </div>
      )}

      {/* Order Routing Header: Hide Giant Token # on Dine-In, Show Only Bold Table Badge */}
      <div className="py-2.5 border-b-2 border-dashed border-black text-center">
        {isDineIn ? (
          <div className="space-y-1">
            <div className="inline-block px-3 py-1 bg-black text-white text-sm font-extrabold uppercase tracking-wide">
              DINE-IN • {order.tableNo ? `TABLE ${order.tableNo}` : 'SEATED TABLE'}
            </div>
            <div className="text-[10px] uppercase font-bold text-neutral-600">
              Floor Hospitality Service
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[10px] uppercase font-bold">ORDER TOKEN NUMBER</div>
            <div className="text-4xl font-extrabold tracking-wider my-0.5">
              #{order.tokenNo}
            </div>
            <div className="inline-block px-2.5 py-0.5 bg-black text-white text-xs font-extrabold uppercase">
              {CHANNEL_META[order.channel].shortLabel}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Metadata */}
      <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>INVOICE NO:</span>
          <span className="font-bold">{order.invoiceNo}</span>
        </div>
        <div className="flex justify-between">
          <span>DATE / TIME:</span>
          <span>{formatDateTimeKW(order.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>CASHIER:</span>
          <span className="font-bold">{order.cashierName}</span>
        </div>
        {order.customerName && (
          <div className="flex justify-between">
            <span>CUSTOMER:</span>
            <span className="font-bold truncate max-w-[175px]">{order.customerName}</span>
          </div>
        )}
        {order.customerPhone && (
          <div className="flex justify-between">
            <span>PHONE:</span>
            <span className="font-bold">{order.customerPhone}</span>
          </div>
        )}
        {order.deliveryAddress && (
          <div className="pt-1 border-t border-dotted border-black/40">
            <span className="font-bold">DELIVER TO: </span>
            <span>{order.deliveryAddress}</span>
          </div>
        )}
      </div>

      {/* Itemized List with Smart Combo Breakdown (Short Receipt Optimization) */}
      <div className="py-2 border-b-2 border-dashed border-black">
        <div className="flex justify-between font-extrabold text-[10px] border-b border-black pb-1 mb-1.5">
          <span>QTY  ITEM DESCRIPTION</span>
          <span>TOTAL ({CURRENCY})</span>
        </div>

        <div className="space-y-2">
          {order.items.map((line) => {
            const lineTotal = roundKWD(line.unitPriceKwd * line.quantity);
            return (
              <div key={line.lineId} className="text-[11px]">
                <div className="flex justify-between items-start font-bold">
                  <span className="pr-2">
                    {line.quantity}x {line.titleEn}
                  </span>
                  <span className="shrink-0">{lineTotal.toFixed(3)}</span>
                </div>
                <div className="text-[10px] text-neutral-700 pl-3">{line.titleAr}</div>

                {/* SMART COMBO SUB-ITEMS: Printed ONLY when entire order is a single combo */}
                {isSingleComboOrder && (line.type === 'COMBO' || line.isCombo) && (
                  line.comboSubItems && line.comboSubItems.length > 0 ? (
                    <div className="mt-1 pl-3 border-l-2 border-black space-y-0.5 text-[10px]">
                      <div className="font-extrabold uppercase underline">
                        [COMBO BUNDLE INCLUDES]:
                      </div>
                      {line.comboSubItems.map((sub, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            • {sub.quantity * line.quantity}x {sub.nameEn}
                          </span>
                          <span className="text-[9px]">INCL</span>
                        </div>
                      ))}
                    </div>
                  ) : (line.description || (line.comboIncludes && line.comboIncludes.length > 0)) ? (
                    <div className="mt-1 pl-3 border-l-2 border-black space-y-0.5 text-[10px]">
                      <div className="font-extrabold uppercase underline">
                        [COMBO BUNDLE INCLUDES]:
                      </div>
                      {(line.comboIncludes || (line.description ? line.description.split(/\||\+|\•|\n/).map((s) => s.trim()).filter(Boolean) : [])).map((inc, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {inc}</span>
                          <span className="text-[9px]">INCL</span>
                        </div>
                      ))}
                    </div>
                  ) : null
                )}

                {/* Modifiers */}
                {line.customization && (
                  <div className="pl-3 mt-0.5 text-[10px] space-y-0.5">
                    <div className="font-bold">
                      {line.customization.prepStyle && line.customization.prepStyle !== 'Regular'
                        ? `* Prep: ${line.customization.prepStyle.toUpperCase()}`
                        : ''}
                      {line.customization.sideChoice && line.customization.sideChoice.id !== 'none' && line.customization.sideChoice.priceDeltaKwd > 0
                        ? ` | ${line.customization.sideChoice.nameEn}`
                        : ''}
                    </div>
                    {line.customization.addons.length > 0 && (
                      <div>
                        * Add-ons:{' '}
                        {line.customization.addons.map((a) => a.nameEn).join(', ')}
                      </div>
                    )}
                    {line.customization.kitchenNotes && (
                      <div className="font-bold">
                        * Note: {line.customization.kitchenNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Totals (Strict 0.000 KWD) */}
      <div className="py-2 border-b-2 border-dashed border-black space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span className="font-bold">{formatKWD(order.subtotalKwd)}</span>
        </div>
        {order.discountKwd > 0 && (
          <div className="flex justify-between">
            <span>DISCOUNT ({order.discountPct}%):</span>
            <span className="font-bold">-{formatKWD(order.discountKwd)}</span>
          </div>
        )}
        {order.deliveryFeeKwd > 0 && (
          <div className="flex justify-between">
            <span>DELIVERY FEE:</span>
            <span className="font-bold">+{formatKWD(order.deliveryFeeKwd)}</span>
          </div>
        )}

        <div className="pt-1.5 border-t border-black flex justify-between items-baseline text-sm font-extrabold">
          <span>{order.status === 'voided' || order.status === 'cancelled' ? 'VOIDED TOTAL (REFUNDED):' : 'GRAND TOTAL:'}</span>
          <span className="text-base font-black">
            {order.status === 'voided' || order.status === 'cancelled'
              ? `-${formatKWD(order.grandTotalKwd)}`
              : formatKWD(order.grandTotalKwd)}
          </span>
        </div>

        <div className="pt-1 text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>PAYMENT MODE:</span>
            <span className="font-extrabold uppercase">
              {PAYMENT_METHOD_LABELS[order.paymentMethod]}
            </span>
          </div>
          {order.paymentMethod === 'cash' && order.cashTenderedKwd > 0 && (
            <>
              <div className="flex justify-between">
                <span>CASH TENDERED:</span>
                <span>{formatKWD(order.cashTenderedKwd)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>CHANGE DUE:</span>
                <span>{formatKWD(order.changeDueKwd)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer & Signature Branding — Bound directly to Admin Receipt Customizer */}
      <div className="pt-3 text-center space-y-1 text-[10px]">
        <div className="font-bold uppercase">
          {receiptConfig.footerMessage || DEFAULT_FOOTER_MESSAGE}
        </div>
        {receiptConfig.websiteDomain && (
          <div>Order Online: {receiptConfig.websiteDomain}</div>
        )}
        <div className="pt-2 mt-2 border-t border-black font-extrabold tracking-widest text-[10px]">
          {POWERED_BY}
        </div>
      </div>
    </div>
  );
};

export const KitchenKOT80mmPaper: React.FC<{ order: PosOrderRecord }> = ({
  order,
}) => {
  const { menuItems } = usePos();
  const isCancelled = order.status === 'cancelled' || order.status === 'voided';

  return (
    <div
      className={`w-[302px] mx-auto bg-white text-black font-mono text-xs leading-snug p-4 shadow-2xl select-text ${
        isCancelled ? 'border-4 border-black' : 'border-2 border-black'
      }`}
    >
      {/* CANCELLATION KOT VS REGULAR KOT HEADER & TOKEN PRESENTATION */}
      {isCancelled ? (
        /* INVERTED CANCELLATION HEADER & TOKEN: Solid black background with white, large, extra-bold text */
        <div className="bg-black text-white p-3 text-center border-2 border-black">
          <div className="text-xl sm:text-2xl font-black tracking-widest uppercase">
            *** CANCEL KOT ***
          </div>
          <div className="text-xs font-black uppercase tracking-wider mt-1 bg-white text-black py-0.5 px-2.5 inline-block">
            HALT PREPARATION IMMEDIATELY!
          </div>

          {/* TOKEN NUMBER INSIDE THE SOLID BLACK INVERTED CANCEL KOT HEADER */}
          <div className="my-2.5 pt-2 pb-1 border-t-2 border-white/80">
            <div className="text-[11px] font-black uppercase tracking-widest text-neutral-200">
              CANCELLED TOKEN NUMBER
            </div>
            <div className="text-5xl sm:text-6xl font-black leading-none tracking-tight text-white mt-1">
              #{order.tokenNo}
            </div>
          </div>

          {order.voidReason && (
            <div className="text-xs font-black uppercase mt-1.5 border border-white px-2 py-0.5">
              REASON: {order.voidReason}
            </div>
          )}
          <div className="text-[10px] font-bold mt-1.5 text-neutral-300">
            CANCELLED AT:{' '}
            {order.voidedAt
              ? formatDateTimeKW(order.voidedAt)
              : formatDateTimeKW(new Date().toISOString())}
            {order.voidedBy ? ` • BY: ${order.voidedBy}` : ''}
          </div>
        </div>
      ) : (
        /* REGULAR KOT HEADER: Optimized for Thermal Printhead Lifespan (No solid black background, no inverted text) */
        <div className="border-2 border-black p-2 text-center bg-white text-black">
          <div className="text-xs font-black tracking-widest uppercase">
            *** KITCHEN ORDER TICKET (KOT) ***
          </div>
          <div className="text-[10px] font-bold mt-0.5 tracking-wider uppercase text-neutral-800">
            {KOT_STATION_LABEL}
          </div>
        </div>
      )}

      {/* TOKEN & ORDER CHANNEL ROW */}
      {isCancelled ? (
        <div className="py-2 border-b-2 border-black flex items-center justify-between">
          <div>
            <span className="inline-block px-2 py-0.5 bg-black text-white font-black text-xs uppercase tracking-wider">
              VOIDED BILL
            </span>
          </div>
          <div className="text-right">
            <div className="inline-block px-2 py-0.5 border-2 border-black font-black text-xs uppercase">
              {CHANNEL_META[order.channel].shortLabel}
            </div>
            {order.tableNo && (
              <div className="text-xs font-black mt-0.5">TABLE: {order.tableNo}</div>
            )}
            {order.webOrderRef && (
              <div className="text-[10px] font-bold mt-0.5">{order.webOrderRef}</div>
            )}
          </div>
        </div>
      ) : (
        /* HIGH-VISIBILITY EXTRA-BOLD TOKEN NUMBER (Double-size font, clean white background, printer lifespan optimized) */
        <div className="py-3 border-b-2 border-black flex items-center justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-black">
              TOKEN #
            </div>
            <div className="text-5xl sm:text-6xl font-black leading-none tracking-tight text-black mt-0.5">
              #{order.tokenNo}
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-2.5 py-1 border-2 border-black font-black text-xs uppercase tracking-wider">
              {CHANNEL_META[order.channel].shortLabel}
            </div>
            {order.tableNo && (
              <div className="text-sm font-black mt-1">TABLE: {order.tableNo}</div>
            )}
            {order.webOrderRef && (
              <div className="text-[10px] font-bold mt-0.5">{order.webOrderRef}</div>
            )}
          </div>
        </div>
      )}

      <div className="py-1.5 border-b border-dashed border-black text-[10px] flex justify-between">
        <span>TIME: {formatDateTimeKW(order.createdAt)}</span>
        <span>BY: {order.cashierName.split(' ')[0]}</span>
      </div>

      {/* High-Contrast Item & Expanded Combo Breakdown */}
      <div className="py-2.5 space-y-3 border-b-2 border-black">
        {order.items.map((line) => (
          <div key={line.lineId} className="pb-2 border-b border-dashed border-black/50 last:border-none">
            <div className="flex items-start justify-between text-sm font-extrabold">
              <span className={isCancelled ? 'line-through opacity-80' : ''}>
                [{line.quantity} X] {line.titleEn.toUpperCase()}
              </span>
              {isCancelled && (
                <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.2 ml-1 shrink-0 uppercase">
                  VOID
                </span>
              )}
            </div>

            {/* Highlighted Prep Style (only show when explicitly non-regular or spicy) */}
            {line.customization?.prepStyle && line.customization.prepStyle !== 'Regular' && (
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 bg-black text-white text-xs font-extrabold uppercase tracking-wider">
                  ** {line.customization.prepStyle.toUpperCase()} **
                </span>
              </div>
            )}

            {/* Expanded Combo Components for Kitchen Line Cooks (e.g. Family Meal, Buckets, Burger Deals) */}
            {(() => {
              const comboComponents = getComboComponents(line, menuItems);
              const isCombo = isComboLine(line, menuItems) || comboComponents.length > 0;
              if (!isCombo || comboComponents.length === 0) return null;
              return (
                <div className="mt-1.5 pl-2.5 border-l-4 border-black space-y-1 text-xs font-bold">
                  <div className="text-[10px] uppercase underline tracking-wider">
                    PACK COMBO COMPONENTS:
                  </div>
                  {comboComponents.map((inc, i) => (
                    <div key={i} className="font-extrabold">
                      • {inc}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Side / Drink / Addons / Kitchen Notes - strictly attach only when explicitly selected */}
            {line.customization && (
              <div className="mt-1.5 space-y-0.5 text-[11px] font-bold">
                {line.customization.sideChoice && line.customization.sideChoice.id !== 'none' && (
                  <div>• SIDE: {line.customization.sideChoice.nameEn}</div>
                )}
                {line.customization.drinkChoice && line.customization.drinkChoice.id !== 'none' && (
                  <div>• DRINK: {line.customization.drinkChoice.nameEn}</div>
                )}
                {line.customization.addons && line.customization.addons.length > 0 && (
                  <div>
                    • ADD-ONS:{' '}
                    {line.customization.addons.map((a) => a.nameEn.toUpperCase()).join(' + ')}
                  </div>
                )}
                {line.customization.kitchenNotes && (
                  <div className="mt-1 p-1.5 border-2 border-black bg-neutral-100 text-xs font-extrabold uppercase">
                    NOTE: {line.customization.kitchenNotes}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 text-center text-[10px] font-bold">
        {isCancelled ? (
          <div className="bg-black text-white py-1.5 px-2 text-xs font-black uppercase tracking-wider">
            ** DO NOT PREPARE • TOKEN #{order.tokenNo} CANCELLED **
          </div>
        ) : (
          <div className="text-black font-bold">
            ITEMS COUNT: {order.items.reduce((s, l) => s + l.quantity, 0)} • Powered by JeztBrain
          </div>
        )}
      </div>
    </div>
  );
};

export const ThermalPrintModal: React.FC = () => {
  const {
    activePrintOrder,
    printModalInitialTab,
    closePrintModal,
    directPrintDoc,
  } = usePos();
  const [viewMode, setViewMode] = useState<'BOTH' | 'INVOICE' | 'KOT'>(
    printModalInitialTab
  );

  // DIRECT SILENT PRINT CONTAINER (Zero Modal: Invisible on Screen, Spooled to 80mm Printer)
  if (!activePrintOrder) {
    if (!directPrintDoc) return null;
    return (
      <div
        id="thermal-print-root"
        className="fixed -left-[9999px] -top-[9999px] print:left-0 print:top-0 print:static print:visible pointer-events-none"
      >
        {(directPrintDoc.docType === 'BOTH' || directPrintDoc.docType === 'INVOICE') && (
          <div className="mb-4">
            <CustomerReceipt80mmPaper order={directPrintDoc.order} />
          </div>
        )}
        {(directPrintDoc.docType === 'BOTH' || directPrintDoc.docType === 'KOT') && (
          <div>
            <KitchenKOT80mmPaper order={directPrintDoc.order} />
          </div>
        )}
      </div>
    );
  }

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header (Hidden during physical @media print) */}
        <div className="no-print px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-mono text-[11px] font-bold">
                80MM THERMAL HARDWARE READY
              </span>
              <span className="font-mono text-xs text-stone-900 font-bold">
                Token #{activePrintOrder.tokenNo} • {activePrintOrder.invoiceNo}
              </span>
            </div>
            <h3 className="text-base font-display font-bold text-[#1E293B] mt-0.5">
              80mm Customer Thermal Receipt &amp; Kitchen Order Ticket (KOT)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-1 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5]">
              <button
                type="button"
                onClick={() => setViewMode('BOTH')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  viewMode === 'BOTH'
                    ? 'bg-white text-[#C8102E] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setViewMode('INVOICE')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
                  viewMode === 'INVOICE'
                    ? 'bg-white text-[#C8102E] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" /> Customer Bill
              </button>
              <button
                type="button"
                onClick={() => setViewMode('KOT')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
                  viewMode === 'KOT'
                    ? 'bg-white text-[#C8102E] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" /> Kitchen KOT
              </button>
            </div>

            <button
              type="button"
              onClick={handleBrowserPrint}
              className="px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print 80mm Roll</span>
            </button>

            <button
              type="button"
              onClick={closePrintModal}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable 80mm Thermal Roll Canvas */}
        <div
          id="thermal-print-root"
          className="p-6 overflow-y-auto bg-slate-100 flex-1 flex flex-wrap items-start justify-center gap-8"
        >
          {(viewMode === 'BOTH' || viewMode === 'INVOICE') && (
            <div className="space-y-2">
              <div className="no-print text-center text-xs font-mono uppercase text-slate-700 font-bold">
                1. 80mm Customer Tax Invoice
              </div>
              <CustomerReceipt80mmPaper order={activePrintOrder} />
            </div>
          )}

          {(viewMode === 'BOTH' || viewMode === 'KOT') && (
            <div className="space-y-2">
              <div className="no-print text-center text-xs font-mono uppercase text-slate-700 font-bold">
                2. 80mm Kitchen Order Ticket (KOT)
              </div>
              <KitchenKOT80mmPaper order={activePrintOrder} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

