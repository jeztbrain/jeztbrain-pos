import React, { useMemo, useState } from 'react';
import { CURRENCY, BRAND_NAME, DEFAULT_FOOTER_MESSAGE, SHORT_NAME } from '../config/brandConfig';
import {
  AlertTriangle,
  Ban,
  Banknote,
  BarChart3,
  Boxes,
  Building2,
  Calculator,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  Edit3,
  Eye,
  Filter,
  Lock,
  PackageCheck,
  PackagePlus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Tag,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
  AlertCircle,
  Receipt,
  Save,
  UserCheck,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { CustomersCrm, PromoManagement } from './PromoManagement';
import { PredictiveAnalyticsWidget } from './PredictiveAnalyticsWidget';
import { ExportButtons } from './ExportButtons';
import { PurchaseOrderGenerator } from './PurchaseOrderGenerator';
import {
  PosOrderRecord,
  RawIngredient,
  ReceiptStoreConfig,
  RoleTier,
  ShopExpense,
  StaffAccount,
  StaffCreditRecord,
} from '../types/pos';
import {
  CHANNEL_META,
  formatDateTimeKW,
  formatKWD,
  formatTimeKW,
  PAYMENT_METHOD_LABELS,
  roundKWD,
} from '../utils/formatters';

export const ErpConsole: React.FC = () => {
  const {
    currentUser,
    activeBranch,
    branches,
    setActiveBranchId,
    updateBranchCommissions,
    rawIngredients,
    inventoryLogs,
    lowStockIngredients,
    restockIngredient,
    menuItems,
    shopExpenses,
    addShopExpense,
    posOrders,
    openingFloatKwd,
    setOpeningFloatKwd,
    staffAccounts,
    addOrUpdateStaffAccount,
    resetSystemToFactorySeed,
    language,
    multiBranchMode,
    setMultiBranchMode,
    toggleItemStockTracking,
    updateItemStockQuantity,
    updateItemStockThreshold,
    allLowStockItems,
    openPrintModal,
    receiptConfig,
    updateReceiptConfig,
    staffCreditRecords,
    settleStaffCreditRecord,
    voidSettledOrder,
    verifyManagerPin,
    activeShift,
    shiftSummary,
    closeShift,
    closedShifts,
  } = usePos();

  const isAdmin = currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState<
    | 'inventory-bom'
    | 'sales-audit'
    | 'z-report'
    | 'expenses'
    | 'staff-credit'
    | 'admin-executive'
    | 'promos'
    | 'crm'
  >('inventory-bom');


  // Sales Audit Void Bill & Refund Receipt Modal States
  const [orderToVoid, setOrderToVoid] = useState<PosOrderRecord | null>(null);
  const [voidAuditReason, setVoidAuditReason] = useState<string>('Customer Cancellation / Dispute');
  const [voidAuditNotes, setVoidAuditNotes] = useState<string>('');
  const [voidAuditSupervisorPin, setVoidAuditSupervisorPin] = useState<string>('');
  const [voidAuditError, setVoidAuditError] = useState<string | null>(null);
  const [isVoidingOrder, setIsVoidingOrder] = useState<boolean>(false);

  // Staff Credit Ledger Filter States
  const [creditSearchQuery, setCreditSearchQuery] = useState<string>('');
  const [creditStatusFilter, setCreditStatusFilter] = useState<'all' | 'unpaid' | 'settled'>('all');
  const [creditStaffFilter, setCreditStaffFilter] = useState<string>('all');

  // Receipt & Store Details Editor Form State
  const [receiptDraft, setReceiptDraft] = useState<ReceiptStoreConfig>(receiptConfig);

  // Fast & Slow Moving Analytics Modal in Admin Panel
  const [showMovementAnalyticsModal, setShowMovementAnalyticsModal] = useState<boolean>(false);
  const [movementAnalyticsTab, setMovementAnalyticsTab] = useState<'fast' | 'slow'>('fast');

  // Universal Item Stock Tracking State
  const [stockSearchQuery, setStockSearchQuery] = useState<string>('');
  const [stockEditQtyMap, setStockEditQtyMap] = useState<Record<string, string>>({});
  const [stockEditThresholdMap, setStockEditThresholdMap] = useState<Record<string, string>>({});

  // Sales Audit Search & Filter States
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [auditChannelFilter, setAuditChannelFilter] = useState<string>('all');
  const [auditPaymentFilter, setAuditPaymentFilter] = useState<string>('all');
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>('all');
  const [auditSegmentChip, setAuditSegmentChip] = useState<
    'ALL' | 'CASH' | 'KNET' | 'WAMD' | 'WEB' | 'KEETA' | 'DINE_IN' | 'TAKEAWAY'
  >('ALL');
  const [auditActiveSubTab, setAuditActiveSubTab] = useState<'bills' | 'velocity'>('bills');

  // Data-Driven Raw Ingredient Restock Modal State
  const [restockingIngredient, setRestockingIngredient] = useState<RawIngredient | null>(null);
  const [restockQtyInput, setRestockQtyInput] = useState<string>('25');
  const [restockSupplierRef, setRestockSupplierRef] = useState<string>('');
  const [restockNotes, setRestockNotes] = useState<string>('Batch temperature & quality verified');

  // Management Roles & Editable Staff Account Modal State
  const [editingStaffAccount, setEditingStaffAccount] = useState<StaffAccount | null>(null);

  // Expense Form State
  const [expCategory, setExpCategory] =
    useState<ShopExpense['category']>('Produce & Supplies');
  const [expDesc, setExpDesc] = useState<string>('');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expPaidVia, setExpPaidVia] =
    useState<ShopExpense['paidVia']>('Cash Drawer');

  // Shift close (Z-Report) state
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [confirmClose, setConfirmClose] = useState<boolean>(false);

  // Z-Report Actual Cash Counted Input
  const [actualCashCountedInput, setActualCashCountedInput] =
    useState<string>('');
  const [showPrintableZModal, setShowPrintableZModal] =
    useState<boolean>(false);

  // Admin Staff Editor State
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffCode, setNewStaffCode] = useState<string>('CHK-STF-109');
  const [newStaffRole, setNewStaffRole] = useState<RoleTier>('staff');
  const [newStaffPin, setNewStaffPin] = useState<string>('');
  const [newStaffMaxDisc, setNewStaffMaxDisc] = useState<string>('10');

  // Commission Editor State
  const [keetaComm, setKeetaComm] = useState<string>(
    String(activeBranch.commissions.keeta || 18)
  );

  // =========================================================================
  // SHIFT Z-REPORT & EXECUTIVE FINANCIAL CALCULATIONS (STRICT 3-DECIMAL KWD)
  // UNIFIED STATUS MAPPING: Web orders with 'Delivered', 'Completed', or 'Accepted'
  // are treated identically to POS 'completed' (Settled / Paid).
  // =========================================================================
  const validOrders = useMemo(() => {
    return posOrders.filter((o) => {
      if (o.status === 'voided') return false;
      const ext = (o.externalStatus || '').toLowerCase();
      if (ext === 'voided' || ext === 'cancelled' || ext === 'refunded') return false;
      return true;
    });
  }, [posOrders]);

  const voidedOrders = useMemo(() => {
    return posOrders.filter((o) => {
      const ext = (o.externalStatus || '').toLowerCase();
      return o.status === 'voided' || ext === 'voided' || ext === 'cancelled' || ext === 'refunded';
    });
  }, [posOrders]);

  const financialMetrics = useMemo(() => {
    let grossRevenue = 0;
    let totalDiscounts = 0;
    let totalFoodCost = 0;
    let cashSales = 0;
    let knetSales = 0;
    let wamdSales = 0;
    let linkSales = 0;
    let aggregatorSales = 0;
    let webDirectSales = 0;
    let keetaSales = 0;
    let totalStaffCredit = 0;

    validOrders.forEach((o) => {
      // Exclude voided
      if (o.status === 'voided') return;
      const ext = (o.externalStatus || '').toLowerCase();
      if (ext === 'voided' || ext === 'cancelled' || ext === 'refunded') return;

      // CRITICAL ACCOUNTING RULE: Exclude unpaid Staff Credit from customer sales & cash/knet drawers
      if (o.isStaffPurchase || o.paymentMethod === 'staff_credit') {
        totalStaffCredit += o.grandTotalKwd;
        totalFoodCost += o.totalFoodCostKwd; // internal ingredient cost incurred
        return;
      }

      grossRevenue += o.grandTotalKwd;
      totalDiscounts += o.discountKwd;
      totalFoodCost += o.totalFoodCostKwd;

      if (o.paymentMethod === 'cash') {
        cashSales += o.grandTotalKwd;
      } else if (o.paymentMethod === 'knet') {
        knetSales += o.grandTotalKwd;
      } else if (o.paymentMethod === 'wamd') {
        wamdSales += o.grandTotalKwd;
      } else if (o.paymentMethod === 'payment_link') {
        linkSales += o.grandTotalKwd;
      } else if (o.paymentMethod === 'aggregator_prepaid') {
        aggregatorSales += o.grandTotalKwd;
      } else if (o.paymentMethod === 'split') {
        cashSales += o.cashTenderedKwd;
        knetSales += o.knetTenderedKwd;
      }

      // Unified Web Sales Attribution (Website Direct & Cloud Web Orders)
      if (o.channel === 'chikarro_web' || o.source === 'WEB' || o.webOrderRef) {
        webDirectSales += o.grandTotalKwd;
      }
      if (o.channel === 'keeta') keetaSales += o.grandTotalKwd;
    });

    const cashDrawerExpenses = shiftSummary
      ? shiftSummary.cashExpensesKwd
      : roundKWD(
          shopExpenses
            .filter((e) => e.paidVia === 'Cash Drawer')
            .reduce((s, e) => s + e.amountKwd, 0)
        );

    const totalAllExpenses = roundKWD(
      shopExpenses.reduce((s, e) => s + e.amountKwd, 0)
    );

    const expectedCashInDrawer = shiftSummary
      ? shiftSummary.expectedCashKwd
      : roundKWD(openingFloatKwd + cashSales - cashDrawerExpenses);

    const aggregatorCommissionCost = roundKWD(
      (keetaSales * (activeBranch.commissions.keeta || 18)) / 100
    );

    const netOperatingProfit = roundKWD(
      grossRevenue - totalFoodCost - aggregatorCommissionCost - totalAllExpenses
    );

    return {
      grossRevenue: roundKWD(grossRevenue),
      totalDiscounts: roundKWD(totalDiscounts),
      totalFoodCost: roundKWD(totalFoodCost),
      cashSales: roundKWD(cashSales),
      knetSales: roundKWD(knetSales),
      wamdSales: roundKWD(wamdSales),
      linkSales: roundKWD(linkSales),
      aggregatorSales: roundKWD(aggregatorSales),
      webDirectSales: roundKWD(webDirectSales),
      keetaSales: roundKWD(keetaSales),
      cashDrawerExpenses,
      totalAllExpenses,
      expectedCashInDrawer,
      aggregatorCommissionCost,
      netOperatingProfit,
      totalStaffCredit: roundKWD(totalStaffCredit),
    };
  }, [validOrders, shopExpenses, openingFloatKwd, activeBranch.commissions, shiftSummary]);

  // Filtered Menu Items for Universal Stock Tracking Table
  const filteredStockMenuItems = useMemo(() => {
    const q = stockSearchQuery.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter(
      (m) =>
        m.nameEn.toLowerCase().includes(q) ||
        m.nameAr.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q)
    );
  }, [menuItems, stockSearchQuery]);

  // Dynamic Counts for Sales Audit Segment Chips
  const auditSegmentCounts = useMemo(() => {
    return {
      ALL: posOrders.length,
      CASH: posOrders.filter((o) => o.paymentMethod === 'cash').length,
      KNET: posOrders.filter((o) => o.paymentMethod === 'knet').length,
      WAMD: posOrders.filter((o) => o.paymentMethod === 'wamd').length,
      WEB: posOrders.filter((o) => o.channel === 'chikarro_web' || o.source === 'WEB' || o.webOrderRef).length,
      KEETA: posOrders.filter((o) => o.channel === 'keeta').length,
      DINE_IN: posOrders.filter((o) => o.channel === 'dine_in').length,
      TAKEAWAY: posOrders.filter((o) => o.channel === 'takeaway').length,
    };
  }, [posOrders]);

  // Filtered Staff Purchase & Credit Records
  const filteredStaffCreditRecords = useMemo(() => {
    return staffCreditRecords.filter((rec) => {
      if (creditStatusFilter !== 'all' && rec.status !== creditStatusFilter) return false;
      if (creditStaffFilter !== 'all' && rec.staffId !== creditStaffFilter) return false;
      if (creditSearchQuery.trim()) {
        const q = creditSearchQuery.trim().toLowerCase();
        const matchName = rec.staffName.toLowerCase().includes(q);
        const matchCode = rec.employeeCode.toLowerCase().includes(q);
        const matchInvoice = (rec.invoiceNo || '').toLowerCase().includes(q);
        const matchSummary = rec.itemsSummary.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchInvoice && !matchSummary) return false;
      }
      return true;
    });
  }, [staffCreditRecords, creditStatusFilter, creditStaffFilter, creditSearchQuery]);

  // Filtered Orders for Comprehensive Sales Audit Log (Segment Chips + Dropdowns + Search)
  const filteredAuditOrders = useMemo(() => {
    return posOrders.filter((ord) => {
      // 1. Instant Segment Chip Filter
      if (auditSegmentChip === 'CASH' && ord.paymentMethod !== 'cash') return false;
      if (auditSegmentChip === 'KNET' && ord.paymentMethod !== 'knet') return false;
      if (auditSegmentChip === 'WAMD' && ord.paymentMethod !== 'wamd') return false;
      if (auditSegmentChip === 'WEB' && ord.channel !== 'chikarro_web' && ord.source !== 'WEB' && !ord.webOrderRef) return false;
      if (auditSegmentChip === 'KEETA' && ord.channel !== 'keeta') return false;
      if (auditSegmentChip === 'DINE_IN' && ord.channel !== 'dine_in') return false;
      if (auditSegmentChip === 'TAKEAWAY' && ord.channel !== 'takeaway') return false;

      // 2. Dropdown Filters
      if (auditChannelFilter !== 'all') {
        if (auditChannelFilter === 'chikarro_web') {
          if (ord.channel !== 'chikarro_web' && ord.source !== 'WEB' && !ord.webOrderRef) return false;
        } else if (ord.channel !== auditChannelFilter) {
          return false;
        }
      }

      if (auditPaymentFilter !== 'all' && ord.paymentMethod !== auditPaymentFilter) return false;

      if (auditStatusFilter !== 'all') {
        const ext = (ord.externalStatus || '').toLowerCase();
        if (auditStatusFilter === 'completed') {
          const isSettled =
            ord.status === 'completed' ||
            ext === 'completed' ||
            ext === 'delivered' ||
            ext === 'accepted' ||
            ext === 'settled';
          if (!isSettled) return false;
        } else if (auditStatusFilter === 'delivered') {
          if (ext !== 'delivered') return false;
        } else if (auditStatusFilter === 'accepted') {
          if (ext !== 'accepted') return false;
        } else if (auditStatusFilter === 'cooking') {
          if (ord.status !== 'cooking' && ext !== 'cooking') return false;
        } else if (auditStatusFilter === 'ready') {
          if (ord.status !== 'ready' && ext !== 'ready') return false;
        } else if (auditStatusFilter === 'voided') {
          if (ord.status !== 'voided' && ext !== 'voided' && ext !== 'cancelled') return false;
        } else if (ord.status !== auditStatusFilter && ext !== auditStatusFilter) {
          return false;
        }
      }

      // 3. Free-text Search
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.trim().toLowerCase();
        const matchInvoice = ord.invoiceNo.toLowerCase().includes(q);
        const matchToken = String(ord.tokenNo).includes(q);
        const matchCashier = ord.cashierName.toLowerCase().includes(q);
        const matchCustomer = ord.customerName.toLowerCase().includes(q);
        const matchWebRef = (ord.webOrderRef || '').toLowerCase().includes(q);
        const matchItems = ord.items.some(
          (i) => i.titleEn.toLowerCase().includes(q) || i.titleAr.toLowerCase().includes(q)
        );
        if (!matchInvoice && !matchToken && !matchCashier && !matchCustomer && !matchWebRef && !matchItems) {
          return false;
        }
      }
      return true;
    });
  }, [
    posOrders,
    auditSegmentChip,
    auditChannelFilter,
    auditPaymentFilter,
    auditStatusFilter,
    auditSearchQuery,
  ]);

  // Item Velocity & Fast-Moving / Slow-Moving Analytics Matrix (Including Web Orders)
  const itemVelocityStats = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        nameAr: string;
        unitsSold: number;
        revenueKwd: number;
        visualEmoji: string;
        priceKwd: number;
        trackStock?: boolean;
        stockQuantity?: number;
      }
    >();

    menuItems.forEach((m) => {
      map.set(m.id, {
        id: m.id,
        name: m.nameEn,
        nameAr: m.nameAr,
        unitsSold: 0,
        revenueKwd: 0,
        visualEmoji: m.visualEmoji,
        priceKwd: m.priceKwd,
        trackStock: m.trackStock,
        stockQuantity: m.stockQuantity,
      });
    });

    const menuList = Array.from(map.values());

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.type === 'ITEM') {
          let entry = map.get(item.refId);
          if (!entry) {
            entry = menuList.find(
              (m) =>
                m.id === item.refId ||
                (item.skuOrCode && m.id.toLowerCase().includes(item.skuOrCode.toLowerCase())) ||
                m.name.toLowerCase() === item.titleEn.toLowerCase()
            );
          }
          if (entry) {
            entry.unitsSold += item.quantity;
            entry.revenueKwd = roundKWD(entry.revenueKwd + item.quantity * item.unitPriceKwd);
          }
        } else if (item.type === 'COMBO' && item.comboSubItems) {
          item.comboSubItems.forEach((sub) => {
            const entry = map.get(sub.menuItemId);
            if (entry) {
              entry.unitsSold += (sub.quantity || 1) * item.quantity;
            }
          });
        }
      });
    });

    const list = Array.from(map.values());
    const fast = [...list]
      .filter((i) => i.unitsSold > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenueKwd - a.revenueKwd);

    const slow = [...list]
      .filter((i) => i.unitsSold <= 1)
      .sort((a, b) => a.unitsSold - b.unitsSold || a.priceKwd - b.priceKwd);

    const totalUnits = list.reduce((acc, i) => acc + i.unitsSold, 0);

    return { fast, slow, totalUnits, list };
  }, [menuItems, validOrders]);

  const parsedActualCash =
    actualCashCountedInput !== ''
      ? roundKWD(parseFloat(actualCashCountedInput) || 0)
      : financialMetrics.expectedCashInDrawer;

  const hasActualCashInput = actualCashCountedInput.trim() !== '';
  const cashVarianceKwd = roundKWD(
    parsedActualCash - financialMetrics.expectedCashInDrawer
  );

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (!expDesc.trim() || !amt || amt <= 0) return;
    addShopExpense({
      category: expCategory,
      description: expDesc.trim(),
      amountKwd: amt,
      paidVia: expPaidVia,
    });
    setExpDesc('');
    setExpAmount('');
  };

  // Data-Driven Restock Confirmation Handler
  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingIngredient) return;
    const qty = parseFloat(restockQtyInput);
    if (isNaN(qty) || qty <= 0) return;
    const supplierRef = restockSupplierRef.trim() || `DELIVERY-PO-${Date.now().toString().slice(-4)}`;
    const fullNote = restockNotes.trim()
      ? `${supplierRef} • ${restockNotes.trim()}`
      : `${supplierRef} • Verified by ${currentUser?.name || 'Manager'}`;

    restockIngredient(restockingIngredient.id, qty, fullNote);
    setRestockingIngredient(null);
  };

  // Add New Staff Account (Supporting Extended Roles: Cashier, Supervisor, Storekeeper, Manager, Admin)
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPin.trim()) return;

    const isStaffOrCashier = newStaffRole === 'staff' || newStaffRole === 'cashier';
    const isSupervisor = newStaffRole === 'supervisor';
    const isStorekeeper = newStaffRole === 'storekeeper';
    const isMgrOrAdmin = newStaffRole === 'manager' || newStaffRole === 'admin';

    addOrUpdateStaffAccount({
      id: `usr-${Date.now()}`,
      employeeCode: newStaffCode.trim().toUpperCase(),
      name: newStaffName.trim(),
      title:
        newStaffRole === 'supervisor'
          ? 'Floor Shift Supervisor'
          : newStaffRole === 'storekeeper'
          ? 'Raw Stock & Inventory Storekeeper'
          : newStaffRole === 'cashier'
          ? 'Counter POS Cashier'
          : `${newStaffRole.toUpperCase()} — Salmiya Flagship`,
      role: newStaffRole,
      pin: newStaffPin.trim(),
      password: newStaffRole,
      maxDiscountPct:
        Number(newStaffMaxDisc) ||
        (isMgrOrAdmin ? 25 : isSupervisor ? 15 : isStaffOrCashier ? 10 : 0),
      canVoidBills: isMgrOrAdmin || isSupervisor,
      canManageCombos: isMgrOrAdmin || isStorekeeper,
      canViewMargins: newStaffRole === 'admin',
      avatarBadge: newStaffName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    });
    setNewStaffName('');
    setNewStaffPin('');
  };

  // Save Modified Staff / Role / PIN
  const handleSaveEditedStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffAccount || !editingStaffAccount.name.trim() || !editingStaffAccount.pin.trim()) {
      return;
    }
    addOrUpdateStaffAccount({
      ...editingStaffAccount,
      name: editingStaffAccount.name.trim(),
      pin: editingStaffAccount.pin.trim(),
      employeeCode: editingStaffAccount.employeeCode.trim().toUpperCase(),
    });
    setEditingStaffAccount(null);
  };

  return (
    <div className="no-print h-[calc(100vh-62px)] w-full overflow-y-auto bg-[#FAF6F0] text-[#1E293B] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOP HEADER & SUB-MODULE TABS */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E8E1D5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#C8102E]/10 text-[#C8102E] border border-[#C8102E]/20 font-mono text-xs font-bold uppercase">
                {language === 'ar' ? 'الوحدة رقم 6 • النظام المالي' : 'CORE MODULE 6 • /erp'}
              </span>
              {lowStockIngredients.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-300 font-mono text-xs font-bold flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {lowStockIngredients.length} LOW STOCK ALERT
                </span>
              )}
            </div>
            <h1 className="text-2xl font-display font-extrabold text-[#1E293B] mt-1">
              {language === 'ar'
                ? 'مخزون الوصفات، المصروفات والتقرير المالي للوردية'
                : 'Recipe (BOM) Raw Inventory, Expenses & Shift Z-Report Reconciliation'}
            </h1>
          </div>

          {/* Sub-Module Navigation Tabs */}
          <div className="flex flex-wrap p-1.5 rounded-xl bg-white border border-[#E8E1D5] gap-1 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('inventory-bom')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'inventory-bom'
                  ? 'bg-[#C8102E] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#FAF6F0]'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'المخزون والوصفات' : 'Recipe (BOM) & Stock'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sales-audit')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'sales-audit'
                  ? 'bg-[#C8102E] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#FAF6F0]'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>
                {language === 'ar' ? 'سجل المبيعات وحركة الأصناف' : 'Sales Audit & Item Movement'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('z-report')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'z-report'
                  ? 'bg-[#C8102E] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#FAF6F0]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تقرير Z وإغلاق الوردية' : 'Shift Z-Report Closing'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'bg-[#C8102E] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#FAF6F0]'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>
                {language === 'ar' ? 'المصروفات اليومية' : 'Daily Shop Expenses'} ({shopExpenses.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staff-credit')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'staff-credit'
                  ? 'bg-[#C8102E] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#FAF6F0]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {language === 'ar' ? 'سجل مشتريات الموظفين والآجل' : 'Staff Credit Ledger'} (
                {staffCreditRecords.filter((r) => r.status === 'unpaid').length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('promos')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'promos'
                  ? 'bg-[#C8102E] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#FAF6F0]'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'العروض والكوبونات' : 'Promo Management'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('crm')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'crm'
                  ? 'bg-[#C8102E] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#FAF6F0]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'العملاء والولاء' : 'Customers (CRM)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isAdmin) return;
                setActiveTab('admin-executive');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'admin-executive'
                  ? 'bg-[#1E293B] text-white shadow-sm'
                  : isAdmin
                  ? 'text-[#1E293B] hover:bg-[#FAF6F0]'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              {isAdmin ? (
                <BarChart3 className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>{language === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Executive HQ'}</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: RECIPE (BOM) RAW INVENTORY & AUTOMATIC STOCK DEDUCTION ENGINE
           ========================================================================= */}
        {activeTab === 'inventory-bom' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT 8 COLS: Raw Ingredients Stock Matrix & One-Click Restock */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-display font-bold text-slate-900">
                    {activeBranch.branchName} Raw Ingredients &amp; Live BOM Stock Levels
                  </h2>
                  <p className="text-xs text-slate-500">
                    Every POS invoice &amp; Web Order automatically deducts mapped raw ingredients in real time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PurchaseOrderGenerator />
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-[#C8102E]/10 text-[#C8102E] border border-[#C8102E]/20">
                    {rawIngredients.length} Tracked Raw SKUs
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {rawIngredients.length === 0 && (
                  <div className="py-10 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No raw ingredients found in Supabase (raw_ingredients). Add inventory in the database to begin tracking.
                  </div>
                )}
                {rawIngredients.map((ing) => {
                  const isLow = ing.currentStock <= ing.reorderLevel;

                  return (
                    <div
                      key={ing.id}
                      className={`p-3.5 rounded-xl border transition flex flex-wrap items-center justify-between gap-3 ${
                        isLow
                          ? 'bg-rose-50/70 border-rose-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="min-w-[230px] flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                            {ing.sku}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{ing.name}</span>
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-extrabold uppercase">
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold">
                              OPTIMAL
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-1">
                          Supplier: {ing.supplier} • Unit Cost:{' '}
                          <strong className="text-slate-800">
                            {formatKWD(ing.unitCostKwd)}/{ing.unit}
                          </strong>{' '}
                          • Threshold: {ing.reorderLevel} {ing.unit}
                        </div>
                      </div>

                      {/* Current Stock & Instant Restock Controls */}
                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono pr-2 border-r border-slate-200">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            Current Stock
                          </div>
                          <div
                            className={`text-base font-extrabold ${
                              isLow ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {ing.currentStock.toFixed(1)} {ing.unit}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setRestockingIngredient(ing);
                            setRestockQtyInput(String(ing.reorderLevel * 2 || 20));
                            setRestockSupplierRef(
                              `${ing.supplier.split(' ')[0].toUpperCase()}-PO-${Math.floor(1000 + Math.random() * 9000)}`
                            );
                            setRestockNotes('Standard batch delivery accepted & inspected');
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
                          title="Open Data-Driven Inward Stock Receiving Dialog"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>Receive Stock</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT 4 COLS: LIVE BOM DEDUCTION LEDGER & RECIPE MAPPING */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#C8102E]" />
                  Live BOM Stock Transaction Log
                </h3>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {inventoryLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-800 truncate">
                          {log.ingredientName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {log.reference} • {formatTimeKW(log.timestamp)}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold shrink-0 ${
                          log.qtyDelta > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.qtyDelta > 0 ? `+${log.qtyDelta}` : log.qtyDelta} {log.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipe BOM Breakdown Card (Strict Live Supabase Data) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider">
                    Recipe (BOM) Mapping Inspector
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    Supabase: recipe_bom_items
                  </span>
                </div>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {menuItems.filter((m) => m.bom && m.bom.length > 0).length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-slate-400">
                      No recipes mapped in Supabase (recipe_bom_items). When ingredient recipes are mapped, deduction ratios will display here.
                    </div>
                  ) : (
                    menuItems
                      .filter((m) => m.bom && m.bom.length > 0)
                      .map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">
                              {m.visualEmoji} {m.nameEn}
                            </span>
                            <span className="font-mono font-bold text-[#C8102E]">
                              {formatKWD(m.priceKwd)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {m.bom.map((b, idx) => {
                              const ing = rawIngredients.find(
                                (r) => r.id === b.rawIngredientId
                              );
                              return (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-600 font-medium"
                                >
                                  -{b.qtyPerUnit} {ing?.unit || 'unit'} {ing?.name || b.rawIngredientId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* FULL-WIDTH SECTION: UNIVERSAL MENU ITEM & BEVERAGE STOCK TRACKING TABLE */}
            <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-display font-bold text-slate-900">
                      Universal Menu Item &amp; Beverage Stock Tracking
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[11px] font-bold">
                      Dynamic Stock Deduction Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toggle live inventory tracking for ANY product or beverage. Settled POS bills and online orders automatically decrement stock count.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={stockSearchQuery}
                      onChange={(e) => setStockSearchQuery(e.target.value)}
                      placeholder="Filter items or SKU..."
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#C8102E]"
                    />
                  </div>
                </div>
              </div>

              {/* Items Stock Control Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Product / Beverage</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Price ({CURRENCY})</th>
                      <th className="py-2.5 px-3">Stock Tracking</th>
                      <th className="py-2.5 px-3">Stock Level &amp; Alerts</th>
                      <th className="py-2.5 px-3">Alert Threshold</th>
                      <th className="py-2.5 px-3 text-right">Quick Restock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStockMenuItems.map((item) => {
                      const isTracked = !!item.trackStock;
                      const stock = item.stockQuantity ?? 0;
                      const threshold = item.lowStockThreshold ?? 5;
                      const isOutOfStock = isTracked && stock <= 0;
                      const isLowStock = isTracked && stock > 0 && stock <= threshold;
                      const customQty = stockEditQtyMap[item.id] ?? '10';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{item.visualEmoji}</span>
                              <div>
                                <div className="font-bold text-slate-900">{item.nameEn}</div>
                                <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                            {item.categoryId.replace('cat-', '').toUpperCase()}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#C8102E]">
                            {formatKWD(item.priceKwd)}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => toggleItemStockTracking(item.id, !isTracked)}
                              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-extrabold transition flex items-center gap-1 ${
                                isTracked
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>{isTracked ? 'TRACKED' : 'UNTRACKED'}</span>
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            {isTracked ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-black uppercase flex items-center gap-1 ${
                                    isOutOfStock
                                      ? 'bg-rose-600 text-white animate-pulse'
                                      : isLowStock
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  {isOutOfStock ? (
                                    <>
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>OUT OF STOCK (0 LEFT)</span>
                                    </>
                                  ) : isLowStock ? (
                                    <>
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      <span>LOW STOCK: {stock} LEFT</span>
                                    </>
                                  ) : (
                                    <span>OPTIMAL: {stock} IN STOCK</span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">
                                Unlimited / Off
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isTracked ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-mono text-slate-400">Trigger &lt;=</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={stockEditThresholdMap[item.id] ?? threshold}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setStockEditThresholdMap((prev) => ({ ...prev, [item.id]: val }));
                                    const num = parseInt(val, 10);
                                    if (!isNaN(num) && num >= 0) {
                                      updateItemStockThreshold(item.id, num);
                                    }
                                  }}
                                  className="w-12 px-1.5 py-1 rounded bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-800 text-center"
                                />
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isTracked ? (
                              <div className="flex items-center justify-end gap-1.5">
                                {[5, 10, 25].map((qty) => (
                                  <button
                                    key={qty}
                                    type="button"
                                    onClick={() => updateItemStockQuantity(item.id, stock + qty)}
                                    className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-mono text-[11px] font-bold border border-slate-200 transition"
                                  >
                                    +{qty}
                                  </button>
                                ))}
                                <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs ml-1">
                                  <input
                                    type="number"
                                    value={customQty}
                                    onChange={(e) =>
                                      setStockEditQtyMap((prev) => ({
                                        ...prev,
                                        [item.id]: e.target.value,
                                      }))
                                    }
                                    className="w-12 px-1.5 py-1 font-mono text-xs text-slate-900 focus:outline-none text-center"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const n = parseInt(customQty, 10);
                                      if (!isNaN(n)) updateItemStockQuantity(item.id, stock + n);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold uppercase transition"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  toggleItemStockTracking(item.id, true);
                                  updateItemStockQuantity(item.id, 20);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-mono text-[11px] font-bold transition"
                              >
                                Enable Stock (20)
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: SALES AUDIT LOG & ITEM MOVEMENT VELOCITY MATRIX
           ========================================================================= */}
        {activeTab === 'sales-audit' && (
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
                <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
                  Total Settled Invoices
                </div>
                <div className="text-2xl font-mono font-black text-slate-900 mt-1">
                  {validOrders.length}
                </div>
                <div className="text-[11px] font-mono text-emerald-600 mt-0.5">
                  100% audited &amp; verified
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
                <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
                  Gross Sales Revenue
                </div>
                <div className="text-2xl font-mono font-black text-[#C8102E] mt-1">
                  {formatKWD(financialMetrics.grossRevenue)}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Avg Ticket: {validOrders.length > 0 ? formatKWD(financialMetrics.grossRevenue / validOrders.length) : `0.000 ${CURRENCY}`}
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
                <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
                  Discounts Granted
                </div>
                <div className="text-2xl font-mono font-black text-amber-600 mt-1">
                  {formatKWD(financialMetrics.totalDiscounts)}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Concessions &amp; promos
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
                <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
                  Items Dispensed Today
                </div>
                <div className="text-2xl font-mono font-black text-emerald-700 mt-1">
                  {itemVelocityStats.totalUnits} Units
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Across {itemVelocityStats.list.length} active menu SKUs
                </div>
              </div>
            </div>

            {/* Sub-Tabs: Bills & Invoices vs Item Velocity */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setAuditActiveSubTab('bills')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition flex items-center gap-2 ${
                  auditActiveSubTab === 'bills'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>All Orders &amp; Bills Audit Log ({filteredAuditOrders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAuditActiveSubTab('velocity')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition flex items-center gap-2 ${
                  auditActiveSubTab === 'velocity'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Fast &amp; Slow Moving Item Velocity</span>
              </button>
            </div>

            {/* SUB-TAB 1: BILLS AUDIT LOG TABLE */}
            {auditActiveSubTab === 'bills' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                {/* Instant Segment Filter Chips */}
                <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mr-1">
                    Filter By:
                  </span>
                  {([
                    { key: 'ALL', label: 'All Bills', count: auditSegmentCounts.ALL },
                    { key: 'CASH', label: 'Cash', count: auditSegmentCounts.CASH },
                    { key: 'KNET', label: 'K-Net', count: auditSegmentCounts.KNET },
                    { key: 'WAMD', label: 'Wamd', count: auditSegmentCounts.WAMD },
                    { key: 'WEB', label: 'Web Direct', count: auditSegmentCounts.WEB },
                    { key: 'KEETA', label: 'Keeta', count: auditSegmentCounts.KEETA },
                    { key: 'DINE_IN', label: 'Dine-In', count: auditSegmentCounts.DINE_IN },
                    { key: 'TAKEAWAY', label: 'Takeaway', count: auditSegmentCounts.TAKEAWAY },
                  ] as const).map((chip) => {
                    const isActive = auditSegmentChip === chip.key;
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => setAuditSegmentChip(chip.key)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs transition flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#C8102E] text-white font-bold shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60 font-medium'
                        }`}
                      >
                        <span>{chip.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {chip.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <div className="relative min-w-[220px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={auditSearchQuery}
                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                        placeholder="Search invoice, token, cashier, customer, item..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#C8102E]"
                      />
                    </div>

                    <select
                      value={auditChannelFilter}
                      onChange={(e) => setAuditChannelFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
                    >
                      <option value="all">All Channels</option>
                      <option value="dine_in">Dine-In</option>
                      <option value="takeaway">Takeaway</option>
                      <option value="chikarro_web">Web Direct</option>
                      <option value="keeta">Keeta</option>
                    </select>

                    <select
                      value={auditPaymentFilter}
                      onChange={(e) => setAuditPaymentFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
                    >
                      <option value="all">All Tender Methods</option>
                      <option value="cash">Cash ({CURRENCY})</option>
                      <option value="knet">K-Net</option>
                      <option value="wamd">Wamd Instant</option>
                      <option value="split">Split Tender</option>
                      <option value="payment_link">Payment Link</option>
                      <option value="aggregator_prepaid">Keeta Prepaid</option>
                    </select>

                    <select
                      value={auditStatusFilter}
                      onChange={(e) => setAuditStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed / Settled</option>
                      <option value="delivered">Delivered (Web)</option>
                      <option value="accepted">Accepted (Web)</option>
                      <option value="cooking">Cooking / In Kitchen</option>
                      <option value="ready">Ready</option>
                      <option value="voided">Voided</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <ExportButtons orders={filteredAuditOrders} rangeLabel={`Sales Audit (filtered: ${auditSegmentChip})`} />
                    <div className="text-xs font-mono text-slate-500">
                      Showing {filteredAuditOrders.length} of {posOrders.length} tickets
                    </div>
                  </div>
                </div>

                {/* Table of Orders */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase">
                        <th className="py-2.5 px-3">Invoice &amp; Token</th>
                        <th className="py-2.5 px-3">Time &amp; Cashier</th>
                        <th className="py-2.5 px-3">Channel</th>
                        <th className="py-2.5 px-3">Tender Mode</th>
                        <th className="py-2.5 px-3">Items Purchased</th>
                        <th className="py-2.5 px-3">Discount</th>
                        <th className="py-2.5 px-3">Total ({CURRENCY})</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredAuditOrders.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-xs font-mono text-slate-400">
                            No orders match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-900">{ord.invoiceNo}</span>
                                {(ord.channel === 'chikarro_web' || ord.source === 'WEB' || ord.webOrderRef) && (
                                  <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 font-mono text-[9px] font-extrabold tracking-wider shrink-0">
                                    WEB
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-[#C8102E] font-extrabold">
                                TOKEN #{ord.tokenNo}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-mono text-[11px] text-slate-600">
                                {formatDateTimeKW(ord.createdAt)}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-800">
                                {ord.cashierName}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                                  ord.channel === 'chikarro_web' || ord.source === 'WEB'
                                    ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {ord.channel === 'chikarro_web' || ord.source === 'WEB'
                                  ? 'WEB DELIVERY'
                                  : ord.channel.replace('_', ' ')}
                                {ord.tableNo && ` (T-${ord.tableNo})`}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] font-bold text-slate-800 uppercase">
                              {ord.paymentMethod.replace('_', ' ')}
                            </td>
                            <td className="py-3 px-3 max-w-[200px]">
                              <div className="text-[11px] text-slate-700 truncate">
                                {ord.items.map((i) => `${i.quantity}x ${i.titleEn}`).join(', ')}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px]">
                              {ord.discountKwd > 0 ? (
                                <span className="text-amber-600 font-bold">
                                  -{formatKWD(ord.discountKwd)}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono font-extrabold text-[#C8102E] text-sm">
                              {formatKWD(ord.grandTotalKwd)}
                            </td>
                            <td className="py-3 px-3">
                              {(() => {
                                const ext = (ord.externalStatus || '').toLowerCase();
                                if (ext === 'delivered') {
                                  return (
                                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      DELIVERED
                                    </span>
                                  );
                                }
                                if (ext === 'accepted') {
                                  return (
                                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 border border-sky-300">
                                      ACCEPTED
                                    </span>
                                  );
                                }
                                if (ord.status === 'completed' || ext === 'completed' || ext === 'settled') {
                                  return (
                                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                                      SETTLED
                                    </span>
                                  );
                                }
                                if (ord.status === 'cooking' || ext === 'cooking') {
                                  return (
                                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                      COOKING
                                    </span>
                                  );
                                }
                                if (ord.status === 'ready' || ext === 'ready') {
                                  return (
                                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 border border-indigo-300">
                                      READY
                                    </span>
                                  );
                                }
                                if (ord.status === 'voided' || ext === 'voided' || ext === 'cancelled') {
                                  return (
                                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                      VOIDED
                                    </span>
                                  );
                                }
                                return (
                                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800">
                                    {ord.externalStatus || ord.status}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openPrintModal(ord, 'INVOICE')}
                                  title="Re-print 80mm Customer Bill"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#C8102E] hover:text-white text-slate-700 transition cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openPrintModal(ord, 'KOT')}
                                  title="Re-print Kitchen KOT slip"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-600 hover:text-white text-slate-700 transition cursor-pointer"
                                >
                                  <ChefHat className="w-3.5 h-3.5" />
                                </button>

                                {/* Explicit Void / Cancel Bill Button */}
                                {ord.status !== 'voided' && ord.status !== 'cancelled' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOrderToVoid(ord);
                                      setVoidAuditError(null);
                                      setVoidAuditSupervisorPin('');
                                    }}
                                    title="Void / Cancel Completed Bill (Deducts from Gross Sales & Spools Cancellation Receipt)"
                                    className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 border border-amber-300 transition cursor-pointer flex items-center gap-1 font-mono text-[10px] font-extrabold"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    <span>Void</span>
                                  </button>
                                ) : (
                                  <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-black uppercase">
                                    VOIDED
                                  </span>
                                )}

                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: FAST & SLOW MOVING VELOCITY MATRIX */}
            {auditActiveSubTab === 'velocity' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* FAST-MOVING BESTSELLERS */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-slate-900">
                          Fast-Moving Bestsellers (Ranked by Sales)
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500">
                          High-velocity items generating primary revenue
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-xs font-bold">
                      {itemVelocityStats.fast.length} Active Movers
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {itemVelocityStats.fast.map((item, idx) => {
                      const sharePct =
                        financialMetrics.grossRevenue > 0
                          ? ((item.revenueKwd / financialMetrics.grossRevenue) * 100).toFixed(1)
                          : '0.0';

                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-black ${
                                idx === 0
                                  ? 'bg-amber-400 text-stone-900'
                                  : idx === 1
                                  ? 'bg-stone-300 text-stone-800'
                                  : idx === 2
                                  ? 'bg-amber-200 text-stone-800'
                                  : 'bg-white text-stone-600 border border-slate-200'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <span className="text-xl">{item.visualEmoji}</span>
                            <div>
                              <div className="font-bold text-xs text-slate-900">{item.name}</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {formatKWD(item.priceKwd)} • {sharePct}% of Gross Sales
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono text-sm font-black text-[#C8102E]">
                              {item.unitsSold} Units
                            </div>
                            <div className="text-[11px] font-mono font-bold text-slate-700">
                              {formatKWD(item.revenueKwd)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SLOW-MOVING & DORMANT ITEMS */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-800">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-slate-900">
                          Slow-Moving &amp; Dormant Products
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500">
                          Items with 0 or minimal sales today
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-mono text-xs font-bold">
                      {itemVelocityStats.slow.length} Needs Attention
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {itemVelocityStats.slow.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{item.visualEmoji}</span>
                          <div>
                            <div className="font-bold text-xs text-slate-900">{item.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              Price: {formatKWD(item.priceKwd)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-xs font-bold text-slate-600">
                            {item.unitsSold} sold today
                          </div>
                          <span className="inline-block mt-0.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Add to Combo Deal
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: SHIFT Z-REPORT & REGISTER CLOSING RECONCILIATION
           ========================================================================= */}
        {activeTab === 'z-report' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-900">
                    End-of-Shift Z-Report &amp; Cash Drawer Reconciliation
                  </h2>
                  <p className="text-xs text-slate-500">
                    Branch: {activeBranch.branchName} • Active Shift Audited by{' '}
                    <strong className="text-slate-800">{currentUser?.name}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPrintableZModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print 80mm Z-Report Slip</span>
                </button>
              </div>

              {/* Payment Tender Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                <div className="p-3.5 rounded-xl bg-[#C8102E]/10 border border-[#C8102E]/20">
                  <div className="text-[10px] text-[#C8102E] font-bold uppercase">
                    Gross Settled Sales ({validOrders.length})
                  </div>
                  <div className="text-lg font-extrabold text-[#C8102E] mt-1">
                    {formatKWD(financialMetrics.grossRevenue)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[10px] text-emerald-700 font-bold uppercase">
                    Cash Sales Total
                  </div>
                  <div className="text-lg font-bold text-emerald-800 mt-1">
                    {formatKWD(financialMetrics.cashSales)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200">
                  <div className="text-[10px] text-sky-700 font-bold uppercase">
                    K-Net Terminal Batch
                  </div>
                  <div className="text-lg font-bold text-sky-900 mt-1">
                    {formatKWD(financialMetrics.knetSales)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
                  <div className="text-[10px] text-purple-700 font-bold uppercase">
                    Wamd Instant Total
                  </div>
                  <div className="text-base font-bold text-purple-900 mt-1">
                    {formatKWD(financialMetrics.wamdSales)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200">
                  <div className="text-[10px] text-cyan-700 font-bold uppercase">
                    {SHORT_NAME} Web Delivery
                  </div>
                  <div className="text-base font-bold text-cyan-900 mt-1">
                    {formatKWD(financialMetrics.webDirectSales)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="text-[10px] text-amber-800 font-bold uppercase">
                    Keeta Kuwait Sales
                  </div>
                  <div className="text-base font-bold text-amber-900 mt-1">
                    {formatKWD(financialMetrics.keetaSales)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300">
                  <div className="text-[10px] text-amber-900 font-bold uppercase">
                    Staff Credit (Salary Deductions)
                  </div>
                  <div className="text-base font-bold text-amber-950 mt-1">
                    {formatKWD(financialMetrics.totalStaffCredit)}
                  </div>
                  <div className="text-[9px] text-amber-800 mt-0.5">
                    Excluded from Drawer Cash
                  </div>
                </div>
              </div>

              {/* CASH DRAWER EXPECTED VS ACTUAL RECONCILIATION */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 font-mono">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Physical Cash Drawer Reconciliation ({CURRENCY})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      OPENING FLOAT ({CURRENCY})
                    </label>
                    <input
                      type="number"
                      step="1.000"
                      value={openingFloatKwd}
                      readOnly={!!activeShift}
                      title={activeShift ? 'Locked: entered when the shift was opened' : undefined}
                      onChange={(e) =>
                        setOpeningFloatKwd(roundKWD(parseFloat(e.target.value) || 0))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#C8102E] shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      LESS CASH DRAWER EXPENSES
                    </label>
                    <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 font-bold text-rose-700">
                      -{formatKWD(financialMetrics.cashDrawerExpenses)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C8102E] mb-1">
                      EXPECTED CASH IN DRAWER
                    </label>
                    <div className="px-3 py-2 rounded-xl bg-[#C8102E]/10 border border-[#C8102E]/30 font-extrabold text-[#C8102E]">
                      {formatKWD(financialMetrics.expectedCashInDrawer)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ACTUAL PHYSICAL CASH COUNTED IN DRAWER ({CURRENCY})
                    </label>
                    <input
                      type="number"
                      step="0.250"
                      placeholder={financialMetrics.expectedCashInDrawer.toFixed(3)}
                      value={actualCashCountedInput}
                      onChange={(e) => setActualCashCountedInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-emerald-500 text-base font-extrabold text-emerald-700 focus:outline-none shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      DRAWER VARIANCE (OVER / SHORT)
                    </label>
                    <div
                      className={`px-3.5 py-2.5 rounded-xl border text-base font-extrabold flex items-center justify-between ${
                        !hasActualCashInput
                          ? 'bg-slate-50 border-slate-300 text-slate-500'
                          : Math.abs(cashVarianceKwd) < 0.005
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : cashVarianceKwd > 0
                          ? 'bg-sky-50 border-sky-300 text-sky-800'
                          : 'bg-rose-50 border-rose-300 text-rose-800'
                      }`}
                    >
                      <span>
                        {!hasActualCashInput
                          ? '—'
                          : cashVarianceKwd >= 0
                          ? `+${formatKWD(cashVarianceKwd)}`
                          : formatKWD(cashVarianceKwd)}
                      </span>
                      <span className="text-[10px] uppercase font-bold">
                        {!hasActualCashInput
                          ? 'ENTER COUNT'
                          : Math.abs(cashVarianceKwd) < 0.005
                          ? 'BALANCED'
                          : cashVarianceKwd > 0
                          ? 'OVERAGE'
                          : 'SHORTAGE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CLOSE SHIFT & SAVE Z-REPORT */}
              <div className="p-5 rounded-2xl bg-white border-2 border-[#C8102E]/30 space-y-3 font-mono">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Close Shift {activeShift ? `• ${activeShift.shiftCode}` : ''}
                  </div>
                  {activeShift && (
                    <span className="text-[11px] text-slate-500">
                      Opened {formatDateTimeKW(activeShift.openedAt)} by {activeShift.openedBy} with{' '}
                      {formatKWD(activeShift.openingCashKwd)}
                    </span>
                  )}
                </div>

                {hasActualCashInput && Math.abs(cashVarianceKwd) >= 0.005 && (
                  <div
                    className={`p-3 rounded-xl border-2 text-sm font-extrabold flex items-center gap-2 ${
                      cashVarianceKwd < 0
                        ? 'bg-rose-50 border-rose-400 text-rose-800'
                        : 'bg-sky-50 border-sky-400 text-sky-800'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>
                      {cashVarianceKwd < 0 ? 'CASH SHORTAGE' : 'CASH OVERAGE'}: {formatKWD(Math.abs(cashVarianceKwd))}
                      {' '}(expected {formatKWD(financialMetrics.expectedCashInDrawer)}, counted {formatKWD(parsedActualCash)})
                    </span>
                  </div>
                )}

                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Closing notes (explain any shortage / overage)..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#C8102E]"
                />

                <button
                  type="button"
                  disabled={!activeShift || !hasActualCashInput}
                  onClick={() => {
                    if (!confirmClose) {
                      setConfirmClose(true);
                      return;
                    }
                    closeShift(parsedActualCash, closeNotes.trim());
                    setConfirmClose(false);
                    setCloseNotes('');
                    setActualCashCountedInput('');
                  }}
                  className={`w-full py-3 rounded-xl text-white font-display font-extrabold text-xs uppercase tracking-wider shadow-sm transition disabled:opacity-40 ${
                    confirmClose ? 'bg-rose-700 hover:bg-rose-800' : 'bg-[#C8102E] hover:bg-[#A50D25]'
                  }`}
                >
                  {!hasActualCashInput
                    ? 'Enter actual drawer cash to close shift'
                    : confirmClose
                    ? 'Tap again to confirm: close shift, save Z-report & sign out'
                    : 'Close Shift & Save Z-Report'}
                </button>

                {closedShifts.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Recent closed shifts</div>
                    {closedShifts.slice(0, 5).map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-[11px] px-3 py-2 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <span className="font-bold text-slate-800">{r.shiftCode}</span>
                        <span className="text-slate-500">{formatDateTimeKW(r.closedAt)}</span>
                        <span className="text-slate-600">
                          Expected {formatKWD(r.expectedCashKwd)} / Counted {formatKWD(r.actualCashKwd)}
                        </span>
                        <span
                          className={`font-extrabold ${
                            Math.abs(r.varianceKwd) < 0.005
                              ? 'text-emerald-700'
                              : r.varianceKwd < 0
                              ? 'text-rose-700'
                              : 'text-sky-700'
                          }`}
                        >
                          {Math.abs(r.varianceKwd) < 0.005
                            ? 'BALANCED'
                            : r.varianceKwd < 0
                            ? `SHORT ${formatKWD(Math.abs(r.varianceKwd))}`
                            : `OVER ${formatKWD(r.varianceKwd)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT 5 COLS: VOIDED BILLS AUDIT LOG */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5">
                Voided Bills &amp; Manager Override Audit Log ({voidedOrders.length})
              </h3>

              {voidedOrders.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-slate-400">
                  Zero voided bills during this shift.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {voidedOrders.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs font-mono space-y-1"
                    >
                      <div className="flex justify-between font-bold text-rose-800">
                        <span>
                          {v.invoiceNo} (Token #{v.tokenNo})
                        </span>
                        <span>{formatKWD(v.grandTotalKwd)}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Reason: {v.voidReason || 'Manager Void'} • Authorized By:{' '}
                        <strong className="text-slate-900">{v.voidedBy}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: DAILY SHOP EXPENSES LEDGER
           ========================================================================= */}
        {activeTab === 'expenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleAddExpenseSubmit}
              className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 h-fit"
            >
              <h3 className="text-base font-display font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                Record Daily Branch Shop Expense
              </h3>

              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase text-slate-500 mb-1">
                  Expense Category
                </label>
                <select
                  value={expCategory}
                  onChange={(e) =>
                    setExpCategory(e.target.value as ShopExpense['category'])
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                >
                  <option value="Produce & Supplies">Produce &amp; Supplies</option>
                  <option value="Packaging & Boxes">Packaging &amp; Boxes</option>
                  <option value="Driver Fuel">Driver Fuel</option>
                  <option value="Equipment Maintenance">Equipment Maintenance</option>
                  <option value="Petty Cash">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase text-slate-500 mb-1">
                  Description / Voucher Note *
                </label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="e.g. Salmiya Co-op Fresh Iceberg & Lemons..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-mono font-semibold uppercase text-slate-700 mb-1">
                    Amount ({CURRENCY}) *
                  </label>
                  <input
                    type="number"
                    step="0.050"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-sm font-bold text-[#C8102E] focus:bg-white focus:outline-none focus:border-[#C8102E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-semibold uppercase text-slate-500 mb-1">
                    Paid Via
                  </label>
                  <select
                    value={expPaidVia}
                    onChange={(e) =>
                      setExpPaidVia(e.target.value as ShopExpense['paidVia'])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                  >
                    <option value="Cash Drawer">Cash Drawer</option>
                    <option value="K-Net Corporate">K-Net Corporate</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-display font-extrabold text-xs uppercase tracking-wider shadow-sm transition"
              >
                + Record Expense Voucher
              </button>
            </form>

            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-base font-display font-bold text-slate-900">
                  {activeBranch.branchName} Shop Expense Vouchers
                </h3>
                <span className="font-mono text-sm font-bold text-rose-600">
                  Total Outflow: {formatKWD(financialMetrics.totalAllExpenses)}
                </span>
              </div>

              <div className="space-y-2.5">
                {shopExpenses.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs font-mono text-slate-500">
                      {language === 'ar'
                        ? 'لا توجد مصروفات مسجلة اليوم. إجمالي المصروفات: 0.000 د.ك'
                        : `No shop expenses recorded today. Total Outflow: 0.000 ${CURRENCY}`}
                    </p>
                  </div>
                ) : (
                  shopExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#C8102E]/10 text-[#C8102E] font-mono text-[10px] font-bold border border-[#C8102E]/20">
                            {exp.category}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono text-[10px]">
                            {exp.paidVia}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-1">
                          {exp.description}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Recorded by {exp.recordedBy} • {formatDateTimeKW(exp.createdAt)}
                        </div>
                      </div>

                      <div className="font-mono text-base font-extrabold text-rose-600 shrink-0">
                        -{formatKWD(exp.amountKwd)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: STAFF PURCHASE & CREDIT LEDGER (MONTHLY SALARY DEDUCTION AUDIT)
           ========================================================================= */}
        {activeTab === 'staff-credit' && (
          <div className="space-y-6">
            {/* Header / Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              <div className="bg-white rounded-2xl p-4 border border-[#E8E1D5] shadow-xs">
                <div className="text-[11px] text-stone-500 uppercase font-semibold flex items-center justify-between">
                  <span>Total Unpaid Credit</span>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {formatKWD(
                    roundKWD(
                      staffCreditRecords
                        .filter((r) => r.status === 'unpaid')
                        .reduce((s, r) => s + r.totalAmountKwd, 0)
                    )
                  )}
                </div>
                <div className="text-[11px] text-amber-800 font-bold mt-1">
                  {staffCreditRecords.filter((r) => r.status === 'unpaid').length} Pending Salary Deductions
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#E8E1D5] shadow-xs">
                <div className="text-[11px] text-stone-500 uppercase font-semibold flex items-center justify-between">
                  <span>Total Settled Credit</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {formatKWD(
                    roundKWD(
                      staffCreditRecords
                        .filter((r) => r.status === 'settled')
                        .reduce((s, r) => s + r.totalAmountKwd, 0)
                    )
                  )}
                </div>
                <div className="text-[11px] text-emerald-800 font-bold mt-1">
                  {staffCreditRecords.filter((r) => r.status === 'settled').length} Settled Invoices
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#E8E1D5] shadow-xs">
                <div className="text-[11px] text-stone-500 uppercase font-semibold flex items-center justify-between">
                  <span>Cumulative Staff Meals</span>
                  <UserCheck className="w-4 h-4 text-[#C8102E]" />
                </div>
                <div className="text-2xl font-black text-[#1E293B] mt-1">
                  {formatKWD(
                    roundKWD(
                      staffCreditRecords.reduce((s, r) => s + r.totalAmountKwd, 0)
                    )
                  )}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  Across {staffCreditRecords.length} Ledger Records
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 shadow-xs">
                <div className="text-[11px] text-amber-900 uppercase font-bold flex items-center justify-between">
                  <span>Accounting Segregation</span>
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                </div>
                <div className="text-xs font-bold text-amber-950 mt-1">
                  Strictly Segregated
                </div>
                <div className="text-[11px] text-amber-900 mt-1">
                  Excluded from customer sales and cash/K-Net drawers.
                </div>
              </div>
            </div>

            {/* Filter Bar & Ledger Records Table */}
            <div className="bg-white rounded-2xl border border-[#E8E1D5] shadow-xs p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <h3 className="font-display font-extrabold text-base text-[#1E293B]">
                    Staff Purchase &amp; Credit Ledger
                  </h3>
                  <p className="text-xs text-stone-500">
                    Audit meals and items taken by team members on credit for monthly payroll deduction
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status filter */}
                  <select
                    value={creditStatusFilter}
                    onChange={(e) => setCreditStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono font-bold text-stone-800"
                  >
                    <option value="all">All Statuses</option>
                    <option value="unpaid">Unpaid (Pending Deduction)</option>
                    <option value="settled">Settled / Deducted</option>
                  </select>

                  {/* Staff filter */}
                  <select
                    value={creditStaffFilter}
                    onChange={(e) => setCreditStaffFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono font-bold text-stone-800"
                  >
                    <option value="all">All Staff Members</option>
                    {staffAccounts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.employeeCode})
                      </option>
                    ))}
                  </select>

                  {/* Search query */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={creditSearchQuery}
                      onChange={(e) => setCreditSearchQuery(e.target.value)}
                      placeholder="Search staff, item or code..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono text-stone-800 w-52"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#FAF6F0] text-stone-600 font-bold border-b border-[#E8E1D5]">
                    <tr>
                      <th className="py-2.5 px-3">Date / Time</th>
                      <th className="py-2.5 px-3">Staff Member</th>
                      <th className="py-2.5 px-3">Employee Code</th>
                      <th className="py-2.5 px-3">Invoice Ref</th>
                      <th className="py-2.5 px-3">Items Taken</th>
                      <th className="py-2.5 px-3 text-right">Amount ({CURRENCY})</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredStaffCreditRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-stone-400">
                          No staff credit transactions found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStaffCreditRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-stone-50 transition">
                          <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">
                            {formatDateTimeKW(rec.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#1E293B]">
                            {rec.staffName}
                          </td>
                          <td className="py-2.5 px-3 text-stone-500">
                            {rec.employeeCode}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#C8102E]">
                            {rec.invoiceNo || 'INV-SLM-STF'}
                          </td>
                          <td className="py-2.5 px-3 max-w-xs truncate text-stone-700" title={rec.itemsSummary}>
                            {rec.itemsSummary}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-[#1E293B]">
                            {formatKWD(rec.totalAmountKwd)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === 'unpaid'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              }`}
                            >
                              {rec.status === 'unpaid' ? 'PENDING DEDUCTION' : 'SETTLED'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {rec.status === 'unpaid' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  settleStaffCreditRecord(
                                    rec.id,
                                    currentUser?.name || 'Admin',
                                    'Deducted from monthly payroll'
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold transition shadow-xs"
                              >
                                Mark Deducted
                              </button>
                            ) : (
                              <span className="text-[10px] text-stone-400 font-mono">
                                Settled: {rec.settledBy?.split(' ')[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: ADMIN EXECUTIVE ANALYTICS, MULTI-BRANCH & PIN SECURITY (ADMIN ONLY)
           ========================================================================= */}
        {activeTab === 'promos' && <PromoManagement />}
        {activeTab === 'crm' && <CustomersCrm />}

        {activeTab === 'admin-executive' && isAdmin && (
          <div className="space-y-6">
            <PredictiveAnalyticsWidget />

            {/* Executive Net Profit & Margin Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
                <div className="text-[11px] text-slate-500 uppercase font-semibold flex items-center justify-between">
                  <span>Gross POS Revenue</span>
                  <DollarSign className="w-4 h-4 text-[#C8102E]" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {formatKWD(financialMetrics.grossRevenue)}
                </div>
                <div className="text-[11px] text-[#C8102E] font-semibold mt-1">
                  Across {validOrders.length} Settled Invoices
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
                <div className="text-[11px] text-slate-500 uppercase font-semibold flex items-center justify-between">
                  <span>Recipe (BOM) COGS</span>
                  <Boxes className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {formatKWD(financialMetrics.totalFoodCost)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Food Cost Ratio:{' '}
                  {financialMetrics.grossRevenue > 0
                    ? (
                        (financialMetrics.totalFoodCost /
                          financialMetrics.grossRevenue) *
                        100
                      ).toFixed(1)
                    : '0.0'}
                  %
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
                <div className="text-[11px] text-slate-500 uppercase font-semibold flex items-center justify-between">
                  <span>Expenses + Aggregator Fees</span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {formatKWD(
                    roundKWD(
                      financialMetrics.totalAllExpenses +
                        financialMetrics.aggregatorCommissionCost
                    )
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Commissions: {formatKWD(financialMetrics.aggregatorCommissionCost)}
                </div>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-300 shadow-sm">
                <div className="text-[11px] text-emerald-800 uppercase font-bold flex items-center justify-between">
                  <span>Estimated Net Profit</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                  {formatKWD(financialMetrics.netOperatingProfit)}
                </div>
                <div className="text-[11px] text-emerald-800 font-semibold mt-1">
                  Net Margin:{' '}
                  {financialMetrics.grossRevenue > 0
                    ? (
                        (financialMetrics.netOperatingProfit /
                          financialMetrics.grossRevenue) *
                        100
                      ).toFixed(1)
                    : '0.0'}
                  %
                </div>
              </div>
            </div>

            {/* =========================================================================
                MULTI-BRANCH MASTER CONFIGURATION & TOGGLE BANNER
               ========================================================================= */}
            <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#E8E1D5] shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C8102E] text-white flex items-center justify-center shadow-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-base text-[#1E293B]">
                      Multi-Branch / Multi-Tenant Master Mode
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {multiBranchMode
                        ? 'Multi-branch operations are ACTIVE. Cross-branch switcher and multi-tenant telemetry are visible in the top command header.'
                        : 'Single-branch QSR mode is ACTIVE. System operates strictly as a high-performance single store for Salmiya Flagship (KW-SLM-01) with zero multi-tenant clutter.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                      multiBranchMode
                        ? 'bg-[#C8102E] text-white'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {multiBranchMode
                      ? 'MULTI-BRANCH ENABLED'
                      : 'SINGLE-BRANCH ACTIVE (KW-SLM-01)'}
                  </span>

                  {/* Accessible Master Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={multiBranchMode}
                    aria-label="Toggle Multi-Branch Master Mode"
                    onClick={() => setMultiBranchMode(!multiBranchMode)}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-2 ${
                      multiBranchMode ? 'bg-[#C8102E]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        multiBranchMode ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* =========================================================================
                RECEIPT & STORE DETAILS EDITOR (DIRECT 80MM BILL BINDING)
               ========================================================================= */}
            <div className="bg-white rounded-2xl border border-[#E8E1D5] shadow-sm p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-base text-[#1E293B]">
                      Receipt &amp; Store Details Editor
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Configure store header, Arabic subtitle, address, contact phone, website, and footer thank-you message bound to all 80mm thermal receipts.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => updateReceiptConfig(receiptDraft)}
                  className="px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Receipt Settings</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Editable Inputs Form (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1">
                        Restaurant / Store Title
                      </label>
                      <input
                        type="text"
                        value={receiptDraft.storeTitle}
                        onChange={(e) => setReceiptDraft({ ...receiptDraft, storeTitle: e.target.value })}
                        placeholder={`e.g. ${BRAND_NAME}`}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1">
                        Arabic Subtitle
                      </label>
                      <input
                        type="text"
                        value={receiptDraft.subtitleAr}
                        onChange={(e) => setReceiptDraft({ ...receiptDraft, subtitleAr: e.target.value })}
                        placeholder="e.g. شيكارو للدجاج المقلي - السالمية"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1">
                        Address Line 1 (Street &amp; Block)
                      </label>
                      <input
                        type="text"
                        value={receiptDraft.addressLine1}
                        onChange={(e) => setReceiptDraft({ ...receiptDraft, addressLine1: e.target.value })}
                        placeholder="e.g. Block 10, Salem Al-Mubarak St"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1">
                        Address Line 2 (Building &amp; Area)
                      </label>
                      <input
                        type="text"
                        value={receiptDraft.addressLine2}
                        onChange={(e) => setReceiptDraft({ ...receiptDraft, addressLine2: e.target.value })}
                        placeholder="e.g. Building 24, Salmiya, Kuwait"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1">
                        Contact Phone Number
                      </label>
                      <input
                        type="text"
                        value={receiptDraft.phone}
                        onChange={(e) => setReceiptDraft({ ...receiptDraft, phone: e.target.value })}
                        placeholder="e.g. +965 2224 8910"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1">
                        Website Domain Name
                      </label>
                      <input
                        type="text"
                        value={receiptDraft.websiteDomain}
                        onChange={(e) => setReceiptDraft({ ...receiptDraft, websiteDomain: e.target.value })}
                        placeholder="e.g. chikarrasalmiya.com"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1">
                      Custom Thank-You Footer Message
                    </label>
                    <textarea
                      rows={2}
                      value={receiptDraft.footerMessage}
                      onChange={(e) => setReceiptDraft({ ...receiptDraft, footerMessage: e.target.value })}
                      placeholder={`e.g. ${DEFAULT_FOOTER_MESSAGE}`}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                    />
                  </div>
                </div>

                {/* Live 80mm Receipt Preview (5 cols) */}
                <div className="lg:col-span-5 bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col items-center">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-2">
                    Live 80mm Print Layout Preview
                  </div>
                  <div className="w-[280px] bg-white text-black font-mono text-[10px] leading-tight p-3.5 shadow-md border border-slate-300">
                    <div className="text-center border-b border-dashed border-black pb-2 space-y-0.5">
                      <div className="text-xs font-black uppercase tracking-tight">
                        {receiptDraft.storeTitle || BRAND_NAME}
                      </div>
                      {receiptDraft.subtitleAr && (
                        <div className="text-[10px] font-bold">{receiptDraft.subtitleAr}</div>
                      )}
                      {receiptDraft.addressLine1 && (
                        <div className="text-[9px]">{receiptDraft.addressLine1}</div>
                      )}
                      {receiptDraft.addressLine2 && (
                        <div className="text-[9px]">{receiptDraft.addressLine2}</div>
                      )}
                      <div className="text-[9px] font-bold">
                        TEL: {receiptDraft.phone} • {receiptDraft.websiteDomain}
                      </div>
                    </div>
                    <div className="py-2 text-center border-b border-dashed border-black text-[9px] text-stone-500">
                      [ ... Itemized lines &amp; totals ... ]
                    </div>
                    <div className="pt-2 text-center text-[9px] space-y-0.5">
                      <div className="font-bold uppercase">
                        {receiptDraft.footerMessage || DEFAULT_FOOTER_MESSAGE}
                      </div>
                      <div>Order Online: {receiptDraft.websiteDomain}</div>
                      <div className="pt-1 mt-1 border-t border-black font-extrabold tracking-widest text-[8px]">
                        Powered by JeztBrain
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Staff & Manager PIN Security Management */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C8102E]" />
                    Management Roles &amp; PINs
                  </h3>
                </div>

                <div className="space-y-2">
                  {staffAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border ${
                              acc.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : acc.role === 'manager'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : acc.role === 'supervisor'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : acc.role === 'storekeeper'
                                ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                : acc.role === 'cashier'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {acc.role}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{acc.name}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            ({acc.employeeCode})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Max Discount without Override: {acc.maxDiscountPct}% • Void Bills:{' '}
                          {acc.canVoidBills ? 'YES' : 'REQUIRES MGR PIN'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[#C8102E] font-bold shadow-xs">
                          PIN: <strong>{acc.pin}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingStaffAccount({ ...acc })}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#C8102E] hover:text-[#C8102E] text-slate-600 transition shadow-xs flex items-center gap-1 font-mono text-[11px] font-semibold"
                          title={`Edit ${acc.name}`}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#C8102E]" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Staff/Manager Account */}
                <form
                  onSubmit={handleCreateStaff}
                  className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-5 gap-2"
                >
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Full Name..."
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                  />
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as RoleTier)}
                    className="px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                  >
                    <option value="staff">Staff (Team Member)</option>
                    <option value="cashier">Cashier</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="storekeeper">Storekeeper</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input
                    type="password"
                    name="chikarro_new_staff_pin"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    maxLength={6}
                    required
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    placeholder="4-Digit PIN"
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-xs text-[#C8102E] font-bold focus:bg-white focus:outline-none focus:border-[#C8102E]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-mono text-xs font-bold shadow-xs transition"
                  >
                    + Add User
                  </button>
                </form>
              </div>

              {/* Multi-Branch Branch Selector & Aggregator Commissions */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-5">
                <div>
                  <h3 className="text-base font-display font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <Building2 className="w-4 h-4 text-[#C8102E]" />
                    {multiBranchMode
                      ? 'Multi-Branch Tenant Selector'
                      : 'Active Single-Branch Configuration'}
                  </h3>

                  {multiBranchMode ? (
                    <div className="space-y-2 mt-3">
                      {branches.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setActiveBranchId(b.id)}
                          className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                            b.id === activeBranch.id
                              ? 'bg-[#C8102E]/10 border-[#C8102E] text-[#C8102E]'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">
                              {b.branchCode} • {b.branchName}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {b.address}
                            </div>
                          </div>
                          {b.id === activeBranch.id && (
                            <CheckCircle2 className="w-4 h-4 text-[#C8102E] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {activeBranch.branchCode} • {activeBranch.branchName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold">
                          FLAGSHIP
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        {activeBranch.address}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                        Single-Branch Mode: Secondary branch switchers are hidden from cashier view.
                      </div>
                    </div>
                  )}
                </div>

                {/* Aggregator Commission Settings */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-xs font-mono font-bold uppercase text-slate-600">
                    Aggregator Commission Rates (%)
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-amber-800 font-semibold mb-1">
                        Keeta Kuwait Commission (%)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={keetaComm}
                        onChange={(e) => setKeetaComm(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E8E1D5] font-mono text-xs text-[#1E293B] focus:outline-none focus:border-[#C8102E] shadow-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateBranchCommissions(activeBranch.id, {
                        keeta: Number(keetaComm) || 18,
                        chikarro_web: 0,
                      })
                    }
                    className="w-full py-2 rounded-lg bg-[#C8102E] hover:bg-[#A50D25] text-white font-mono text-xs font-bold transition shadow-xs"
                  >
                    Save Keeta Commission Rate
                  </button>
                </div>

                {/* Factory Seed Reset */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetSystemToFactorySeed}
                    className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-mono text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset System to Clean Production Slate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          PRINTABLE 80MM SHIFT Z-REPORT MODAL
         ========================================================================= */}
      {showPrintableZModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="no-print px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-display font-bold text-sm text-slate-900">
                80mm Shift Z-Report Thermal Slip
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#A50D25] text-white font-mono text-xs font-bold flex items-center gap-1 transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print 80mm Z-Slip
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintableZModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              id="thermal-print-root"
              className="p-6 overflow-y-auto bg-slate-100 flex justify-center"
            >
              <div className="w-[302px] bg-white text-black font-mono text-[11px] leading-snug p-4 shadow-xl border border-slate-300">
                <div className="text-center border-b-2 border-dashed border-black pb-2">
                  <div className="text-sm font-extrabold uppercase">
                    {activeBranch.tenantName}
                  </div>
                  <div className="text-[10px] font-bold">
                    SHIFT CLOSING Z-REPORT RECONCILIATION
                  </div>
                  <div className="text-[10px]">{activeBranch.branchName}</div>
                  <div className="text-[10px] mt-0.5">
                    PRINTED: {formatDateTimeKW(new Date().toISOString())}
                  </div>
                  <div className="text-[10px] font-bold">
                    MANAGER: {currentUser?.name}
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-black space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>SETTLED ORDERS:</span>
                    <span>{validOrders.length}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>VOIDED ORDERS:</span>
                    <span>{voidedOrders.length}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-black">
                    <span>GROSS REVENUE:</span>
                    <span>{formatKWD(financialMetrics.grossRevenue)}</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-black space-y-1">
                  <div className="font-extrabold uppercase underline">
                    TENDER BREAKDOWN:
                  </div>
                  <div className="flex justify-between">
                    <span>CASH SALES:</span>
                    <span>{formatKWD(financialMetrics.cashSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>K-NET BATCH:</span>
                    <span>{formatKWD(financialMetrics.knetSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WAMD INSTANT:</span>
                    <span>{formatKWD(financialMetrics.wamdSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{SHORT_NAME} WEB DIRECT:</span>
                    <span>{formatKWD(financialMetrics.webDirectSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KEETA PREPAID:</span>
                    <span>{formatKWD(financialMetrics.keetaSales)}</span>
                  </div>
                </div>

                <div className="py-2 border-b-2 border-dashed border-black space-y-1">
                  <div className="font-extrabold uppercase underline">
                    CASH DRAWER AUDIT:
                  </div>
                  <div className="flex justify-between">
                    <span>OPENING FLOAT:</span>
                    <span>{formatKWD(openingFloatKwd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ CASH SALES:</span>
                    <span>{formatKWD(financialMetrics.cashSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- CASH EXPENSES:</span>
                    <span>-{formatKWD(financialMetrics.cashDrawerExpenses)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-black">
                    <span>EXPECTED CASH:</span>
                    <span>{formatKWD(financialMetrics.expectedCashInDrawer)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>ACTUAL COUNTED:</span>
                    <span>{formatKWD(parsedActualCash)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold">
                    <span>VARIANCE:</span>
                    <span>
                      {cashVarianceKwd >= 0
                        ? `+${formatKWD(cashVarianceKwd)}`
                        : formatKWD(cashVarianceKwd)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 text-center text-[10px] font-extrabold tracking-widest">
                  Powered by JeztBrain
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Ingredient Modal */}
      {restockingIngredient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E] flex items-center justify-center font-bold text-sm">
                  +
                </div>
                <div>
                  <h3 className="font-bold text-sm font-display">Receive Stock Consignment</h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    {restockingIngredient.name} ({restockingIngredient.sku})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRestockingIngredient(null);
                  setRestockQtyInput('');
                  setRestockSupplierRef('');
                  setRestockNotes('');
                }}
                className="text-slate-400 hover:text-white transition text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Current Stock:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {restockingIngredient.currentStock} {restockingIngredient.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Min Threshold:</span>
                  <span className="font-mono text-slate-700">
                    {restockingIngredient.reorderLevel} {restockingIngredient.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Cost / Unit:</span>
                  <span className="font-mono text-slate-700 font-bold">
                    {formatKWD(restockingIngredient.unitCostKwd)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                  Quantity Received ({restockingIngredient.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus
                  value={restockQtyInput}
                  onChange={(e) => setRestockQtyInput(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                  Supplier Invoice / PO Reference
                </label>
                <input
                  type="text"
                  value={restockSupplierRef}
                  onChange={(e) => setRestockSupplierRef(e.target.value)}
                  placeholder="e.g. INV-KW-8841 (Al-Wazzan Foods)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                  Receiving &amp; Quality Notes
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="e.g. Temperature checked +4°C, batch seal intact"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {parseFloat(restockQtyInput) > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
                  New Projected Stock:{' '}
                  <strong>
                    {(
                      restockingIngredient.currentStock + (parseFloat(restockQtyInput) || 0)
                    ).toFixed(1)}{' '}
                    {restockingIngredient.unit}
                  </strong>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRestockingIngredient(null);
                    setRestockQtyInput('');
                    setRestockSupplierRef('');
                    setRestockNotes('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-mono text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-mono text-xs font-bold shadow-xs transition"
                >
                  Confirm &amp; Log Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Account Modal */}
      {editingStaffAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E] flex items-center justify-center font-bold text-sm">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-display">Edit User Profile &amp; Role</h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    {editingStaffAccount.name} ({editingStaffAccount.employeeCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaffAccount(null)}
                className="text-slate-400 hover:text-white transition text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedStaff} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStaffAccount.name}
                    onChange={(e) =>
                      setEditingStaffAccount({ ...editingStaffAccount, name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#C8102E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStaffAccount.employeeCode}
                    onChange={(e) =>
                      setEditingStaffAccount({
                        ...editingStaffAccount,
                        employeeCode: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                    Role Tier *
                  </label>
                  <select
                    value={editingStaffAccount.role}
                    onChange={(e) =>
                      setEditingStaffAccount({
                        ...editingStaffAccount,
                        role: e.target.value as RoleTier,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#C8102E]"
                  >
                    <option value="staff">Staff (Team Member)</option>
                    <option value="cashier">Cashier</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="storekeeper">Storekeeper</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                    Job Title / Designation
                  </label>
                  <input
                    type="text"
                    value={editingStaffAccount.title}
                    onChange={(e) =>
                      setEditingStaffAccount({
                        ...editingStaffAccount,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Senior Cashier"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                    Security PIN (4-6 Digits) *
                  </label>
                  <input
                    type="password"
                    name="chikarro_edit_staff_pin"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    maxLength={6}
                    required
                    value={editingStaffAccount.pin}
                    onChange={(e) =>
                      setEditingStaffAccount({
                        ...editingStaffAccount,
                        pin: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold text-[#C8102E] focus:outline-none focus:border-[#C8102E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                    Max Discount without Override (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingStaffAccount.maxDiscountPct}
                    onChange={(e) =>
                      setEditingStaffAccount({
                        ...editingStaffAccount,
                        maxDiscountPct: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingStaffAccount.canVoidBills}
                    onChange={(e) =>
                      setEditingStaffAccount({
                        ...editingStaffAccount,
                        canVoidBills: e.target.checked,
                      })
                    }
                    className="rounded text-[#C8102E] focus:ring-[#C8102E]"
                  />
                  <span>Permission to Void Bills directly (No PIN override required)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingStaffAccount.canManageCombos}
                    onChange={(e) =>
                      setEditingStaffAccount({
                        ...editingStaffAccount,
                        canManageCombos: e.target.checked,
                      })
                    }
                    className="rounded text-[#C8102E] focus:ring-[#C8102E]"
                  />
                  <span>Permission to edit Menu &amp; Combo Recipes</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaffAccount(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-mono text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-mono text-xs font-bold shadow-xs transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FAST & SLOW MOVING ITEM VELOCITY ANALYTICS (ADMIN PANEL)
         ========================================================================= */}
      {showMovementAnalyticsModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#E8E1D5] shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-display font-black text-lg text-[#1E293B] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#C8102E]" />
                  <span>Item Sales Movement &amp; Velocity Matrix</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Real-time sales velocity breakdown • Salmiya Flagship
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMovementAnalyticsModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fast vs Slow Tab Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5]">
              <button
                type="button"
                onClick={() => setMovementAnalyticsTab('fast')}
                className={`py-2 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  movementAnalyticsTab === 'fast'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E293B]'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Fast-Moving Bestsellers ({itemVelocityStats.fast.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMovementAnalyticsTab('slow')}
                className={`py-2 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  movementAnalyticsTab === 'slow'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1E293B]'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>Slow-Moving / Upsell Targets ({itemVelocityStats.slow.length})</span>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(movementAnalyticsTab === 'fast'
                ? itemVelocityStats.fast
                : itemVelocityStats.slow
              ).map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-between gap-3 hover:bg-stone-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-950 font-mono text-xs font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-2xl">{item.visualEmoji}</span>
                    <div>
                      <div className="font-bold text-xs md:text-sm text-[#1E293B]">
                        {item.name}
                      </div>
                      <div className="text-[11px] font-mono text-stone-500">
                        {item.nameAr} • {formatKWD(item.priceKwd)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-sm font-black text-[#C8102E]">
                      {item.unitsSold} units sold
                    </div>
                    <div className="text-xs text-stone-600">
                      Revenue: {formatKWD(item.revenueKwd)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===========================================================================
          SALES AUDIT VOID BILL & REFUND RECEIPT MODAL
         =========================================================================== */}
      {orderToVoid && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E8E1D5] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="p-4 sm:p-5 bg-[#C8102E] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <Ban className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base tracking-wide uppercase">
                    Void Bill #{orderToVoid.invoiceNo}
                  </h3>
                  <p className="text-xs font-mono text-rose-100">
                    Deducts from Gross Sales &amp; Auto-Prints 80mm Cancellation Receipt
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderToVoid(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-mono">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-bold">Bill / Invoice:</span>
                  <strong className="text-stone-900">{orderToVoid.invoiceNo} (Token #{orderToVoid.tokenNo})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-bold">Total Amount to Refund:</span>
                  <strong className="text-base text-[#C8102E] font-black">{formatKWD(orderToVoid.grandTotalKwd)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-bold">Order Channel &amp; Payment:</span>
                  <span className="text-stone-800 font-bold">
                    {CHANNEL_META[orderToVoid.channel]?.label || orderToVoid.channel} • {PAYMENT_METHOD_LABELS[orderToVoid.paymentMethod] || orderToVoid.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-bold">Billed At:</span>
                  <span className="text-stone-700">{formatDateTimeKW(orderToVoid.createdAt)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                  1. Reason for Voiding
                </label>
                <select
                  value={voidAuditReason}
                  onChange={(e) => setVoidAuditReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#C8102E]"
                >
                  <option value="Customer Changed Mind / Left">Customer Changed Mind / Left</option>
                  <option value="Cashier Input Mistake / Wrong Items">Cashier Input Mistake / Wrong Items</option>
                  <option value="Order Double-Billed">Order Double-Billed</option>
                  <option value="Food Quality / Customer Dispute">Food Quality / Customer Dispute</option>
                  <option value="Test / Practice Transaction Void">Test / Practice Transaction Void</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                  2. Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  value={voidAuditNotes}
                  onChange={(e) => setVoidAuditNotes(e.target.value)}
                  placeholder="e.g. Refunded cash at counter..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700 uppercase">
                    3. Supervisor / Admin PIN Authorization
                  </label>
                </div>
                <input
                  type="password"
                  name="chikarro_admin_void_pin_no_autofill"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  maxLength={6}
                  value={voidAuditSupervisorPin}
                  onChange={(e) => {
                    setVoidAuditSupervisorPin(e.target.value);
                    setVoidAuditError(null);
                  }}
                  placeholder="Enter Manager or Admin PIN..."
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border-2 border-stone-300 text-center font-extrabold text-sm font-mono tracking-widest text-stone-900 focus:bg-white focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {voidAuditError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#C8102E]" />
                  <span>{voidAuditError}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Accounting &amp; Thermal Printer Action:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Daily Gross Sales will be reduced by <strong>-{formatKWD(orderToVoid.grandTotalKwd)}</strong>.</li>
                  <li>Order status updated to <code>voided</code> in Supabase cloud database.</li>
                  <li>An 80mm Cancellation Receipt with <strong>*** VOIDED / CANCELLED BILL ***</strong> will be spooled immediately.</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderToVoid(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancel / Keep Bill
                </button>
                <button
                  type="button"
                  disabled={isVoidingOrder || !voidAuditSupervisorPin.trim()}
                  onClick={() => {
                    if (!orderToVoid) return;
                    const authorizedMgr = verifyManagerPin(voidAuditSupervisorPin);
                    if (!authorizedMgr) {
                      setVoidAuditError('Invalid Manager or Admin PIN .');
                      return;
                    }
                    setIsVoidingOrder(true);
                    try {
                      const fullReason = voidAuditNotes.trim()
                        ? `${voidAuditReason} - ${voidAuditNotes.trim()}`
                        : voidAuditReason;
                      const ok = voidSettledOrder(orderToVoid.invoiceNo, fullReason, authorizedMgr.name);
                      if (ok) {
                        setOrderToVoid(null);
                      }
                    } finally {
                      setIsVoidingOrder(false);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>{isVoidingOrder ? 'Processing Void...' : 'Authorize Void & Print'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
