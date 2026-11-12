import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  BRAND_NAME,
  BRAND_NAME_AR,
  CURRENCY,
  DEFAULT_FOOTER_MESSAGE,
  SHORT_NAME,
  STORAGE_NAMESPACE,
} from '../config/brandConfig';
import {
  DRINK_SELECTION_OPTIONS,
  SEED_BRANCHES,
  SEED_CATEGORIES,
  SEED_COMBO_OFFERS,
  SEED_DINE_IN_TABLES,
  SEED_MENU_ITEMS,
  SEED_SHOP_EXPENSES,
  SEED_STAFF_ACCOUNTS,
  SIDE_UPGRADE_OPTIONS,
} from '../data/seedData';
import {
  ActiveModule,
  AppLanguage,
  CartItemCustomization,
  CartLineItem,
  Category,
  ComboOffer,
  DeliveryRider,
  DineInTable,
  HeldOrder,
  IncomingWebOrder,
  InventoryLogEntry,
  LowStockAlertItem,
  MenuItem,
  OrderChannel,
  PaymentMethod,
  PosOrderRecord,
  RawIngredient,
  ReceiptStoreConfig,
  RoleTier,
  ShopExpense,
  StaffAccount,
  StaffCreditRecord,
  TenantBranch,
  WebDispatchStatus,
  CloudSyncStatus,
  StaffDirectoryState,
  ClosedShiftReport,
  CustomerRecord,
  PromoCode,
  ShiftSession,
  ShiftSummary,
} from '../types/pos';
import {
  buildPrintJobs,
  checkPrinterStatus,
  isDirectPrintAvailable,
  PrinterStatus,
  sendDirectPrint,
} from '../lib/printService';
import {
  fetchCustomersFromSupabase,
  fetchPromoCodesFromSupabase,
  incrementPromoUseInSupabase,
  newUuid,
  recordCustomerOrderInSupabase,
  savePosOrderToSupabase,
  savePromoCodeToSupabase,
  saveShiftReportToSupabase,
} from '../lib/supabaseSaas';
import { isCancelledOrder } from '../utils/orderStatus';
import { CHANNEL_META, getComboComponents, isComboLine, playTerminalSound, roundKWD } from '../utils/formatters';
import {
  fetchAllOrdersFromSupabase,
  fetchCategoriesFromSupabase,
  fetchDeliveryRidersFromSupabase,
  fetchMenuItemsFromSupabase,
  fetchRawIngredientsFromSupabase,
  fetchRecipeBomFromSupabase,
  fetchStaffUsersFromSupabase,
  fetchBranchesFromSupabase,
  fetchStoreSettingsFromSupabase,
  isSupabaseConfigured,
  mapDbItemToComboOffer,
  OFFICIAL_CHIKARRO_CATEGORIES,
  subscribeToAllOrdersRealtime,
  subscribeToIncomingWebOrders,
  subscribeToSupabaseCatalog,
  supabase,
  updateOrderStatusInSupabase,
} from '../lib/supabase';

interface OverrideRequestConfig {
  title: string;
  reasonPrompt: string;
  onAuthorized: (manager: StaffAccount, reason: string) => void;
}

interface PosContextValue {
  // Multi-Tenant & Branch
  multiBranchMode: boolean;
  setMultiBranchMode: (enabled: boolean) => void;
  branches: TenantBranch[];
  activeBranch: TenantBranch;
  setActiveBranchId: (id: string) => void;
  updateBranchCommissions: (branchId: string, commissions: TenantBranch['commissions']) => void;

  // Auth & Role
  staffAccounts: StaffAccount[];
  staffDirectory: StaffDirectoryState;
  currentUser: StaffAccount | null;
  loginWithPin: (roleTab: RoleTier, pin: string) => { ok: boolean; error?: string };
  loginWithPassword: (roleTab: RoleTier, password: string) => { ok: boolean; error?: string };
  loginWithCredentials: (
    usernameOrCode: string,
    passwordOrPin: string
  ) => { ok: boolean; error?: string; user?: StaffAccount };
  logout: () => void;
  addOrUpdateStaffAccount: (account: StaffAccount) => void;
  createInitialAdmin: (input: { name: string; pin: string; password: string }) => { ok: boolean; error?: string };

  // Navigation & HUD
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  shiftStartTime: string;
  activeShift: ShiftSession | null;
  closedShifts: ClosedShiftReport[];
  shiftSummary: ShiftSummary | null;
  openShift: (openingCashKwd: number) => boolean;
  closeShift: (actualCashKwd: number, notes?: string) => ClosedShiftReport | null;
  promoCodes: PromoCode[];
  appliedPromo: PromoCode | null;
  applyPromoCode: (code: string) => { ok: boolean; message: string };
  removePromo: () => void;
  createPromoCode: (
    input: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'> & { id?: string }
  ) => Promise<boolean>;
  customers: CustomerRecord[];
  lookupCustomerByPhone: (phone: string) => CustomerRecord | undefined;
  openingFloatKwd: number;
  setOpeningFloatKwd: (val: number) => void;

  // Catalog & Combos
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (catId: string, updates: Partial<Category>) => void;
  deleteCategory: (catId: string) => void;
  reorderCategories: (newOrderedList: Category[]) => void;
  menuItems: MenuItem[];
  comboOffers: ComboOffer[];
  saveComboOffer: (combo: ComboOffer) => void;
  toggleComboAvailability: (comboId: string) => void;
  deleteComboOffer: (comboId: string) => void;
  saveMenuItem: (item: MenuItem) => void;
  updateMenuItemPrice: (itemId: string, newPriceKwd: number) => void;
  toggleMenuItemAvailability: (itemId: string) => void;

  // POS Cart & Billing
  cartChannel: OrderChannel;
  setCartChannel: (ch: OrderChannel) => void;
  selectedTableNo: string;
  setSelectedTableNo: (tableNo: string) => void;
  dineInTables: DineInTable[];
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (v: string) => void;
  cartLines: CartLineItem[];
  discountPct: number;
  discountReason: string;
  discountOverrideManager: string | undefined;
  isFlatDiscount: boolean;
  discountAmountKwd: number;
  addItemToCart: (item: MenuItem, customization?: CartItemCustomization, qty?: number) => void;
  addComboToCart: (combo: ComboOffer, customization?: CartItemCustomization, qty?: number) => void;
  updateCartLineQty: (lineId: string, delta: number) => void;
  removeCartLine: (lineId: string) => void;
  clearCart: () => void;
  applyCartDiscount: (
    pctOrAmount: number,
    reason: string,
    isFlat?: boolean,
    managerName?: string
  ) => void;

  // Cart Totals
  cartSubtotalKwd: number;
  cartDiscountKwd: number;
  cartDeliveryFeeKwd: number;
  cartGrandTotalKwd: number;
  cartTotalFoodCostKwd: number;

  // Hold / Recall
  heldOrders: HeldOrder[];
  holdCurrentCart: () => boolean;
  recallHeldOrder: (holdId: string) => void;
  deleteHeldOrder: (holdId: string) => void;

  // Checkout & Orders
  posOrders: PosOrderRecord[];
  activeKotOrders: PosOrderRecord[];
  activeKitchenOrderId: string | null;
  loadKitchenOrderToCart: (orderId: string) => void;
  settleKitchenOrderDirectly: (
    orderId: string,
    paymentMethod: PaymentMethod,
    cashTenderedKwd?: number,
    knetTenderedKwd?: number
  ) => PosOrderRecord | null;
  unbindKitchenOrder: () => void;
  sendCartToKitchen: () => PosOrderRecord | null;
  cancelKitchenOrder: (orderId: string, reason?: string) => Promise<boolean>;
  completeCheckout: (params: {
    paymentMethod: PaymentMethod;
    cashTenderedKwd: number;
    knetTenderedKwd: number;
  }) => PosOrderRecord | null;
  voidSettledOrder: (orderId: string, reason: string, managerName: string) => boolean;
  updatePosOrderStatus: (orderId: string, status: PosOrderRecord['status']) => void;
  autoPrintKotWithBill: boolean;
  setAutoPrintKotWithBill: (v: boolean) => void;

  // Manager Override Modal
  overrideModalConfig: OverrideRequestConfig | null;
  requestManagerOverride: (config: OverrideRequestConfig) => void;
  closeManagerOverride: () => void;
  verifyManagerPin: (pin: string) => StaffAccount | null;

  // Print Engine Modal
  activePrintOrder: PosOrderRecord | null;
  printModalInitialTab: 'INVOICE' | 'KOT' | 'BOTH';
  openPrintModal: (order: PosOrderRecord, tab?: 'INVOICE' | 'KOT' | 'BOTH') => void;
  closePrintModal: () => void;

  // Website Orders & Dispatch Hub
  webOrders: IncomingWebOrder[];
  deliveryRiders: DeliveryRider[];
  pendingWebOrdersCount: number;
  dailyGrossSalesKwd: number;
  pendingWebOrders: IncomingWebOrder[];
  acceptAndAutoBillWebOrder: (webOrderId: string, riderId?: string) => PosOrderRecord | null;
  acceptWebOrderFromBanner: (webOrderId: string) => PosOrderRecord | null;
  updateWebOrderStatus: (webOrderId: string, status: WebDispatchStatus) => void;
  assignRiderToWebOrder: (webOrderId: string, riderId: string) => void;

  // Silent Incoming Web Order Visual Pop-up Alert
  activeWebOrderAlert: IncomingWebOrder | null;
  dismissWebOrderAlert: () => void;
  selectWebOrderAlert: (order: IncomingWebOrder) => void;

  // Universal Raw Inventory (BOM) & Direct Stock Tracking
  rawIngredients: RawIngredient[];
  inventoryLogs: InventoryLogEntry[];
  lowStockIngredients: RawIngredient[];
  allLowStockItems: LowStockAlertItem[];
  toggleItemStockTracking: (
    itemId: string,
    enabled: boolean,
    initialStock?: number,
    threshold?: number
  ) => void;
  updateItemStockQuantity: (itemId: string, newStock: number) => void;
  updateItemStockThreshold: (itemId: string, newThreshold: number) => void;
  restockIngredient: (ingredientId: string, addedQty: number, notes?: string) => void;
  shopExpenses: ShopExpense[];
  addShopExpense: (expense: Omit<ShopExpense, 'id' | 'branchId' | 'createdAt' | 'recordedBy'>) => void;

  // Toast Notification
  toastMessage: { text: string; type: 'success' | 'warning' | 'info' } | null;
  showToast: (text: string, type?: 'success' | 'warning' | 'info') => void;

  // Admin Receipt & Store Details Configuration
  receiptConfig: ReceiptStoreConfig;
  updateReceiptConfig: (newConfig: Partial<ReceiptStoreConfig>) => void;

  // Staff Purchase & Credit Ledger
  activeStaffPurchaseRecipient: StaffAccount | null;
  setActiveStaffPurchaseRecipient: (staff: StaffAccount | null) => void;
  staffCreditRecords: StaffCreditRecord[];
  settleStaffCreditRecord: (recordId: string, settledBy: string, notes?: string) => void;

  // Direct Silent Thermal Printing (Zero-Modal Instant 80mm Spooler)
  directPrintDoc: { order: PosOrderRecord; docType: 'KOT' | 'INVOICE' | 'BOTH' } | null;
  triggerDirectPrint: (order: PosOrderRecord, docType: 'KOT' | 'INVOICE' | 'BOTH') => void;
  printerStatus: PrinterStatus;
  clearDirectPrintDoc: () => void;

  // Supabase Cloud Menu Sync & Real-Time Telemetry
  isCloudSyncing: boolean;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncError: string | null;
  lastCloudSyncAt: string | null;
  refetchCloudCatalog: () => Promise<void>;

  // Reset
  resetSystemToFactorySeed: () => void;
}

const STORAGE_KEY = STORAGE_NAMESPACE;

export const DEFAULT_RECEIPT_CONFIG: ReceiptStoreConfig = {
  storeTitle: BRAND_NAME,
  subtitleAr: BRAND_NAME_AR,
  addressLine1: 'Block 10, Salem Al-Mubarak St, Building 24',
  addressLine2: 'Ground Floor, Salmiya, Kuwait',
  phone: '+965 2224 8910',
  websiteDomain: 'chikarrasalmiya.com',
  footerMessage: DEFAULT_FOOTER_MESSAGE,
};

export const SEED_STAFF_CREDIT_RECORDS: StaffCreditRecord[] = [];

const LEGACY_DEMO_BRANCH_IDS = ['branch-salmiya-01', 'branch-hawally-02', 'branch-mahboula-03'];
const LEGACY_DEMO_STAFF_IDS = ['usr-staff-01', 'usr-mgr-01', 'usr-adm-01'];
const LEGACY_DEMO_COMBO_IDS = [
  'CMB-S395',
  'CMB-F595',
  'CMB-P790',
  'CMB-SF95',
  'CMB-B325',
  'CMB-V525',
  'CMB-MIX4',
];

// Purge legacy cached orders/riders/ingredients (incl. old prototype mock orders) so only
// live Supabase data is ever shown.
['posOrders', 'webOrders', 'deliveryRiders', 'rawIngredients'].forEach((k) => {
  try {
    localStorage.removeItem(`${STORAGE_KEY}_${k}`);
  } catch {}
});

const PosContext = createContext<PosContextValue | undefined>(undefined);

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load persisted or seed state
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  const [branches, setBranches] = useState<TenantBranch[]>(() => {
    const saved = loadState<TenantBranch[]>('branches', SEED_BRANCHES);
    const cleaned = saved.filter((b) => !LEGACY_DEMO_BRANCH_IDS.includes(b.id));
    return cleaned.length > 0 ? cleaned : SEED_BRANCHES;
  });
  const [activeBranchId, setActiveBranchId] = useState<string>(() =>
    loadState('activeBranchId', SEED_BRANCHES[0].id)
  );
  const [multiBranchMode, setMultiBranchModeState] = useState<boolean>(() =>
    loadState('multiBranchMode', false)
  );

  const setMultiBranchMode = (enabled: boolean) => {
    setMultiBranchModeState(enabled);
    try {
      localStorage.setItem(`${STORAGE_KEY}_multiBranchMode`, JSON.stringify(enabled));
    } catch {
      // ignore
    }
    showToast(
      enabled
        ? 'Multi-Branch / Multi-Tenant Mode Activated'
        : `Single Branch Mode Activated (${SHORT_NAME})`,
      'info'
    );
  };
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() =>
    loadState<StaffAccount[]>('staffAccounts', SEED_STAFF_ACCOUNTS).filter(
      (a) => !LEGACY_DEMO_STAFF_IDS.includes(a.id)
    )
  );
  const [currentUser, setCurrentUser] = useState<StaffAccount | null>(() =>
    loadState('currentUser', null)
  );
  const [language, setLanguageState] = useState<AppLanguage>(() =>
    loadState('language', 'en')
  );

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(`${STORAGE_KEY}_language`, JSON.stringify(lang));
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };
  const [activeModule, setActiveModuleState] = useState<ActiveModule>('pos');
  const [openingFloatKwd, setOpeningFloatKwd] = useState<number>(() =>
    loadState('openingFloatKwd', 0.000)
  );

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = loadState<Category[]>('categories', SEED_CATEGORIES);
    // If saved still has legacy mock categories (e.g. deals, individual, buckets), reset to official SEED_CATEGORIES
    if (
      !saved ||
      saved.length === 0 ||
      saved.some(
        (c) =>
          c.id === 'deals' ||
          c.slug === 'deals' ||
          c.id === 'individual' ||
          c.slug === 'individual' ||
          c.slug === 'buckets' ||
          c.id === 'cat-combos'
      )
    ) {
      return SEED_CATEGORIES;
    }
    return saved;
  });
  // Menu & combos are sourced strictly from Supabase / the Combo Studio (no cached demo catalog)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [comboOffers, setComboOffers] = useState<ComboOffer[]>(() =>
    loadState<ComboOffer[]>('comboOffers', SEED_COMBO_OFFERS).filter(
      (c) => !LEGACY_DEMO_COMBO_IDS.includes(c.id) && c.comboPriceKwd > 0
    )
  );

  // POS Cart State
  const [cartChannel, setCartChannelState] = useState<OrderChannel>('dine_in');
  const [selectedTableNo, setSelectedTableNo] = useState<string>('T-01');
  const [dineInTables, setDineInTables] = useState<DineInTable[]>(() =>
    loadState('dineInTables', SEED_DINE_IN_TABLES)
  );
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [cartLines, setCartLines] = useState<CartLineItem[]>([]);
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [isFlatDiscount, setIsFlatDiscount] = useState<boolean>(false);
  const [discountAmountKwd, setDiscountAmountKwd] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [discountOverrideManager, setDiscountOverrideManager] = useState<string | undefined>(
    undefined
  );
  const [autoPrintKotWithBill, setAutoPrintKotWithBill] = useState<boolean>(true);
  const [activeKitchenOrderId, setActiveKitchenOrderId] = useState<string | null>(null);

  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() =>
    loadState('heldOrders', [])
  );
  const [posOrders, setPosOrders] = useState<PosOrderRecord[]>(() =>
    loadState<PosOrderRecord[]>('localPosOrders', [])
  ); // Supabase is the source of truth; only bills not yet synced are kept locally

  // Active Kitchen Order Tickets (KOT Queue: cooking/kitchen tickets that are active)
  const activeKotOrders = useMemo(() => {
    return posOrders.filter(
      (o) =>
        (o.status === 'cooking' || (o.orderStage === 'kitchen' && o.status !== 'completed')) &&
        o.status !== 'voided' &&
        o.status !== 'cancelled'
    );
  }, [posOrders]);

  // Override & Print Modals
  const [overrideModalConfig, setOverrideModalConfig] = useState<OverrideRequestConfig | null>(
    null
  );
  const [activePrintOrder, setActivePrintOrder] = useState<PosOrderRecord | null>(null);
  const [printModalInitialTab, setPrintModalInitialTab] = useState<'INVOICE' | 'KOT' | 'BOTH'>(
    'BOTH'
  );

  // Web Orders & Dispatch
  const [webOrders, setWebOrders] = useState<IncomingWebOrder[]>([]); // Live Supabase data only
  const [deliveryRiders, setDeliveryRiders] = useState<DeliveryRider[]>([]);
  const [activeWebOrderAlert, setActiveWebOrderAlert] = useState<IncomingWebOrder | null>(null);
  const [dismissedWebOrderAlertIds, setDismissedWebOrderAlertIds] = useState<Set<string>>(
    () => new Set<string>()
  );

  // ERP Inventory & Expenses
  const [rawIngredients, setRawIngredients] = useState<RawIngredient[]>(() =>
    [] // Sourced strictly from Supabase (no local mock/cached inventory)
  );
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLogEntry[]>(() =>
    loadState('inventoryLogs', [])
  );
  const [shopExpenses, setShopExpenses] = useState<ShopExpense[]>(() =>
    loadState('shopExpenses', SEED_SHOP_EXPENSES)
  );

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3800);
  };

  // Receipt Configuration & Store Details
  const [receiptConfig, setReceiptConfig] = useState<ReceiptStoreConfig>(() =>
    loadState('receiptConfig', DEFAULT_RECEIPT_CONFIG)
  );

  const updateReceiptConfig = (newConfig: Partial<ReceiptStoreConfig>) => {
    setReceiptConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      try {
        localStorage.setItem(`${STORAGE_KEY}_receiptConfig`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    playTerminalSound('tap');
    showToast('Receipt & Store details saved successfully!', 'success');
  };

  // Staff Purchase & Credit Ledger
  const [activeStaffPurchaseRecipient, setActiveStaffPurchaseRecipient] =
    useState<StaffAccount | null>(null);
  const [staffCreditRecords, setStaffCreditRecords] = useState<StaffCreditRecord[]>(() =>
    loadState('staffCreditRecords', SEED_STAFF_CREDIT_RECORDS)
  );

  const settleStaffCreditRecord = (
    recordId: string,
    settledBy: string,
    notes = 'Deducted from Monthly Salary / Settled'
  ) => {
    setStaffCreditRecords((prev) =>
      prev.map((rec) =>
        rec.id === recordId
          ? {
              ...rec,
              status: 'settled',
              settledAt: new Date().toISOString(),
              settledBy,
              settleNotes: notes,
            }
          : rec
      )
    );
    playTerminalSound('paid');
    showToast(`Staff Credit Record marked settled (${settledBy})`, 'success');
  };

  // Direct Silent Thermal Printing (Zero-Modal Instant 80mm Spooler)
  const [directPrintDoc, setDirectPrintDoc] = useState<{
    order: PosOrderRecord;
    docType: 'KOT' | 'INVOICE' | 'BOTH';
  } | null>(null);

  const triggerDirectPrint = (
    order: PosOrderRecord,
    docType: 'KOT' | 'INVOICE' | 'BOTH'
  ) => {
    // Direct 80mm printing: local print bridge first (no dialog); otherwise the browser path,
    // which is fully silent when the terminal browser runs with --kiosk-printing.
    const browserPrint = () => {
      setDirectPrintDoc({ order, docType });
      setTimeout(() => {
        window.print();
      }, 60);
    };
    if (!isDirectPrintAvailable()) {
      browserPrint();
      return;
    }
    sendDirectPrint(buildPrintJobs(order, docType, receiptConfig)).then((ok) => {
      if (ok) {
        setPrinterStatus('connected');
      } else {
        setPrinterStatus('disconnected');
        showToast('Direct printer unreachable — used browser print fallback', 'warning');
        browserPrint();
      }
    });
  };

  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>('checking');
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      const st = await checkPrinterStatus();
      if (alive) setPrinterStatus(st);
    };
    poll();
    const t = setInterval(poll, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const clearDirectPrintDoc = () => {
    setDirectPrintDoc(null);
  };

  // Supabase Cloud Menu Sync & Real-Time Telemetry
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('syncing');
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | null>(() =>
    loadState('lastCloudSyncAt', null)
  );

  const [staffDirectory, setStaffDirectory] = useState<StaffDirectoryState>({ status: 'idle' });

  const refetchCloudCatalog = async () => {
    setIsCloudSyncing(true);
    setCloudSyncError(null);

    try {
      // Query categories, menu_items, store_settings, delivery_riders, and ALL orders in parallel
      const [
        catResult,
        itemResult,
        settingsResult,
        ridersResult,
        ordersResult,
        ingredientsResult,
        bomResult,
        staffResult,
        branchResult,
      ] = await Promise.all([
        fetchCategoriesFromSupabase(),
        fetchMenuItemsFromSupabase(),
        fetchStoreSettingsFromSupabase(),
        fetchDeliveryRidersFromSupabase(),
        fetchAllOrdersFromSupabase(),
        fetchRawIngredientsFromSupabase(),
        fetchRecipeBomFromSupabase(),
        fetchStaffUsersFromSupabase(),
        fetchBranchesFromSupabase(),
      ]);

      const { data: cloudCats, error: catErr } = catResult;
      const { data: cloudItems, error: itemErr } = itemResult;
      const { data: cloudSettings } = settingsResult;
      const { data: cloudRiders } = ridersResult;
      const { data: cloudOrders } = ordersResult;
      const { data: cloudIngredients } = ingredientsResult;
      const { data: cloudBom } = bomResult;
      const { data: cloudStaff, error: staffErr } = staffResult;
      if (staffErr) {
        setStaffDirectory({ status: staffErr.kind, message: staffErr.message });
      } else {
        setStaffDirectory({ status: 'ok' });
      }
      const { data: cloudBranches } = branchResult;

      if (catErr) {
        console.warn('[POS] Categories fetch warning:', catErr.message);
      }
      if (itemErr) {
        console.warn('[POS] Menu items fetch warning:', itemErr.message);
      }

      // If both core queries failed with network/API errors, throw to trigger offline fallback
      if (catErr && itemErr) {
        throw itemErr;
      }

      let hasCloudData = false;

      // 1. Process official categories from Supabase (ordered by display_order ASC)
      if (cloudCats && cloudCats.length > 0) {
        setCategories(cloudCats);
        hasCloudData = true;
        try {
          localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(cloudCats));
        } catch {}
      }

      // 2. Process official menu_items from Supabase
      if (cloudItems && cloudItems.length > 0) {
        // Recipe BOM lines come strictly from Supabase (recipe_bom_items)
        if (cloudBom) {
          cloudItems.forEach((item) => {
            item.bom = cloudBom[item.id] || [];
          });
        }
        setMenuItems(cloudItems);
        hasCloudData = true;
        try {
          localStorage.setItem(`${STORAGE_KEY}_menuItems`, JSON.stringify(cloudItems));
        } catch {}
      }

      // 2b. Raw ingredient stock ledger strictly from Supabase (empty array if none)
      if (cloudIngredients) {
        setRawIngredients(cloudIngredients);
      }

      // 2c. Staff accounts & branches strictly from Supabase
      if (cloudStaff && cloudStaff.length > 0) {
        setStaffAccounts((prev) => {
          const cloudIds = new Set(cloudStaff.map((a) => a.id));
          return [...prev.filter((a) => !cloudIds.has(a.id)), ...cloudStaff];
        });
      }
      if (cloudBranches && cloudBranches.length > 0) {
        setBranches(cloudBranches);
        setActiveBranchId((cur) =>
          cloudBranches.some((b) => b.id === cur) ? cur : cloudBranches[0].id
        );
      }

      // 3. Process live delivery fleet riders from Supabase if present
      if (cloudRiders && cloudRiders.length > 0) {
        setDeliveryRiders(cloudRiders);
        try {
          localStorage.setItem(`${STORAGE_KEY}_deliveryRiders`, JSON.stringify(cloudRiders));
        } catch {}
      }

      // 4. Process store_settings from Supabase if present
      if (cloudSettings && Object.keys(cloudSettings).length > 0) {
        setReceiptConfig((prev) => ({ ...prev, ...cloudSettings }));
        hasCloudData = true;
      }

      // 5. Process ALL orders (Web, Counter, Keeta) from Supabase without restrictive filters
      if (cloudOrders && cloudOrders.length > 0) {
        setPosOrders((prev) => {
          const cloudKeys = new Set(
            cloudOrders.map((o) => `${o.id}_${o.invoiceNo}`)
          );
          const localOnly = prev.filter(
            (o) => !cloudKeys.has(`${o.id}_${o.invoiceNo}`)
          );
          const merged = [...localOnly, ...cloudOrders];
          merged.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          return merged;
        });

        // Also ensure web orders are mapped into webOrders queue
        const cloudWebOrders: IncomingWebOrder[] = cloudOrders
          .filter((o) => o.channel === 'chikarro_web' || o.source === 'WEB' || o.webOrderRef)
          .map((o) => ({
            id: o.id,
            branchId: o.branchId,
            webOrderNo: o.webOrderRef || o.invoiceNo,
            receivedAt: o.createdAt,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            area: 'Salmiya',
            blockNo: '',
            streetNo: '',
            buildingNo: '',
            floorApt: '',
            landmarkNotes: o.deliveryAddress,
            paymentMode: o.paymentMethod === 'cash' ? 'Cash on Delivery' : 'K-Net Online',
            isPaid: o.status === 'completed' || o.paymentMethod !== 'cash',
            subtotalKwd: o.subtotalKwd,
            deliveryFeeKwd: o.deliveryFeeKwd,
            totalKwd: o.grandTotalKwd,
            status: (o.externalStatus as any) || (o.status === 'completed' ? 'Delivered' : 'Pending'),
            items: o.items.map((it) => ({
              refId: it.refId,
              type: it.type,
              titleEn: it.titleEn,
              titleAr: it.titleAr,
              quantity: it.quantity,
              unitPriceKwd: it.unitPriceKwd,
              prepStyle: 'Spicy',
              comboSubItems: it.comboSubItems,
            })),
          }));

        if (cloudWebOrders.length > 0) {
          setWebOrders((prev) => {
            const seen = new Set(prev.map((w) => `${w.id}_${w.webOrderNo}`));
            const fresh = cloudWebOrders.filter((w) => !seen.has(`${w.id}_${w.webOrderNo}`));
            return [...prev, ...fresh];
          });
        }
      }

      // Orders confirmed by Supabase must not be re-saved or re-counted (CRM / promo)
      (cloudOrders || []).forEach((o) => {
        orderSigRef.current.set(
          o.id,
          `${o.status}|${o.paymentMethod}|${o.grandTotalKwd}|${o.orderStage ?? ''}`
        );
        syncedOrderIdsRef.current.add(o.id);
        countedOrderIdsRef.current.add(o.id);
      });
      refreshPromoCodes();
      refreshCustomers();

      const syncTime = new Date().toISOString();
      setLastCloudSyncAt(syncTime);
      try {
        localStorage.setItem(`${STORAGE_KEY}_lastCloudSyncAt`, JSON.stringify(syncTime));
      } catch {}

      if (hasCloudData) {
        setCloudSyncStatus('synced');
      } else {
        console.warn(
          '[POS] Supabase reachable (HTTP 200), but 0 rows returned from `menu_items`. Verify RLS SELECT policy on `public.menu_items` in Supabase Dashboard. Using safe local catalog fallback.'
        );
        setCloudSyncStatus('offline_fallback');
      }
    } catch (err: any) {
      console.error(
        '[POS] Supabase cloud fetch failed — falling back to offline mode:',
        err
      );
      setCloudSyncError(err?.message || 'Failed to sync with Supabase cloud database');
      setStaffDirectory((prev) =>
        prev.status === 'ok' || prev.status === 'table_missing'
          ? prev
          : { status: 'error', message: err?.message || 'Cannot reach Supabase' }
      );
      setCloudSyncStatus('offline_fallback');
      showToast('Operating with offline local menu catalog (Safe fallback)', 'warning');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Real-Time Supabase Subscription and Initial Fetch on Mount (Purging legacy cache versions)
  useEffect(() => {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (
          k.startsWith('JEZTBRAIN_CHIKARRO_POS_ERP_STATE_V1') ||
          k.startsWith('JEZTBRAIN_CHIKARRO_POS_ERP_STATE_V2')
        ) {
          localStorage.removeItem(k);
        }
      });
    } catch {
      // ignore
    }

    refetchCloudCatalog();

    const unsubscribeCatalog = subscribeToSupabaseCatalog(() => {
      refetchCloudCatalog();
    });

    const unsubscribeWebOrders = subscribeToIncomingWebOrders((newOrder) => {
      console.info('[Supabase Realtime] Incoming web order arrived in POS:', newOrder.webOrderNo);
      setWebOrders((prev) => {
        const exists = prev.some(
          (w) => w.id === newOrder.id || w.webOrderNo === newOrder.webOrderNo
        );
        if (exists) {
          return prev.map((w) =>
            w.id === newOrder.id || w.webOrderNo === newOrder.webOrderNo ? newOrder : w
          );
        }
        return [newOrder, ...prev];
      });

      if (newOrder.status === 'Pending') {
        // Silent drop-down notification banner in POS (STRICTLY NO audio alert)
        setActiveWebOrderAlert(newOrder);
      }
    });

    const unsubscribeAllOrders = subscribeToAllOrdersRealtime((incoming) => {
      console.info('[Supabase Realtime] Live order synced into POS state:', incoming.invoiceNo, incoming.status);
      setPosOrders((prev) => {
        const idx = prev.findIndex(
          (o) => o.id === incoming.id || o.invoiceNo === incoming.invoiceNo
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...incoming };
          return updated;
        }
        return [incoming, ...prev];
      });
    });

    return () => {
      unsubscribeCatalog();
      unsubscribeWebOrders();
      unsubscribeAllOrders();
    };
  }, []);

  // Persist key slices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_branches`, JSON.stringify(branches));
      localStorage.setItem(`${STORAGE_KEY}_activeBranchId`, JSON.stringify(activeBranchId));
      localStorage.setItem(`${STORAGE_KEY}_staffAccounts`, JSON.stringify(staffAccounts));
      localStorage.setItem(`${STORAGE_KEY}_currentUser`, JSON.stringify(currentUser));
      localStorage.setItem(`${STORAGE_KEY}_openingFloatKwd`, JSON.stringify(openingFloatKwd));
      localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
      localStorage.setItem(`${STORAGE_KEY}_menuItems`, JSON.stringify(menuItems));
      localStorage.setItem(`${STORAGE_KEY}_comboOffers`, JSON.stringify(comboOffers));
      localStorage.setItem(`${STORAGE_KEY}_heldOrders`, JSON.stringify(heldOrders));
      localStorage.setItem(`${STORAGE_KEY}_rawIngredients`, JSON.stringify(rawIngredients));
      localStorage.setItem(`${STORAGE_KEY}_inventoryLogs`, JSON.stringify(inventoryLogs));
      localStorage.setItem(`${STORAGE_KEY}_shopExpenses`, JSON.stringify(shopExpenses));
      localStorage.setItem(`${STORAGE_KEY}_dineInTables`, JSON.stringify(dineInTables));
      localStorage.setItem(`${STORAGE_KEY}_receiptConfig`, JSON.stringify(receiptConfig));
      localStorage.setItem(`${STORAGE_KEY}_staffCreditRecords`, JSON.stringify(staffCreditRecords));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    branches,
    activeBranchId,
    staffAccounts,
    currentUser,
    openingFloatKwd,
    categories,
    menuItems,
    comboOffers,
    heldOrders,
    posOrders,
    webOrders,
    deliveryRiders,
    rawIngredients,
    inventoryLogs,
    shopExpenses,
    dineInTables,
    receiptConfig,
    staffCreditRecords,
  ]);

  const activeBranch = useMemo(
    () => branches.find((b) => b.id === activeBranchId) || branches[0],
    [branches, activeBranchId]
  );

  // Role-restricted module navigation
  const setActiveModule = (mod: ActiveModule) => {
    if (!currentUser) return;
    if (currentUser.role === 'staff' && (mod === 'catalog' || mod === 'erp')) {
      playTerminalSound('error');
      showToast(
        'Access Restricted: Staff Terminal cannot access Combo Studio or ERP Financials.',
        'warning'
      );
      return;
    }
    playTerminalSound('tap');
    setActiveModuleState(mod);
  };

  // Authentication
  const loginWithPin = (roleTab: RoleTier, pin: string): { ok: boolean; error?: string } => {
    const account = staffAccounts.find((a) => a.role === roleTab && a.pin === pin.trim());
    if (!account) {
      playTerminalSound('error');
      return {
        ok: false,
        error: `Invalid PIN for ${roleTab.toUpperCase()} portal.`,
      };
    }
    playTerminalSound('paid');
    setCurrentUser(account);
    setActiveModuleState('pos');
    showToast(`Authenticated as ${account.name} (${account.role.toUpperCase()})`, 'success');
    return { ok: true };
  };

  const loginWithPassword = (
    roleTab: RoleTier,
    password: string
  ): { ok: boolean; error?: string } => {
    const account = staffAccounts.find(
      (a) => a.role === roleTab && a.password.toLowerCase() === password.trim().toLowerCase()
    );
    if (!account) {
      playTerminalSound('error');
      return {
        ok: false,
        error: `Invalid password for ${roleTab.toUpperCase()} portal.`,
      };
    }
    playTerminalSound('paid');
    setCurrentUser(account);
    setActiveModuleState('pos');
    showToast(`Authenticated as ${account.name} (${account.role.toUpperCase()})`, 'success');
    return { ok: true };
  };

  // Unified Enterprise Authentication & Smart Role-Based Dashboard Routing
  const loginWithCredentials = (
    usernameOrCode: string,
    passwordOrPin: string
  ): { ok: boolean; error?: string; user?: StaffAccount } => {
    const uClean = usernameOrCode.trim().toLowerCase();
    const pClean = passwordOrPin.trim().toLowerCase();

    if (!pClean && !uClean) {
      playTerminalSound('error');
      return { ok: false, error: 'Please enter your username and password or access PIN.' };
    }

    let match: StaffAccount | undefined;

    // 1. If username / staff ID is provided, match by employeeCode, role, or name
    if (uClean) {
      match = staffAccounts.find((a) => {
        const matchesUser =
          a.employeeCode.toLowerCase() === uClean ||
          a.role.toLowerCase() === uClean ||
          a.name.toLowerCase().includes(uClean);

        if (!matchesUser) return false;

        // If password/PIN is also provided, check PIN or password
        if (pClean) {
          return a.pin === pClean || a.password.toLowerCase() === pClean;
        }
        return true;
      });
    }

    // 2. If no match yet and PIN/Password is provided, check if PIN/Password uniquely matches any account
    if (!match && pClean) {
      match = staffAccounts.find((a) => a.pin === pClean || a.password.toLowerCase() === pClean);
    }

    if (!match) {
      playTerminalSound('error');
      return {
        ok: false,
        error: 'Invalid credentials. Please verify your Staff ID / PIN.',
      };
    }

    playTerminalSound('paid');
    setCurrentUser(match);

    // Smart Role Routing:
    // Super Admin -> Admin HQ (/erp)
    // Branch Manager / Supervisor -> Manager Console (/catalog)
    // Staff / Cashier / Storekeeper -> Staff POS (/pos)
    if (match.role === 'admin') {
      setActiveModuleState('erp');
    } else if (match.role === 'manager' || match.role === 'supervisor') {
      setActiveModuleState('catalog');
    } else {
      setActiveModuleState('pos');
    }

    showToast(`Authenticated as ${match.name} (${match.role.toUpperCase()})`, 'success');
    return { ok: true, user: match };
  };

  const logout = () => {
    playTerminalSound('tap');
    setCurrentUser(null);
    setActiveModuleState('pos');
  };

  /** First-run bootstrap: only allowed while NO staff account exists (cloud or local). */
  const createInitialAdmin = ({
    name,
    pin,
    password,
  }: {
    name: string;
    pin: string;
    password: string;
  }): { ok: boolean; error?: string } => {
    if (staffAccounts.length > 0) return { ok: false, error: 'Accounts already exist.' };
    const cleanName = name.trim();
    if (cleanName.length < 2) return { ok: false, error: 'Enter the administrator name.' };
    if (!/^d{4,6}$/.test(pin)) return { ok: false, error: 'PIN must be 4-6 digits.' };
    if (password.length < 4) return { ok: false, error: 'Password must be at least 4 characters.' };
    const admin: StaffAccount = {
      id: newUuid(),
      employeeCode: 'ADM-001',
      name: cleanName,
      title: 'Administrator',
      role: 'admin',
      pin,
      password,
      maxDiscountPct: 100,
      canVoidBills: true,
      canManageCombos: true,
      canViewMargins: true,
      avatarBadge: cleanName
        .split(/s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join(''),
    };
    setStaffAccounts([admin]);
    setCurrentUser(admin);
    setActiveModuleState('pos');
    playTerminalSound('paid');
    return { ok: true };
  };

  const addOrUpdateStaffAccount = (account: StaffAccount) => {
    setStaffAccounts((prev) => {
      const exists = prev.some((s) => s.id === account.id);
      if (exists) {
        return prev.map((s) => (s.id === account.id ? account : s));
      }
      return [...prev, account];
    });
    showToast(`Saved role credentials for ${account.name}`, 'success');
  };

  // Branch Commissions
  const updateBranchCommissions = (
    branchId: string,
    commissions: TenantBranch['commissions']
  ) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, commissions } : b))
    );
    showToast('Updated aggregator commission rates', 'success');
  };

  // Catalog & Combo Offer Studio
  const saveComboOffer = (combo: ComboOffer) => {
    setComboOffers((prev) => {
      const exists = prev.some((c) => c.id === combo.id);
      if (exists) {
        return prev.map((c) => (c.id === combo.id ? combo : c));
      }
      return [combo, ...prev];
    });
    playTerminalSound('paid');
    showToast(
      `Combo "${combo.headingEn}" (${combo.comboPriceKwd.toFixed(3)} ${CURRENCY}) synced live to POS Terminal!`,
      'success'
    );
  };

  const toggleComboAvailability = (comboId: string) => {
    setComboOffers((prev) =>
      prev.map((c) => (c.id === comboId ? { ...c, isAvailable: !c.isAvailable } : c))
    );
    playTerminalSound('tap');
  };

  const deleteComboOffer = (comboId: string) => {
    setComboOffers((prev) => prev.filter((c) => c.id !== comboId));
    showToast('Combo Offer removed from catalog', 'info');
  };

  const saveMenuItem = (item: MenuItem) => {
    setMenuItems((prev) => {
      const exists = prev.some((m) => m.id === item.id);
      if (exists) {
        return prev.map((m) => (m.id === item.id ? item : m));
      }
      return [item, ...prev];
    });
    playTerminalSound('paid');
    showToast(`Saved Menu Item "${item.nameEn}" (${item.priceKwd.toFixed(3)} ${CURRENCY})`, 'success');
  };

  const updateMenuItemPrice = (itemId: string, newPriceKwd: number) => {
    const safePrice = roundKWD(newPriceKwd);
    setMenuItems((prev) =>
      prev.map((m) => (m.id === itemId ? { ...m, priceKwd: safePrice } : m))
    );
    showToast(`Updated item price to ${safePrice.toFixed(3)} ${CURRENCY}`, 'success');
  };

  const toggleMenuItemAvailability = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((m) => (m.id === itemId ? { ...m, isAvailable: !m.isAvailable } : m))
    );
    playTerminalSound('tap');
  };

  // Category Management (Admin / Manager)
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
      sortOrder: categories.length + 1,
      showIcon: cat.showIcon ?? (cat.icon ? true : false),
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`Category "${cat.nameEn}" added`, 'success');
  };

  const updateCategory = (catId: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, ...updates } : c))
    );
    showToast('Category updated', 'success');
  };

  const deleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    showToast('Category deleted', 'info');
  };

  const reorderCategories = (newOrderedList: Category[]) => {
    const updated = newOrderedList.map((c, idx) => ({ ...c, sortOrder: idx + 1 }));
    setCategories(updated);
  };

  // Cart & Customization Logic
  const setCartChannel = (ch: OrderChannel) => {
    playTerminalSound('tap');
    setCartChannelState(ch);
  };

  const addItemToCart = (
    item: MenuItem,
    customization?: CartItemCustomization,
    qty = 1
  ) => {
    playTerminalSound('tap');

    // 1. Detect whether item is a combo (from Supabase category, isCombo flag, or title)
    const isCombo =
      Boolean(item.isCombo) ||
      /(combo|deal|meal|bucket|box|feast|platter|pack)/i.test(item.nameEn) ||
      item.categoryId === '879809c5-bf5b-4aa4-a497-85549906c7a3' ||
      item.categoryId === 'ff643ddf-60db-4c7a-9703-0fc77954bac6' ||
      item.categoryId === 'deals';

    // 2. Modifiers logic:
    // Single items have NO default side/drink modifiers unless explicitly customized via 'Prep'.
    // True combos inherit standard side & drink choices if not customized.
    const effectiveCustom: CartItemCustomization | undefined = customization
      ? customization
      : isCombo
      ? {
          prepStyle: 'Regular',
          sideChoice: SIDE_UPGRADE_OPTIONS[0],
          drinkChoice: DRINK_SELECTION_OPTIONS[0],
          addons: [],
          kitchenNotes: '',
        }
      : undefined;

    const sideDelta =
      effectiveCustom?.sideChoice && effectiveCustom.sideChoice.id !== 'none'
        ? effectiveCustom.sideChoice.priceDeltaKwd
        : 0;
    const drinkDelta =
      effectiveCustom?.drinkChoice && effectiveCustom.drinkChoice.id !== 'none'
        ? effectiveCustom.drinkChoice.priceDeltaKwd
        : 0;
    const addonsTotal = (effectiveCustom?.addons || []).reduce((acc, a) => acc + a.priceKwd, 0);

    const effectiveUnitPrice = roundKWD(item.priceKwd + sideDelta + drinkDelta + addonsTotal);

    const prepStr = effectiveCustom?.prepStyle || 'Regular';
    const sideStr = effectiveCustom?.sideChoice?.id || 'none';
    const drinkStr = effectiveCustom?.drinkChoice?.id || 'none';
    const addonsStr = (effectiveCustom?.addons || []).map((a) => a.id).join(',');
    const notesStr = effectiveCustom?.kitchenNotes || '';

    const signatureKey = `${item.id}_${prepStr}_${sideStr}_${drinkStr}_${addonsStr}_${notesStr}`;

    // 3. Resolve true combo components for packaging & kitchen printing
    const dummyLine: CartLineItem = {
      lineId: '',
      type: isCombo ? 'COMBO' : 'ITEM',
      refId: item.id,
      skuOrCode: item.sku,
      titleEn: item.nameEn,
      titleAr: item.nameAr,
      quantity: qty,
      baseUnitPriceKwd: item.priceKwd,
      unitPriceKwd: effectiveUnitPrice,
      unitCostKwd: item.costKwd,
      description: item.description,
      comboIncludes: item.comboIncludes,
      isCombo,
    };
    const resolvedComboItems = getComboComponents(dummyLine, menuItems);

    setCartLines((prev) => {
      const existingIdx = prev.findIndex((l) => {
        if (l.type !== (isCombo ? 'COMBO' : 'ITEM') || l.refId !== item.id) return false;
        const lPrep = l.customization?.prepStyle || 'Regular';
        const lSide = l.customization?.sideChoice?.id || 'none';
        const lDrink = l.customization?.drinkChoice?.id || 'none';
        const lAddons = (l.customization?.addons || []).map((a) => a.id).join(',');
        const lNotes = l.customization?.kitchenNotes || '';
        return `${l.refId}_${lPrep}_${lSide}_${lDrink}_${lAddons}_${lNotes}` === signatureKey;
      });

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + qty,
        };
        return updated;
      }

      const newLine: CartLineItem = {
        lineId: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: isCombo ? 'COMBO' : 'ITEM',
        refId: item.id,
        skuOrCode: item.sku,
        titleEn: item.nameEn,
        titleAr: item.nameAr,
        quantity: qty,
        baseUnitPriceKwd: item.priceKwd,
        unitPriceKwd: effectiveUnitPrice,
        unitCostKwd: item.costKwd,
        customization: effectiveCustom,
        description: item.description,
        comboIncludes: resolvedComboItems.length > 0 ? resolvedComboItems : item.comboIncludes,
        isCombo,
      };
      return [...prev, newLine];
    });
  };

  const addComboToCart = (
    combo: ComboOffer,
    customization?: CartItemCustomization,
    qty = 1
  ) => {
    playTerminalSound('tap');
    const defaultCustom: CartItemCustomization = customization || {
      prepStyle: 'Regular',
      sideChoice: SIDE_UPGRADE_OPTIONS[0],
      drinkChoice: DRINK_SELECTION_OPTIONS[0],
      addons: [],
      kitchenNotes: '',
    };

    const sideDelta =
      defaultCustom.sideChoice && defaultCustom.sideChoice.id !== 'none'
        ? defaultCustom.sideChoice.priceDeltaKwd
        : 0;
    const drinkDelta =
      defaultCustom.drinkChoice && defaultCustom.drinkChoice.id !== 'none'
        ? defaultCustom.drinkChoice.priceDeltaKwd
        : 0;
    const addonsTotal = (defaultCustom.addons || []).reduce((acc, a) => acc + a.priceKwd, 0);

    const effectiveUnitPrice = roundKWD(combo.comboPriceKwd + sideDelta + drinkDelta + addonsTotal);
    const comboItemNames = combo.items.map((sub) => `${sub.quantity * qty}x ${sub.nameEn}`);

    setCartLines((prev) => [
      ...prev,
      {
        lineId: `line-cmb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'COMBO',
        refId: combo.id,
        skuOrCode: combo.code,
        titleEn: combo.headingEn,
        titleAr: combo.headingAr,
        quantity: qty,
        baseUnitPriceKwd: combo.comboPriceKwd,
        unitPriceKwd: effectiveUnitPrice,
        unitCostKwd: combo.totalCostKwd,
        customization: defaultCustom,
        comboSubItems: combo.items,
        comboIncludes: comboItemNames,
        description: comboItemNames.join(' + '),
        promoTag: combo.promoTag,
        isCombo: true,
      },
    ]);
  };

  const updateCartLineQty = (lineId: string, delta: number) => {
    playTerminalSound('tap');
    setCartLines((prev) =>
      prev
        .map((line) =>
          line.lineId === lineId ? { ...line, quantity: line.quantity + delta } : line
        )
        .filter((line) => line.quantity > 0)
    );
  };

  const removeCartLine = (lineId: string) => {
    playTerminalSound('tap');
    setCartLines((prev) => prev.filter((l) => l.lineId !== lineId));
  };

  const clearCart = () => {
    setCartLines([]);
    setDiscountPct(0);
    setIsFlatDiscount(false);
    setDiscountAmountKwd(0);
    setDiscountReason('');
    setDiscountOverrideManager(undefined);
    setAppliedPromo(null);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setActiveKitchenOrderId(null);
  };

  const loadKitchenOrderToCart = (orderId: string) => {
    const target = posOrders.find((o) => o.id === orderId);
    if (!target) return;

    setCartChannelState(target.channel);
    if (target.tableNo) setSelectedTableNo(target.tableNo);
    setCustomerName(target.customerName);
    setCustomerPhone(target.customerPhone || '');
    setDeliveryAddress(target.deliveryAddress || '');
    setCartLines([...target.items]);
    setDiscountPct(target.discountPct || 0);
    setDiscountReason(target.discountReason || '');
    setIsFlatDiscount(target.isFlatDiscount || false);
    setActiveKitchenOrderId(target.id);

    playTerminalSound('tap');
    showToast(`Loaded KOT Token #${target.tokenNo} into Billing Deck!`, 'info');
  };

  const unbindKitchenOrder = () => {
    setActiveKitchenOrderId(null);
    clearCart();
    showToast('Unbound kitchen order ticket from active cart.', 'info');
  };

  const settleKitchenOrderDirectly = (
    orderId: string,
    paymentMethod: PaymentMethod,
    cashTenderedKwd = 0,
    knetTenderedKwd = 0
  ): PosOrderRecord | null => {
    const target = posOrders.find((o) => o.id === orderId);
    if (!target || !currentUser) return null;

    const cashTender =
      paymentMethod === 'cash'
        ? cashTenderedKwd > 0
          ? cashTenderedKwd
          : target.grandTotalKwd
        : 0;
    const knetTender =
      paymentMethod === 'knet'
        ? knetTenderedKwd > 0
          ? knetTenderedKwd
          : target.grandTotalKwd
        : 0;
    const changeDue =
      paymentMethod === 'cash' ? roundKWD(Math.max(0, cashTender - target.grandTotalKwd)) : 0;

    const settledOrder: PosOrderRecord = {
      ...target,
      status: 'completed',
      orderStage: 'billed',
      paymentMethod,
      cashTenderedKwd: roundKWD(cashTender),
      knetTenderedKwd: roundKWD(knetTender),
      changeDueKwd: changeDue,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
    };

    setPosOrders((prev) => prev.map((o) => (o.id === orderId ? settledOrder : o)));

    // Release Dine-in Table
    if (target.channel === 'dine_in' && target.tableNo) {
      setDineInTables((prev) =>
        prev.map((t) =>
          t.tableNo === target.tableNo
            ? { ...t, status: 'free', activeOrderToken: undefined }
            : t
        )
      );
    }

    if (activeKitchenOrderId === orderId) {
      setActiveKitchenOrderId(null);
      clearCart();
    }

    playTerminalSound('paid');
    // Direct Silent Print: strictly 80mm Customer Tax Invoice only (Zero Modal)
    triggerDirectPrint(settledOrder, 'INVOICE');
    showToast(
      `Token #${target.tokenNo} (${target.invoiceNo}) Settled via ${paymentMethod.toUpperCase()}! 80mm Bill Issued.`,
      'success'
    );

    return settledOrder;
  };

  const applyCartDiscount = (
    pctOrAmount: number,
    reason: string,
    isFlat = false,
    managerName?: string
  ) => {
    setIsFlatDiscount(isFlat);
    if (isFlat) {
      const safeAmount = roundKWD(Math.max(0, pctOrAmount));
      setDiscountAmountKwd(safeAmount);
      const approxPct = cartSubtotalKwd > 0 ? Math.min(100, Math.round((safeAmount / cartSubtotalKwd) * 100)) : 0;
      setDiscountPct(approxPct);
      setDiscountReason(reason);
      setDiscountOverrideManager(managerName);
      showToast(`Applied ${safeAmount.toFixed(3)} ${CURRENCY} discount (${reason || 'Custom Courtesy'})`, 'info');
    } else {
      const safePct = Math.max(0, Math.min(100, pctOrAmount));
      setDiscountPct(safePct);
      setDiscountAmountKwd(roundKWD((cartSubtotalKwd * safePct) / 100));
      setDiscountReason(reason);
      setDiscountOverrideManager(managerName);
      showToast(`Applied ${safePct}% discount (${reason || 'Standard Promo'})`, 'info');
    }
  };

  // Cart Financial Calculations (Strict 3-decimal KWD)
  const cartSubtotalKwd = useMemo(
    () =>
      roundKWD(
        cartLines.reduce((sum, l) => sum + roundKWD(l.unitPriceKwd * l.quantity), 0)
      ),
    [cartLines]
  );

  const cartDiscountKwd = useMemo(() => {
    if (isFlatDiscount) {
      return roundKWD(Math.min(cartSubtotalKwd, discountAmountKwd));
    }
    return roundKWD((cartSubtotalKwd * discountPct) / 100);
  }, [isFlatDiscount, discountAmountKwd, cartSubtotalKwd, discountPct]);

  const cartDeliveryFeeKwd = useMemo(() => {
    if (cartLines.length === 0) return 0;
    return CHANNEL_META[cartChannel].defaultFeeKwd;
  }, [cartChannel, cartLines.length]);

  const cartGrandTotalKwd = useMemo(
    () => roundKWD(Math.max(0, cartSubtotalKwd - cartDiscountKwd + cartDeliveryFeeKwd)),
    [cartSubtotalKwd, cartDiscountKwd, cartDeliveryFeeKwd]
  );

  const cartTotalFoodCostKwd = useMemo(
    () =>
      roundKWD(
        cartLines.reduce((sum, l) => sum + roundKWD(l.unitCostKwd * l.quantity), 0)
      ),
    [cartLines]
  );

  // Hold / Recall Orders
  const holdCurrentCart = (): boolean => {
    if (cartLines.length === 0) return false;
    const held: HeldOrder = {
      id: `hold-${Date.now()}`,
      holdCode: `HLD-${Math.floor(100 + Math.random() * 900)}`,
      heldAt: new Date().toISOString(),
      heldBy: currentUser?.name || 'Cashier',
      channel: cartChannel,
      tableNo: cartChannel === 'dine_in' ? selectedTableNo : undefined,
      customerName: customerName || 'Held Counter Ticket',
      customerPhone,
      deliveryAddress,
      items: cartLines,
      discountPct,
      discountReason,
    };
    setHeldOrders((prev) => [held, ...prev]);
    clearCart();
    playTerminalSound('tap');
    showToast(`Order parked to Hold Queue (${held.holdCode})`, 'info');
    return true;
  };

  const recallHeldOrder = (holdId: string) => {
    const target = heldOrders.find((h) => h.id === holdId);
    if (!target) return;
    setCartChannelState(target.channel);
    if (target.tableNo) setSelectedTableNo(target.tableNo);
    setCustomerName(target.customerName);
    setCustomerPhone(target.customerPhone);
    setDeliveryAddress(target.deliveryAddress);
    setCartLines(target.items);
    setDiscountPct(target.discountPct);
    setDiscountReason(target.discountReason || '');
    setHeldOrders((prev) => prev.filter((h) => h.id !== holdId));
    playTerminalSound('paid');
    showToast(`Recalled Held Order ${target.holdCode} into active terminal`, 'success');
  };

  const deleteHeldOrder = (holdId: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== holdId));
  };

  // Helper: Deduct Raw BOM Inventory & Tracked Item Stock for any list of CartLineItems
  const deductBomForCartLines = (
    lines: CartLineItem[],
    invoiceNo: string,
    actorName: string
  ) => {
    // 1. Deduct direct tracked stock on MenuItems
    const directDeductionsMap = new Map<string, number>();
    lines.forEach((line) => {
      if (line.type === 'ITEM') {
        directDeductionsMap.set(
          line.refId,
          (directDeductionsMap.get(line.refId) || 0) + line.quantity
        );
      } else if (line.type === 'COMBO' && line.comboSubItems) {
        line.comboSubItems.forEach((sub) => {
          directDeductionsMap.set(
            sub.menuItemId,
            (directDeductionsMap.get(sub.menuItemId) || 0) + sub.quantity * line.quantity
          );
        });
      }
    });

    if (directDeductionsMap.size > 0) {
      setMenuItems((prev) =>
        prev.map((item) => {
          if (!item.trackStock) return item;
          const toDeduct = directDeductionsMap.get(item.id);
          if (!toDeduct) return item;
          const current = item.stockQuantity ?? 0;
          const nextStock = Math.max(0, current - toDeduct);
          return { ...item, stockQuantity: nextStock };
        })
      );
    }

    // 2. Deduct mapped Raw BOM ingredients
    const deductionsMap = new Map<string, number>();

    lines.forEach((line) => {
      if (line.type === 'ITEM') {
        const menuObj = menuItems.find((m) => m.id === line.refId);
        if (menuObj) {
          menuObj.bom.forEach((b) => {
            const current = deductionsMap.get(b.rawIngredientId) || 0;
            deductionsMap.set(b.rawIngredientId, current + b.qtyPerUnit * line.quantity);
          });
        }
      } else if (line.type === 'COMBO' && line.comboSubItems) {
        line.comboSubItems.forEach((sub) => {
          const menuObj = menuItems.find((m) => m.id === sub.menuItemId);
          if (menuObj) {
            menuObj.bom.forEach((b) => {
              const current = deductionsMap.get(b.rawIngredientId) || 0;
              deductionsMap.set(
                b.rawIngredientId,
                current + b.qtyPerUnit * sub.quantity * line.quantity
              );
            });
          }
        });
      }
    });

    if (deductionsMap.size === 0) return;

    const newLogs: InventoryLogEntry[] = [];
    const nowIso = new Date().toISOString();

    setRawIngredients((prev) =>
      prev.map((ing) => {
        const deductQty = deductionsMap.get(ing.id);
        if (!deductQty) return ing;
        const nextStock = roundKWD(Math.max(0, ing.currentStock - deductQty));
        newLogs.push({
          id: `log-${Date.now()}-${ing.id}`,
          timestamp: nowIso,
          ingredientName: ing.name,
          unit: ing.unit,
          txType: 'SALE_DEDUCTION',
          qtyDelta: -roundKWD(deductQty),
          reference: invoiceNo,
          actorName,
        });
        return { ...ing, currentStock: nextStock };
      })
    );

    if (newLogs.length > 0) {
      setInventoryLogs((prev) => [...newLogs, ...prev.slice(0, 80)]);
    }
  };

  // 1. KOT-First Workflow: Send to Kitchen & Print 80mm KOT (Zero Modal)
  const sendCartToKitchen = (): PosOrderRecord | null => {
    if (cartLines.length === 0 || !currentUser) return null;

    const nextToken =
      posOrders.length > 0 ? Math.max(...posOrders.map((o) => o.tokenNo)) + 1 : 401;
    const invoiceNo = `INV-SLM-${20000 + nextToken}`;
    const isStaff = Boolean(activeStaffPurchaseRecipient);
    const staffRecipient = activeStaffPurchaseRecipient;

    const newOrder: PosOrderRecord = {
      id: newUuid(),
      branchId: activeBranch.id,
      invoiceNo,
      tokenNo: nextToken,
      createdAt: new Date().toISOString(),
      channel: cartChannel,
      status: 'cooking',
      tableNo: cartChannel === 'dine_in' ? selectedTableNo : undefined,
      customerName: isStaff
        ? `STAFF: ${staffRecipient!.name} (${staffRecipient!.employeeCode})`
        : customerName.trim() ||
          (cartChannel === 'dine_in' ? `Table ${selectedTableNo}` : 'Counter Guest'),
      customerPhone: isStaff ? '' : customerPhone.trim(),
      deliveryAddress: isStaff ? '' : deliveryAddress.trim(),
      items: [...cartLines],
      subtotalKwd: cartSubtotalKwd,
      discountPct,
      discountKwd: cartDiscountKwd,
      discountReason: discountReason || (isStaff ? 'Staff Meal Credit' : undefined),
      managerOverrideBy: discountOverrideManager,
      deliveryFeeKwd: cartDeliveryFeeKwd,
      grandTotalKwd: cartGrandTotalKwd,
      totalFoodCostKwd: cartTotalFoodCostKwd,
      paymentMethod: isStaff ? 'staff_credit' : 'cash',
      cashTenderedKwd: 0,
      knetTenderedKwd: 0,
      changeDueKwd: 0,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      isFlatDiscount,
      kotPrinted: true,
      orderStage: 'kitchen',
      isStaffPurchase: isStaff,
      staffCreditRecipientId: staffRecipient?.id,
      staffCreditRecipientName: staffRecipient?.name,
    };

    setPosOrders((prev) => [newOrder, ...prev]);

    // Record into Staff Credit Ledger if Staff Purchase Mode is active
    if (isStaff && staffRecipient) {
      const creditRecord: StaffCreditRecord = {
        id: `stf-crd-${Date.now()}`,
        staffId: staffRecipient.id,
        staffName: staffRecipient.name,
        employeeCode: staffRecipient.employeeCode,
        createdAt: new Date().toISOString(),
        itemsSummary: cartLines.map((l) => `${l.quantity}x ${l.titleEn}`).join(', '),
        items: [...cartLines],
        totalAmountKwd: cartGrandTotalKwd,
        status: 'unpaid',
        posOrderId: newOrder.id,
        invoiceNo: newOrder.invoiceNo,
      };
      setStaffCreditRecords((prev) => [creditRecord, ...prev]);
      setActiveStaffPurchaseRecipient(null); // disengage staff mode
    }

    // Mark Dine-in Table occupied
    if (cartChannel === 'dine_in' && selectedTableNo) {
      setDineInTables((prev) =>
        prev.map((t) =>
          t.tableNo === selectedTableNo
            ? { ...t, status: 'occupied', activeOrderToken: nextToken }
            : t
        )
      );
    }

    // Deduct stock in real time
    deductBomForCartLines(cartLines, invoiceNo, currentUser.name);

    playTerminalSound('paid');
    clearCart();

    // DIRECT SILENT PRINT: strictly 80mm KOT slip only, zero preview modal!
    triggerDirectPrint(newOrder, 'KOT');
    showToast(
      isStaff
        ? `Token #${nextToken} (Staff Credit: ${staffRecipient?.name}) sent to Kitchen! 80mm KOT printed.`
        : `Token #${nextToken} (${invoiceNo}) sent to Kitchen! 80mm KOT printed.`,
      'success'
    );

    return newOrder;
  };

  // Complete Checkout (2. Pay & Print Customer Bill - Zero Modal)
  const completeCheckout = ({
    paymentMethod,
    cashTenderedKwd,
    knetTenderedKwd,
  }: {
    paymentMethod: PaymentMethod;
    cashTenderedKwd: number;
    knetTenderedKwd: number;
  }): PosOrderRecord | null => {
    if (cartLines.length === 0 || !currentUser) return null;

    const isStaff = Boolean(activeStaffPurchaseRecipient) || paymentMethod === 'staff_credit';
    const staffRecipient = activeStaffPurchaseRecipient;

    // Handle settlement of a loaded Kitchen Order Ticket
    if (activeKitchenOrderId) {
      const existing = posOrders.find((o) => o.id === activeKitchenOrderId);
      if (existing) {
        const changeDue =
          paymentMethod === 'cash'
            ? roundKWD(Math.max(0, cashTenderedKwd - cartGrandTotalKwd))
            : paymentMethod === 'split'
            ? roundKWD(Math.max(0, cashTenderedKwd + knetTenderedKwd - cartGrandTotalKwd))
            : 0;

        const updatedOrder: PosOrderRecord = {
          ...existing,
          status: 'completed',
          orderStage: 'billed',
          items: [...cartLines],
          subtotalKwd: cartSubtotalKwd,
          discountPct,
          discountKwd: cartDiscountKwd,
          discountReason: discountReason || undefined,
          managerOverrideBy: discountOverrideManager,
          deliveryFeeKwd: cartDeliveryFeeKwd,
          grandTotalKwd: cartGrandTotalKwd,
          totalFoodCostKwd: cartTotalFoodCostKwd,
          paymentMethod: isStaff ? 'staff_credit' : paymentMethod,
          cashTenderedKwd: roundKWD(cashTenderedKwd),
          knetTenderedKwd: roundKWD(knetTenderedKwd),
          changeDueKwd: changeDue,
          cashierId: currentUser.id,
          cashierName: currentUser.name,
          isFlatDiscount,
          isStaffPurchase: isStaff || existing.isStaffPurchase,
          staffCreditRecipientId: staffRecipient?.id || existing.staffCreditRecipientId,
          staffCreditRecipientName: staffRecipient?.name || existing.staffCreditRecipientName,
        };

        setPosOrders((prev) =>
          prev.map((o) => (o.id === activeKitchenOrderId ? updatedOrder : o))
        );

        if (isStaff && staffRecipient) {
          const creditRecord: StaffCreditRecord = {
            id: `stf-crd-${Date.now()}`,
            staffId: staffRecipient.id,
            staffName: staffRecipient.name,
            employeeCode: staffRecipient.employeeCode,
            createdAt: new Date().toISOString(),
            itemsSummary: cartLines.map((l) => `${l.quantity}x ${l.titleEn}`).join(', '),
            items: [...cartLines],
            totalAmountKwd: cartGrandTotalKwd,
            status: 'unpaid',
            posOrderId: updatedOrder.id,
            invoiceNo: updatedOrder.invoiceNo,
          };
          setStaffCreditRecords((prev) => [creditRecord, ...prev]);
          setActiveStaffPurchaseRecipient(null);
        }

        // Release Dine-in Table
        if (cartChannel === 'dine_in' && selectedTableNo) {
          setDineInTables((prev) =>
            prev.map((t) =>
              t.tableNo === selectedTableNo
                ? { ...t, status: 'free', activeOrderToken: undefined }
                : t
            )
          );
        }

        playTerminalSound('paid');
        clearCart();
        setActiveKitchenOrderId(null);

        // DIRECT SILENT PRINT: strictly 80mm Customer Tax Invoice only, zero preview modal!
        triggerDirectPrint(updatedOrder, autoPrintKotWithBill ? 'BOTH' : 'INVOICE');
        showToast(
          `Token #${existing.tokenNo} (${existing.invoiceNo}) settled & billed via ${paymentMethod.toUpperCase()}!`,
          'success'
        );

        return updatedOrder;
      }
    }

    const nextToken =
      posOrders.length > 0 ? Math.max(...posOrders.map((o) => o.tokenNo)) + 1 : 401;
    const invoiceNo = `INV-SLM-${20000 + nextToken}`;

    const changeDue =
      paymentMethod === 'cash'
        ? roundKWD(Math.max(0, cashTenderedKwd - cartGrandTotalKwd))
        : paymentMethod === 'split'
        ? roundKWD(Math.max(0, cashTenderedKwd + knetTenderedKwd - cartGrandTotalKwd))
        : 0;

    const newOrder: PosOrderRecord = {
      id: newUuid(),
      branchId: activeBranch.id,
      invoiceNo,
      tokenNo: nextToken,
      createdAt: new Date().toISOString(),
      channel: cartChannel,
      status: 'cooking',
      tableNo: cartChannel === 'dine_in' ? selectedTableNo : undefined,
      customerName: isStaff
        ? `STAFF: ${staffRecipient!.name} (${staffRecipient!.employeeCode})`
        : customerName.trim() ||
          (cartChannel === 'dine_in' ? `Table ${selectedTableNo}` : 'Counter Guest'),
      customerPhone: isStaff ? '' : customerPhone.trim(),
      deliveryAddress: isStaff ? '' : deliveryAddress.trim(),
      items: [...cartLines],
      subtotalKwd: cartSubtotalKwd,
      discountPct,
      discountKwd: cartDiscountKwd,
      discountReason: discountReason || undefined,
      managerOverrideBy: discountOverrideManager,
      deliveryFeeKwd: cartDeliveryFeeKwd,
      grandTotalKwd: cartGrandTotalKwd,
      totalFoodCostKwd: cartTotalFoodCostKwd,
      paymentMethod: isStaff ? 'staff_credit' : paymentMethod,
      cashTenderedKwd: roundKWD(cashTenderedKwd),
      knetTenderedKwd: roundKWD(knetTenderedKwd),
      changeDueKwd: changeDue,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      isFlatDiscount,
      kotPrinted: autoPrintKotWithBill,
      orderStage: 'billed',
      isStaffPurchase: isStaff,
      staffCreditRecipientId: staffRecipient?.id,
      staffCreditRecipientName: staffRecipient?.name,
    };

    setPosOrders((prev) => [newOrder, ...prev]);

    if (isStaff && staffRecipient) {
      const creditRecord: StaffCreditRecord = {
        id: `stf-crd-${Date.now()}`,
        staffId: staffRecipient.id,
        staffName: staffRecipient.name,
        employeeCode: staffRecipient.employeeCode,
        createdAt: new Date().toISOString(),
        itemsSummary: cartLines.map((l) => `${l.quantity}x ${l.titleEn}`).join(', '),
        items: [...cartLines],
        totalAmountKwd: cartGrandTotalKwd,
        status: 'unpaid',
        posOrderId: newOrder.id,
        invoiceNo: newOrder.invoiceNo,
      };
      setStaffCreditRecords((prev) => [creditRecord, ...prev]);
      setActiveStaffPurchaseRecipient(null);
    }

    // Mark Dine-in Table occupied
    if (cartChannel === 'dine_in' && selectedTableNo) {
      setDineInTables((prev) =>
        prev.map((t) =>
          t.tableNo === selectedTableNo
            ? { ...t, status: 'occupied', activeOrderToken: nextToken }
            : t
        )
      );
    }

    // Automatic BOM Inventory Deduction
    deductBomForCartLines(cartLines, invoiceNo, currentUser.name);

    playTerminalSound('paid');
    clearCart();

    // DIRECT SILENT PRINT: strictly 80mm Customer Tax Invoice only, zero preview modal!
    triggerDirectPrint(newOrder, autoPrintKotWithBill ? 'BOTH' : 'INVOICE');
    showToast(
      isStaff
        ? `Staff Order #${nextToken} recorded on Credit Ledger & 80mm slip printed!`
        : `Order #${nextToken} (${invoiceNo}) settled & sent to 80mm Printer!`,
      'success'
    );

    return newOrder;
  };

  const voidSettledOrder = (
    orderIdOrInvoiceNo: string,
    reason: string,
    managerName: string
  ): boolean => {
    const targetOrder = posOrders.find(
      (o) =>
        o.id === orderIdOrInvoiceNo ||
        o.invoiceNo.toLowerCase() === orderIdOrInvoiceNo.toLowerCase().trim() ||
        String(o.tokenNo) === orderIdOrInvoiceNo.replace(/[^0-9]/g, '')
    );

    if (!targetOrder) {
      showToast(`Bill #${orderIdOrInvoiceNo} not found in sales registry`, 'warning');
      return false;
    }

    if (targetOrder.status === 'voided') {
      showToast(`Bill #${targetOrder.invoiceNo} is already voided`, 'warning');
      return false;
    }

    // 1. REVERSE INVENTORY: Direct Tracked Stock
    const directRestoresMap = new Map<string, number>();
    const orderItems = targetOrder.items || [];

    orderItems.forEach((line) => {
      if (line.type === 'ITEM') {
        directRestoresMap.set(
          line.refId,
          (directRestoresMap.get(line.refId) || 0) + line.quantity
        );
      } else if (line.type === 'COMBO' && line.comboSubItems) {
        line.comboSubItems.forEach((sub) => {
          directRestoresMap.set(
            sub.menuItemId,
            (directRestoresMap.get(sub.menuItemId) || 0) + sub.quantity * line.quantity
          );
        });
      }
    });

    if (directRestoresMap.size > 0) {
      setMenuItems((prev) =>
        prev.map((item) => {
          if (!item.trackStock) return item;
          const toRestore = directRestoresMap.get(item.id);
          if (!toRestore) return item;
          const current = item.stockQuantity ?? 0;
          return { ...item, stockQuantity: current + toRestore };
        })
      );
    }

    // 2. REVERSE INVENTORY: Raw BOM Ingredients
    const bomRestoresMap = new Map<string, number>();

    orderItems.forEach((line) => {
      if (line.type === 'ITEM') {
        const menuObj = menuItems.find((m) => m.id === line.refId);
        if (menuObj) {
          menuObj.bom.forEach((b) => {
            const current = bomRestoresMap.get(b.rawIngredientId) || 0;
            bomRestoresMap.set(b.rawIngredientId, current + b.qtyPerUnit * line.quantity);
          });
        }
      } else if (line.type === 'COMBO' && line.comboSubItems) {
        line.comboSubItems.forEach((sub) => {
          const menuObj = menuItems.find((m) => m.id === sub.menuItemId);
          if (menuObj) {
            menuObj.bom.forEach((b) => {
              const current = bomRestoresMap.get(b.rawIngredientId) || 0;
              bomRestoresMap.set(
                b.rawIngredientId,
                current + b.qtyPerUnit * sub.quantity * line.quantity
              );
            });
          }
        });
      }
    });

    if (bomRestoresMap.size > 0) {
      const nowIso = new Date().toISOString();
      const restoreLogs: InventoryLogEntry[] = [];

      setRawIngredients((prev) =>
        prev.map((ing) => {
          const restoreQty = bomRestoresMap.get(ing.id);
          if (!restoreQty) return ing;
          const nextStock = roundKWD(ing.currentStock + restoreQty);
          restoreLogs.push({
            id: `log-void-${Date.now()}-${ing.id}`,
            timestamp: nowIso,
            ingredientName: ing.name,
            unit: ing.unit,
            txType: 'VOID_RESTOCK',
            qtyDelta: roundKWD(restoreQty),
            reference: `VOID:${targetOrder.invoiceNo}`,
            actorName: managerName,
          });
          return { ...ing, currentStock: nextStock };
        })
      );

      if (restoreLogs.length > 0) {
        setInventoryLogs((prev) => [...restoreLogs, ...prev.slice(0, 80)]);
      }
    }

    // 3. Free Dine-In Table if bound
    if (targetOrder.tableNo) {
      setDineInTables((tables) =>
        tables.map((t) =>
          t.tableNo === targetOrder.tableNo
            ? { ...t, status: 'free', activeOrderToken: undefined }
            : t
        )
      );
    }

    // 4. Update Order Record Status in POS State & LocalStorage
    const voidTimeIso = new Date().toISOString();
    const voidedOrderRecord: PosOrderRecord = {
      ...targetOrder,
      status: 'voided',
      voidReason: reason,
      voidedBy: managerName,
      voidedAt: voidTimeIso,
    };

    setPosOrders((prev) =>
      prev.map((o) => (o.id === targetOrder.id ? voidedOrderRecord : o))
    );

    // 5. Update linked orders in Supabase cloud database
    try {
      updateOrderStatusInSupabase(targetOrder.id, 'voided');
      if (targetOrder.invoiceNo) {
        updateOrderStatusInSupabase(targetOrder.invoiceNo, 'voided');
      }
      if (targetOrder.webOrderRef) {
        updateOrderStatusInSupabase(targetOrder.webOrderRef, 'voided');
      }
    } catch (err) {
      console.warn('[Supabase Void] Exception:', err);
    }

    // 6. Direct Spooler Print: 80mm Customer Cancellation Receipt (Negative tallies & VOID banner)
    triggerDirectPrint(voidedOrderRecord, 'INVOICE');

    playTerminalSound('override');
    showToast(
      `Bill #${targetOrder.invoiceNo} successfully voided by ${managerName}. Cancellation receipt printed.`,
      'warning'
    );
    return true;
  };

  // Kitchen Queue (KOT) Cancellation & Kitchen Alert Print
  const cancelKitchenOrder = async (orderId: string, reason?: string): Promise<boolean> => {
    const target = posOrders.find((o) => o.id === orderId || o.invoiceNo === orderId);
    if (!target) {
      showToast(`Kitchen order #${orderId} not found`, 'warning');
      return false;
    }

    if (target.status === 'cancelled' || target.status === 'voided') {
      showToast(`Kitchen order #${target.tokenNo} is already cancelled`, 'warning');
      return false;
    }

    // 1. Free Dine-In Table if bound
    if (target.tableNo) {
      setDineInTables((tables) =>
        tables.map((t) =>
          t.tableNo === target.tableNo
            ? { ...t, status: 'free', activeOrderToken: undefined }
            : t
        )
      );
    }

    // 2. Unbind if currently loaded in active billing cart
    if (activeKitchenOrderId === target.id) {
      setActiveKitchenOrderId(null);
    }

    // 3. Reverse Inventory: Direct Tracked Stock
    const directRestoresMap = new Map<string, number>();
    const orderItems = target.items || [];

    orderItems.forEach((line) => {
      if (line.type === 'ITEM') {
        directRestoresMap.set(
          line.refId,
          (directRestoresMap.get(line.refId) || 0) + line.quantity
        );
      } else if (line.type === 'COMBO' && line.comboSubItems) {
        line.comboSubItems.forEach((sub) => {
          directRestoresMap.set(
            sub.menuItemId,
            (directRestoresMap.get(sub.menuItemId) || 0) + sub.quantity * line.quantity
          );
        });
      }
    });

    if (directRestoresMap.size > 0) {
      setMenuItems((prev) =>
        prev.map((item) => {
          if (!item.trackStock) return item;
          const toRestore = directRestoresMap.get(item.id);
          if (!toRestore) return item;
          const current = item.stockQuantity ?? 0;
          return { ...item, stockQuantity: current + toRestore };
        })
      );
    }

    // 4. Reverse Inventory: Raw BOM Ingredients
    const bomRestoresMap = new Map<string, number>();
    orderItems.forEach((line) => {
      if (line.type === 'ITEM') {
        const menuObj = menuItems.find((m) => m.id === line.refId);
        if (menuObj) {
          menuObj.bom.forEach((b) => {
            const current = bomRestoresMap.get(b.rawIngredientId) || 0;
            bomRestoresMap.set(b.rawIngredientId, current + b.qtyPerUnit * line.quantity);
          });
        }
      } else if (line.type === 'COMBO' && line.comboSubItems) {
        line.comboSubItems.forEach((sub) => {
          const menuObj = menuItems.find((m) => m.id === sub.menuItemId);
          if (menuObj) {
            menuObj.bom.forEach((b) => {
              const current = bomRestoresMap.get(b.rawIngredientId) || 0;
              bomRestoresMap.set(
                b.rawIngredientId,
                current + b.qtyPerUnit * sub.quantity * line.quantity
              );
            });
          }
        });
      }
    });

    if (bomRestoresMap.size > 0) {
      const nowIso = new Date().toISOString();
      const restoreLogs: InventoryLogEntry[] = [];

      setRawIngredients((prev) =>
        prev.map((ing) => {
          const restoreQty = bomRestoresMap.get(ing.id);
          if (!restoreQty) return ing;
          const nextStock = roundKWD(ing.currentStock + restoreQty);
          restoreLogs.push({
            id: `log-cancel-kot-${Date.now()}-${ing.id}`,
            timestamp: nowIso,
            ingredientName: ing.name,
            unit: ing.unit,
            txType: 'VOID_RESTOCK',
            qtyDelta: roundKWD(restoreQty),
            reference: `CANCEL_KOT:${target.invoiceNo}`,
            actorName: currentUser?.name || 'Kitchen Staff',
          });
          return { ...ing, currentStock: nextStock };
        })
      );

      if (restoreLogs.length > 0) {
        setInventoryLogs((prev) => [...restoreLogs, ...prev.slice(0, 80)]);
      }
    }

    const cancelIso = new Date().toISOString();
    const canceller = currentUser?.name || 'Staff';
    const cancelReason = reason || 'Customer Cancelled Before Prep';

    const cancelledOrderRecord: PosOrderRecord = {
      ...target,
      status: 'cancelled',
      voidReason: cancelReason,
      voidedBy: canceller,
      voidedAt: cancelIso,
    };

    setPosOrders((prev) =>
      prev.map((o) => (o.id === target.id ? cancelledOrderRecord : o))
    );

    // 5. Update status in Supabase cloud database
    try {
      await updateOrderStatusInSupabase(target.id, 'cancelled');
      if (target.invoiceNo) {
        await updateOrderStatusInSupabase(target.invoiceNo, 'cancelled');
      }
      if (target.webOrderRef) {
        await updateOrderStatusInSupabase(target.webOrderRef, 'cancelled');
      }
    } catch (err) {
      console.warn('[cancelKitchenOrder] Supabase sync notice:', err);
    }

    // 6. Direct Spooler Print: 80mm Kitchen Alert Slip (** CANCELLED KOT **)
    triggerDirectPrint(cancelledOrderRecord, 'KOT');

    playTerminalSound('override');
    showToast(
      `Token #${target.tokenNo} cancelled. Kitchen alert slip printed!`,
      'warning'
    );
    return true;
  };

  const updatePosOrderStatus = (orderId: string, status: PosOrderRecord['status']) => {
    setPosOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        if (status === 'completed' && o.tableNo) {
          setDineInTables((tables) =>
            tables.map((t) =>
              t.tableNo === o.tableNo
                ? { ...t, status: 'free', activeOrderToken: undefined }
                : t
            )
          );
        }
        return { ...o, status };
      })
    );
    playTerminalSound('tap');
  };

  // Manager Override Verification
  const requestManagerOverride = (config: OverrideRequestConfig) => {
    playTerminalSound('override');
    setOverrideModalConfig(config);
  };

  const closeManagerOverride = () => {
    setOverrideModalConfig(null);
  };

  const verifyManagerPin = (pin: string): StaffAccount | null => {
    const mgr = staffAccounts.find(
      (a) => (a.role === 'manager' || a.role === 'admin') && a.pin === pin.trim()
    );
    return mgr || null;
  };

  // Print Modal
  const openPrintModal = (
    order: PosOrderRecord,
    tab: 'INVOICE' | 'KOT' | 'BOTH' = 'BOTH'
  ) => {
    playTerminalSound('tap');
    setActivePrintOrder(order);
    setPrintModalInitialTab(tab);
  };

  const closePrintModal = () => {
    setActivePrintOrder(null);
  };

  // Daily Gross Sales (Total Sales header): today's non-cancelled / non-voided bills only.
  // Staff-credit bills are excluded, matching the ERP Z-Report gross revenue rule.
  const dailyGrossSalesKwd = useMemo(() => {
    const todayKey = new Date().toDateString();
    const total = posOrders.reduce((sum, o) => {
      if (new Date(o.createdAt).toDateString() !== todayKey) return sum;
      if (isCancelledOrder(o)) return sum;
      if (o.isStaffPurchase || o.paymentMethod === 'staff_credit') return sum;
      return sum + o.grandTotalKwd;
    }, 0);
    return roundKWD(total);
  }, [posOrders]);

  // Website Orders & Dispatch Hub
  const pendingWebOrdersCount = useMemo(
    () => webOrders.filter((w) => w.status === 'Pending').length,
    [webOrders]
  );

  const pendingWebOrders = useMemo(
    () => webOrders.filter((w) => w.status === 'Pending'),
    [webOrders]
  );

  const dismissWebOrderAlert = () => {
    if (activeWebOrderAlert) {
      setDismissedWebOrderAlertIds((prev) => new Set(prev).add(activeWebOrderAlert.id));
    }
    setActiveWebOrderAlert(null);
  };

  const selectWebOrderAlert = (order: IncomingWebOrder) => {
    setActiveWebOrderAlert(order);
  };

  // Direct Accept Incoming Web Order from Floating Banner (Silent, Zero Screen Displacement)
  const acceptWebOrderFromBanner = (webOrderId: string): PosOrderRecord | null => {
    const target =
      webOrders.find((w) => w.id === webOrderId) ||
      (activeWebOrderAlert?.id === webOrderId ? activeWebOrderAlert : null);
    if (!target) return null;

    const nextToken =
      posOrders.length > 0 ? Math.max(...posOrders.map((o) => o.tokenNo)) + 1 : 401;
    const invoiceNo = `INV-WEB-${20000 + nextToken}`;

    const convertedLines: CartLineItem[] = target.items.map((wLine, idx) => {
      if (wLine.type === 'COMBO') {
        const comboObj = comboOffers.find((c) => c.id === wLine.refId);
        return {
          lineId: `web-ln-${idx}-${Date.now()}`,
          type: 'COMBO',
          refId: wLine.refId,
          skuOrCode: comboObj?.code || 'CMB-WEB',
          titleEn: wLine.titleEn,
          titleAr: wLine.titleAr,
          quantity: wLine.quantity,
          baseUnitPriceKwd: wLine.unitPriceKwd,
          unitPriceKwd: wLine.unitPriceKwd,
          unitCostKwd: comboObj?.totalCostKwd || roundKWD(wLine.unitPriceKwd * 0.48),
          comboSubItems: wLine.comboSubItems || comboObj?.items || [],
          promoTag: comboObj?.promoTag || 'WEB DEAL',
          customization: {
            prepStyle: wLine.prepStyle,
            sideChoice: SIDE_UPGRADE_OPTIONS[0],
            drinkChoice: DRINK_SELECTION_OPTIONS[0],
            addons: [],
            kitchenNotes: wLine.notes || '',
          },
        };
      } else {
        const itemObj = menuItems.find((m) => m.id === wLine.refId);
        return {
          lineId: `web-ln-${idx}-${Date.now()}`,
          type: 'ITEM',
          refId: wLine.refId,
          skuOrCode: itemObj?.sku || 'ITM-WEB',
          titleEn: wLine.titleEn,
          titleAr: wLine.titleAr,
          quantity: wLine.quantity,
          baseUnitPriceKwd: wLine.unitPriceKwd,
          unitPriceKwd: wLine.unitPriceKwd,
          unitCostKwd: itemObj?.costKwd || roundKWD(wLine.unitPriceKwd * 0.45),
          customization: {
            prepStyle: wLine.prepStyle,
            sideChoice: SIDE_UPGRADE_OPTIONS[0],
            drinkChoice: DRINK_SELECTION_OPTIONS[0],
            addons: [],
            kitchenNotes: wLine.notes || '',
          },
        };
      }
    });

    const totalCost = roundKWD(
      convertedLines.reduce((s, l) => s + l.unitCostKwd * l.quantity, 0)
    );

    const mappedPayment: PaymentMethod =
      target.paymentMode === 'K-Net Online'
        ? 'knet'
        : target.paymentMode === 'Wamd Instant'
        ? 'wamd'
        : 'cash';

    const fullAddress = `${target.area}, ${target.blockNo}, ${target.streetNo}, ${target.buildingNo}, ${target.floorApt} (${target.landmarkNotes})`;

    const posOrder: PosOrderRecord = {
      id: `pos-web-${Date.now()}`,
      branchId: activeBranch.id,
      invoiceNo,
      tokenNo: nextToken,
      createdAt: new Date().toISOString(),
      channel: 'chikarro_web',
      status: 'cooking', // Automatically lands in Kitchen KOT queue!
      customerName: target.customerName,
      customerPhone: target.customerPhone,
      deliveryAddress: fullAddress,
      items: convertedLines,
      subtotalKwd: target.subtotalKwd,
      discountPct: 0,
      discountKwd: 0,
      deliveryFeeKwd: target.deliveryFeeKwd,
      grandTotalKwd: target.totalKwd,
      totalFoodCostKwd: totalCost,
      paymentMethod: mappedPayment,
      cashTenderedKwd: mappedPayment === 'cash' ? target.totalKwd : 0,
      knetTenderedKwd: mappedPayment === 'knet' ? target.totalKwd : 0,
      changeDueKwd: 0,
      cashierId: currentUser?.id || 'usr-staff-01',
      cashierName: currentUser?.name || 'Counter Staff',
      webOrderRef: target.webOrderNo,
    };

    // 1. Convert web order into active kitchen order in POS state (instantly visible in activeKotOrders)
    setPosOrders((prev) => [posOrder, ...prev]);

    // 2. Automatically deduct BOM stock
    deductBomForCartLines(
      convertedLines,
      invoiceNo,
      currentUser?.name || 'Web Auto-Sync'
    );

    // 3. Immediately sync status to Supabase cloud database
    updateOrderStatusInSupabase(target.id, 'cooking');
    updateOrderStatusInSupabase(target.webOrderNo, 'cooking');

    // 4. Update web order state
    const defaultRider = deliveryRiders[0]?.id;
    setWebOrders((prev) =>
      prev.map((w) =>
        w.id === webOrderId || w.webOrderNo === target.webOrderNo
          ? {
              ...w,
              status: 'Cooking',
              linkedPosInvoiceNo: invoiceNo,
              linkedPosOrderId: posOrder.id,
              assignedRiderId: defaultRider,
            }
          : w
      )
    );

    // 5. Silent Auto-Print KOT if configured (never opens disruptive full-screen modal)
    if (autoPrintKotWithBill) {
      triggerDirectPrint(posOrder, 'KOT');
    }

    // 6. Dismiss alert banner & show next pending if available
    const nextPending = webOrders.find(
      (w) =>
        w.id !== webOrderId &&
        w.webOrderNo !== target.webOrderNo &&
        w.status === 'Pending' &&
        !dismissedWebOrderAlertIds.has(w.id)
    );
    setActiveWebOrderAlert(nextPending || null);

    showToast(
      `Accepted Web Order ${target.webOrderNo} (${target.totalKwd.toFixed(
        3
      )} ${CURRENCY}) • Dispatched to Kitchen KOT!`,
      'success'
    );

    return posOrder;
  };

  // One-Click Accept & Auto-Bill Web Order
  const acceptAndAutoBillWebOrder = (
    webOrderId: string,
    riderId?: string
  ): PosOrderRecord | null => {
    const target = webOrders.find((w) => w.id === webOrderId);
    if (!target) return null;

    const nextToken =
      posOrders.length > 0 ? Math.max(...posOrders.map((o) => o.tokenNo)) + 1 : 401;
    const invoiceNo = `INV-WEB-${20000 + nextToken}`;

    const convertedLines: CartLineItem[] = target.items.map((wLine, idx) => {
      if (wLine.type === 'COMBO') {
        const comboObj = comboOffers.find((c) => c.id === wLine.refId);
        return {
          lineId: `web-ln-${idx}-${Date.now()}`,
          type: 'COMBO',
          refId: wLine.refId,
          skuOrCode: comboObj?.code || 'CMB-WEB',
          titleEn: wLine.titleEn,
          titleAr: wLine.titleAr,
          quantity: wLine.quantity,
          baseUnitPriceKwd: wLine.unitPriceKwd,
          unitPriceKwd: wLine.unitPriceKwd,
          unitCostKwd: comboObj?.totalCostKwd || roundKWD(wLine.unitPriceKwd * 0.48),
          comboSubItems: wLine.comboSubItems || comboObj?.items || [],
          promoTag: comboObj?.promoTag || 'WEB DEAL',
          customization: {
            prepStyle: wLine.prepStyle,
            sideChoice: SIDE_UPGRADE_OPTIONS[0],
            drinkChoice: DRINK_SELECTION_OPTIONS[0],
            addons: [],
            kitchenNotes: wLine.notes || '',
          },
        };
      } else {
        const itemObj = menuItems.find((m) => m.id === wLine.refId);
        return {
          lineId: `web-ln-${idx}-${Date.now()}`,
          type: 'ITEM',
          refId: wLine.refId,
          skuOrCode: itemObj?.sku || 'ITM-WEB',
          titleEn: wLine.titleEn,
          titleAr: wLine.titleAr,
          quantity: wLine.quantity,
          baseUnitPriceKwd: wLine.unitPriceKwd,
          unitPriceKwd: wLine.unitPriceKwd,
          unitCostKwd: itemObj?.costKwd || roundKWD(wLine.unitPriceKwd * 0.45),
          customization: {
            prepStyle: wLine.prepStyle,
            sideChoice: SIDE_UPGRADE_OPTIONS[0],
            drinkChoice: DRINK_SELECTION_OPTIONS[0],
            addons: [],
            kitchenNotes: wLine.notes || '',
          },
        };
      }
    });

    const totalCost = roundKWD(
      convertedLines.reduce((s, l) => s + l.unitCostKwd * l.quantity, 0)
    );

    const mappedPayment: PaymentMethod =
      target.paymentMode === 'K-Net Online'
        ? 'knet'
        : target.paymentMode === 'Wamd Instant'
        ? 'wamd'
        : 'cash';

    const fullAddress = `${target.area}, ${target.blockNo}, ${target.streetNo}, ${target.buildingNo}, ${target.floorApt} (${target.landmarkNotes})`;

    const posOrder: PosOrderRecord = {
      id: `pos-web-${Date.now()}`,
      branchId: activeBranch.id,
      invoiceNo,
      tokenNo: nextToken,
      createdAt: new Date().toISOString(),
      channel: 'chikarro_web',
      status: 'cooking',
      customerName: target.customerName,
      customerPhone: target.customerPhone,
      deliveryAddress: fullAddress,
      items: convertedLines,
      subtotalKwd: target.subtotalKwd,
      discountPct: 0,
      discountKwd: 0,
      deliveryFeeKwd: target.deliveryFeeKwd,
      grandTotalKwd: target.totalKwd,
      totalFoodCostKwd: totalCost,
      paymentMethod: mappedPayment,
      cashTenderedKwd: mappedPayment === 'cash' ? target.totalKwd : 0,
      knetTenderedKwd: mappedPayment === 'knet' ? target.totalKwd : 0,
      changeDueKwd: 0,
      cashierId: currentUser?.id || 'usr-staff-01',
      cashierName: currentUser?.name || 'Auto-Web Sync',
      webOrderRef: target.webOrderNo,
    };

    setPosOrders((prev) => [posOrder, ...prev]);

    // Deduct BOM stock automatically
    deductBomForCartLines(
      convertedLines,
      invoiceNo,
      currentUser?.name || 'Web Auto-Sync'
    );

    // Sync status to Supabase cloud
    updateOrderStatusInSupabase(target.id, 'cooking');
    updateOrderStatusInSupabase(target.webOrderNo, 'cooking');

    // Update Web Order status & link POS invoice
    const defaultRider = riderId || deliveryRiders[0]?.id;
    setWebOrders((prev) =>
      prev.map((w) =>
        w.id === webOrderId
          ? {
              ...w,
              status: 'Cooking',
              linkedPosInvoiceNo: invoiceNo,
              linkedPosOrderId: posOrder.id,
              assignedRiderId: defaultRider,
            }
          : w
      )
    );

    playTerminalSound('paid');
    setActivePrintOrder(posOrder);
    setPrintModalInitialTab('BOTH');
    showToast(
      `Accepted ${target.webOrderNo} • Auto-Billed as ${invoiceNo} & Triggered 80mm KOT + Receipt!`,
      'success'
    );

    return posOrder;
  };

  const updateWebOrderStatus = (webOrderId: string, status: WebDispatchStatus) => {
    setWebOrders((prev) =>
      prev.map((w) => (w.id === webOrderId ? { ...w, status } : w))
    );
    playTerminalSound('tap');
    showToast(`Updated Web Order dispatch status to "${status}"`, 'info');
  };

  const assignRiderToWebOrder = (webOrderId: string, riderId: string) => {
    setWebOrders((prev) =>
      prev.map((w) => (w.id === webOrderId ? { ...w, assignedRiderId: riderId } : w))
    );
    setDeliveryRiders((prev) =>
      prev.map((r) =>
        r.id === riderId ? { ...r, status: 'busy', activeOrders: r.activeOrders + 1 } : r
      )
    );
    playTerminalSound('tap');
    showToast('Assigned Delivery Rider to order', 'success');
  };

  // Raw Inventory & Universal Stock Tracking
  const lowStockIngredients = useMemo(
    () => rawIngredients.filter((i) => i.currentStock <= i.reorderLevel),
    [rawIngredients]
  );

  // Universal Stock Tracking (Any Menu Item or Ingredient)
  const toggleItemStockTracking = (
    itemId: string,
    enabled: boolean,
    initialStock = 50,
    threshold = 5
  ) => {
    setMenuItems((prev) =>
      prev.map((m) =>
        m.id === itemId
          ? {
              ...m,
              trackStock: enabled,
              stockQuantity: m.stockQuantity ?? initialStock,
              lowStockThreshold: m.lowStockThreshold ?? threshold,
            }
          : m
      )
    );
    showToast(
      enabled
        ? `Enabled stock tracking for item`
        : `Disabled stock tracking for item`,
      'info'
    );
  };

  const updateItemStockQuantity = (itemId: string, newStock: number) => {
    const safeQty = Math.max(0, Math.round(newStock));
    setMenuItems((prev) =>
      prev.map((m) => (m.id === itemId ? { ...m, stockQuantity: safeQty } : m))
    );
    showToast(`Updated stock count to ${safeQty} units`, 'success');
  };

  const updateItemStockThreshold = (itemId: string, newThreshold: number) => {
    const safeThresh = Math.max(1, Math.round(newThreshold));
    setMenuItems((prev) =>
      prev.map((m) => (m.id === itemId ? { ...m, lowStockThreshold: safeThresh } : m))
    );
    showToast(`Updated low stock threshold to <= ${safeThresh}`, 'info');
  };

  // Dynamic <= 5 Low-Stock Notification List (combines tracked menu items and raw ingredients)
  const allLowStockItems = useMemo<LowStockAlertItem[]>(() => {
    const alerts: LowStockAlertItem[] = [];

    // Tracked Menu Items
    menuItems.forEach((m) => {
      if (m.trackStock && (m.stockQuantity ?? 0) <= (m.lowStockThreshold ?? 5)) {
        alerts.push({
          id: m.id,
          type: 'menu_item',
          name: m.nameEn,
          sku: m.sku,
          currentStock: m.stockQuantity ?? 0,
          threshold: m.lowStockThreshold ?? 5,
          unit: 'units',
        });
      }
    });

    // Tracked Raw Ingredients
    rawIngredients.forEach((ing) => {
      if (ing.currentStock <= ing.reorderLevel) {
        alerts.push({
          id: ing.id,
          type: 'raw_ingredient',
          name: ing.name,
          sku: ing.sku,
          currentStock: ing.currentStock,
          threshold: ing.reorderLevel,
          unit: ing.unit,
        });
      }
    });

    return alerts;
  }, [menuItems, rawIngredients]);

  const restockIngredient = (ingredientId: string, addedQty: number, notes?: string) => {
    if (addedQty <= 0) return;
    const nowIso = new Date().toISOString();
    const target = rawIngredients.find((i) => i.id === ingredientId);
    if (!target) return;

    setRawIngredients((prev) =>
      prev.map((i) =>
        i.id === ingredientId
          ? {
              ...i,
              currentStock: roundKWD(i.currentStock + addedQty),
              lastRestockedAt: nowIso,
            }
          : i
      )
    );

    setInventoryLogs((prev) => [
      {
        id: `log-restock-${Date.now()}`,
        timestamp: nowIso,
        ingredientName: target.name,
        unit: target.unit,
        txType: 'RESTOCK',
        qtyDelta: roundKWD(addedQty),
        reference: notes || 'Manual Branch Restock',
        actorName: currentUser?.name || 'Manager',
      },
      ...prev,
    ]);

    playTerminalSound('paid');
    showToast(`Restocked +${addedQty} ${target.unit} of ${target.name}`, 'success');
  };

  const addShopExpense = (
    expense: Omit<ShopExpense, 'id' | 'branchId' | 'createdAt' | 'recordedBy'>
  ) => {
    const newExp: ShopExpense = {
      ...expense,
      id: `exp-${Date.now()}`,
      branchId: activeBranch.id,
      createdAt: new Date().toISOString(),
      amountKwd: roundKWD(expense.amountKwd),
      recordedBy: currentUser?.name || 'Branch Manager',
    };
    setShopExpenses((prev) => [newExp, ...prev]);
    playTerminalSound('paid');
    showToast(
      `Recorded Shop Expense: ${newExp.amountKwd.toFixed(3)} KWD (${newExp.category})`,
      'success'
    );
  };

  // ===========================================================================
  // SHIFT & CASH DRAWER MANAGEMENT
  // ===========================================================================
  const [activeShift, setActiveShift] = useState<ShiftSession | null>(() =>
    loadState<ShiftSession | null>('activeShift', null)
  );
  const [closedShifts, setClosedShifts] = useState<ClosedShiftReport[]>(() =>
    loadState<ClosedShiftReport[]>('closedShifts', [])
  );
  const shiftStartTime = activeShift?.openedAt ?? '';

  const openShift = (openingCashKwd: number): boolean => {
    if (!currentUser) return false;
    const safe = roundKWD(Math.max(0, openingCashKwd));
    const opened: ShiftSession = {
      id: newUuid(),
      shiftCode: `SHIFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(
        closedShifts.length + 1
      ).padStart(2, '0')}`,
      branchId: activeBranch.id,
      openedAt: new Date().toISOString(),
      openedBy: currentUser.name,
      openedById: currentUser.id,
      openingCashKwd: safe,
    };
    setActiveShift(opened);
    setOpeningFloatKwd(safe);
    playTerminalSound('paid');
    showToast(`Shift opened with ${safe.toFixed(3)} ${CURRENCY} opening cash`, 'success');
    return true;
  };

  // Live shift totals (everything since the shift was opened)
  const shiftSummary = useMemo<ShiftSummary | null>(() => {
    if (!activeShift) return null;
    const openedMs = new Date(activeShift.openedAt).getTime();
    let cash = 0;
    let knet = 0;
    let wamd = 0;
    let link = 0;
    let aggregator = 0;
    let voidedCount = 0;
    let voidedAmount = 0;
    posOrders.forEach((o) => {
      if (new Date(o.createdAt).getTime() < openedMs) return;
      const ext = (o.externalStatus || '').toLowerCase();
      if (o.status === 'voided' || ext === 'voided' || ext === 'cancelled' || ext === 'refunded') {
        voidedCount += 1;
        voidedAmount += o.grandTotalKwd;
        return;
      }
      if (o.isStaffPurchase || o.paymentMethod === 'staff_credit') return;
      if (o.paymentMethod === 'cash') cash += o.grandTotalKwd;
      else if (o.paymentMethod === 'knet') knet += o.grandTotalKwd;
      else if (o.paymentMethod === 'wamd') wamd += o.grandTotalKwd;
      else if (o.paymentMethod === 'payment_link') link += o.grandTotalKwd;
      else if (o.paymentMethod === 'aggregator_prepaid') aggregator += o.grandTotalKwd;
      else if (o.paymentMethod === 'split') {
        cash += o.cashTenderedKwd;
        knet += o.knetTenderedKwd;
      }
    });
    const cashExpenses = shopExpenses
      .filter((e) => e.paidVia === 'Cash Drawer' && new Date(e.createdAt).getTime() >= openedMs)
      .reduce((s, e) => s + e.amountKwd, 0);
    return {
      openingCashKwd: activeShift.openingCashKwd,
      cashSalesKwd: roundKWD(cash),
      knetSalesKwd: roundKWD(knet),
      wamdSalesKwd: roundKWD(wamd),
      linkSalesKwd: roundKWD(link),
      aggregatorSalesKwd: roundKWD(aggregator),
      cashExpensesKwd: roundKWD(cashExpenses),
      expectedCashKwd: roundKWD(activeShift.openingCashKwd + cash - cashExpenses),
      voidedCount,
      voidedAmountKwd: roundKWD(voidedAmount),
    };
  }, [activeShift, posOrders, shopExpenses]);

  /** Closes the shift: records Expected vs Actual drawer cash, saves the Z-report, signs out. */
  const closeShift = (actualCashKwd: number, notes = ''): ClosedShiftReport | null => {
    if (!activeShift || !shiftSummary || !currentUser) return null;
    const actual = roundKWD(actualCashKwd);
    const report: ClosedShiftReport = {
      id: newUuid(),
      shiftCode: activeShift.shiftCode,
      branchId: activeShift.branchId,
      openedAt: activeShift.openedAt,
      closedAt: new Date().toISOString(),
      openedBy: activeShift.openedBy,
      closedBy: currentUser.name,
      closedById: currentUser.id,
      openingCashKwd: activeShift.openingCashKwd,
      cashSalesKwd: shiftSummary.cashSalesKwd,
      knetSalesKwd: shiftSummary.knetSalesKwd,
      wamdSalesKwd: shiftSummary.wamdSalesKwd,
      linkSalesKwd: shiftSummary.linkSalesKwd,
      aggregatorSalesKwd: shiftSummary.aggregatorSalesKwd,
      cashExpensesKwd: shiftSummary.cashExpensesKwd,
      expectedCashKwd: shiftSummary.expectedCashKwd,
      actualCashKwd: actual,
      varianceKwd: roundKWD(actual - shiftSummary.expectedCashKwd),
      voidedCount: shiftSummary.voidedCount,
      voidedAmountKwd: shiftSummary.voidedAmountKwd,
      notes,
    };
    setClosedShifts((prev) => [report, ...prev].slice(0, 60));
    saveShiftReportToSupabase(report, activeBranch.tenantId);
    setActiveShift(null);
    setOpeningFloatKwd(0);
    const v = report.varianceKwd;
    showToast(
      Math.abs(v) < 0.0005
        ? 'Shift closed — drawer balanced'
        : v < 0
        ? `Shift closed — SHORTAGE of ${Math.abs(v).toFixed(3)} ${CURRENCY}`
        : `Shift closed — OVERAGE of ${v.toFixed(3)} ${CURRENCY}`,
      Math.abs(v) < 0.0005 ? 'success' : 'warning'
    );
    logout();
    return report;
  };

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_activeShift`, JSON.stringify(activeShift));
      localStorage.setItem(`${STORAGE_KEY}_closedShifts`, JSON.stringify(closedShifts));
    } catch {
      // ignore quota errors
    }
  }, [activeShift, closedShifts]);

  // ===========================================================================
  // OMNICHANNEL PROMO ENGINE
  // ===========================================================================
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  const refreshPromoCodes = async () => {
    const list = await fetchPromoCodesFromSupabase();
    if (list) setPromoCodes(list);
  };

  const removePromo = () => {
    if (!appliedPromo) return;
    setAppliedPromo(null);
    setDiscountPct(0);
    setIsFlatDiscount(false);
    setDiscountAmountKwd(0);
    setDiscountReason('');
  };

  const applyPromoCode = (rawCode: string): { ok: boolean; message: string } => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return { ok: false, message: 'Enter a promo code' };
    if (cartLines.length === 0) return { ok: false, message: 'Add items to the cart first' };
    const promo = promoCodes.find((p) => p.code === code);
    if (!promo) return { ok: false, message: 'Promo code not found' };
    if (!promo.isActive) return { ok: false, message: 'Promo code is inactive' };
    if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
      return { ok: false, message: 'Promo code has expired' };
    }
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return { ok: false, message: 'Promo code usage limit reached' };
    }
    if (cartSubtotalKwd < promo.minOrderKwd) {
      return {
        ok: false,
        message: `Minimum order ${promo.minOrderKwd.toFixed(3)} ${CURRENCY} required`,
      };
    }
    if (promo.type === 'percentage') {
      setIsFlatDiscount(false);
      setDiscountPct(Math.min(100, promo.value));
      setDiscountAmountKwd(0);
    } else {
      setIsFlatDiscount(true);
      setDiscountAmountKwd(promo.value);
      setDiscountPct(0);
    }
    setDiscountReason(`PROMO ${promo.code}`);
    setAppliedPromo(promo);
    playTerminalSound('paid');
    return {
      ok: true,
      message:
        promo.type === 'percentage'
          ? `${promo.code}: ${promo.value}% off applied`
          : `${promo.code}: ${promo.value.toFixed(3)} ${CURRENCY} off applied`,
    };
  };

  const createPromoCode = async (
    input: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'> & { id?: string }
  ): Promise<boolean> => {
    const saved = await savePromoCodeToSupabase(input, activeBranch.tenantId);
    if (!saved) {
      showToast('Could not save promo code to Supabase (check promo_codes table & policies)', 'warning');
      return false;
    }
    await refreshPromoCodes();
    showToast(`Promo ${saved.code} saved`, 'success');
    return true;
  };

  // ===========================================================================
  // CRM: customers
  // ===========================================================================
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);

  const refreshCustomers = async () => {
    const list = await fetchCustomersFromSupabase();
    if (list) setCustomers(list);
  };

  const lookupCustomerByPhone = (phone: string): CustomerRecord | undefined => {
    const clean = phone.replace(/[^0-9+]/g, '');
    if (clean.length < 6) return undefined;
    return customers.find((c) => c.phone === clean);
  };

  // ===========================================================================
  // POS ORDER PERSISTENCE (Supabase pos_orders) + CRM / PROMO SIDE EFFECTS
  // Orders not yet confirmed saved in Supabase are kept in localStorage so a failed sync can
  // never lose a bill; confirmed orders are re-loaded from Supabase.
  // ===========================================================================
  const orderSigRef = useRef<Map<string, string>>(new Map());
  const syncedOrderIdsRef = useRef<Set<string>>(new Set());
  const countedOrderIdsRef = useRef<Set<string>>(
    new Set<string>(posOrders.filter((o) => o.status === 'completed').map((o) => o.id))
  );

  const lastTenantRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const persistLocal = () => {
      try {
        const pending = posOrders.filter((o) => !syncedOrderIdsRef.current.has(o.id));
        localStorage.setItem(`${STORAGE_KEY}_localPosOrders`, JSON.stringify(pending));
      } catch {
        // ignore quota errors
      }
    };
    persistLocal();

    // Tenant id becomes known after the branches fetch: retry bills that could not be saved yet
    if (lastTenantRef.current !== activeBranch.tenantId) {
      lastTenantRef.current = activeBranch.tenantId;
      posOrders.forEach((o) => {
        if (!syncedOrderIdsRef.current.has(o.id)) orderSigRef.current.delete(o.id);
      });
    }

    posOrders.forEach((o) => {
      const isWebSourced = o.channel === 'chikarro_web' || o.source === 'WEB' || !!o.webOrderRef;
      const sig = `${o.status}|${o.paymentMethod}|${o.grandTotalKwd}|${o.orderStage ?? ''}`;
      if (!isWebSourced && orderSigRef.current.get(o.id) !== sig) {
        orderSigRef.current.set(o.id, sig);
        savePosOrderToSupabase(o, activeBranch.tenantId).then((ok) => {
          if (ok) {
            syncedOrderIdsRef.current.add(o.id);
            persistLocal();
          }
        });
      }

      // CRM + promo redemption: exactly once per paid, non-voided bill
      if (
        o.status === 'completed' &&
        !o.isStaffPurchase &&
        !countedOrderIdsRef.current.has(o.id)
      ) {
        countedOrderIdsRef.current.add(o.id);
        if (o.customerPhone) {
          recordCustomerOrderInSupabase(
            { name: o.customerName, phone: o.customerPhone, address: o.deliveryAddress },
            o.grandTotalKwd,
            activeBranch.tenantId
          ).then((rec) => {
            if (rec) {
              setCustomers((prev) => [rec, ...prev.filter((c) => c.id !== rec.id)]);
            }
          });
        }
        const promoMatch = /^PROMO (\S+)/.exec(o.discountReason || '');
        if (promoMatch) {
          const used = promoCodes.find((p) => p.code === promoMatch[1]);
          if (used) {
            incrementPromoUseInSupabase(used).then(() => refreshPromoCodes());
          }
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posOrders, activeBranch.tenantId]);

  const resetSystemToFactorySeed = () => {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(STORAGE_KEY)) {
        localStorage.removeItem(k);
      }
    });
    setBranches(SEED_BRANCHES);
    setActiveBranchId(SEED_BRANCHES[0].id);
    setStaffAccounts(SEED_STAFF_ACCOUNTS);
    setCategories(SEED_CATEGORIES);
    setMenuItems(SEED_MENU_ITEMS);
    setComboOffers(SEED_COMBO_OFFERS);
    setHeldOrders([]);
    setPosOrders([]);
    setWebOrders([]);
    setDeliveryRiders([]);
    setRawIngredients([]);
    setShopExpenses([]);
    setStaffCreditRecords([]);
    setInventoryLogs([]);
    setOpeningFloatKwd(0.000);
    setDineInTables(SEED_DINE_IN_TABLES);
    clearCart();
    showToast('System restored to clean production slate (Zero Mock Data)!', 'info');
  };

  return (
    <PosContext.Provider
      value={{
        multiBranchMode,
        setMultiBranchMode,
        branches,
        activeBranch,
        setActiveBranchId,
        updateBranchCommissions,
        staffAccounts,
        currentUser,
        loginWithPin,
        loginWithPassword,
        loginWithCredentials,
        logout,
        addOrUpdateStaffAccount,
        createInitialAdmin,
        staffDirectory,
        language,
        setLanguage,
        toggleLanguage,
        activeModule,
        setActiveModule,
        shiftStartTime,
        activeShift,
        closedShifts,
        shiftSummary,
        openShift,
        closeShift,
        promoCodes,
        appliedPromo,
        applyPromoCode,
        removePromo,
        createPromoCode,
        customers,
        lookupCustomerByPhone,
        openingFloatKwd,
        setOpeningFloatKwd,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        menuItems,
        comboOffers,
        saveComboOffer,
        toggleComboAvailability,
        deleteComboOffer,
        saveMenuItem,
        updateMenuItemPrice,
        toggleMenuItemAvailability,
        cartChannel,
        setCartChannel,
        selectedTableNo,
        setSelectedTableNo,
        dineInTables,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        deliveryAddress,
        setDeliveryAddress,
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
        cartTotalFoodCostKwd,
        heldOrders,
        holdCurrentCart,
        recallHeldOrder,
        deleteHeldOrder,
        posOrders,
        activeKotOrders,
        activeKitchenOrderId,
        loadKitchenOrderToCart,
        settleKitchenOrderDirectly,
        unbindKitchenOrder,
        sendCartToKitchen,
        cancelKitchenOrder,
        completeCheckout,
        voidSettledOrder,
        updatePosOrderStatus,
        autoPrintKotWithBill,
        setAutoPrintKotWithBill,
        overrideModalConfig,
        requestManagerOverride,
        closeManagerOverride,
        verifyManagerPin,
        activePrintOrder,
        printModalInitialTab,
        openPrintModal,
        closePrintModal,
        webOrders,
        deliveryRiders,
        pendingWebOrdersCount,
        dailyGrossSalesKwd,
        pendingWebOrders,
        acceptAndAutoBillWebOrder,
        acceptWebOrderFromBanner,
        updateWebOrderStatus,
        assignRiderToWebOrder,
        activeWebOrderAlert,
        dismissWebOrderAlert,
        selectWebOrderAlert,
        rawIngredients,
        inventoryLogs,
        lowStockIngredients,
        allLowStockItems,
        toggleItemStockTracking,
        updateItemStockQuantity,
        updateItemStockThreshold,
        restockIngredient,
        shopExpenses,
        addShopExpense,
        toastMessage,
        showToast,
        receiptConfig,
        updateReceiptConfig,
        activeStaffPurchaseRecipient,
        setActiveStaffPurchaseRecipient,
        staffCreditRecords,
        settleStaffCreditRecord,
        directPrintDoc,
        triggerDirectPrint,
        printerStatus,
        clearDirectPrintDoc,
        isCloudSyncing,
        cloudSyncStatus,
        cloudSyncError,
        lastCloudSyncAt,
        refetchCloudCatalog,
        resetSystemToFactorySeed,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = (): PosContextValue => {
  const ctx = useContext(PosContext);
  if (!ctx) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return ctx;
};

