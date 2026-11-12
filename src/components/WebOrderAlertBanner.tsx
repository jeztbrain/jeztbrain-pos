import React, { useMemo } from 'react';
import {
  Bike,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  ShoppingBag,
  User,
  Utensils,
  X,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatKWD } from '../utils/formatters';

export const WebOrderAlertBanner: React.FC = () => {
  const {
    activeWebOrderAlert,
    pendingWebOrders,
    dismissWebOrderAlert,
    acceptWebOrderFromBanner,
    selectWebOrderAlert,
    setActiveModule,
    language,
  } = usePos();

  const isEnglish = language === 'en';

  const currentIndex = useMemo(() => {
    if (!activeWebOrderAlert) return -1;
    return pendingWebOrders.findIndex((w) => w.id === activeWebOrderAlert.id);
  }, [pendingWebOrders, activeWebOrderAlert]);

  if (!activeWebOrderAlert) {
    return null;
  }

  const order = activeWebOrderAlert;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      selectWebOrderAlert(pendingWebOrders[currentIndex - 1]);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < pendingWebOrders.length - 1) {
      selectWebOrderAlert(pendingWebOrders[currentIndex + 1]);
    }
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    acceptWebOrderFromBanner(order.id);
  };

  const handleOpenHub = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissWebOrderAlert();
    setActiveModule('web-orders');
  };

  const isDelivery =
    !order.area.toLowerCase().includes('pickup') &&
    !order.landmarkNotes.toLowerCase().includes('pickup') &&
    !order.landmarkNotes.toLowerCase().includes('takeaway');

  // Format line items summary
  const itemsSummary = order.items
    .map((item) => `${item.quantity}x ${isEnglish ? item.titleEn : item.titleAr || item.titleEn}`)
    .join(' • ');

  return (
    <aside
      role="region"
      aria-label="Incoming Web Order Notification"
      className="no-print fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl transition-all duration-300 ease-out transform translate-y-0 opacity-100 pointer-events-auto"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-[#C8102E] ring-4 ring-[#C8102E]/15 overflow-hidden text-[#1E293B]">
        {/* Top Crimson & Amber Dual Brand Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C8102E] via-[#EAB308] to-[#C8102E]" />

        <div className="p-3.5 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          {/* LEFT: Order Meta & Customer Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Header badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8102E] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C8102E]" />
              </span>

              <span className="font-display font-black text-xs text-[#C8102E] tracking-wider uppercase flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#C8102E]" />
                {isEnglish ? 'NEW WEB ORDER' : 'طلب موقع جديد'}
              </span>

              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-mono text-[11px] font-bold">
                chikarrasalmiya.com
              </span>

              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 ${
                  isDelivery
                    ? 'bg-purple-50 text-purple-900 border border-purple-200'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                }`}
              >
                {isDelivery ? (
                  <>
                    <Bike className="w-3 h-3 text-purple-600" />
                    <span>{isEnglish ? 'Web Direct / Delivery' : 'توصيل مباشر'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3 h-3 text-emerald-600" />
                    <span>{isEnglish ? 'Web Direct / Pickup' : 'استلام من الفرع'}</span>
                  </>
                )}
              </span>

              {/* Multi-Order Carousel Navigator */}
              {pendingWebOrders.length > 1 && (
                <div className="ml-auto flex items-center gap-1 bg-[#FAF6F0] px-2 py-0.5 rounded-lg border border-[#E8E1D5] text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex <= 0}
                    className="hover:text-[#C8102E] disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                    title="Previous pending web order"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-[#1E293B]">
                    {currentIndex + 1} / {pendingWebOrders.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex >= pendingWebOrders.length - 1}
                    className="hover:text-[#C8102E] disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                    title="Next pending web order"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Order Token & Customer Identity Line */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-base sm:text-lg font-black text-[#C8102E] tracking-tight">
                {order.webOrderNo}
              </span>

              <span className="text-sm font-bold text-[#1E293B] flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-400" />
                {order.customerName}
              </span>

              <span className="text-xs font-mono font-bold text-stone-600 flex items-center gap-1">
                <Phone className="w-3 h-3 text-stone-400" />
                {order.customerPhone}
              </span>

              <span className="text-xs text-stone-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                <span className="truncate max-w-[260px]">
                  {order.area}, {order.blockNo}, {order.streetNo}
                </span>
              </span>
            </div>

            {/* Items Summary Preview */}
            <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-[#FAF6F0] px-2.5 py-1 rounded-lg border border-[#E8E1D5]/70">
              <Utensils className="w-3.5 h-3.5 text-[#C8102E] shrink-0" />
              <span className="font-bold text-[#1E293B] shrink-0">
                {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}:
              </span>
              <span className="truncate text-stone-700 font-medium">{itemsSummary}</span>
            </div>
          </div>

          {/* RIGHT: Grand Total & Action Buttons */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E8E1D5]/60">
            {/* Price & Payment Mode */}
            <div className="text-left md:text-right">
              <div className="font-mono text-xl sm:text-2xl font-black text-[#1E293B] leading-none">
                {formatKWD(order.totalKwd)}
              </div>
              <div className="text-[11px] font-mono font-bold text-stone-500 mt-1">
                {order.paymentMode} {order.isPaid ? '• PAID' : '• COD'}
              </div>
            </div>

            {/* Actions group */}
            <div className="flex items-center gap-2">
              {/* Direct Accept Action Button */}
              <button
                type="button"
                onClick={handleAccept}
                className="px-4 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-display font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                title="Accept order immediately and dispatch to Kitchen KOT queue"
              >
                <ChefHat className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{isEnglish ? 'Accept Order' : 'قبول الطلب'}</span>
              </button>

              {/* View in Web Orders Hub Button */}
              <button
                type="button"
                onClick={handleOpenHub}
                className="p-2.5 rounded-xl bg-[#FAF6F0] hover:bg-[#E8E1D5] text-stone-600 hover:text-[#1E293B] border border-[#E8E1D5] transition active:scale-95 cursor-pointer"
                title={isEnglish ? 'Open Web Orders Hub' : 'فتح مركز طلبات الموقع'}
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={dismissWebOrderAlert}
                className="p-2.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                title={isEnglish ? 'Dismiss pop-up' : 'إغلاق الإشعار'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

