import React, { useState } from 'react';
import {
  Ban,
  CheckCircle2,
  ChefHat,
  Flame,
  Printer,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import {
  CHANNEL_META,
  formatDateTimeKW,
  formatKWD,
  PAYMENT_METHOD_LABELS,
} from '../utils/formatters';
import {
  CustomerReceipt80mmPaper,
  KitchenKOT80mmPaper,
} from './ThermalPrintModal';

export const PrintQueueModule: React.FC = () => {
  const {
    posOrders,
    currentUser,
    openPrintModal,
    updatePosOrderStatus,
    voidSettledOrder,
    requestManagerOverride,
  } = usePos();

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    posOrders[0]?.id || ''
  );

  const selectedOrder =
    posOrders.find((o) => o.id === selectedOrderId) || posOrders[0] || null;

  const handleVoidOrderClick = (orderId: string, invoiceNo: string) => {
    if (!currentUser) return;
    if (!currentUser.canVoidBills) {
      requestManagerOverride({
        title: `Void Settled Invoice ${invoiceNo}`,
        reasonPrompt: 'Audit Reason for Voiding Settled Invoice',
        onAuthorized: (mgr, reason) => {
          voidSettledOrder(orderId, reason, mgr.name);
        },
      });
    } else {
      voidSettledOrder(orderId, 'Manager Direct Void Authorization', currentUser.name);
    }
  };

  return (
    <div className="no-print h-[calc(100vh-52px)] w-full overflow-y-auto bg-[#FAF6F0] p-4 md:p-6 text-[#1E293B]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E8E1D5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#C8102E]/10 text-[#C8102E] border border-[#C8102E]/20 font-mono text-xs font-bold uppercase flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                80MM THERMAL HARDWARE SPOOLER
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                EPSON TM-T88VI ONLINE
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold text-[#1E293B] mt-1">
              80mm Customer Receipts &amp; Kitchen Order Ticket (KOT) Spooler
            </h1>
            <p className="text-xs text-[#64748B]">
              Inspect any active or settled invoice, reprint physical thermal rolls, update kitchen ticket status, or authorize bill voids.
            </p>
          </div>

          {selectedOrder && (
            <button
              type="button"
              onClick={() => openPrintModal(selectedOrder, 'BOTH')}
              className="px-5 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-display font-extrabold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print 80mm Roll (#{selectedOrder.tokenNo})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 5 COLS: INVOICES QUEUE */}
          <div className="lg:col-span-5 bg-white border border-[#E8E1D5] rounded-3xl p-5 shadow-sm space-y-3.5">
            <h2 className="text-sm font-display font-bold text-[#1E293B] uppercase border-b border-[#FAF6F0] pb-2.5">
              Settled POS Invoices ({posOrders.length})
            </h2>

            <div className="space-y-2.5 max-h-[660px] overflow-y-auto pr-1">
              {posOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                const isVoided = ord.status === 'voided';
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`cursor-pointer p-4 rounded-2xl border transition ${
                      isSelected
                        ? 'bg-[#C8102E]/5 border-[#C8102E] ring-2 ring-[#C8102E]/10 shadow-sm'
                        : isVoided
                        ? 'bg-rose-50/40 border-rose-200 opacity-60'
                        : 'bg-[#FAF6F0] border-[#E8E1D5] hover:bg-[#F5EFE6]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-[#C8102E]">
                            #{ord.tokenNo}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#1E293B]">
                            {ord.invoiceNo}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${CHANNEL_META[ord.channel].badgeClass}`}
                          >
                            {CHANNEL_META[ord.channel].shortLabel}
                          </span>
                        </div>
                        <div className="text-xs text-[#64748B] font-mono mt-1">
                          {formatDateTimeKW(ord.createdAt)} • {ord.cashierName}
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div
                          className={`text-base font-extrabold ${
                            isVoided ? 'text-rose-600 line-through' : 'text-[#1E293B]'
                          }`}
                        >
                          {formatKWD(ord.grandTotalKwd)}
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {PAYMENT_METHOD_LABELS[ord.paymentMethod]}
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="mt-3 pt-2.5 border-t border-[#E8E1D5]/60 flex flex-wrap items-center justify-between gap-2">
                      {isVoided ? (
                        <span className="text-xs font-mono text-rose-700 font-bold">
                          VOIDED ({ord.voidReason})
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          {(['cooking', 'ready', 'completed'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updatePosOrderStatus(ord.id, st);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase border transition ${
                                ord.status === st
                                  ? 'bg-[#C8102E] text-white border-[#C8102E]'
                                  : 'bg-white text-[#1E293B] border-[#E8E1D5] hover:bg-[#FAF6F0]'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      )}

                      {!isVoided && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPrintModal(ord, 'BOTH');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono font-bold text-[#C8102E] flex items-center gap-1 shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVoidOrderClick(ord.id, ord.invoiceNo);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-[#E8E1D5] hover:border-rose-200 text-xs font-mono font-bold text-rose-700 flex items-center gap-1 shadow-sm"
                          >
                            <Ban className="w-3.5 h-3.5" /> Void
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 7 COLS: SIDE-BY-SIDE 80MM RECEIPT PREVIEW */}
          <div className="lg:col-span-7 bg-white border border-[#E8E1D5] rounded-3xl p-6 shadow-sm">
            {selectedOrder ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#FAF6F0] pb-3">
                  <div className="flex items-center gap-2">
                    <Printer className="w-5 h-5 text-[#C8102E]" />
                    <h3 className="text-base font-display font-bold text-[#1E293B]">
                      Live 80mm Roll Preview — #{selectedOrder.tokenNo} ({selectedOrder.invoiceNo})
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[#64748B] font-bold">
                    Scale: 80mm (302px)
                  </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start justify-items-center pt-2">
                  <div className="space-y-2">
                    <div className="text-center text-xs font-mono font-bold text-[#1E293B] flex items-center justify-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-[#C8102E]" /> 80MM CUSTOMER INVOICE
                    </div>
                    <CustomerReceipt80mmPaper order={selectedOrder} />
                  </div>

                  <div className="space-y-2">
                    <div className="text-center text-xs font-mono font-bold text-[#1E293B] flex items-center justify-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5 text-emerald-600" /> 80MM KITCHEN KOT
                    </div>
                    <KitchenKOT80mmPaper order={selectedOrder} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-[#94A3B8] font-mono">
                Select an order on the left to inspect its 80mm thermal receipts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
