import React, { useState } from 'react';
import {
  Bike,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Globe,
  MapPin,
  Phone,
  Printer,
  User,
  Zap,
} from 'lucide-react';
import { BRAND_NAME_AR, SHORT_NAME } from '../config/brandConfig';
import { usePos } from '../context/PosContext';
import { WebDispatchStatus } from '../types/pos';
import { formatKWD, formatTimeKW } from '../utils/formatters';

const STATUS_PIPELINE: WebDispatchStatus[] = [
  'Pending',
  'Cooking',
  'Ready',
  'Out for Delivery',
  'Delivered',
];

export const WebOrdersHub: React.FC = () => {
  const {
    webOrders,
    deliveryRiders,
    acceptAndAutoBillWebOrder,
    updateWebOrderStatus,
    assignRiderToWebOrder,
    posOrders,
    openPrintModal,
    language,
  } = usePos();

  const isEnglish = language === 'en';

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedRiderMap, setSelectedRiderMap] = useState<Record<string, string>>({});
  const [expandedComboMap, setExpandedComboMap] = useState<Record<string, boolean>>({});

  const toggleWebCombo = (key: string) => {
    setExpandedComboMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredOrders =
    filterStatus === 'ALL'
      ? webOrders
      : webOrders.filter((w) => w.status === filterStatus);

  const getStatusBadgeStyle = (status: WebDispatchStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse font-extrabold';
      case 'Cooking':
        return 'bg-orange-50 text-orange-900 border-orange-200 font-bold';
      case 'Ready':
        return 'bg-amber-100 text-amber-950 border-amber-300 font-bold';
      case 'Out for Delivery':
        return 'bg-purple-50 text-purple-800 border-purple-200 font-bold';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
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
                <Globe className="w-3.5 h-3.5" />
                chikarrasalmiya.com LIVE ORDER STREAM
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE DISPATCH
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold text-[#1E293B] mt-1">
              Website Order Sync &amp; Salmiya Fleet Dispatch Hub
            </h1>
            <p className="text-xs text-[#64748B]">
              Zero double-entry: Click &ldquo;Accept &amp; Auto-Bill&rdquo; to convert incoming website orders directly into official POS invoices, deduct raw stock, and print 80mm thermal receipts.
            </p>
          </div>

        </div>

        {/* PIPELINE FILTER & RIDERS BAR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-7 flex flex-wrap items-center gap-1.5">
            {['ALL', ...STATUS_PIPELINE].map((st) => {
              const count =
                st === 'ALL'
                  ? webOrders.length
                  : webOrders.filter((w) => w.status === st).length;
              const active = filterStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition ${
                    active
                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                      : 'bg-white text-[#1E293B] border-[#E8E1D5] hover:bg-[#F5EFE6]'
                  }`}
                >
                  {st.toUpperCase()} ({count})
                </button>
              );
            })}
          </div>

          {/* Salmiya Delivery Riders Strip */}
          <div className="lg:col-span-5 flex items-center gap-2 overflow-x-auto bg-white border border-[#E8E1D5] rounded-2xl p-2 shadow-sm">
            <span className="text-[11px] font-mono uppercase font-bold text-[#64748B] shrink-0 flex items-center gap-1 px-1">
              <Bike className="w-4 h-4 text-[#C8102E]" /> Fleet:
            </span>
            {deliveryRiders.length === 0 ? (
              <span className="text-xs font-mono text-stone-400 italic px-2 py-0.5">
                No active drivers
              </span>
            ) : (
              deliveryRiders.map((r) => (
                <div
                  key={r.id}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono flex items-center gap-1.5"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      r.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-[#1E293B] font-bold">{r.name.split(' ')[0]}</span>
                  <span className="text-[#64748B]">({r.activeOrders})</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ORDERS CARDS GRID */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E1D5] p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-center mx-auto mb-4 text-[#C8102E]">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="text-base font-display font-extrabold text-[#1E293B]">
              {isEnglish ? 'No Incoming Web Orders' : 'لا توجد طلبات ويب واردة'}
            </h3>
            <p className="text-xs font-mono text-[#64748B] mt-1 max-w-sm mx-auto">
              {isEnglish
                ? `Listening to Supabase Realtime for live online customer orders from the ${SHORT_NAME} web portal.`
                : `في انتظار وصول طلبات أونلاين عبر اتصال سوبابيس اللحظي من موقع ${BRAND_NAME_AR}.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order) => {
            const isPending = order.status === 'Pending';
            const assignedRider = deliveryRiders.find(
              (r) => r.id === (order.assignedRiderId || selectedRiderMap[order.id])
            );
            const linkedPosRecord = posOrders.find(
              (p) => p.id === order.linkedPosOrderId || p.invoiceNo === order.linkedPosInvoiceNo
            );

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between shadow-sm ${
                  isPending
                    ? 'border-[#C8102E]/60 ring-2 ring-[#C8102E]/15'
                    : 'border-[#E8E1D5]'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-[#FAF6F0]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-[#C8102E]">
                          {order.webOrderNo}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-mono border ${getStatusBadgeStyle(
                            order.status
                          )}`}
                        >
                          {order.status.toUpperCase()}
                        </span>
                        {order.linkedPosInvoiceNo && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-bold">
                            POS: {order.linkedPosInvoiceNo}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#64748B] font-mono mt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                          {formatTimeKW(order.receivedAt)}
                        </span>
                        <span>• chikarrasalmiya.com</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="text-right font-mono">
                        <div className="text-xl font-extrabold text-[#1E293B]">
                          {formatKWD(order.totalKwd)}
                        </div>
                        <div className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#FAF6F0] border border-[#E8E1D5] text-[#1E293B] mt-1 font-semibold">
                          <CreditCard className="w-3 h-3 text-[#C8102E]" />
                          <span>
                            {order.paymentMode} ({order.isPaid ? 'PAID' : 'COD'})
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1E293B] flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#C8102E]" />
                        {order.customerName}
                      </span>
                      <span className="font-mono font-bold text-[#C8102E] flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {order.customerPhone}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-[#1E293B] pt-1.5 border-t border-[#E8E1D5]/60">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-[#1E293B]">
                          {order.area} • {order.blockNo} • {order.streetNo} • {order.buildingNo} ({order.floorApt})
                        </div>
                        <div className="text-xs text-[#64748B] mt-0.5">
                          Landmark: {order.landmarkNotes}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono uppercase font-bold text-[#64748B]">
                      Items Ordered ({order.items.length} Lines)
                    </div>
                    {order.items.map((line, idx) => {
                      const comboKey = `${order.id}-${idx}`;
                      const isExpanded = !!expandedComboMap[comboKey];

                      return (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#1E293B] flex items-center gap-1.5 flex-wrap">
                              <strong className="text-[#C8102E] font-mono text-sm">
                                {line.quantity}x
                              </strong>{' '}
                              {isEnglish ? line.titleEn : line.titleAr}
                              <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 font-mono text-[10px] font-bold">
                                {line.prepStyle}
                              </span>
                              {line.comboSubItems && line.comboSubItems.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleWebCombo(comboKey)}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-mono text-[10px] font-bold transition active:scale-95"
                                  title={isExpanded ? 'Collapse pack items' : 'View pack items'}
                                >
                                  <span>{line.comboSubItems.length} items</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </span>
                            <span className="font-mono font-extrabold text-[#1E293B]">
                              {formatKWD(line.unitPriceKwd * line.quantity)}
                            </span>
                          </div>

                          {line.comboSubItems && isExpanded && (
                            <div className="mt-1 pl-2.5 border-l-2 border-[#C8102E] flex flex-wrap gap-1">
                              {line.comboSubItems.map((sub, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-[#E8E1D5] text-[#1E293B]"
                                >
                                  {sub.quantity}x {isEnglish ? sub.nameEn : sub.nameAr}
                                </span>
                              ))}
                            </div>
                          )}

                          {line.notes && (
                            <div className="text-[11px] font-mono text-amber-800 font-semibold">
                              Note: {line.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-3 pt-3 border-t border-[#FAF6F0] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#1E293B]">
                      <Bike className="w-4 h-4 text-[#C8102E]" />
                      <span>Rider:</span>
                    </div>
                    <select
                      value={
                        order.assignedRiderId ||
                        selectedRiderMap[order.id] ||
                        deliveryRiders[0]?.id ||
                        ''
                      }
                      onChange={(e) => {
                        const rId = e.target.value;
                        setSelectedRiderMap((prev) => ({ ...prev, [order.id]: rId }));
                        if (!isPending && rId) {
                          assignRiderToWebOrder(order.id, rId);
                        }
                      }}
                      className="flex-1 max-w-xs px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono font-bold text-[#1E293B]"
                    >
                      {deliveryRiders.length === 0 ? (
                        <option value="">No active drivers</option>
                      ) : (
                        deliveryRiders.map((rider) => (
                          <option key={rider.id} value={rider.id}>
                            {rider.name} • {rider.vehiclePlate}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          acceptAndAutoBillWebOrder(
                            order.id,
                            selectedRiderMap[order.id] || deliveryRiders[0]?.id
                          )
                        }
                        className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-extrabold text-xs md:text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        <span>
                          ACCEPT &amp; AUTO-BILL ({formatKWD(order.totalKwd)}) • ISSUE KOT &amp; RECEIPT
                        </span>
                      </button>

                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="grid grid-cols-4 gap-1.5 flex-1">
                          {(['Cooking', 'Ready', 'Out for Delivery', 'Delivered'] as WebDispatchStatus[]).map(
                            (step) => {
                              const active = order.status === step;
                              return (
                                <button
                                  key={step}
                                  type="button"
                                  onClick={() => updateWebOrderStatus(order.id, step)}
                                  className={`py-2 px-2 rounded-xl font-mono text-[11px] font-bold border transition ${
                                    active
                                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                                      : 'bg-[#FAF6F0] text-[#1E293B] border-[#E8E1D5] hover:bg-[#F5EFE6]'
                                  }`}
                                >
                                  {step.toUpperCase()}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {linkedPosRecord && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-mono text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Auto-Billed as {linkedPosRecord.invoiceNo} (#{linkedPosRecord.tokenNo}) • Rider: {assignedRider?.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => openPrintModal(linkedPosRecord, 'BOTH')}
                            className="px-3 py-1 rounded-lg bg-[#FAF6F0] hover:bg-[#F5EFE6] text-xs font-mono font-bold text-[#1E293B] flex items-center gap-1.5 border border-[#E8E1D5]"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Reprint 80mm
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

    </div>
  );
};
