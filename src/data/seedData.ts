import {
  Category,
  ComboOffer,
  DeliveryRider,
  DineInTable,
  DrinkOption,
  IncomingWebOrder,
  MenuItem,
  PaidAddonOption,
  PosOrderRecord,
  RawIngredient,
  ShopExpense,
  SideUpgradeOption,
  StaffAccount,
  TenantBranch,
} from '../types/pos';
import { BRAND_NAME } from '../config/brandConfig';

// Neutral placeholder so the app has an active branch before the Supabase branches table loads.
// Real branch details are fetched from Supabase and replace this entry.
export const SEED_BRANCHES: TenantBranch[] = [
  {
    id: 'branch-default',
    tenantName: BRAND_NAME,
    tenantSlug: '',
    branchCode: '',
    branchName: 'Main Branch',
    area: '',
    address: '',
    phone: '',
    printerIp: '',
    websiteDomain: '',
    commissions: {
      keeta: 18.0,
      chikarro_web: 0.0,
    },
  },
];

// Staff accounts are loaded strictly from Supabase (staff_users). No demo users.
export const SEED_STAFF_ACCOUNTS: StaffAccount[] = [];

export const SEED_CATEGORIES: Category[] = [
  {
    id: '879809c5-bf5b-4aa4-a497-85549906c7a3',
    slug: 'deals-combos',
    nameEn: 'Deals & Combos',
    nameAr: 'عروض الكومبو والتوفير',
    icon: 'Flame',
    sortOrder: 1,
    showIcon: true,
  },
  {
    id: 'c2161df6-9ba0-4a32-81ad-581038df3dad',
    slug: 'burgers-wraps',
    nameEn: 'Burgers & Wraps',
    nameAr: 'برجر ولفائف',
    icon: 'Sandwich',
    sortOrder: 2,
    showIcon: true,
  },
  {
    id: '46c81c0a-300c-4349-8b41-6bdb62780c7b',
    slug: 'prawns-special',
    nameEn: 'Prawns Special',
    nameAr: 'أطباق روبيان خاصة',
    icon: 'Utensils',
    sortOrder: 3,
    showIcon: true,
  },
  {
    id: '1ece624d-a9f2-4ab7-82cc-567932e1416a',
    slug: 'loaded-fries',
    nameEn: 'Loaded Fries',
    nameAr: 'بطاطس مقلية محملة',
    icon: 'Sparkles',
    sortOrder: 4,
    showIcon: true,
  },
  {
    id: 'ff643ddf-60db-4c7a-9703-0fc77954bac6',
    slug: 'kids-meals',
    nameEn: 'Kids Meals',
    nameAr: 'وجبات الأطفال',
    icon: 'Smile',
    sortOrder: 5,
    showIcon: true,
  },
  {
    id: '46ea24e0-00aa-4367-9e7b-06c08c4d05a1',
    slug: 'sides-snacks',
    nameEn: 'Sides & Snacks',
    nameAr: 'مقبلات وسناكس',
    icon: 'Layers',
    sortOrder: 6,
    showIcon: true,
  },
  {
    id: '23608f56-935a-47ff-b8fd-b4c7502f9255',
    slug: 'juices-mojitos',
    nameEn: 'Juices & Mojitos',
    nameAr: 'عصائر وموهيتو',
    icon: 'GlassWater',
    sortOrder: 7,
    showIcon: true,
  },
  {
    id: 'ab566596-4f71-4221-a74b-cb1e2852121f',
    slug: 'shake-lassi',
    nameEn: 'Shake & Lassi',
    nameAr: 'شيك ولاسي',
    icon: 'CupSoda',
    sortOrder: 8,
    showIcon: true,
  },
  {
    id: '89044163-601e-459f-8bb5-ecc31d49a732',
    slug: 'dips-sauce',
    nameEn: 'Dips & Sauce',
    nameAr: 'صلصات وتغميسات',
    icon: 'Soup',
    sortOrder: 9,
    showIcon: true,
  },
  {
    id: '5be775a6-c5e3-43f8-a70c-cb51d67decef',
    slug: 'add-on',
    nameEn: 'Add On',
    nameAr: 'إضافات',
    icon: 'PlusCircle',
    sortOrder: 10,
    showIcon: true,
  },
  {
    id: 'a4546fcd-6f32-4898-8061-e36fcd835ec9',
    slug: 'soft-drinks',
    nameEn: 'Soft Drinks',
    nameAr: 'مشروبات غازية ومياه',
    icon: 'CupSoda',
    sortOrder: 11,
    showIcon: true,
  },
];

// Raw ingredients are sourced strictly from Supabase (raw_ingredients). No mock inventory.
export const SEED_RAW_INGREDIENTS: RawIngredient[] = [];

// Menu items are loaded strictly from Supabase (menu_items). No demo catalog.
export const SEED_MENU_ITEMS: MenuItem[] = [];

// Combo offers are created in the Combo Studio / loaded from Supabase. No demo combos.
export const SEED_COMBO_OFFERS: ComboOffer[] = [];

export const SIDE_UPGRADE_OPTIONS: SideUpgradeOption[] = [
  { id: 'side-fries', nameEn: 'Standard Crinkle Fries', nameAr: 'بطاطس كرينكل عادي', priceDeltaKwd: 0.000 },
  { id: 'side-coleslaw', nameEn: 'Creamy Coleslaw Cup', nameAr: 'كول سلو كريمي', priceDeltaKwd: 0.000 },
  { id: 'side-hommos', nameEn: 'Beirut Hommos Upgrade', nameAr: 'حمص بيروتي', priceDeltaKwd: 0.250 },
  { id: 'side-garlic-bread', nameEn: 'Toasted Cheese Garlic Bread', nameAr: 'خبز بالثوم والجبن', priceDeltaKwd: 0.350 },
  { id: 'side-spicy-rice', nameEn: 'Spiced Machboos Rice Bowl', nameAr: 'أرز مبهر على الطريقة الكويتية', priceDeltaKwd: 0.400 },
];

export const DRINK_SELECTION_OPTIONS: DrinkOption[] = [
  { id: 'drk-pepsi', nameEn: 'Pepsi (Chilled)', nameAr: 'بيبسي', priceDeltaKwd: 0.000 },
  { id: 'drk-diet-pepsi', nameEn: 'Diet Pepsi Zero Sugar', nameAr: 'دايت بيبسي', priceDeltaKwd: 0.000 },
  { id: 'drk-mirinda', nameEn: 'Mirinda Orange', nameAr: 'ميرندا برتقال', priceDeltaKwd: 0.000 },
  { id: 'drk-7up', nameEn: '7Up Lemon-Lime', nameAr: 'سفن أب', priceDeltaKwd: 0.000 },
  { id: 'drk-kinza', nameEn: 'Kinza Citrus', nameAr: 'كينزا حمضيات', priceDeltaKwd: 0.000 },
  { id: 'drk-225l-upgrade', nameEn: 'Upgrade to 2.25L Family Pepsi', nameAr: 'ترقية بيبسي عائلي ٢.٢٥ لتر', priceDeltaKwd: 0.500 },
];

export const PAID_ADDON_OPTIONS: PaidAddonOption[] = [
  { id: 'add-garlic', nameEn: 'Extra Garlic Paste Tub', nameAr: 'ثوم إضافي', priceKwd: 0.150 },
  { id: 'add-cheddar', nameEn: 'Melted Cheddar Slice', nameAr: 'شريحة جبن شيدر', priceKwd: 0.200 },
  { id: 'add-spicy-dip', nameEn: 'Fiery Volcano Dip Cup', nameAr: 'صوص بركان حار', priceKwd: 0.200 },
  { id: 'add-jalapeno', nameEn: 'Pickled Jalapeño Rings', nameAr: 'هالابينو مخلل', priceKwd: 0.150 },
  { id: 'add-bun', nameEn: 'Extra Brioche Dinner Bun', nameAr: 'خبز بريوش إضافي', priceKwd: 0.100 },
];

export const SEED_DINE_IN_TABLES: DineInTable[] = [
  { tableNo: 'T-01', zone: 'Main Hall', seats: 4, status: 'free' },
  { tableNo: 'T-02', zone: 'Main Hall', seats: 4, status: 'free' },
  { tableNo: 'T-03', zone: 'Main Hall', seats: 2, status: 'free' },
  { tableNo: 'T-04', zone: 'Main Hall', seats: 6, status: 'free' },
  { tableNo: 'F-01', zone: 'Family Booth', seats: 8, status: 'free' },
  { tableNo: 'F-02', zone: 'Family Booth', seats: 8, status: 'free' },
  { tableNo: 'F-03', zone: 'Family Booth', seats: 6, status: 'free' },
  { tableNo: 'P-01', zone: 'Outdoor Patio', seats: 4, status: 'free' },
];

/**
 * Production Empty States:
 * All delivery riders, incoming web orders, initial POS orders, and shop expenses
 * initialize strictly to clean empty arrays `[]` awaiting real database ingestion.
 */
export const SEED_DELIVERY_RIDERS: DeliveryRider[] = [];

// Production Empty States
export const SEED_INCOMING_WEB_ORDERS: IncomingWebOrder[] = [];

export const SEED_INITIAL_POS_ORDERS: PosOrderRecord[] = [];

export const SEED_SHOP_EXPENSES: ShopExpense[] = [];

