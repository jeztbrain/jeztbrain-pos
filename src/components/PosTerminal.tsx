import React, { useMemo, useState } from 'react';
import { CURRENCY } from '../config/brandConfig';
import {
  AlertTriangle,
  Ban,
  Banknote,
  Barcode,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  CupSoda,
  Flame,
  GlassWater,
  KeyRound,
  Layers,
  ListFilter,
  MapPin,
  Minus,
  PauseCircle,
  Percent,
  PlayCircle,
  Plus,
  PlusCircle,
  Printer,
  RotateCcw,
  Sandwich,
  Search,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Smile,
  Soup,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  Utensils,
  X,
  XCircle,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import {
  CartLineItem,
  Category,
  ComboOffer,
  MenuItem,
  OrderChannel,
  PaymentMethod,
  PosOrderRecord,
} from '../types/pos';
import {
  CHANNEL_META,
  formatKWD,
  getComboComponents,
  PAYMENT_METHOD_LABELS,
  playTerminalSound,
  roundKWD,
} from '../utils/formatters';
import { ItemCustomizationModal } from './ItemCustomizationModal';

// Strict Lucide Icon Mapping for All 11 Official Chikarro Categories
const ALLOWED_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Flame: <Flame className="w-4 h-4 shrink-0 text-[#C8102E]" />,
  Sandwich: <Sandwich className="w-4 h-4 shrink-0 text-amber-800" />,
  Utensils: <Utensils className="w-4 h-4 shrink-0 text-[#C8102E]" />,
  Sparkles: <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />,
  Smile: <Smile className="w-4 h-4 shrink-0 text-amber-600" />,
  Layers: <Layers className="w-4 h-4 shrink-0 text-orange-600" />,
  GlassWater: <GlassWater className="w-4 h-4 shrink-0 text-teal-600" />,
  CupSoda: <CupSoda className="w-4 h-4 shrink-0 text-amber-700" />,
  Soup: <Soup className="w-4 h-4 shrink-0 text-red-600" />,
  PlusCircle: <PlusCircle className="w-4 h-4 shrink-0 text-stone-600" />,
};

export const PosTerminal: React.FC = () => {
  const {
    currentUser,
    categories,
    menuItems,
    comboOffers,
    cartChannel,
    setCartChannel,
    selectedTableNo,
    setSelectedTableNo,
    dineInTables,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    applyPromoCode,
    removePromo,
    appliedPromo,
    lookupCustomerByPhone,
    setDeliveryAddress,
    deliveryAddress,
    cartLines,
    discountPct,
    discountReason,
    discountOverrideManager,
    isFlatDiscount,
    discountAmountKwd,
    addItemToCart,
    addComboToCart,
    updateCartLineQty,
    removeCartLine,
    clearCart,
    applyCartDiscount,
    cartSubtotalKwd,
    cartDiscountKwd,
    cartDeliveryFeeKwd,
    cartGrandTotalKwd,
    heldOrders,
    holdCurrentCart,
    recallHeldOrder,
    deleteHeldOrder,
    activeKotOrders,
    activeKitchenOrderId,
    loadKitchenOrderToCart,
    settleKitchenOrderDirectly,
    unbindKitchenOrder,
    sendCartToKitchen,
    cancelKitchenOrder,
    completeCheckout,
    autoPrintKotWithBill,
    setAutoPrintKotWithBill,
    requestManagerOverride,
    posOrders,
    openPrintModal,
    triggerDirectPrint,
    voidSettledOrder,
    verifyManagerPin,
    rawIngredients,
    language,
    staffAccounts,
    activeStaffPurchaseRecipient,
    setActiveStaffPurchaseRecipient,
  } = usePos();

  // Navigation & Category Sidebar State
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [showCategorySidebar, setShowCategorySidebar] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showStaffPurchaseDropdown, setShowStaffPurchaseDropdown] = useState<boolean>(false);

  // Modals
  const [showTableMapModal, setShowTableMapModal] = useState<boolean>(false);
  const [showHeldModal, setShowHeldModal] = useState<boolean>(false);
  const [showCustomerDrawer, setShowCustomerDrawer] = useState<boolean>(false);
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [showMovementModal, setShowMovementModal] = useState<boolean>(false);
  const [movementTab, setMovementTab] = useState<'fast' | 'slow'>('fast');

  // KOT Manager Drawer & Active Kitchen Queue Modal
  const [showKotModal, setShowKotModal] = useState<boolean>(false);
  const [kotSearchQuery, setKotSearchQuery] = useState<string>('');
  const [kotChannelFilter, setKotChannelFilter] = useState<'all' | 'dine_in' | 'takeaway' | 'keeta'>('all');
  const [kotToCancel, setKotToCancel] = useState<PosOrderRecord | null>(null);
  const [promoInput, setPromoInput] = useState<string>('');
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [kotCancelReason, setKotCancelReason] = useState<string>('Customer Cancelled Before Prep');
  const [isCancellingKot, setIsCancellingKot] = useState<boolean>(false);

  // Admin / Manager Void Completed Bill Modal State
  const [showVoidBillModal, setShowVoidBillModal] = useState<boolean>(false);
  const [voidSearchQuery, setVoidSearchQuery] = useState<string>('');
  const [selectedVoidOrder, setSelectedVoidOrder] = useState<PosOrderRecord | null>(null);
  const [voidReason, setVoidReason] = useState<string>('Customer Cancelled / Left');
  const [voidCustomNotes, setVoidCustomNotes] = useState<string>('');
  const [voidSupervisorPin, setVoidSupervisorPin] = useState<string>('');
  const [voidError, setVoidError] = useState<string | null>(null);
  const [voidSuccessOrder, setVoidSuccessOrder] = useState<PosOrderRecord | null>(null);

  // Redesigned Touch Discount Modal State
  const [discountMode, setDiscountMode] = useState<'percentage' | 'flat'>('percentage');
  const [discountKeypadVal, setDiscountKeypadVal] = useState<string>('10');
  const [discountReasonNote, setDiscountReasonNote] = useState<string>('Salmiya Regular Guest');

  // Customization Target
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [customizingCombo, setCustomizingCombo] = useState<ComboOffer | null>(null);

  // Multi-Tender Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>('cash');
  const [cashTenderedInput, setCashTenderedInput] = useState<string>('');
  const [splitCashInput, setSplitCashInput] = useState<string>('');

  // Collapsible Combo Accordion State in Right Cart (Default: Collapsed)
  const [expandedComboLineIds, setExpandedComboLineIds] = useState<Record<string, boolean>>({});

  const toggleComboLineAccordion = (lineId: string) => {
    setExpandedComboLineIds((prev) => ({
      ...prev,
      [lineId]: !prev[lineId],
    }));
    playTerminalSound('tap');
  };

  // Helper to extract detailed combo breakdown from line, description, or linked menu item
  const getLineComboBreakdown = (line: CartLineItem): {
    isCombo: boolean;
    items: string[];
    rawDescription?: string;
  } => {
    const linkedItem = menuItems.find(
      (m) => m.id === line.refId || m.sku === line.skuOrCode
    );

    const titleLower = (line.titleEn || '').toLowerCase();
    const isCandidate =
      line.type === 'COMBO' ||
      Boolean(line.isCombo) ||
      Boolean(linkedItem?.isCombo) ||
      Boolean(line.comboSubItems && line.comboSubItems.length > 0) ||
      Boolean(line.comboIncludes && line.comboIncludes.length > 0) ||
      Boolean(linkedItem?.comboIncludes && linkedItem.comboIncludes.length > 0) ||
      Boolean(line.description && line.description.trim().length > 0) ||
      Boolean(linkedItem?.description && linkedItem.description.trim().length > 0) ||
      /(combo|deal|meal|bucket|box|feast|platter|pack)/.test(titleLower) ||
      linkedItem?.categoryId === '879809c5-bf5b-4aa4-a497-85549906c7a3' ||
      linkedItem?.categoryId === 'ff643ddf-60db-4c7a-9703-0fc77954bac6' ||
      linkedItem?.categoryId === 'deals';

    if (!isCandidate) {
      return { isCombo: false, items: [] };
    }

    // 1. Check if structured comboSubItems exist (from ComboOffer)
    if (line.comboSubItems && line.comboSubItems.length > 0) {
      return {
        isCombo: true,
        items: line.comboSubItems.map((sub) => `${sub.quantity * line.quantity}x ${sub.nameEn}`),
      };
    }

    // 2. Check if structured comboIncludes exist (from MenuItem)
    const includes = line.comboIncludes || linkedItem?.comboIncludes;
    if (includes && Array.isArray(includes) && includes.length > 0) {
      return {
        isCombo: true,
        items: includes,
        rawDescription: line.description || linkedItem?.description,
      };
    }

    // 3. Check item.description (pulled directly from database)
    const rawDesc = (line.description || linkedItem?.description || '').trim();
    if (rawDesc.length > 0) {
      // Split by pipe '|', '+', bullet '•', or newline '\n'
      const parts = rawDesc
        .split(/\||\+|\•|\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (parts.length > 0) {
        return {
          isCombo: true,
          items: parts,
          rawDescription: rawDesc,
        };
      }
    }

    // 4. Smart fallback for combo/meal if no description stored in DB
    if (titleLower.includes('combo')) {
      return {
        isCombo: true,
        items: ['Medium French Fries', 'Soft Drink (250ml)', 'Ketchup & Signature Dip'],
      };
    }
    if (titleLower.includes('bucket') || titleLower.includes('meal') || titleLower.includes('box')) {
      return {
        isCombo: true,
        items: ['Fresh Fried Chicken', 'Crispy Golden Fries', 'Fresh Coleslaw', 'Dinner Buns'],
      };
    }

    return { isCombo: false, items: [] };
  };

  // Strict Smart Search: Matches item name (EN/AR), SKU, or exact price without category leakage
  const checkStrictSearchMatch = (
    titleEn: string,
    titleAr: string,
    priceKwd: number,
    skuOrCode: string,
    rawQuery: string
  ): boolean => {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;

    // 1. Space-Insensitive & Symbol-Agnostic Matching (e.g. "zingerwrap", "broastedchicken", "hot&crispy")
    const cleanQ = q.replace(/[^a-z0-9.]/g, '');
    const cleanEn = titleEn.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const cleanAr = titleAr.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const cleanSku = skuOrCode.toLowerCase().replace(/[^a-z0-9.]/g, '');

    if (
      (cleanEn && cleanEn.includes(cleanQ)) ||
      (cleanAr && cleanAr.includes(cleanQ)) ||
      (cleanSku && cleanSku.includes(cleanQ))
    ) {
      return true;
    }

    // 2. Multi-Word Any-Order Token Matching for Product Name & SKU
    const tokens = q.split(/\s+/).filter(Boolean);
    const combined = `${titleEn} ${titleAr} ${skuOrCode}`.toLowerCase();
    const allTokensMatch = tokens.every((token) => combined.includes(token));
    if (tokens.length > 1 && allTokensMatch) {
      return true;
    }

    // 3. Exact or Partial Price Matching (e.g., 7.450, 1.500, 0.250)
    const numericQuery = q.replace(/[^0-9.]/g, '');
    if (numericQuery.length > 0) {
      const price3 = priceKwd.toFixed(3);
      const pricePlain = priceKwd.toString();
      if (
        price3 === numericQuery ||
        price3.startsWith(numericQuery) ||
        price3.includes(numericQuery) ||
        pricePlain === numericQuery ||
        pricePlain.startsWith(numericQuery)
      ) {
        return true;
      }
    }

    return false;
  };

  // Quick Barcode / SKU enter handler: instant add to cart
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchedCombo = comboOffers.find(
        (c) => c.code.toLowerCase() === q && c.isAvailable
      );
      if (matchedCombo) {
        addComboToCart(matchedCombo);
        setSearchQuery('');
        return;
      }
      const matchedItem = menuItems.find(
        (m) => m.sku.toLowerCase() === q && m.isAvailable
      );
      if (matchedItem) {
        addItemToCart(matchedItem);
        setSearchQuery('');
      }
    }
  };

  // Filtered Menu Items (Strict Search & Category Filtering directly from Supabase Catalog)
  const filteredMenuItems = useMemo(() => {
    const q = searchQuery.trim();
    if (q) {
      return menuItems.filter(
        (m) => m.isAvailable && checkStrictSearchMatch(m.nameEn, m.nameAr, m.priceKwd, m.sku, q)
      );
    }
    if (selectedCategorySlug === 'all') {
      return menuItems.filter((m) => m.isAvailable);
    }
    const cat = categories.find(
      (c) => c.id === selectedCategorySlug || c.slug === selectedCategorySlug
    );
    if (!cat) {
      return menuItems.filter((m) => m.categoryId === selectedCategorySlug && m.isAvailable);
    }
    return menuItems.filter(
      (m) => (m.categoryId === cat.id || m.categoryId === cat.slug) && m.isAvailable
    );
  }, [menuItems, categories, selectedCategorySlug, searchQuery]);

  // Deduplicated & Ordered Categories from Supabase (Strictly supports all 11 official categories)
  const displayCategories = useMemo(() => {
    const sorted = [...categories].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    const seen = new Set<string>();
    const list: Category[] = [];
    sorted.forEach((cat) => {
      const key = cat.id || cat.slug;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(cat);
      }
    });
    // Soft Drinks and all official categories remain strictly visible even with 0 items
    return list;
  }, [categories]);

  // Filtered Active Kitchen Orders for KOT Manager Drawer
  const filteredKotOrders = useMemo(() => {
    return activeKotOrders.filter((ord) => {
      if (kotChannelFilter !== 'all' && ord.channel !== kotChannelFilter) {
        return false;
      }
      if (kotSearchQuery.trim()) {
        const q = kotSearchQuery.trim().toLowerCase();
        const matchToken = String(ord.tokenNo).includes(q);
        const matchInvoice = ord.invoiceNo.toLowerCase().includes(q);
        const matchTable = (ord.tableNo || '').toLowerCase().includes(q);
        const matchCust = ord.customerName.toLowerCase().includes(q);
        const matchItems = ord.items.some(
          (i) => i.titleEn.toLowerCase().includes(q) || i.titleAr.toLowerCase().includes(q)
        );
        return matchToken || matchInvoice || matchTable || matchCust || matchItems;
      }
      return true;
    });
  }, [activeKotOrders, kotChannelFilter, kotSearchQuery]);

  // Today's Fast-Moving vs Slow-Moving Items Analytics (Staff & Manager Live View)
  const itemMovementAnalytics = useMemo(() => {
    const salesMap = new Map<
      string,
      {
        id: string;
        nameEn: string;
        nameAr: string;
        category: string;
        priceKwd: number;
        visualEmoji: string;
        unitsSold: number;
        totalRevenueKwd: number;
        trackStock?: boolean;
        stockQuantity?: number;
      }
    >();

    // Initialize all menu items
    menuItems.forEach((m) => {
      const cat = categories.find((c) => c.id === m.categoryId);
      salesMap.set(m.id, {
        id: m.id,
        nameEn: m.nameEn,
        nameAr: m.nameAr,
        category: cat?.nameEn || 'Sides & Dips',
        priceKwd: m.priceKwd,
        visualEmoji: m.visualEmoji,
        unitsSold: 0,
        totalRevenueKwd: 0,
        trackStock: m.trackStock,
        stockQuantity: m.stockQuantity,
      });
    });

    // Aggregate today's settled orders
    posOrders.forEach((ord) => {
      if (ord.status === 'voided') return;
      ord.items.forEach((item) => {
        if (item.type === 'ITEM') {
          const entry = salesMap.get(item.refId);
          if (entry) {
            entry.unitsSold += item.quantity;
            entry.totalRevenueKwd = roundKWD(
              entry.totalRevenueKwd + item.quantity * item.unitPriceKwd
            );
          }
        }
      });
    });

    const allList = Array.from(salesMap.values());
    const fastMoving = [...allList]
      .filter((i) => i.unitsSold > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold || b.totalRevenueKwd - a.totalRevenueKwd);

    const slowMoving = [...allList]
      .filter((i) => i.unitsSold === 0 || i.unitsSold <= 2)
      .sort((a, b) => a.unitsSold - b.unitsSold || a.priceKwd - b.priceKwd);

    return { fastMoving, slowMoving, totalActiveProducts: allList.length };
  }, [menuItems, categories, posOrders]);

  // Stock status check
  const getItemStockStatus = (item: MenuItem): { low: boolean; label: string } => {
    for (const b of item.bom) {
      const ing = rawIngredients.find((r) => r.id === b.rawIngredientId);
      if (ing && ing.currentStock <= ing.reorderLevel) {
        return { low: true, label: `Low ${ing.name.split(' ')[0]}` };
      }
    }
    return { low: false, label: 'IN STOCK' };
  };

  // Handle Discount with Role Guard
  const handleSelectDiscount = (val: number, reasonText: string, isFlat = false) => {
    if (!currentUser) return;
    const effectivePct = isFlat
      ? cartSubtotalKwd > 0
        ? Math.round((val / cartSubtotalKwd) * 100)
        : 0
      : val;

    if (effectivePct > currentUser.maxDiscountPct) {
      setShowDiscountModal(false);
      requestManagerOverride({
        title: isFlat
          ? `Authorize ${val.toFixed(3)} ${CURRENCY} Discount (Approx. ${effectivePct}%, Limit: ${currentUser.maxDiscountPct}%)`
          : `Authorize ${val}% Discount (Cashier Limit: ${currentUser.maxDiscountPct}%)`,
        reasonPrompt: 'Manager Discount Authorization Note',
        onAuthorized: (mgr, overrideReason) => {
          applyCartDiscount(val, overrideReason || reasonText, isFlat, mgr.name);
        },
      });
    } else {
      applyCartDiscount(val, reasonText, isFlat);
      setShowDiscountModal(false);
    }
  };

  // Instant Clear Active Unbilled Cart (Routine Cashier Operation — Strictly No Manager PIN Prompt)
  const handleClearActiveCart = () => {
    if (cartLines.length === 0) return;
    clearCart();
    playTerminalSound('tap');
  };

  // Void Active Cart (Manager Override Guard for Void Authorizations)
  const handleVoidActiveTicket = () => {
    if (cartLines.length === 0 || !currentUser) return;
    if (!currentUser.canVoidBills) {
      requestManagerOverride({
        title: `Void Active Ticket (${formatKWD(cartGrandTotalKwd)})`,
        reasonPrompt: 'Reason for Voiding Active Ticket',
        onAuthorized: () => {
          clearCart();
        },
      });
    } else {
      clearCart();
    }
  };

  // Open Payment Modal
  const handleOpenPaymentDeck = (defaultMethod: PaymentMethod = 'cash') => {
    if (cartLines.length === 0) return;
    playTerminalSound('tap');
    setSelectedPaymentMethod(
      activeStaffPurchaseRecipient
        ? 'staff_credit'
        : cartChannel === 'keeta'
        ? 'aggregator_prepaid'
        : defaultMethod
    );
    setCashTenderedInput(cartGrandTotalKwd.toFixed(3));
    setSplitCashInput(roundKWD(cartGrandTotalKwd / 2).toFixed(3));
    setShowPaymentModal(true);
  };

  const parsedCashTendered = parseFloat(cashTenderedInput) || 0;
  const parsedSplitCash = parseFloat(splitCashInput) || 0;
  const computedSplitKnet = roundKWD(Math.max(0, cartGrandTotalKwd - parsedSplitCash));
  const computedCashChange = roundKWD(Math.max(0, parsedCashTendered - cartGrandTotalKwd));

  const handleFinalizeSale = () => {
    if (selectedPaymentMethod === 'cash' && parsedCashTendered < cartGrandTotalKwd) {
      playTerminalSound('error');
      return;
    }

    completeCheckout({
      paymentMethod: selectedPaymentMethod,
      cashTenderedKwd:
        selectedPaymentMethod === 'cash'
          ? parsedCashTendered
          : selectedPaymentMethod === 'split'
          ? parsedSplitCash
          : 0,
      knetTenderedKwd:
        selectedPaymentMethod === 'knet'
          ? cartGrandTotalKwd
          : selectedPaymentMethod === 'split'
          ? computedSplitKnet
          : 0,
    });
    setShowPaymentModal(false);
  };

  return (
    <div className="no-print h-full w-full flex-1 min-h-0 flex flex-row overflow-hidden bg-[#FAF6F0] text-[#1E293B]">
      {/* ===========================================================================
          LEFT / CENTER CANVAS: CHANNELS, MASTER SEARCH & CATEGORY WORKSPACE
         =========================================================================== */}
      <div className="w-[58%] md:w-[60%] lg:w-[64%] xl:w-[66%] h-full flex flex-col min-h-0 overflow-hidden border-r border-[#E8E1D5]">
        {/* TOP ROW: ORDER TYPES BAR (Dine-In, Takeaway, Web Direct, Keeta) */}
        <div className="p-2 sm:p-2.5 bg-white border-b border-[#E8E1D5] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['dine_in', 'takeaway', 'chikarro_web', 'keeta'] as OrderChannel[]).map((ch) => {
              const active = cartChannel === ch;
              const meta = CHANNEL_META[ch];
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setCartChannel(ch)}
                  className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold border transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-xs'
                      : 'bg-[#FAF6F0] text-[#1E293B] border-[#E8E1D5] hover:bg-amber-50'
                  }`}
                >
                  <span>{meta.shortLabel}</span>
                  {ch === 'dine_in' && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setCartChannel('dine_in');
                        setShowTableMapModal(true);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        active ? 'bg-[#A50D25] text-white' : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {selectedTableNo}
                    </span>
                  )}
                </button>
              );
            })}

            {cartChannel === 'dine_in' && (
              <button
                type="button"
                onClick={() => setShowTableMapModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition"
              >
                Table Map ({selectedTableNo})
              </button>
            )}

            {/* Staff Purchase (Staff Credit) Dropdown Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  playTerminalSound('tap');
                  setShowStaffPurchaseDropdown((prev) => !prev);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs md:text-sm font-extrabold flex items-center gap-1.5 transition shadow-xs active:scale-95 ${
                  activeStaffPurchaseRecipient
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
                }`}
                title="Switch active cart into Staff Purchase (Credit Ledger) Mode"
              >
                <UserCheck className={`w-4 h-4 ${activeStaffPurchaseRecipient ? 'text-white' : 'text-[#C8102E]'}`} />
                <span>
                  {activeStaffPurchaseRecipient
                    ? `Staff: ${activeStaffPurchaseRecipient.name.split(' ')[0]} (Credit)`
                    : 'Staff Purchase'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 ${activeStaffPurchaseRecipient ? 'text-white' : 'text-amber-900'}`} />
              </button>

              {/* Staff Dropdown Menu */}
              {showStaffPurchaseDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl border border-[#E8E1D5] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2 py-1.5 border-b border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-500 font-bold uppercase">
                    <span>Select Staff Member</span>
                    <button
                      type="button"
                      onClick={() => setShowStaffPurchaseDropdown(false)}
                      className="p-0.5 text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                    {staffAccounts.map((staff) => {
                      const isSelected = activeStaffPurchaseRecipient?.id === staff.id;
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => {
                            playTerminalSound('tap');
                            setActiveStaffPurchaseRecipient(staff);
                            setShowStaffPurchaseDropdown(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-amber-100 border border-amber-300'
                              : 'hover:bg-amber-50/60 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-200 text-amber-950 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              {staff.avatarBadge}
                            </span>
                            <div>
                              <div className="font-display font-bold text-xs text-[#1E293B]">
                                {staff.name}
                              </div>
                              <div className="text-[10px] font-mono text-stone-400">
                                {staff.employeeCode} • {staff.role}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                              ACTIVE
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {activeStaffPurchaseRecipient && (
                    <div className="pt-1 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => {
                          playTerminalSound('tap');
                          setActiveStaffPurchaseRecipient(null);
                          setShowStaffPurchaseDropdown(false);
                        }}
                        className="w-full py-1.5 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono font-bold text-center transition"
                      >
                        Reset to Regular Customer Mode
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] font-mono text-stone-500 hidden sm:block">
            Salmiya Flagship
          </div>
        </div>

        {/* SECOND ROW: "ALL MENU" + "FIND IT" BUTTONS & UNIVERSAL SEARCH BAR */}
        <div className="p-2 sm:p-2.5 bg-[#FAF6F0] border-b border-[#E8E1D5] flex items-center gap-2 shrink-0">
          {/* Master Button: All Menu */}
          <button
            type="button"
            onClick={() => {
              playTerminalSound('tap');
              setSearchQuery('');
              setSelectedCategorySlug('all');
            }}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all border flex items-center gap-1.5 shrink-0 ${
              selectedCategorySlug === 'all' && !searchQuery
                ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-xs'
                : 'bg-white text-[#1E293B] border-[#E8E1D5] hover:bg-amber-50'
            }`}
          >
            <span>All Menu</span>
          </button>

          {/* Master Button: Find It (Categories Toggle/Pin) */}
          <button
            type="button"
            onClick={() => {
              playTerminalSound('tap');
              setShowCategorySidebar((prev) => !prev);
              if (selectedCategorySlug === 'all') {
                setSelectedCategorySlug(categories[0]?.slug || 'combos');
              }
            }}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all border flex items-center gap-1.5 shrink-0 ${
              showCategorySidebar && selectedCategorySlug !== 'all'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-[#1E293B] border-[#E8E1D5] hover:bg-amber-50'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Find It (Categories)</span>
          </button>

          {/* Prominent High-Contrast Universal Smart Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search any item name, words, or price (e.g., 7.450, 1.500)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border-2 border-amber-300 focus:border-[#C8102E] text-xs md:text-sm font-medium text-[#1E293B] placeholder:text-stone-400 focus:outline-none transition shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* WORKSPACE AREA: VERTICAL SIDEBAR + COMPACT PRODUCT GRID */}
        <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
          {/* VERTICAL CATEGORY SIDEBAR (Dedicated Independent Scrolling Container) */}
          {showCategorySidebar && (
            <aside
              aria-label="Menu Categories Navigation"
              className="w-40 sm:w-44 md:w-48 lg:w-52 h-full overflow-y-auto bg-white border-r border-[#E8E1D5] p-1.5 sm:p-2 space-y-1 shrink-0 overscroll-contain select-none focus:outline-none"
              style={{ scrollbarGutter: 'stable' }}
            >
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
                Menu Categories
              </div>

              {/* All Items Button */}
              <button
                type="button"
                onClick={() => {
                  playTerminalSound('tap');
                  setSearchQuery('');
                  setSelectedCategorySlug('all');
                }}
                className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs md:text-sm transition-all flex items-center justify-between gap-1.5 ${
                  selectedCategorySlug === 'all' && !searchQuery
                    ? 'bg-[#C8102E] text-white border-[#C8102E] font-extrabold shadow-xs'
                    : 'bg-[#FAF6F0] hover:bg-amber-50 text-[#1E293B] border-[#E8E1D5] font-semibold'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Utensils className="w-4 h-4 shrink-0" />
                  <span className="truncate">All Categories</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                    selectedCategorySlug === 'all' && !searchQuery
                      ? 'bg-[#A50D25] text-white'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {menuItems.filter((m) => m.isAvailable).length}
                </span>
              </button>

              {displayCategories.map((cat) => {
                const active =
                  (selectedCategorySlug === cat.id || selectedCategorySlug === cat.slug) &&
                  !searchQuery;
                const iconElement = cat.icon ? ALLOWED_CATEGORY_ICONS[cat.icon] : null;

                const count = menuItems.filter(
                  (m) =>
                    (m.categoryId === cat.id || m.categoryId === cat.slug) &&
                    m.isAvailable
                ).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playTerminalSound('tap');
                      setSearchQuery('');
                      setSelectedCategorySlug(cat.id);
                    }}
                    className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs md:text-sm transition-all flex items-center justify-between gap-1.5 ${
                      active
                        ? 'bg-[#C8102E] text-white border-[#C8102E] font-extrabold shadow-xs'
                        : 'bg-[#FAF6F0] hover:bg-amber-50 text-[#1E293B] border-[#E8E1D5] font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {iconElement}
                      <span className="truncate">{cat.nameEn}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                        active ? 'bg-[#A50D25] text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </aside>
          )}

          {/* COMPACT PRODUCT CARDS GRID (Dedicated Independent Scrolling Container) */}
          <div
            aria-label="Product Catalog Grid"
            className="flex-1 min-w-0 h-full overflow-y-auto p-2 sm:p-3 space-y-3 overscroll-contain"
            style={{ scrollbarGutter: 'stable' }}
          >
            {/* Menu Items Section */}
            {filteredMenuItems.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2 sm:gap-2.5">
                  {filteredMenuItems.map((item) => {
                    const stockInfo = getItemStockStatus(item);
                    const isDirectTracked = Boolean(item.trackStock);
                    const stockQty = item.stockQuantity ?? 0;
                    const threshold = item.lowStockThreshold ?? 5;
                    const isOutOfStock = isDirectTracked && stockQty <= 0;
                    const isLowStock = isDirectTracked ? stockQty <= threshold : stockInfo.low;
                    const canOrder = item.isAvailable && !isOutOfStock;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!canOrder) return;
                          addItemToCart(item);
                        }}
                        className={`group relative rounded-xl p-3 border transition-all flex flex-col justify-between ${
                          canOrder
                            ? 'cursor-pointer bg-white border-[#E8E1D5] hover:border-amber-400 hover:shadow-card-hover active:scale-[0.99]'
                            : 'opacity-50 cursor-not-allowed bg-stone-100 border-red-300'
                        }`}
                      >
                        <div>
                          {/* Thumbnail / Emoji + Stock Badge */}
                          <div className="flex items-start justify-between gap-1 mb-2">
                            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-xl shadow-xs">
                              {item.visualEmoji}
                            </div>
                            {isDirectTracked ? (
                              isOutOfStock ? (
                                <span className="px-2 py-0.5 rounded font-mono text-[9px] font-extrabold bg-red-600 text-white animate-pulse">
                                  OUT OF STOCK (0)
                                </span>
                              ) : isLowStock ? (
                                <span className="px-2 py-0.5 rounded font-mono text-[9px] font-extrabold bg-rose-600 text-white animate-pulse">
                                  LOW STOCK: {stockQty} LEFT
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {stockQty} in stock
                                </span>
                              )
                            ) : (
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                                  stockInfo.low
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-50 text-emerald-800'
                                }`}
                              >
                                {stockInfo.label}
                              </span>
                            )}
                          </div>

                          {/* Bold Title */}
                          <h4 className="font-display font-bold text-xs md:text-sm text-[#1E293B] group-hover:text-[#C8102E] transition line-clamp-2 min-h-[2.4rem] leading-snug break-words">
                            {item.nameEn}
                          </h4>
                          <span className="text-[10px] font-mono text-stone-400 block mt-0.5">
                            {item.sku}
                          </span>
                        </div>

                        {/* Price in Crimson Red + Prep Customizer + Large Add Button */}
                        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
                          <span className="font-mono text-sm md:text-base font-extrabold text-[#C8102E]">
                            {formatKWD(item.priceKwd)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={!canOrder}
                              onClick={(e) => {
                                e.stopPropagation();
                                playTerminalSound('tap');
                                setCustomizingItem(item);
                              }}
                              className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-[10px] font-bold flex items-center gap-1 transition"
                              title="Customize prep, spice & sides"
                            >
                              <SlidersHorizontal className="w-3 h-3 text-stone-500" />
                              <span>Prep</span>
                            </button>
                            <button
                              type="button"
                              disabled={!canOrder}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!canOrder) return;
                                addItemToCart(item);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#C8102E] hover:bg-[#A50D25] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredMenuItems.length === 0 && (
              <div className="h-72 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-stone-200 rounded-2xl bg-white/60">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-3 text-amber-600">
                  <CupSoda className="w-6 h-6" />
                </div>
                {searchQuery ? (
                  <>
                    <h4 className="font-bold text-sm text-[#1E293B]">No items match your search</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      No products found matching &ldquo;{searchQuery}&rdquo;. Try another search term or price.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-bold text-sm text-[#1E293B]">
                      No products currently in {categories.find((c) => c.id === selectedCategorySlug || c.slug === selectedCategorySlug)?.nameEn || 'this category'}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm">
                      This category is active in the menu catalog. Products added by Admin in the Catalog Studio will immediately appear here.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===========================================================================
          RIGHT DOCKED ORDER TICKET / CART: 100VH SECURE PINNED BOTTOM DECK
         =========================================================================== */}
      <div className="w-[42%] md:w-[40%] lg:w-[36%] xl:w-[34%] h-full flex flex-col min-h-0 bg-white border-l border-[#E8E1D5] overflow-hidden shadow-xs">
        {/* CART TOP BAR: Channel, Table, KOT Queue, Hold, Held */}
        <div className="p-2 sm:p-2.5 bg-[#FAF6F0] border-b border-[#E8E1D5] shrink-0 space-y-1.5">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border ${CHANNEL_META[cartChannel].badgeClass}`}>
                {CHANNEL_META[cartChannel].shortLabel}
              </span>
              {cartChannel === 'dine_in' && (
                <span className="px-1.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-mono text-[11px] font-bold">
                  {selectedTableNo}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setShowKotModal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-mono text-[11px] font-bold transition shadow-2xs active:scale-95 border border-amber-600"
                title="Open Active Kitchen Orders Queue"
              >
                <ChefHat className="w-3.5 h-3.5 text-white" />
                <span>KOT ({activeKotOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={holdCurrentCart}
                disabled={cartLines.length === 0}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-amber-50 disabled:opacity-40 border border-[#E8E1D5] text-[11px] font-mono font-bold text-amber-800 transition"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Hold</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHeldModal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-stone-50 border border-[#E8E1D5] text-[11px] font-mono font-bold text-stone-700 transition"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Held ({heldOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTerminalSound('tap');
                  setVoidSearchQuery('');
                  setSelectedVoidOrder(null);
                  setVoidSupervisorPin('');
                  setVoidError(null);
                  setVoidSuccessOrder(null);
                  setShowVoidBillModal(true);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-[11px] font-mono font-bold text-rose-800 transition active:scale-95 shadow-2xs"
                title="Admin / Manager: Void or Cancel Completed Bill"
              >
                <RotateCcw className="w-3 h-3 text-rose-700" />
                <span>Void</span>
              </button>
            </div>
          </div>

          {/* Bound Kitchen Order Active Indicator Banner */}
          {activeKitchenOrderId && (
            <div className="p-2 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex items-center justify-between text-[11px] font-mono shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-amber-700 animate-pulse shrink-0" />
                <div>
                  <span className="font-extrabold text-[#C8102E]">
                    KITCHEN TICKET #{posOrders.find((o) => o.id === activeKitchenOrderId)?.tokenNo}
                  </span>
                  <span className="text-[10px] text-amber-800 ml-1 hidden sm:inline">
                    (Loaded for Settlement)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={unbindKitchenOrder}
                className="px-1.5 py-0.5 rounded bg-white hover:bg-rose-50 border border-amber-300 hover:border-rose-300 text-rose-700 font-bold text-[10px] transition"
                title="Unbind from this kitchen ticket"
              >
                ✕ Unbind
              </button>
            </div>
          )}

          {/* Customer / Table Info Pill */}
          <div className="flex items-center justify-between gap-1.5 bg-white border border-[#E8E1D5] rounded-lg px-2 py-1 text-xs text-stone-700">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3 h-3 text-[#C8102E] shrink-0" />
              <span className="truncate text-[11px]">
                {customerName
                  ? `${customerName} ${customerPhone ? `(${customerPhone})` : ''}`
                  : cartChannel === 'dine_in'
                  ? `Dine-In • Table ${selectedTableNo}`
                  : 'Counter Walk-In'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomerDrawer((v) => !v)}
              className="text-[10px] font-bold text-[#C8102E] hover:underline shrink-0"
            >
              {showCustomerDrawer ? 'Hide' : 'Customer Info'}
            </button>
          </div>

          {showCustomerDrawer && (
            <div className="p-2 rounded-lg bg-white border border-[#E8E1D5] shadow-2xs space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Guest Name"
                  className="w-full px-2 py-1 rounded bg-[#FAF6F0] border border-[#E8E1D5] text-[11px] text-[#1E293B]"
                />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={() => {
                    const known = lookupCustomerByPhone(customerPhone);
                    if (!known) return;
                    if (!customerName.trim()) setCustomerName(known.name);
                    if (!deliveryAddress.trim() && known.address) setDeliveryAddress(known.address);
                  }}
                  placeholder="+965 Phone"
                  className="w-full px-2 py-1 rounded bg-[#FAF6F0] border border-[#E8E1D5] text-[11px] font-mono text-[#1E293B]"
                />
              </div>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Salmiya Block / Street / Bldg / Apt..."
                className="w-full px-2 py-1 rounded bg-[#FAF6F0] border border-[#E8E1D5] text-[11px] text-[#1E293B]"
              />
            </div>
          )}
        </div>

        {/* CART ITEM LIST: INTERNAL SCROLL (FLEX-1) NEVER OVERFLOWS BOTTOM */}
        <div 
          className="flex-1 min-h-[85px] sm:min-h-[100px] overflow-y-auto p-2 sm:p-2.5 space-y-1.5 overscroll-contain"
          style={{ scrollbarGutter: 'stable' }}
        >
          {/* Active Staff Purchase Mode Banner */}
          {activeStaffPurchaseRecipient && (
            <div className="p-2 rounded-xl bg-amber-500 text-white flex items-center justify-between shadow-2xs border border-amber-600">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-white shrink-0" />
                <div>
                  <div className="text-[11px] font-mono font-black uppercase tracking-wide">
                    STAFF PURCHASE: {activeStaffPurchaseRecipient.name} - CREDIT
                  </div>
                  <div className="text-[9px] text-amber-100 font-mono">
                    Code: {activeStaffPurchaseRecipient.employeeCode} • Recorded to Salary Ledger
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStaffPurchaseRecipient(null)}
                className="p-1 rounded-lg bg-black/20 hover:bg-black/30 text-white text-xs font-bold transition"
                title="Cancel Staff Purchase Mode"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {cartLines.length === 0 ? (
            <div className="h-full min-h-[80px] flex flex-col items-center justify-center text-center px-4 py-4 text-stone-400">
              <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-center mb-1 text-stone-500">
                <Utensils className="w-5 h-5" />
              </div>
              <p className="text-xs font-display font-bold text-[#1E293B]">
                Order Ticket Empty
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Select items on the left to add to bill.
              </p>
            </div>
          ) : (
            cartLines.map((line) => {
              const lineTotal = roundKWD(line.unitPriceKwd * line.quantity);
              const isComboExpanded = !!expandedComboLineIds[line.lineId];
              const comboBreakdown = getLineComboBreakdown(line);

              return (
                <div
                  key={line.lineId}
                  className="rounded-xl p-2 border border-[#E8E1D5] bg-[#FAF6F0]/60 space-y-1"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {(line.type === 'COMBO' || comboBreakdown.isCombo) && (
                          <span className="px-1 py-0.2 rounded bg-amber-600 text-white font-mono text-[9px] font-extrabold uppercase">
                            COMBO
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-stone-400 font-bold">
                          {line.skuOrCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-xs md:text-sm font-bold text-[#1E293B] leading-tight truncate">
                          {line.titleEn}
                        </h5>
                        {/* Interactive Collapsible Accordion Arrow Button (▼ / ▶) for Combos & Meals */}
                        {comboBreakdown.isCombo && (
                          <button
                            type="button"
                            onClick={() => toggleComboLineAccordion(line.lineId)}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-bold transition active:scale-95 shadow-2xs ${
                              isComboExpanded
                                ? 'bg-amber-200 text-amber-950 border-amber-400'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                            }`}
                            title={isComboExpanded ? 'Collapse meal breakdown' : 'Click to view included items'}
                          >
                            <span className="text-[10px] leading-none select-none">
                              {isComboExpanded ? '▼' : '▶'}
                            </span>
                            <span>{isComboExpanded ? 'Hide' : `${comboBreakdown.items.length || 'View'} Items`}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs md:text-sm font-extrabold text-[#C8102E]">
                        {formatKWD(lineTotal)}
                      </div>
                      <div className="font-mono text-[10px] text-stone-400">
                        {formatKWD(line.unitPriceKwd, false)} × {line.quantity}
                      </div>
                    </div>
                  </div>

                  {/* Combo & Meal Breakdown Accordion (Expandable downward) */}
                  {comboBreakdown.isCombo && isComboExpanded && (
                    <div className="pl-2.5 py-1.5 pr-2 border-l-2 border-amber-500 bg-amber-50/90 rounded-r-lg space-y-1 my-1 animate-in fade-in duration-150">
                      <div className="text-[10px] font-mono font-extrabold text-amber-950 uppercase flex items-center justify-between">
                        <span>Items Included in this Meal:</span>
                        <span className="text-[9px] text-amber-800 font-bold font-mono">
                          {line.quantity > 1 ? `(${line.quantity}x Combos)` : '1x Meal'}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {comboBreakdown.items.map((it, itIdx) => (
                          <div
                            key={itIdx}
                            className="text-[11px] font-mono text-stone-700 flex items-center justify-between"
                          >
                            <span className="truncate">• {it}</span>
                            <span className="text-[9px] font-extrabold text-amber-800 uppercase shrink-0 ml-1">
                              INCL
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modifiers */}
                  {line.customization && (
                    <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                      {line.customization.prepStyle && line.customization.prepStyle !== 'Regular' && (
                        <span className="px-1 py-0.2 rounded bg-stone-200 text-stone-800 font-bold">
                          {line.customization.prepStyle}
                        </span>
                      )}
                      {line.customization.sideChoice && line.customization.sideChoice.id !== 'none' && (
                        <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-900">
                          {line.customization.sideChoice.nameEn}
                        </span>
                      )}
                      {line.customization.drinkChoice && line.customization.drinkChoice.id !== 'none' && (
                        <span className="px-1 py-0.2 rounded bg-sky-100 text-sky-900">
                          {line.customization.drinkChoice.nameEn}
                        </span>
                      )}
                      {line.customization.addons.map((ad) => (
                        <span key={ad.id} className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-900">
                          +{ad.nameEn}
                        </span>
                      ))}
                      {line.customization.kitchenNotes && (
                        <span className="px-1 py-0.2 rounded bg-yellow-100 text-yellow-900 font-bold">
                          NOTE: {line.customization.kitchenNotes}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quantity Stepper & Delete */}
                  <div className="pt-1 border-t border-stone-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateCartLineQty(line.lineId, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-[#E8E1D5] flex items-center justify-center text-stone-700 font-bold hover:bg-stone-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono text-xs font-extrabold text-[#1E293B]">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartLineQty(line.lineId, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-[#E8E1D5] flex items-center justify-center text-stone-700 font-bold hover:bg-stone-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCartLine(line.lineId)}
                      className="text-stone-400 hover:text-rose-600 p-1 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PINNED BOTTOM DECK (SHRINK-0): NEVER CUT OFF ON LAPTOP & TABLET SCREENS */}
        <div className="shrink-0 border-t border-[#E8E1D5] bg-[#FAF6F0] p-2 sm:p-2.5 space-y-1.5 sm:space-y-2">
          {/* Apply Promo */}
          {cartLines.length > 0 && (
            <div className="space-y-1">
              {appliedPromo ? (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px] font-mono font-extrabold text-emerald-900">
                  <span>PROMO {appliedPromo.code} APPLIED</span>
                  <button
                    type="button"
                    onClick={() => {
                      removePromo();
                      setPromoInput('');
                      setPromoMsg(null);
                    }}
                    className="px-2 py-0.5 rounded bg-white border border-emerald-300 hover:bg-emerald-100"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      setPromoMsg(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setPromoMsg(applyPromoCode(promoInput));
                    }}
                    placeholder="PROMO CODE"
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white border border-[#E8E1D5] text-[11px] font-mono font-bold uppercase focus:outline-none focus:border-[#C8102E]"
                  />
                  <button
                    type="button"
                    onClick={() => setPromoMsg(applyPromoCode(promoInput))}
                    className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-black text-white text-[11px] font-mono font-extrabold"
                  >
                    APPLY PROMO
                  </button>
                </div>
              )}
              {promoMsg && !appliedPromo && (
                <div className={`text-[10px] font-mono font-bold ${promoMsg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {promoMsg.message}
                </div>
              )}
            </div>
          )}

          {/* Subtotal, Discount & Grand Total */}
          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between text-stone-600 text-[11px] sm:text-xs">
              <span>SUBTOTAL ({cartLines.reduce((s, l) => s + l.quantity, 0)} ITEMS)</span>
              <span className="text-[#1E293B] font-bold">{formatKWD(cartSubtotalKwd)}</span>
            </div>

            {cartDiscountKwd > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold text-[11px] sm:text-xs">
                <span>
                  DISCOUNT {isFlatDiscount ? `(FLAT)` : `(${discountPct}%)`}
                </span>
                <span>-{formatKWD(cartDiscountKwd)}</span>
              </div>
            )}

            {cartDeliveryFeeKwd > 0 && (
              <div className="flex justify-between text-amber-800 font-bold text-[11px] sm:text-xs">
                <span>DELIVERY FEE</span>
                <span>+{formatKWD(cartDeliveryFeeKwd)}</span>
              </div>
            )}

            {/* Prominent Grand Total in Crimson Red */}
            <div className="pt-1 border-t border-[#E8E1D5] flex items-baseline justify-between">
              <span className="font-display font-bold text-xs uppercase text-[#1E293B]">
                GRAND TOTAL
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black text-[#C8102E] tracking-tight">
                {formatKWD(cartGrandTotalKwd)}
              </span>
            </div>
          </div>

          {/* OVERSIZED TOUCH ACTION ROW: HOLD, RECALL, CLEAR, DISCOUNT */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
            <button
              type="button"
              disabled={cartLines.length === 0}
              onClick={holdCurrentCart}
              className="min-h-[42px] sm:min-h-[46px] py-1 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 disabled:opacity-40 border border-amber-300 text-[10px] sm:text-xs font-mono font-extrabold text-amber-950 flex flex-col items-center justify-center gap-0.5 transition shadow-2xs active:scale-95"
              title="Park order to Hold Queue"
            >
              <PauseCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800" />
              <span>HOLD</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHeldModal(true)}
              className="min-h-[42px] sm:min-h-[46px] py-1 px-1 rounded-xl bg-white hover:bg-stone-50 border border-[#E8E1D5] text-[10px] sm:text-xs font-mono font-extrabold text-[#1E293B] flex flex-col items-center justify-center gap-0.5 transition shadow-2xs active:scale-95"
              title="Recall Parked Orders"
            >
              <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-700" />
              <span>RECALL ({heldOrders.length})</span>
            </button>

            <button
              type="button"
              disabled={cartLines.length === 0}
              onClick={handleClearActiveCart}
              className="min-h-[42px] sm:min-h-[46px] py-1 px-1 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-40 border border-rose-300 text-[10px] sm:text-xs font-mono font-extrabold text-rose-800 flex flex-col items-center justify-center gap-0.5 transition shadow-2xs active:scale-95"
              title="Instantly clear active cart without PIN"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-700" />
              <span>CLEAR</span>
            </button>

            <button
              type="button"
              disabled={cartLines.length === 0}
              onClick={() => {
                setDiscountKeypadVal(isFlatDiscount ? discountAmountKwd.toFixed(3) : (discountPct || 10).toString());
                setDiscountMode(isFlatDiscount ? 'flat' : 'percentage');
                setShowDiscountModal(true);
              }}
              className="min-h-[42px] sm:min-h-[46px] py-1 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 border border-emerald-300 text-[10px] sm:text-xs font-mono font-extrabold text-emerald-950 flex flex-col items-center justify-center gap-0.5 transition shadow-2xs active:scale-95"
              title="Apply touch percentage or flat discount"
            >
              <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
              <span>{cartDiscountKwd > 0 ? 'DISC ON' : 'DISCOUNT'}</span>
            </button>
          </div>

          {/* TWO PRIMARY OVERSIZED WORKFLOW BUTTONS */}
          <div className="space-y-1.5 pt-0.5">
            {/* 1. SEND & PRINT KOT (KITCHEN TICKET FIRST) */}
            <button
              type="button"
              disabled={cartLines.length === 0}
              onClick={() => sendCartToKitchen()}
              className="w-full min-h-[44px] sm:min-h-[48px] py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition border-2 border-amber-500"
              title="Immediately issue 80mm Kitchen Order Ticket without prices and mark in-kitchen"
            >
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>1. SEND &amp; PRINT KOT (KITCHEN)</span>
            </button>

            {/* 2. PAY & PRINT CUSTOMER BILL */}
            <button
              type="button"
              disabled={cartLines.length === 0}
              onClick={() => handleOpenPaymentDeck('cash')}
              className="w-full min-h-[44px] sm:min-h-[48px] py-2 px-3 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] disabled:opacity-40 text-white font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition border-2 border-[#A50D25]"
            >
              <Printer className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>2. PAY &amp; PRINT BILL ({formatKWD(cartGrandTotalKwd)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===========================================================================
          MODAL 1: ITEM & COMBO CUSTOMIZATION SHEET
         =========================================================================== */}
      {(customizingItem || customizingCombo) && (
        <ItemCustomizationModal
          targetItem={customizingItem}
          targetCombo={customizingCombo}
          onClose={() => {
            setCustomizingItem(null);
            setCustomizingCombo(null);
          }}
          onConfirm={(customization) => {
            if (customizingCombo) {
              addComboToCart(customizingCombo, customization);
              setCustomizingCombo(null);
            } else if (customizingItem) {
              addItemToCart(customizingItem, customization);
              setCustomizingItem(null);
            }
          }}
        />
      )}

      {/* ===========================================================================
          MODAL 2: DINE-IN TABLE MAP SELECTOR
         =========================================================================== */}
      {showTableMapModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E1D5] shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div>
                <h3 className="font-display font-bold text-base text-[#1E293B]">
                  Salmiya Dine-In Floor Plan &amp; Table Map
                </h3>
                <p className="text-xs text-stone-500">
                  Select customer table for dine-in seating
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTableMapModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {dineInTables.map((tbl) => {
                const isSelected = selectedTableNo === tbl.tableNo;
                return (
                  <button
                    key={tbl.tableNo}
                    type="button"
                    onClick={() => {
                      setSelectedTableNo(tbl.tableNo);
                      setCartChannel('dine_in');
                      setShowTableMapModal(false);
                      playTerminalSound('tap');
                    }}
                    className={`p-3 rounded-xl border text-center transition ${
                      isSelected
                        ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                        : tbl.status === 'occupied'
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-[#FAF6F0] text-[#1E293B] border-[#E8E1D5] hover:bg-white'
                    }`}
                  >
                    <div className="font-mono text-base font-extrabold">
                      {tbl.tableNo}
                    </div>
                    <div className="text-[10px] uppercase font-bold mt-0.5">
                      {tbl.zone}
                    </div>
                    <div className="text-[10px] font-mono opacity-80 mt-1">
                      {tbl.seats} Seats • {tbl.status.toUpperCase()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===========================================================================
          MODAL 3: HELD ORDERS RECALL SHEET
         =========================================================================== */}
      {showHeldModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E1D5] shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="font-display font-bold text-base text-[#1E293B]">
                Parked &amp; Held Order Queue ({heldOrders.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowHeldModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {heldOrders.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-stone-400">
                Zero parked orders in queue.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {heldOrders.map((h) => {
                  const heldTotal = roundKWD(
                    h.items.reduce((s, i) => s + i.unitPriceKwd * i.quantity, 0)
                  );
                  return (
                    <div
                      key={h.id}
                      className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#C8102E]">
                            {h.holdCode}
                          </span>
                          <span className="text-xs font-bold text-[#1E293B]">
                            {h.customerName}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                          {h.items.length} lines • {formatKWD(heldTotal)} • Held by {h.heldBy}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            recallHeldOrder(h.id);
                            setShowHeldModal(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#C8102E] text-white text-xs font-bold hover:bg-[#A50D25]"
                        >
                          Recall
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHeldOrder(h.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===========================================================================
          MODAL 4: TOUCH-SCREEN ERGONOMIC DISCOUNT MODAL (PERCENTAGE & FLAT {CURRENCY})
         =========================================================================== */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8E1D5] shadow-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#1E293B]">
                    Order Discount &amp; Markdowns
                  </h3>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Touch-optimized percentage or flat dinar concession
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Switch: % Percentage vs 0.000 KWD Flat */}
            <div className="grid grid-cols-2 p-1 bg-[#FAF6F0] rounded-xl border border-[#E8E1D5]">
              <button
                type="button"
                onClick={() => {
                  setDiscountMode('percentage');
                  setDiscountKeypadVal('10');
                  playTerminalSound('tap');
                }}
                className={`py-2 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                  discountMode === 'percentage'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-[#1E293B] hover:bg-stone-200'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Percentage (%)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountMode('flat');
                  setDiscountKeypadVal('0.500');
                  playTerminalSound('tap');
                }}
                className={`py-2 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                  discountMode === 'flat'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-[#1E293B] hover:bg-stone-200'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Flat (0.000 {CURRENCY})</span>
              </button>
            </div>

            {/* Quick Preset Chips */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">
                Quick Presets
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {discountMode === 'percentage'
                  ? [5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setDiscountKeypadVal(pct.toString());
                          playTerminalSound('tap');
                        }}
                        className={`py-2 rounded-xl border font-mono text-xs font-extrabold transition ${
                          discountKeypadVal === pct.toString()
                            ? 'bg-[#C8102E] text-white border-[#C8102E]'
                            : 'bg-[#FAF6F0] border-[#E8E1D5] text-[#1E293B] hover:bg-amber-50'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))
                  : [0.25, 0.5, 1.0, 2.0].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setDiscountKeypadVal(amt.toFixed(3));
                          playTerminalSound('tap');
                        }}
                        className={`py-2 rounded-xl border font-mono text-xs font-extrabold transition ${
                          parseFloat(discountKeypadVal) === amt
                            ? 'bg-[#C8102E] text-white border-[#C8102E]'
                            : 'bg-[#FAF6F0] border-[#E8E1D5] text-[#1E293B] hover:bg-amber-50'
                        }`}
                      >
                        {amt.toFixed(3)}
                      </button>
                    ))}
              </div>
            </div>

            {/* Keypad Display */}
            <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-stone-600 uppercase">
                {discountMode === 'percentage' ? 'Selected Rate:' : 'Selected Concession:'}
              </span>
              <span className="font-mono text-2xl font-black text-[#C8102E]">
                {discountKeypadVal || '0'}{' '}
                <span className="text-sm">{discountMode === 'percentage' ? '%' : `${CURRENCY}`}</span>
              </span>
            </div>

            {/* Touch Keypad Grid */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    playTerminalSound('tap');
                    if (key === '⌫') {
                      setDiscountKeypadVal((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
                    } else if (key === '.') {
                      if (!discountKeypadVal.includes('.')) {
                        setDiscountKeypadVal((prev) => prev + '.');
                      }
                    } else {
                      setDiscountKeypadVal((prev) => (prev === '0' ? key : prev + key));
                    }
                  }}
                  className="h-11 rounded-xl bg-white hover:bg-stone-50 border border-[#E8E1D5] text-base font-mono font-extrabold text-[#1E293B] flex items-center justify-center active:scale-95 transition shadow-2xs"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Live Calculation Display */}
            {(() => {
              const entered = parseFloat(discountKeypadVal) || 0;
              const calcDiscount =
                discountMode === 'percentage'
                  ? roundKWD((cartSubtotalKwd * Math.min(100, entered)) / 100)
                  : roundKWD(Math.min(cartSubtotalKwd, entered));
              const netPayable = roundKWD(
                Math.max(0, cartSubtotalKwd - calcDiscount + cartDeliveryFeeKwd)
              );
              const effectivePct =
                discountMode === 'percentage'
                  ? entered
                  : cartSubtotalKwd > 0
                  ? Math.round((entered / cartSubtotalKwd) * 100)
                  : 0;
              const requiresMgr = effectivePct > (currentUser?.maxDiscountPct || 10);

              return (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono space-y-1.5">
                    <div className="flex justify-between text-stone-600 font-semibold">
                      <span>Cart Subtotal:</span>
                      <span className="font-extrabold text-[#1E293B]">
                        {formatKWD(cartSubtotalKwd)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#C8102E] font-bold">
                      <span>
                        Concession (
                        {discountMode === 'percentage'
                          ? `${entered}%`
                          : `${entered.toFixed(3)} ${CURRENCY}`}
                        ):
                      </span>
                      <span>-{formatKWD(calcDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-[#1E293B] font-black pt-1.5 border-t border-[#E8E1D5] text-sm">
                      <span>Net Order Payable:</span>
                      <span className="text-[#C8102E]">{formatKWD(netPayable)}</span>
                    </div>
                  </div>

                  {requiresMgr && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-[11px] font-mono text-amber-950 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Rate exceeds Cashier Limit ({currentUser?.maxDiscountPct || 10}%).
                        Requires Manager PIN authorization on apply.
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Reason Chips & Input */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">
                Discount Reason / Note
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  'Regular Guest',
                  'Staff Meal',
                  'Manager Promo',
                  'Goodwill / Delay',
                  'Spill / Remake',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setDiscountReasonNote(reason)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                      discountReasonNote === reason
                        ? 'bg-amber-100 border-amber-400 text-amber-950'
                        : 'bg-[#FAF6F0] border-[#E8E1D5] text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={discountReasonNote}
                onChange={(e) => setDiscountReasonNote(e.target.value)}
                placeholder="Or enter custom reason note..."
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono text-[#1E293B] placeholder-stone-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDiscountKeypadVal('0')}
                className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs font-bold transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(discountKeypadVal) || 0;
                  handleSelectDiscount(val, discountReasonNote, discountMode === 'flat');
                }}
                className="flex-1 py-3 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-display font-extrabold text-xs uppercase tracking-wider shadow-sm transition active:scale-[0.99]"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===========================================================================
          MODAL 5: FAST & SLOW MOVING ANALYTICS (STAFF VIEW)
         =========================================================================== */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#E8E1D5] shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C8102E]/10 flex items-center justify-center text-[#C8102E]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#1E293B]">
                    Today&apos;s Item Sales &amp; Velocity
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    Real-time movement metrics from {posOrders.length} settled tickets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switcher: Fast vs Slow */}
            <div className="grid grid-cols-2 p-1 bg-[#FAF6F0] rounded-xl border border-[#E8E1D5]">
              <button
                type="button"
                onClick={() => setMovementTab('fast')}
                className={`py-2 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                  movementTab === 'fast'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-[#1E293B] hover:bg-stone-200'
                }`}
              >
                <span>🔥 Fast-Moving Bestsellers</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {itemMovementAnalytics.fastMoving.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMovementTab('slow')}
                className={`py-2 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                  movementTab === 'slow'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-[#1E293B] hover:bg-stone-200'
                }`}
              >
                <span>🧊 Slow-Moving / Dormant</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {itemMovementAnalytics.slowMoving.length}
                </span>
              </button>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {movementTab === 'fast' ? (
                itemMovementAnalytics.fastMoving.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-stone-400">
                    No orders settled yet today to compute fast-moving items.
                  </div>
                ) : (
                  itemMovementAnalytics.fastMoving.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-between gap-3 hover:bg-amber-50/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-black ${
                            idx === 0
                              ? 'bg-amber-400 text-stone-900 shadow-xs'
                              : idx === 1
                              ? 'bg-stone-300 text-stone-800'
                              : idx === 2
                              ? 'bg-amber-200 text-stone-800'
                              : 'bg-white border border-[#E8E1D5] text-stone-600'
                          }`}
                        >
                          #{idx + 1}
                        </div>
                        <span className="text-2xl">{item.visualEmoji}</span>
                        <div>
                          <div className="font-bold text-xs md:text-sm text-[#1E293B]">
                            {item.nameEn}
                          </div>
                          <div className="text-[11px] font-mono text-stone-500">
                            {item.category} • {formatKWD(item.priceKwd)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-sm font-black text-[#C8102E]">
                          {item.unitsSold} sold
                        </div>
                        <div className="text-[11px] font-mono font-bold text-stone-600">
                          {formatKWD(item.totalRevenueKwd)}
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : itemMovementAnalytics.slowMoving.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-stone-400">
                  Zero slow-moving items detected.
                </div>
              ) : (
                itemMovementAnalytics.slowMoving.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-between gap-3 hover:bg-stone-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.visualEmoji}</span>
                      <div>
                        <div className="font-bold text-xs md:text-sm text-[#1E293B]">
                          {item.nameEn}
                        </div>
                        <div className="text-[11px] font-mono text-stone-500">
                          {item.category} • {formatKWD(item.priceKwd)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-stone-500">
                        {item.unitsSold} sold today
                      </div>
                      <div className="text-[10px] font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Suggest as Upsell
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs font-bold transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===========================================================================
          MODAL 6: MULTI-TENDER PAYMENT DECK (CASH NOTES, K-NET, WAMD, SPLIT)
         =========================================================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E1D5] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div>
                <h3 className="font-display font-bold text-base text-[#1E293B]">
                  Settlement &amp; Multi-Tender Checkout
                </h3>
                <p className="text-xs text-stone-500">
                  Select tender method to finalize bill and issue 80mm receipts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Due Banner */}
            <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-stone-600 uppercase">
                Total Amount Due
              </span>
              <span className="font-mono text-2xl font-extrabold text-[#C8102E]">
                {formatKWD(cartGrandTotalKwd)}
              </span>
            </div>

            {/* Auto-Print KOT Before Customer Bill Toggle */}
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-950">
                    Auto-Print KOT before Customer Bill
                  </div>
                  <div className="text-[10px] text-amber-800">
                    Dispatches 80mm kitchen slip immediately on settlement
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintKotWithBill}
                  onChange={(e) => setAutoPrintKotWithBill(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C8102E]"></div>
              </label>
            </div>

            {/* Payment Method Selector Grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash' as PaymentMethod, label: `Cash (${CURRENCY})`, icon: <Banknote className="w-4 h-4" /> },
                { id: 'knet' as PaymentMethod, label: 'K-Net Terminal', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'wamd' as PaymentMethod, label: 'Wamd Instant', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'split' as PaymentMethod, label: 'Split (Cash+K-Net)', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'payment_link' as PaymentMethod, label: 'K-Net Pay Link', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'aggregator_prepaid' as PaymentMethod, label: 'Keeta Prepaid', icon: <Banknote className="w-4 h-4" /> },
                ...(activeStaffPurchaseRecipient
                  ? [
                      {
                        id: 'staff_credit' as PaymentMethod,
                        label: `Staff Credit (${activeStaffPurchaseRecipient.name.split(' ')[0]})`,
                        icon: <UserCheck className="w-4 h-4 text-amber-500" />,
                      },
                    ]
                  : []),
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedPaymentMethod(m.id)}
                  className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 transition ${
                    selectedPaymentMethod === m.id
                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                      : 'bg-[#FAF6F0] hover:bg-white text-[#1E293B] border-[#E8E1D5]'
                  }`}
                >
                  {m.icon}
                  <span className="text-[11px] truncate max-w-full">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Staff Credit Confirmation Banner */}
            {selectedPaymentMethod === 'staff_credit' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-1.5 font-mono">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <UserCheck className="w-4 h-4 text-[#C8102E]" />
                  <span>STAFF PURCHASE CREDIT CONFIRMATION</span>
                </div>
                <div className="text-xs text-stone-700">
                  Recipient: <strong className="text-stone-900">{activeStaffPurchaseRecipient?.name || 'Staff Member'}</strong> ({activeStaffPurchaseRecipient?.employeeCode})
                </div>
                <div className="text-[11px] text-amber-800">
                  This transaction will be recorded directly into the Staff Credit Ledger and deducted from monthly salary. Zero cash collected.
                </div>
              </div>
            )}

            {/* Cash Tendered & Quick KWD Notes */}
            {selectedPaymentMethod === 'cash' && (
              <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-stone-700 uppercase">
                    Cash Tendered ({CURRENCY})
                  </label>
                  <input
                    type="number"
                    step="0.250"
                    value={cashTenderedInput}
                    onChange={(e) => setCashTenderedInput(e.target.value)}
                    className="w-28 px-3 py-1.5 rounded-lg bg-white border border-[#E8E1D5] font-mono text-base font-extrabold text-[#C8102E] text-right"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">
                    Quick Notes:
                  </span>
                  {[1.0, 5.0, 10.0, 20.0].map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setCashTenderedInput(note.toFixed(3))}
                      className="px-2.5 py-1 rounded bg-white hover:bg-amber-50 border border-[#E8E1D5] text-xs font-mono font-bold text-stone-800"
                    >
                      {note.toFixed(0)} {CURRENCY}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E8E1D5] flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-600 font-bold">CHANGE DUE TO GUEST:</span>
                  <span
                    className={`text-base font-extrabold ${
                      parsedCashTendered < cartGrandTotalKwd
                        ? 'text-rose-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {parsedCashTendered < cartGrandTotalKwd
                      ? `SHORT ${formatKWD(cartGrandTotalKwd - parsedCashTendered)}`
                      : formatKWD(computedCashChange)}
                  </span>
                </div>
              </div>
            )}

            {/* Split Tender Controls */}
            {selectedPaymentMethod === 'split' && (
              <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span>Cash Portion:</span>
                  <input
                    type="number"
                    step="0.250"
                    value={splitCashInput}
                    onChange={(e) => setSplitCashInput(e.target.value)}
                    className="w-28 px-3 py-1 rounded bg-white border border-[#E8E1D5] font-bold text-right"
                  />
                </div>
                <div className="flex items-center justify-between font-bold text-[#C8102E]">
                  <span>K-Net Balance:</span>
                  <span>{formatKWD(computedSplitKnet)}</span>
                </div>
              </div>
            )}

            {/* Action Finalize Button */}
            <button
              type="button"
              onClick={handleFinalizeSale}
              disabled={selectedPaymentMethod === 'cash' && parsedCashTendered < cartGrandTotalKwd}
              className="w-full py-3.5 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] disabled:opacity-40 text-white font-display font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>CONFIRM PAYMENT &amp; PRINT BILL</span>
            </button>
          </div>
        </div>
      )}

      {/* ===========================================================================
          MODAL 7: KOT MANAGER DRAWER & MODAL (ACTIVE KITCHEN ORDERS QUEUE)
         =========================================================================== */}
      {showKotModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl border border-[#E8E1D5] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-stone-900 text-white shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center font-bold text-white shadow-xs">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-black text-lg md:text-xl text-white">
                      Active Kitchen Orders Queue (KOT)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-black border border-amber-500/30">
                      {activeKotOrders.length} In Kitchen
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 font-mono mt-0.5">
                    Click any kitchen order to load into billing or settle directly
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowKotModal(false)}
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center text-lg font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Filter Chips & Search Bar */}
            <div className="p-3.5 bg-[#FAF6F0] border-b border-[#E8E1D5] shrink-0 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'all', label: 'All Channels', count: activeKotOrders.length },
                  {
                    key: 'dine_in',
                    label: 'Dine-In',
                    count: activeKotOrders.filter((o) => o.channel === 'dine_in').length,
                  },
                  {
                    key: 'takeaway',
                    label: 'Takeaway',
                    count: activeKotOrders.filter((o) => o.channel === 'takeaway').length,
                  },
                  {
                    key: 'keeta',
                    label: 'Keeta Delivery',
                    count: activeKotOrders.filter((o) => o.channel === 'keeta').length,
                  },
                ].map((chip) => {
                  const isActive = kotChannelFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setKotChannelFilter(chip.key as any)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-amber-600 text-white font-extrabold shadow-xs'
                          : 'bg-white text-stone-700 hover:bg-stone-100 border border-[#E8E1D5] font-medium'
                      }`}
                    >
                      <span>{chip.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-black/20 text-white' : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {chip.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={kotSearchQuery}
                  onChange={(e) => setKotSearchQuery(e.target.value)}
                  placeholder="Search token, table, customer or item..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#E8E1D5] text-xs font-mono text-[#1E293B] focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Active KOT Bento Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(92vh-180px)] bg-[#FAF6F0] flex-1">
              {filteredKotOrders.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-bold text-sm text-[#1E293B]">
                    No Active Kitchen Orders Found
                  </h4>
                  <p className="text-xs font-mono text-stone-500 max-w-sm mx-auto">
                    All orders are settled or served. To send new tickets to the kitchen, click{' '}
                    <strong>"1. SEND &amp; PRINT KOT (KITCHEN)"</strong> on the POS billing screen.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredKotOrders.map((ord) => {
                    const elapsedTotalMins = Math.max(
                      1,
                      Math.round(
                        (Date.now() - new Date(ord.createdAt).getTime()) / (1000 * 60)
                      )
                    );
                    const formattedElapsed =
                      elapsedTotalMins >= 60
                        ? `${Math.floor(elapsedTotalMins / 60)}h ${elapsedTotalMins % 60}m in kitchen`
                        : `${elapsedTotalMins}m in kitchen`;
                    const isSelected = activeKitchenOrderId === ord.id;

                    return (
                      <div
                        key={ord.id}
                        className={`bg-white rounded-2xl border-2 transition-all duration-150 p-4 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md ${
                          isSelected
                            ? 'border-[#C8102E] ring-2 ring-[#C8102E]/20 bg-rose-50/20'
                            : 'border-[#E8E1D5] hover:border-amber-400'
                        }`}
                      >
                        {/* Top Token & Meta Row */}
                        <div>
                          <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-2xl font-black text-[#C8102E] tracking-tight">
                                  #{ord.tokenNo}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-extrabold uppercase border ${
                                    CHANNEL_META[ord.channel].badgeClass
                                  }`}
                                >
                                  {ord.channel === 'dine_in' && ord.tableNo
                                    ? `Dine-In • ${ord.tableNo}`
                                    : CHANNEL_META[ord.channel].label}
                                </span>
                              </div>
                              <div className="font-mono text-[11px] text-stone-500 mt-0.5">
                                {ord.invoiceNo} • {ord.customerName}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                {formattedElapsed}
                              </span>
                            </div>
                          </div>

                          {/* Items & Customization Breakdown */}
                          <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100 space-y-2 max-h-44 overflow-y-auto">
                            {ord.items.map((item, idx) => (
                              <div key={idx} className="text-xs font-mono">
                                <div className="flex items-baseline justify-between font-bold text-[#1E293B]">
                                  <span>
                                    <span className="text-[#C8102E] font-black mr-1">
                                      {item.quantity}x
                                    </span>
                                    {item.titleEn}
                                  </span>
                                  <span className="text-stone-500 text-[11px]">
                                    {formatKWD(item.unitPriceKwd * item.quantity)}
                                  </span>
                                </div>

                                {/* Combo Sub-Items (e.g. Family Meal, Buckets) in KOT Queue */}
                                {(() => {
                                  const comboComponents = getComboComponents(item, menuItems);
                                  if (comboComponents.length === 0) return null;
                                  return (
                                    <div className="text-[10px] text-amber-900 pl-3 border-l-2 border-amber-500 mt-1 space-y-0.5 font-bold">
                                      <span className="uppercase text-[9px] text-stone-500 block">Pack Includes:</span>
                                      {comboComponents.map((c, i) => (
                                        <div key={i}>• {c}</div>
                                      ))}
                                    </div>
                                  );
                                })()}

                                {/* Item Modifiers: strictly only show if explicitly selected */}
                                {item.customization && (
                                  <div className="text-[10px] text-stone-600 pl-3 border-l-2 border-amber-400 mt-0.5 space-y-0.5">
                                    {item.customization.prepStyle && item.customization.prepStyle !== 'Regular' && (
                                      <span className="font-bold uppercase text-amber-800 mr-1">
                                        {item.customization.prepStyle}
                                      </span>
                                    )}
                                    {item.customization.sideChoice && item.customization.sideChoice.id !== 'none' && (
                                      <span> • {item.customization.sideChoice.nameEn}</span>
                                    )}
                                    {item.customization.drinkChoice && item.customization.drinkChoice.id !== 'none' && (
                                      <span> • {item.customization.drinkChoice.nameEn}</span>
                                    )}
                                    {item.customization.addons && item.customization.addons.length > 0 && (
                                      <span> • {item.customization.addons.map((a) => a.nameEn).join(', ')}</span>
                                    )}
                                    {item.customization.kitchenNotes && (
                                      <div className="text-[#C8102E] font-bold italic">
                                        Note: {item.customization.kitchenNotes}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Total & Action Deck: Clean View (Shortcut buttons hidden per directive) */}
                        <div className="pt-2 border-t border-stone-100 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="font-mono text-xs text-stone-500 uppercase font-bold">
                              Payable Total:
                            </span>
                            <span className="font-mono text-base font-black text-[#C8102E]">
                              {formatKWD(ord.grandTotalKwd)}
                            </span>
                          </div>

                          {/* Action Buttons: Load into Billing & Direct Kitchen Order Cancellation */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                loadKitchenOrderToCart(ord.id);
                                setShowKotModal(false);
                              }}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-mono text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                            >
                              <span>Load into Billing</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playTerminalSound('tap');
                                setKotToCancel(ord);
                              }}
                              className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                              title="Cancel Kitchen Order Ticket and notify kitchen with 80mm slip"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel Order</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===========================================================================
          MODAL 7.5: DIRECT KITCHEN ORDER (KOT) CANCELLATION DIALOG
         =========================================================================== */}
      {kotToCancel && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E8E1D5] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base tracking-wide uppercase">
                    Cancel Kitchen Ticket #{kotToCancel.tokenNo}
                  </h3>
                  <p className="text-xs font-mono text-rose-100">
                    Halts preparation and spools 80mm ** CANCELLED KOT ** slip
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setKotToCancel(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-mono">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Invoice:</span>
                  <strong className="text-stone-900">{kotToCancel.invoiceNo}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Channel / Customer:</span>
                  <span className="text-stone-800 font-bold">
                    {CHANNEL_META[kotToCancel.channel].label} • {kotToCancel.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Order Amount:</span>
                  <strong className="text-[#C8102E]">{formatKWD(kotToCancel.grandTotalKwd)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Items:</span>
                  <span className="text-stone-700">
                    {kotToCancel.items.reduce((s, i) => s + i.quantity, 0)} items ({kotToCancel.items.map((i) => `${i.quantity}x ${i.titleEn}`).join(', ')})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                  Reason for Cancellation
                </label>
                <select
                  value={kotCancelReason}
                  onChange={(e) => setKotCancelReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-rose-600"
                >
                  <option value="Customer Requested Cancellation">Customer Requested Cancellation</option>
                  <option value="Customer Changed Mind / Left Store">Customer Changed Mind / Left Store</option>
                  <option value="Kitchen Ingredient Out of Stock">Kitchen Ingredient Out of Stock</option>
                  <option value="Order Mistake / Duplicate Ticket">Order Mistake / Duplicate Ticket</option>
                  <option value="Incorrect Items or Quantity">Incorrect Items or Quantity</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <strong>Kitchen Alert Notice:</strong> Confirming will immediately mark order as cancelled in Supabase, restore ingredient inventory, and spool an 80mm cancelled ticket to the kitchen station.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setKotToCancel(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
                >
                  Keep Order Active
                </button>
                <button
                  type="button"
                  disabled={isCancellingKot}
                  onClick={async () => {
                    if (!kotToCancel) return;
                    setIsCancellingKot(true);
                    try {
                      await cancelKitchenOrder(kotToCancel.id, kotCancelReason);
                      setKotToCancel(null);
                      setShowKotModal(false);
                    } finally {
                      setIsCancellingKot(false);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isCancellingKot ? 'Cancelling...' : 'Confirm & Print KOT Slip'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===========================================================================
          MODAL 8: ADMIN / MANAGER VOID COMPLETED BILL & INVENTORY REVERSAL
         =========================================================================== */}
      {showVoidBillModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl border border-[#E8E1D5] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#C8102E] text-white shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-white shadow-xs">
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-black text-lg md:text-xl text-white">
                      Void / Cancel Completed Bill
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                      Supervisor / Admin Only
                    </span>
                  </div>
                  <p className="text-xs text-rose-100 font-mono mt-0.5">
                    Cancels sales record, reverts inventory deductions &amp; preserves Z-report audit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoidBillModal(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {voidSuccessOrder ? (
                /* Success View */
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-xl text-[#1E293B]">
                      Bill #{voidSuccessOrder.invoiceNo} Successfully Voided!
                    </h4>
                    <p className="text-xs text-stone-500 font-mono mt-1">
                      Token #{voidSuccessOrder.tokenNo} • {formatKWD(voidSuccessOrder.grandTotalKwd)}
                    </p>
                  </div>

                  <div className="w-full max-w-md p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-left text-xs font-mono space-y-1.5 text-stone-600">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <span>✓</span>
                      <span>Sales record marked as VOIDED</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <span>✓</span>
                      <span>Stock quantities &amp; raw BOM ingredients restored</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <span>✓</span>
                      <span>Excluded from daily shift revenue &amp; cash drawer</span>
                    </div>
                    {voidSuccessOrder.voidReason && (
                      <div className="pt-1.5 border-t border-stone-200 text-[11px] text-stone-500">
                        Reason: {voidSuccessOrder.voidReason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerDirectPrint(voidSuccessOrder, 'INVOICE');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#1E293B] hover:bg-black text-white font-mono text-xs font-bold flex items-center gap-2 transition shadow-xs"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print 80mm Void Audit Slip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowVoidBillModal(false);
                        setVoidSuccessOrder(null);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-mono text-xs font-bold transition shadow-xs"
                    >
                      Done / Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Void Form View */
                <>
                  {/* Step 1: Bill Input & Recent Completed Bills */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-600">
                      1. Enter Bill # or Token # to Retrieve
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={voidSearchQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVoidSearchQuery(val);
                          setVoidError(null);
                          if (val.trim()) {
                            const q = val.trim().toLowerCase();
                            const matched = posOrders.find(
                              (o) =>
                                o.invoiceNo.toLowerCase().includes(q) ||
                                String(o.tokenNo) === q ||
                                o.id.toLowerCase() === q
                            );
                            if (matched) setSelectedVoidOrder(matched);
                          }
                        }}
                        placeholder="e.g. INV-SLM-20401 or Token 401..."
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-stone-50 border-2 border-stone-300 focus:border-[#C8102E] text-xs font-mono font-bold text-[#1E293B] placeholder:text-stone-400 focus:outline-none transition"
                      />
                      {voidSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setVoidSearchQuery('');
                            setSelectedVoidOrder(null);
                            setVoidError(null);
                          }}
                          className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Quick Select: Recent Completed Bills */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-stone-400 font-bold uppercase">
                        Recent Completed Orders (Click to select):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {posOrders
                          .slice(-6)
                          .reverse()
                          .map((ord) => {
                            const isSelected = selectedVoidOrder?.id === ord.id;
                            const isVoided = ord.status === 'voided';
                            return (
                              <button
                                key={ord.id}
                                type="button"
                                onClick={() => {
                                  playTerminalSound('tap');
                                  setSelectedVoidOrder(ord);
                                  setVoidSearchQuery(ord.invoiceNo);
                                  setVoidError(null);
                                }}
                                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition ${
                                  isSelected
                                    ? 'bg-[#C8102E] text-white border-[#C8102E]'
                                    : isVoided
                                    ? 'bg-stone-100 text-stone-400 border-stone-200 line-through'
                                    : 'bg-stone-50 hover:bg-amber-50 text-stone-800 border-stone-200'
                                }`}
                              >
                                #{ord.tokenNo} ({ord.invoiceNo}) • {formatKWD(ord.grandTotalKwd)}
                                {isVoided && ' [VOID]'}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Retrieved Order Preview */}
                  {selectedVoidOrder && (
                    <div className="p-3.5 rounded-2xl bg-stone-50 border-2 border-stone-200 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200 text-xs font-mono">
                        <div>
                          <div className="font-extrabold text-[#1E293B] text-sm">
                            Token #{selectedVoidOrder.tokenNo} • {selectedVoidOrder.invoiceNo}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            Cashier: {selectedVoidOrder.cashierName} • {PAYMENT_METHOD_LABELS[selectedVoidOrder.paymentMethod as PaymentMethod]}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-base font-black text-[#C8102E]">
                            {formatKWD(selectedVoidOrder.grandTotalKwd)}
                          </span>
                          <div className="text-[10px] font-bold text-stone-500">
                            {CHANNEL_META[selectedVoidOrder.channel as OrderChannel].label}
                          </div>
                        </div>
                      </div>

                      {/* Status Notice */}
                      {selectedVoidOrder.status === 'voided' ? (
                        <div className="p-2.5 rounded-xl bg-red-100 border border-red-300 text-red-900 font-mono text-xs flex items-center gap-2">
                          <Ban className="w-4 h-4 text-red-600 shrink-0" />
                          <div>
                            <span className="font-bold">THIS BILL IS ALREADY VOIDED.</span>
                            <div className="text-[11px] text-red-800">
                              Voided by {selectedVoidOrder.voidedBy || 'Supervisor'} (Reason: {selectedVoidOrder.voidReason || 'None specified'})
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-stone-600 max-h-24 overflow-y-auto space-y-1">
                          {selectedVoidOrder.items.map((line: CartLineItem, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span>
                                {line.quantity}x {line.titleEn}
                              </span>
                              <span className="font-bold text-stone-800">
                                {formatKWD(roundKWD(line.unitPriceKwd * line.quantity))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Void Reason */}
                  {selectedVoidOrder && selectedVoidOrder.status !== 'voided' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-600">
                        2. Select Cancellation Reason
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {[
                          'Customer Cancelled / Left',
                          'Cashier Mistake / Wrong Items',
                          'Kitchen 86 / Out of Stock',
                          'Duplicate Bill Entry',
                          'Payment Failure / Reversal',
                          'Customer Quality Complaint',
                        ].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              playTerminalSound('tap');
                              setVoidReason(r);
                            }}
                            className={`p-2 rounded-xl text-left text-xs font-mono font-bold border transition ${
                              voidReason === r
                                ? 'bg-amber-100 text-amber-950 border-amber-400'
                                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={voidCustomNotes}
                        onChange={(e) => setVoidCustomNotes(e.target.value)}
                        placeholder="Additional audit notes (optional)..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-[#1E293B] placeholder:text-stone-400 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Step 4: Supervisor PIN Authorization Guard */}
                  {selectedVoidOrder && selectedVoidOrder.status !== 'voided' && (
                    <div className="space-y-2 pt-2 border-t border-stone-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                          <span>3. Supervisor / Admin PIN Authorization</span>
                        </label>
                        <span className="text-[10px] font-mono text-stone-400">
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="password"
                          name="chikarro_supervisor_pin_no_autofill"
                          autoComplete="new-password"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck="false"
                          maxLength={6}
                          value={voidSupervisorPin}
                          onChange={(e) => {
                            setVoidSupervisorPin(e.target.value);
                            setVoidError(null);
                          }}
                          placeholder="Enter Supervisor PIN..."
                          className="flex-1 px-3 py-2.5 rounded-xl bg-stone-50 border-2 border-stone-300 focus:border-[#C8102E] text-center text-sm font-mono font-extrabold tracking-widest text-[#1E293B] focus:outline-none"
                        />
                      </div>

                      {/* Touch numeric keypad for touchscreen terminals */}
                      <div className="grid grid-cols-6 gap-1 pt-1">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', '⌫'].map(
                          (key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                playTerminalSound('tap');
                                setVoidError(null);
                                if (key === 'CLR') {
                                  setVoidSupervisorPin('');
                                } else if (key === '⌫') {
                                  setVoidSupervisorPin((prev) => prev.slice(0, -1));
                                } else {
                                  setVoidSupervisorPin((prev) =>
                                    prev.length < 6 ? prev + key : prev
                                  );
                                }
                              }}
                              className="py-2 rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-amber-100 text-xs font-mono font-bold text-stone-800 transition"
                            >
                              {key}
                            </button>
                          )
                        )}
                      </div>

                      {voidError && (
                        <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 font-mono text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{voidError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowVoidBillModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs font-bold transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={
                        !selectedVoidOrder ||
                        selectedVoidOrder.status === 'voided' ||
                        !voidSupervisorPin.trim()
                      }
                      onClick={() => {
                        if (!selectedVoidOrder) return;
                        const manager = verifyManagerPin(voidSupervisorPin);
                        if (!manager) {
                          playTerminalSound('error');
                          setVoidError('Invalid Supervisor PIN. Only a Manager or Admin can void bills.');
                          return;
                        }

                        const fullReason = voidCustomNotes.trim()
                          ? `${voidReason} - ${voidCustomNotes.trim()}`
                          : voidReason;

                        const success = voidSettledOrder(
                          selectedVoidOrder.id,
                          fullReason,
                          manager.name
                        );

                        if (success) {
                          setVoidSuccessOrder({
                            ...selectedVoidOrder,
                            status: 'voided',
                            voidReason: fullReason,
                            voidedBy: manager.name,
                          });
                        }
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] disabled:opacity-40 text-white font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-xs active:scale-[0.99]"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>
                        {selectedVoidOrder
                          ? `Confirm & Void Bill (${formatKWD(selectedVoidOrder.grandTotalKwd)})`
                          : 'Select Bill to Void'}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
