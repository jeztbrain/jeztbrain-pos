export type RoleTier =
  | 'staff'
  | 'cashier'
  | 'supervisor'
  | 'storekeeper'
  | 'manager'
  | 'admin';

export type AppLanguage = 'en' | 'ar';

export type ActiveModule =
  | 'pos'
  | 'web-orders'
  | 'catalog'
  | 'print-engine'
  | 'erp';

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline_fallback' | 'error';

export type OrderChannel =
  | 'dine_in'
  | 'takeaway'
  | 'chikarro_web'
  | 'keeta';

export type PaymentMethod =
  | 'cash'
  | 'knet'
  | 'wamd'
  | 'payment_link'
  | 'split'
  | 'aggregator_prepaid'
  | 'staff_credit';

export type PrepStyle = 'Spicy' | 'Regular' | 'Mixed';

export interface ReceiptStoreConfig {
  storeTitle: string;
  subtitleAr: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  websiteDomain: string;
  footerMessage: string;
}

export interface StaffCreditRecord {
  id: string;
  staffId: string;
  staffName: string;
  employeeCode: string;
  createdAt: string;
  itemsSummary: string;
  items: CartLineItem[];
  totalAmountKwd: number;
  status: 'unpaid' | 'settled';
  settledAt?: string;
  settledBy?: string;
  settleNotes?: string;
  posOrderId?: string;
  invoiceNo?: string;
}

export interface TenantBranch {
  tenantId?: string;
  id: string;
  tenantName: string;
  tenantSlug: string;
  branchCode: string;
  branchName: string;
  area: string;
  address: string;
  phone: string;
  printerIp: string;
  websiteDomain: string;
  commissions: {
    keeta: number;
    chikarro_web: number;
  };
}

export interface StaffAccount {
  id: string;
  employeeCode: string;
  name: string;
  title: string;
  role: RoleTier;
  pin: string;
  password: string;
  maxDiscountPct: number;
  canVoidBills: boolean;
  canManageCombos: boolean;
  canViewMargins: boolean;
  avatarBadge: string;
}

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  icon?: string | null;
  sortOrder: number;
  showIcon?: boolean;
}

export interface BomRecipeLine {
  rawIngredientId: string;
  qtyPerUnit: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  description: string;
  priceKwd: number;
  costKwd: number;
  requiresCustomization: boolean;
  prepTimeMins: number;
  badge?: string;
  visualEmoji: string;
  accentGradient: string;
  isAvailable: boolean;
  bom: BomRecipeLine[];
  isCombo?: boolean;
  comboIncludes?: string[];
  // Universal Dynamic Stock Tracking (Admin Configurable)
  trackStock?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number; // default: 5
}

export interface ComboSubItem {
  menuItemId: string;
  nameEn: string;
  nameAr: string;
  quantity: number;
  unitPriceKwd: number;
  unitCostKwd: number;
}

export interface ComboOffer {
  id: string;
  code: string;
  headingEn: string;
  headingAr: string;
  promoTag: string;
  items: ComboSubItem[];
  originalValueKwd: number;
  comboPriceKwd: number;
  totalCostKwd: number;
  isAvailable: boolean;
  accentColor: string;
  createdAt: string;
}

export interface PaidAddonOption {
  id: string;
  nameEn: string;
  nameAr: string;
  priceKwd: number;
}

export interface SideUpgradeOption {
  id: string;
  nameEn: string;
  nameAr: string;
  priceDeltaKwd: number;
}

export interface DrinkOption {
  id: string;
  nameEn: string;
  nameAr: string;
  priceDeltaKwd: number;
}

export interface CartItemCustomization {
  prepStyle?: PrepStyle;
  sideChoice?: SideUpgradeOption;
  drinkChoice?: DrinkOption;
  addons: PaidAddonOption[];
  kitchenNotes?: string;
}

export interface CartLineItem {
  lineId: string;
  type: 'ITEM' | 'COMBO';
  refId: string;
  skuOrCode: string;
  titleEn: string;
  titleAr: string;
  quantity: number;
  baseUnitPriceKwd: number;
  unitPriceKwd: number; // includes side/drink/addon deltas
  unitCostKwd: number;
  customization?: CartItemCustomization;
  comboSubItems?: ComboSubItem[];
  promoTag?: string;
  description?: string;
  comboIncludes?: string[];
  isCombo?: boolean;
}

export interface HeldOrder {
  id: string;
  holdCode: string;
  heldAt: string;
  heldBy: string;
  channel: OrderChannel;
  tableNo?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: CartLineItem[];
  discountPct: number;
  discountReason?: string;
  isFlatDiscount?: boolean;
  kotPrinted?: boolean;
}

export interface PosOrderRecord {
  id: string;
  branchId: string;
  invoiceNo: string;
  tokenNo: number;
  createdAt: string;
  channel: OrderChannel;
  status: 'cooking' | 'ready' | 'completed' | 'voided' | 'cancelled';
  tableNo?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: CartLineItem[];
  subtotalKwd: number;
  discountPct: number;
  discountKwd: number;
  discountReason?: string;
  managerOverrideBy?: string;
  deliveryFeeKwd: number;
  grandTotalKwd: number;
  totalFoodCostKwd: number;
  paymentMethod: PaymentMethod;
  cashTenderedKwd: number;
  knetTenderedKwd: number;
  changeDueKwd: number;
  cashierId: string;
  cashierName: string;
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: string;
  webOrderRef?: string;
  isFlatDiscount?: boolean;
  kotPrinted?: boolean;
  orderStage?: 'kitchen' | 'billed';
  isStaffPurchase?: boolean;
  source?: 'POS' | 'WEB' | string;
  orderType?: string;
  externalStatus?: string; // e.g. 'Delivered', 'Completed', 'Accepted', 'Cooking', 'Ready'
  staffCreditRecipientId?: string;
  staffCreditRecipientName?: string;
}

export interface LowStockAlertItem {
  id: string;
  type: 'menu_item' | 'raw_ingredient';
  name: string;
  sku: string;
  currentStock: number;
  threshold: number;
  unit: string;
}

export type WebDispatchStatus =
  | 'Pending'
  | 'Cooking'
  | 'Ready'
  | 'Out for Delivery'
  | 'Delivered';

export interface DeliveryRider {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  status: 'available' | 'busy';
  activeOrders: number;
}

export interface WebOrderLine {
  refId: string;
  type: 'ITEM' | 'COMBO';
  titleEn: string;
  titleAr: string;
  quantity: number;
  unitPriceKwd: number;
  prepStyle: PrepStyle;
  notes?: string;
  comboSubItems?: ComboSubItem[];
}

export interface IncomingWebOrder {
  id: string;
  branchId: string;
  webOrderNo: string;
  receivedAt: string;
  customerName: string;
  customerPhone: string;
  area: string;
  blockNo: string;
  streetNo: string;
  buildingNo: string;
  floorApt: string;
  landmarkNotes: string;
  paymentMode: 'K-Net Online' | 'Wamd Instant' | 'Cash on Delivery';
  isPaid: boolean;
  items: WebOrderLine[];
  subtotalKwd: number;
  deliveryFeeKwd: number;
  totalKwd: number;
  status: WebDispatchStatus;
  assignedRiderId?: string;
  linkedPosInvoiceNo?: string;
  linkedPosOrderId?: string;
}

export interface RawIngredient {
  id: string;
  sku: string;
  name: string;
  unit: 'pcs' | 'kg' | 'L' | 'tubs' | 'boxes' | 'cans';
  currentStock: number;
  reorderLevel: number;
  unitCostKwd: number;
  supplier: string;
  lastRestockedAt: string;
}

export interface InventoryLogEntry {
  id: string;
  timestamp: string;
  ingredientName: string;
  unit: string;
  txType: 'SALE_DEDUCTION' | 'RESTOCK' | 'WASTAGE' | 'VOID_RESTOCK';
  qtyDelta: number;
  reference: string;
  actorName: string;
}

export interface ShopExpense {
  id: string;
  branchId: string;
  createdAt: string;
  category:
    | 'Produce & Supplies'
    | 'Packaging & Boxes'
    | 'Driver Fuel'
    | 'Equipment Maintenance'
    | 'Petty Cash';
  description: string;
  amountKwd: number;
  paidVia: 'Cash Drawer' | 'Bank Transfer' | 'K-Net Corporate';
  recordedBy: string;
}

export interface DineInTable {
  tableNo: string;
  zone: 'Main Hall' | 'Family Booth' | 'Outdoor Patio';
  seats: number;
  status: 'free' | 'occupied';
  activeOrderToken?: number;
}


// ---------------------------------------------------------------------------
// SHIFT & CASH DRAWER RECONCILIATION
// ---------------------------------------------------------------------------
export interface ShiftSession {
  id: string;
  shiftCode: string;
  branchId: string;
  openedAt: string;
  openedBy: string;
  openedById: string;
  openingCashKwd: number;
}

export interface ClosedShiftReport {
  id: string;
  shiftCode: string;
  branchId: string;
  openedAt: string;
  closedAt: string;
  openedBy: string;
  closedBy: string;
  closedById: string;
  openingCashKwd: number;
  cashSalesKwd: number;
  knetSalesKwd: number;
  wamdSalesKwd: number;
  linkSalesKwd: number;
  aggregatorSalesKwd: number;
  cashExpensesKwd: number;
  expectedCashKwd: number;
  actualCashKwd: number;
  varianceKwd: number; // actual - expected (negative = shortage, positive = overage)
  voidedCount: number;
  voidedAmountKwd: number;
  notes: string;
}

// ---------------------------------------------------------------------------
// OMNICHANNEL PROMO ENGINE & CRM
// ---------------------------------------------------------------------------
export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // % (0-100) or fixed KWD amount
  minOrderKwd: number;
  maxUses: number | null; // null = unlimited
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpentKwd: number;
  lastOrderAt: string;
  createdAt: string;
}

/** Outcome of the last staff directory (Supabase staff_users) fetch. */
export interface StaffDirectoryState {
  /** idle: not fetched yet | ok: fetched | table_missing: staff_users not in the project | error: network / auth / RLS failure */
  status: 'idle' | 'ok' | 'table_missing' | 'error';
  message?: string;
}

export interface ShiftSummary {
  openingCashKwd: number;
  cashSalesKwd: number;
  knetSalesKwd: number;
  wamdSalesKwd: number;
  linkSalesKwd: number;
  aggregatorSalesKwd: number;
  cashExpensesKwd: number;
  expectedCashKwd: number;
  voidedCount: number;
  voidedAmountKwd: number;
}
