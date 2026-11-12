import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  BomRecipeLine,
  CartLineItem,
  Category,
  ComboOffer,
  ComboSubItem,
  DeliveryRider,
  IncomingWebOrder,
  MenuItem,
  OrderChannel,
  PaymentMethod,
  PosOrderRecord,
  PrepStyle,
  RawIngredient,
  ReceiptStoreConfig,
  StaffAccount,
  TenantBranch,
  WebOrderLine,
} from '../types/pos';
import { BRAND_NAME, SHORT_NAME } from '../config/brandConfig';
import { roundKWD } from '../utils/formatters';

// Strictly read Vite environment variables
// Desktop (.exe) runtime .env override wins; otherwise the values Vite inlined at build time.
const desktopEnv: Record<string, string> =
  (typeof window !== 'undefined' && window.posDesktop?.env) || {};
const envSupabaseUrl = desktopEnv.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const envSupabaseAnonKey = desktopEnv.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!envSupabaseUrl) {
  console.warn(
    '[CHIKARRO Supabase Warning] VITE_SUPABASE_URL is missing in environment variables (.env). Falling back to default project URL.'
  );
}

if (!envSupabaseAnonKey) {
  console.warn(
    '[CHIKARRO Supabase Warning] VITE_SUPABASE_ANON_KEY is missing in environment variables (.env). Falling back to default publishable key.'
  );
}

export const SUPABASE_URL =
  (envSupabaseUrl && envSupabaseUrl.trim()) ||
  'https://ntnjinkhxntenmkcufjb.supabase.co';

export const SUPABASE_ANON_KEY =
  (envSupabaseAnonKey && envSupabaseAnonKey.trim()) ||
  'sb_publishable_tTeHKqnl83ablrmGbnZ6FA_qGCm1MwI';

console.info('[CHIKARRO Supabase Init] Initializing Supabase client:', {
  url: SUPABASE_URL,
  hasEnvUrl: Boolean(envSupabaseUrl),
  hasEnvKey: Boolean(envSupabaseAnonKey),
});

/**
 * Official Supabase Client for CHIKARRO POS & ERP (Powered by JeztBrain)
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Returns true if the Supabase client is properly initialized with a valid URL and Key
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_URL.startsWith('http')
  );
}

/**
 * 11 Official Standard Categories for CHIKARRO QSR POS & ERP:
 * Strictly matches the updated Supabase `public.categories` schema.
 */
export const OFFICIAL_CHIKARRO_CATEGORIES: Category[] = [
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

/**
 * Assigns appropriate icons and Arabic translations based on category name.
 */
export function getCategoryMeta(name: string): { icon: string; nameAr: string } {
  const n = (name || '').toLowerCase().trim();
  if (n.includes('deal') || n.includes('combo')) {
    return { icon: 'Flame', nameAr: 'عروض الكومبو والتوفير' };
  }
  if (n.includes('burger') || n.includes('wrap')) {
    return { icon: 'Sandwich', nameAr: 'برجر ولفائف' };
  }
  if (n.includes('prawn')) {
    return { icon: 'Utensils', nameAr: 'أطباق روبيان خاصة' };
  }
  if (n.includes('loaded') || n.includes('fries')) {
    return { icon: 'Sparkles', nameAr: 'بطاطس مقلية محملة' };
  }
  if (n.includes('kid')) {
    return { icon: 'Smile', nameAr: 'وجبات الأطفال' };
  }
  if (n.includes('side') || n.includes('snack')) {
    return { icon: 'Layers', nameAr: 'مقبلات وسناكس' };
  }
  if (n.includes('juice') || n.includes('mojito')) {
    return { icon: 'GlassWater', nameAr: 'عصائر وموهيتو' };
  }
  if (n.includes('shake') || n.includes('lassi')) {
    return { icon: 'CupSoda', nameAr: 'شيك ولاسي' };
  }
  if (n.includes('dip') || n.includes('sauce')) {
    return { icon: 'Soup', nameAr: 'صلصات وتغميسات' };
  }
  if (n.includes('add on') || n.includes('addon') || n.includes('extra')) {
    return { icon: 'PlusCircle', nameAr: 'إضافات' };
  }
  if (n.includes('soft') || n.includes('drink') || n.includes('beverage') || n.includes('pepsi')) {
    return { icon: 'CupSoda', nameAr: 'مشروبات غازية ومياه' };
  }
  return { icon: 'Utensils', nameAr: name };
}

/**
 * Map raw database row from Supabase `categories` table into typed POS `Category`.
 */
export function mapDbCategoryToCategory(
  row: Record<string, any>,
  index = 0
): Category {
  const id = String(row.id || `cat-${index + 1}`).trim();
  const nameEn = String(
    row.name ?? row.name_en ?? row.nameEn ?? row.title ?? `Category ${index + 1}`
  ).trim();

  const meta = getCategoryMeta(nameEn);
  const nameAr = String(
    row.name_ar ?? row.nameAr ?? meta.nameAr ?? nameEn
  ).trim();

  const slug = (row.slug ?? nameEn)
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const icon = row.icon_name ?? row.iconName ?? row.icon ?? meta.icon;
  const sortOrder = Number(
    row.display_order ?? row.sort_order ?? row.sortOrder ?? index + 1
  );

  return {
    id,
    slug,
    nameEn,
    nameAr,
    icon,
    sortOrder: isNaN(sortOrder) ? index + 1 : sortOrder,
    showIcon: true,
  };
}

/**
 * Map raw database row from Supabase `menu_items` table into typed POS `MenuItem`.
 * Directly binds to `item.name`, `item.category_id`, and `Number(item.price).toFixed(3)` from Supabase.
 */
export function mapDbMenuItemToMenuItem(
  row: Record<string, any>,
  index = 0
): MenuItem {
  const rawPrice = Number(
    row.price ?? row.price_kwd ?? row.priceKwd ?? row.unit_price ?? 0
  );
  const priceKwd = roundKWD(isNaN(rawPrice) ? 0 : rawPrice);

  const rawCost =
    row.cost !== undefined || row.cost_kwd !== undefined || row.costKwd !== undefined
      ? Number(row.cost ?? row.cost_kwd ?? row.costKwd ?? 0)
      : roundKWD(priceKwd * 0.42);
  const costKwd = roundKWD(isNaN(rawCost) ? 0 : rawCost);

  const nameEn = String(
    row.name ??
    row.name_en ??
    row.nameEn ??
    row.title ??
    `Item #${index + 1}`
  ).trim();

  const nameAr = String(
    row.name_ar ??
    row.nameAr ??
    row.name ??
    nameEn
  ).trim();

  const idStr = String(row.id || `itm-${index + 1}`).trim();
  const categoryId = String(row.category_id || row.categoryId || '').trim();

  const sku = (
    row.sku_code ??
    row.skuCode ??
    row.sku ??
    idStr.slice(0, 8)
  )
    .toString()
    .toUpperCase();

  const description = String(
    row.description ??
    row.description_en ??
    row.descriptionEn ??
    ''
  );

  const isCombo = Boolean(row.is_combo);
  const comboIncludes: string[] = Array.isArray(row.combo_includes)
    ? row.combo_includes
    : typeof row.combo_includes === 'string'
    ? JSON.parse(row.combo_includes)
    : [];

  const lowerName = nameEn.toLowerCase();
  const requiresCustomization =
    Boolean(row.requires_customization) ||
    lowerName.includes('meal') ||
    lowerName.includes('combo') ||
    lowerName.includes('box') ||
    lowerName.includes('burger') ||
    lowerName.includes('wrap');

  const stockQuantity =
    row.stock !== undefined && row.stock !== null
      ? Number(row.stock)
      : row.stock_quantity !== undefined && row.stock_quantity !== null
      ? Number(row.stock_quantity)
      : 100;

  const trackStock = Boolean(row.track_stock);

  const visualEmoji =
    lowerName.includes('drink') || lowerName.includes('pepsi') || lowerName.includes('water')
      ? '🥤'
      : lowerName.includes('juice') || lowerName.includes('mojito')
      ? '🍹'
      : lowerName.includes('shake') || lowerName.includes('lassi') || lowerName.includes('falooda')
      ? '🧋'
      : lowerName.includes('fries')
      ? '🍟'
      : lowerName.includes('sauce') || lowerName.includes('dip') || lowerName.includes('mayo')
      ? '🥣'
      : lowerName.includes('prawn')
      ? '🍤'
      : lowerName.includes('burger') || lowerName.includes('sandwich') || lowerName.includes('wrap')
      ? '🍔'
      : lowerName.includes('deal') || lowerName.includes('meal') || lowerName.includes('bucket')
      ? '🍗'
      : '🍽️';

  const accentGradient =
    row.image_gradient ??
    row.imageGradient ??
    row.accentGradient ??
    'from-amber-500/25 via-red-600/15 to-transparent';

  const bom = Array.isArray(row.bom)
    ? row.bom.map((b: any) => ({
        rawIngredientId: String(b.rawIngredientId || b.raw_ingredient_id || ''),
        qtyPerUnit: Number(b.qtyPerUnit || b.qty_per_unit || 1),
      }))
    : [];

  return {
    id: idStr,
    categoryId,
    sku,
    nameEn,
    nameAr,
    description,
    priceKwd,
    costKwd,
    requiresCustomization,
    prepTimeMins: Number(row.prep_time_mins || 8),
    badge: isCombo ? 'COMBO' : undefined,
    visualEmoji,
    accentGradient,
    isAvailable: row.is_available !== false,
    bom,
    isCombo,
    comboIncludes,
    trackStock,
    stockQuantity,
    lowStockThreshold: 5,
  };
}

/**
 * Converts live database items or MenuItem objects into official POS ComboOffer structures.
 * Strictly guarantees accurate name, price (3-decimal KWD), and SKU extraction from DB.
 */
export function mapDbItemToComboOffer(row: Record<string, any>): ComboOffer {
  const code = (
    row.sku ||
    row.sku_code ||
    row.skuCode ||
    row.id ||
    `CMB-${Math.random().toString(36).slice(2, 6)}`
  )
    .toString()
    .toUpperCase();

  const headingEn = (
    row.nameEn ??
    row.name_en ??
    row.name ??
    row.headingEn ??
    row.title ??
    'Combo Deal'
  ).toString();

  const headingAr = (
    row.nameAr ??
    row.name_ar ??
    row.headingAr ??
    headingEn
  ).toString();

  const rawPrice = Number(
    row.priceKwd ??
    row.price ??
    row.price_kwd ??
    row.comboPriceKwd ??
    row.unit_price ??
    0
  );
  const priceKwd = roundKWD(isNaN(rawPrice) ? 0 : rawPrice);

  const rawOrig = Number(
    row.originalValueKwd ??
    row.original_value_kwd ??
    (priceKwd > 0 ? priceKwd * 1.25 : 0)
  );
  const originalValueKwd = roundKWD(isNaN(rawOrig) ? priceKwd : rawOrig);

  const rawCost = Number(
    row.totalCostKwd ??
    row.costKwd ??
    row.cost_kwd ??
    row.cost ??
    priceKwd * 0.42
  );
  const totalCostKwd = roundKWD(isNaN(rawCost) ? 0 : rawCost);

  const rawIncludes: string[] = Array.isArray(row.comboIncludes)
    ? row.comboIncludes
    : Array.isArray(row.combo_includes)
    ? row.combo_includes
    : typeof row.combo_includes === 'string'
    ? JSON.parse(row.combo_includes)
    : typeof row.comboIncludes === 'string'
    ? JSON.parse(row.comboIncludes)
    : [];

  const items: ComboSubItem[] = rawIncludes.map((incText, idx) => ({
    menuItemId: `${code}-sub-${idx + 1}`,
    nameEn: incText,
    nameAr: incText,
    quantity: 1,
    unitPriceKwd: 0,
    unitCostKwd: 0,
  }));

  const headingUpper = headingEn.toUpperCase();
  const promoTag = headingUpper.includes('FAMILY')
    ? 'FAMILY MEAL'
    : headingUpper.includes('PARTY')
    ? 'PARTY BUCKET'
    : headingUpper.includes('SUPER')
    ? 'SUPER DEAL'
    : headingUpper.includes('BUDGET')
    ? 'BUDGET VALUE'
    : headingUpper.includes('SNACK')
    ? 'SNACK BOX'
    : headingUpper.includes('STRIP')
    ? 'STRIP COMBO'
    : headingUpper.includes('PRAWN')
    ? 'PRAWNS COMBO'
    : headingUpper.includes('BURGER') || headingUpper.includes('WRAP')
    ? 'BURGER COMBO'
    : 'SPECIAL DEAL';

  return {
    id: String(row.id),
    code,
    headingEn,
    headingAr,
    promoTag,
    items,
    originalValueKwd,
    comboPriceKwd: priceKwd,
    totalCostKwd,
    isAvailable: row.is_available !== false && row.isAvailable !== false,
    accentColor: 'amber',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

/**
 * Standard Supabase Cloud fetch: Categories
 * Fetches categories dynamically from Supabase `public.categories` ordered by `display_order` ASC,
 * supporting the exact 11 official categories and keeping Soft Drinks visible.
 */
export async function fetchCategoriesFromSupabase(): Promise<{
  data: Category[] | null;
  error: Error | null;
}> {
  try {
    console.info('[Supabase Cloud Sync] Fetching categories from Supabase ordered by display_order ASC...');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.warn(
        '[Supabase Cloud Sync] categories query notice:',
        error.message
      );
      return { data: OFFICIAL_CHIKARRO_CATEGORIES, error: null };
    }

    if (!data || data.length === 0) {
      return { data: OFFICIAL_CHIKARRO_CATEGORIES, error: null };
    }

    const mapped = data.map((row, idx) => mapDbCategoryToCategory(row, idx));

    // Ensure Soft Drinks exists in the returned categories list so it stays visible even when its count is 0
    const hasSoftDrinks = mapped.some((c) => c.nameEn.toLowerCase().includes('soft drink'));
    if (!hasSoftDrinks) {
      const softDrinksCat = OFFICIAL_CHIKARRO_CATEGORIES.find((c) =>
        c.nameEn.toLowerCase().includes('soft drink')
      );
      if (softDrinksCat) mapped.push(softDrinksCat);
    }

    // Sort strictly by sortOrder (display_order)
    mapped.sort((a, b) => a.sortOrder - b.sortOrder);

    console.info(
      `[Supabase Cloud Sync] Ready with ${mapped.length} official categories:`,
      mapped.map((c) => `${c.sortOrder}: ${c.nameEn} (ID: ${c.id})`)
    );
    return { data: mapped, error: null };
  } catch (err: any) {
    console.warn('[Supabase Cloud Sync] Exception fetching categories:', err);
    return { data: OFFICIAL_CHIKARRO_CATEGORIES, error: null };
  }
}

/**
 * Standard Supabase Cloud fetch: Menu Items
 * Strictly formats all prices to 3-decimal KWD (`0.000 KWD`) and extracts combo deals.
 */
export async function fetchMenuItemsFromSupabase(): Promise<{
  data: MenuItem[] | null;
  error: Error | null;
}> {
  try {
    console.info('[Supabase Cloud Sync] Fetching menu_items from Supabase...');
    const { data, error } = await supabase.from('menu_items').select('*');

    if (error) {
      console.error(
        '[Supabase Cloud Sync] Error fetching menu_items:',
        error.message,
        error
      );
      return { data: null, error: new Error(error.message) };
    }

    if (!data || data.length === 0) {
      console.warn(
        '[Supabase Cloud Sync] `menu_items` query succeeded (HTTP 200) but returned 0 rows.'
      );
      return { data: [], error: null };
    }

    const mapped = data.map((row, idx) => mapDbMenuItemToMenuItem(row, idx));
    console.info(
      `[Supabase Cloud Sync] Successfully loaded ${mapped.length} live items from Supabase.`,
      mapped.slice(0, 3)
    );
    return { data: mapped, error: null };
  } catch (err: any) {
    console.error('[Supabase Cloud Sync] Network error fetching menu_items:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Standard Supabase Cloud fetch: Store & Receipt Settings
 */
export async function fetchStoreSettingsFromSupabase(): Promise<{
  data: Partial<ReceiptStoreConfig> | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    const row = data[0];
    const config: Partial<ReceiptStoreConfig> = {};
    if (row.store_title || row.storeTitle || row.name)
      config.storeTitle = row.store_title || row.storeTitle || row.name;
    if (row.subtitle_ar || row.subtitleAr)
      config.subtitleAr = row.subtitle_ar || row.subtitleAr;
    if (row.address_line1 || row.addressLine1 || row.address)
      config.addressLine1 = row.address_line1 || row.addressLine1 || row.address;
    if (row.address_line2 || row.addressLine2)
      config.addressLine2 = row.address_line2 || row.addressLine2;
    if (row.phone) config.phone = row.phone;
    if (row.website || row.website_domain || row.websiteDomain)
      config.websiteDomain =
        row.website || row.website_domain || row.websiteDomain;
    if (row.footer_message || row.footerMessage || row.receipt_footer)
      config.footerMessage =
        row.footer_message || row.footerMessage || row.receipt_footer;

    return { data: config, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Standard Supabase Cloud fetch: Delivery Riders Fleet
 * Fetches active delivery fleet drivers from Supabase `delivery_riders` table.
 * If no drivers exist in the database, returns an empty array `[]` cleanly.
 */
export async function fetchDeliveryRidersFromSupabase(): Promise<{
  data: DeliveryRider[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('delivery_riders')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      // Table may not exist yet or have RLS, return empty array gracefully
      return { data: [], error: null };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const mapped: DeliveryRider[] = data.map((row: any) => ({
      id: String(row.id),
      name: String(row.name || row.rider_name || 'Driver'),
      phone: String(row.phone || row.mobile || ''),
      vehiclePlate: String(row.vehicle_plate || row.vehiclePlate || row.plate || ''),
      status: row.status === 'busy' ? 'busy' : 'available',
      activeOrders: Number(row.active_orders ?? row.activeOrders ?? 0),
    }));

    return { data: mapped, error: null };
  } catch {
    return { data: [], error: null };
  }
}

/**
 * Map raw database row from Supabase `orders`, `pos_orders`, or `web_orders` table
 * into typed POS `PosOrderRecord`.
 *
 * UNIFIED STATUS & SOURCE MAPPING:
 * - NO strict source === 'POS' or order_type === 'POS' filters.
 * - Web orders with statuses 'Delivered', 'Completed', or 'Accepted' are treated identically
 *   to POS 'completed' (Settled / Paid) orders so they appear in revenue, sales audit, and Z-report metrics.
 * - External status is preserved for clear badge display (e.g. 'Delivered', 'Accepted').
 */
export function mapDbRowToPosOrderRecord(
  row: Record<string, any>,
  index = 0
): PosOrderRecord {
  const id = String(row.id || `ord-cloud-${Date.now()}-${index}`);
  const branchId = String(row.branch_id || row.branchId || 'branch-salmiya-01');

  // Unified Invoice Number & Token Number
  const invoiceNo = String(
    row.invoice_no ||
      row.order_number ||
      row.web_order_no ||
      row.order_no ||
      `INV-SLM-${String(20400 + index)}`
  );

  let rawToken = Number(
    row.token_no ?? row.token_number ?? row.tokenNo ?? 0
  );
  if (!rawToken || isNaN(rawToken)) {
    const matched = invoiceNo.match(/\d+/g);
    rawToken = matched ? parseInt(matched[matched.length - 1], 10) % 1000 : 401 + index;
  }
  const tokenNo = isNaN(rawToken) || rawToken <= 0 ? 401 + index : rawToken;

  const createdAt = String(
    row.created_at || row.createdAt || row.placed_at || row.received_at || new Date().toISOString()
  );

  // Source & Channel Identification (NO restrictive source filter)
  const rawChannel = String(
    row.channel || row.order_channel || row.source || row.order_type || ''
  ).toLowerCase();

  const isWeb = Boolean(
    rawChannel.includes('web') ||
      rawChannel.includes('online') ||
      rawChannel.includes('website') ||
      row.web_order_no ||
      row.source_domain ||
      row.dispatch_status
  );

  let channel: OrderChannel = 'dine_in';
  if (isWeb) {
    channel = 'chikarro_web';
  } else if (rawChannel.includes('keeta')) {
    channel = 'keeta';
  } else if (rawChannel.includes('take') || rawChannel.includes('pick')) {
    channel = 'takeaway';
  } else if (rawChannel.includes('dine') || row.table_no) {
    channel = 'dine_in';
  }

  // Unified Status Mapping:
  // External website statuses like 'Delivered', 'Completed', or 'Accepted' are unified with POS 'completed' (Settled / Paid)
  const rawStatus = String(
    row.dispatch_status || row.status || row.order_status || 'completed'
  ).trim();
  const lowerStatus = rawStatus.toLowerCase();

  let status: 'cooking' | 'ready' | 'completed' | 'voided' = 'completed';
  if (
    lowerStatus.includes('void') ||
    lowerStatus.includes('cancel') ||
    lowerStatus.includes('refund')
  ) {
    status = 'voided';
  } else if (
    lowerStatus.includes('cook') ||
    lowerStatus === 'in-kitchen' ||
    lowerStatus === 'in_kitchen'
  ) {
    status = 'cooking';
  } else if (lowerStatus.includes('ready')) {
    status = 'ready';
  } else {
    // 'delivered', 'completed', 'accepted', 'settled', 'paid', 'out for delivery', or default
    status = 'completed';
  }

  // Preserve human-readable external status for badge rendering in UI
  const externalStatus = lowerStatus.includes('deliv')
    ? 'Delivered'
    : lowerStatus.includes('accept')
    ? 'Accepted'
    : lowerStatus.includes('cook')
    ? 'Cooking'
    : lowerStatus.includes('ready')
    ? 'Ready'
    : lowerStatus.includes('void') || lowerStatus.includes('cancel')
    ? 'Voided'
    : lowerStatus === 'completed' || lowerStatus === 'settled' || lowerStatus === 'paid'
    ? 'Completed'
    : rawStatus || 'Completed';

  // Total & Subtotals (Strict 3-decimal KWD)
  const rawTotal = Number(
    row.grand_total_kwd ??
      row.grand_total ??
      row.total_kwd ??
      row.total ??
      row.total_amount ??
      0
  );
  const grandTotalKwd = roundKWD(isNaN(rawTotal) ? 0 : rawTotal);

  const rawSubtotal = Number(
    row.subtotal_kwd ?? row.subtotal ?? (grandTotalKwd > 0.5 ? grandTotalKwd - 0.5 : grandTotalKwd)
  );
  const subtotalKwd = roundKWD(isNaN(rawSubtotal) ? grandTotalKwd : rawSubtotal);

  const rawDiscount = Number(row.discount_kwd ?? row.discount ?? 0);
  const discountKwd = roundKWD(isNaN(rawDiscount) ? 0 : rawDiscount);

  const rawFee = Number(row.delivery_fee_kwd ?? row.delivery_fee ?? 0);
  const deliveryFeeKwd = roundKWD(isNaN(rawFee) ? 0 : rawFee);

  const rawCost = Number(
    row.total_food_cost_kwd ?? row.totalFoodCostKwd ?? (grandTotalKwd * 0.42)
  );
  const totalFoodCostKwd = roundKWD(isNaN(rawCost) ? 0 : rawCost);

  // Payment Method Mapping
  const rawPay = String(
    row.payment_method || row.payment_mode || row.paymentMethod || 'knet'
  ).toLowerCase();

  let paymentMethod: PaymentMethod = 'knet';
  if (rawPay.includes('cash')) paymentMethod = 'cash';
  else if (rawPay.includes('knet') || rawPay.includes('k-net') || rawPay.includes('card')) paymentMethod = 'knet';
  else if (rawPay.includes('wamd')) paymentMethod = 'wamd';
  else if (rawPay.includes('keeta') || rawPay.includes('aggregator')) paymentMethod = 'aggregator_prepaid';
  else if (rawPay.includes('link')) paymentMethod = 'payment_link';
  else if (rawPay.includes('staff')) paymentMethod = 'staff_credit';
  else if (rawPay.includes('split')) paymentMethod = 'split';

  // Items Parsing
  let rawItems = row.items_payload || row.items || row.order_items || [];
  if (typeof rawItems === 'string') {
    try {
      rawItems = JSON.parse(rawItems);
    } catch {
      rawItems = [];
    }
  }

  const items: CartLineItem[] =
    Array.isArray(rawItems) && rawItems.length > 0
      ? rawItems.map((it: any, iIdx: number) => {
          const itPrice = Number(it.unitPriceKwd || it.price || it.unit_price || 0);
          const itCost = Number(it.unitCostKwd || it.cost || it.unit_cost || (itPrice * 0.4));
          const itQty = Number(it.quantity || it.qty || 1);
          const itType =
            String(it.type || (it.comboSubItems ? 'COMBO' : 'ITEM')).toUpperCase() === 'COMBO'
              ? ('COMBO' as const)
              : ('ITEM' as const);

          return {
            lineId: String(it.lineId || it.id || `line-${index}-${iIdx + 1}`),
            type: itType,
            refId: String(it.refId || it.menu_item_id || it.id || `itm-${iIdx + 1}`),
            skuOrCode: String(it.skuOrCode || it.sku || `SKU-${iIdx + 1}`),
            titleEn: String(it.titleEn || it.name || it.name_en || `Item ${iIdx + 1}`),
            titleAr: String(it.titleAr || it.name_ar || it.titleEn || it.name || `Item ${iIdx + 1}`),
            quantity: itQty,
            baseUnitPriceKwd: roundKWD(itPrice),
            unitPriceKwd: roundKWD(itPrice),
            unitCostKwd: roundKWD(itCost),
            comboSubItems: it.comboSubItems || it.combo_includes || [],
          };
        })
      : [
          {
            lineId: `line-${index}-1`,
            type: 'ITEM' as const,
            refId: 'itm-generic-order',
            skuOrCode: isWeb ? 'WEB-DIR' : 'POS-CTR',
            titleEn: isWeb ? `${SHORT_NAME} Web Order` : `${SHORT_NAME} Restaurant Order`,
            titleAr: isWeb ? 'طلب أونلاين شيكارو' : 'طلب كاونتر شيكارو',
            quantity: 1,
            baseUnitPriceKwd: grandTotalKwd,
            unitPriceKwd: grandTotalKwd,
            unitCostKwd: totalFoodCostKwd,
          },
        ];

  const tableNo = row.table_no || row.tableNo || undefined;
  const customerName = String(row.customer_name || row.customerName || (isWeb ? 'Online Guest' : 'Walk-in Guest'));
  const customerPhone = String(row.customer_phone || row.customerPhone || '');
  const deliveryAddress = String(
    row.delivery_address ||
      row.address ||
      (row.area ? `${row.area}${row.block_no ? `, Block ${row.block_no}` : ''}${row.street_no ? `, St ${row.street_no}` : ''}` : '') ||
      ''
  );
  const cashierName = String(
    row.cashier_name || row.cashierName || (isWeb ? 'Website Online Checkout' : 'Counter Cashier')
  );
  const cashierId = String(row.cashier_id || row.cashierId || (isWeb ? 'usr-web-online' : 'usr-staff-01'));
  const webOrderRef = row.web_order_ref || row.web_order_no || (isWeb ? invoiceNo : undefined);

  return {
    id,
    branchId,
    invoiceNo,
    tokenNo,
    createdAt,
    channel,
    status,
    externalStatus,
    source: isWeb ? 'WEB' : 'POS',
    orderType: isWeb ? 'WEB' : 'POS',
    tableNo,
    customerName,
    customerPhone,
    deliveryAddress,
    items,
    subtotalKwd,
    discountPct: Number(row.discount_pct || row.discountPct || 0),
    discountKwd,
    deliveryFeeKwd,
    grandTotalKwd,
    totalFoodCostKwd,
    paymentMethod,
    cashTenderedKwd: Number(row.cash_tendered_kwd || 0),
    knetTenderedKwd: Number(row.knet_tendered_kwd || 0),
    changeDueKwd: Number(row.change_due_kwd || 0),
    cashierId,
    cashierName,
    webOrderRef,
    kotPrinted: Boolean(row.kot_printed || row.kotPrinted || false),
    orderStage: status === 'cooking' ? 'kitchen' : 'billed',
  };
}

/**
 * Standard Supabase Cloud fetch: All Orders (Web & POS)
 *
 * STRICT EXECUTION RULES:
 * 1. REMOVE STRICT STATUS/SOURCE FILTERS:
 *    Fetches ALL orders from Supabase without any hardcoded filter on source === 'POS'
 *    or order_type === 'POS'. Queries `orders`, `pos_orders`, and `web_orders`.
 * 2. UNIFIED STATUS MAPPING:
 *    Web orders with statuses like 'Delivered', 'Completed', or 'Accepted' are unified
 *    with POS completed (Settled / Paid) orders so they appear in sales audit & Z-reports.
 */
export async function fetchAllOrdersFromSupabase(): Promise<{
  data: PosOrderRecord[] | null;
  error: Error | null;
}> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    console.info('[Supabase Cloud Sync] Fetching ALL orders from Supabase (orders, pos_orders, web_orders)...');

    // Query `orders` table (master website + POS orders table)
    const { data: dbOrders, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersErr) {
      console.warn('[Supabase Cloud Sync] orders query notice:', ordersErr.message);
    }

    // Query `pos_orders` table if separate
    const { data: dbPosOrders } = await supabase
      .from('pos_orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Query `web_orders` table if separate
    const { data: dbWebOrders } = await supabase
      .from('web_orders')
      .select('*')
      .order('created_at', { ascending: false });

    const combined: any[] = [];
    const seen = new Set<string>();

    const addRows = (rows: any[] | null) => {
      if (!rows || !Array.isArray(rows)) return;
      for (const row of rows) {
        const key = String(row.id || row.invoice_no || row.order_number || row.web_order_no);
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(row);
        }
      }
    };

    addRows(dbOrders);
    addRows(dbPosOrders);
    addRows(dbWebOrders);

    if (combined.length === 0) {
      return { data: [], error: null };
    }

    const mapped = combined.map((row, idx) => mapDbRowToPosOrderRecord(row, idx));

    // Sort descending by creation timestamp
    mapped.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.info(
      `[Supabase Cloud Sync] Successfully loaded ${mapped.length} total orders from Supabase (including Web and Counter).`
    );

    return { data: mapped, error: null };
  } catch (err: any) {
    console.warn('[Supabase Cloud Sync] Exception fetching orders:', err);
    return { data: [], error: null };
  }
}

/**
 * Real-Time Supabase Subscription Helper for ALL Orders (Web & POS):
 * Listens to postgres_changes across orders, pos_orders, and web_orders
 * so website updates (e.g. status changed to 'Delivered') immediately reflect in POS.
 */
export function subscribeToAllOrdersRealtime(
  onOrderChange: (order: PosOrderRecord) => void
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel('public:pos_unified_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            const mapped = mapDbRowToPosOrderRecord(payload.new);
            onOrderChange(mapped);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pos_orders' },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            const mapped = mapDbRowToPosOrderRecord(payload.new);
            onOrderChange(mapped);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'web_orders' },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            const mapped = mapDbRowToPosOrderRecord(payload.new);
            onOrderChange(mapped);
          }
        }
      )
      .subscribe((status) => {
        console.info('[Supabase Realtime] All orders channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

/**
 * Real-Time Supabase Subscription Helper:
 * Listens to postgres_changes on categories, menu_items, and store_settings
 */
export function subscribeToSupabaseCatalog(
  onUpdate: (payload: any) => void
): () => void {
  try {
    const channel = supabase
      .channel('public:pos_cloud_catalog')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => onUpdate(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => onUpdate(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        (payload) => onUpdate(payload)
      )
      .subscribe((status) => {
        console.info('[Supabase Realtime] Channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Subscription warning:', err);
    return () => {};
  }
}

/**
 * Map raw database row from Supabase `web_orders` or `orders` table into typed POS `IncomingWebOrder`.
 */
export function mapDbRowToIncomingWebOrder(row: Record<string, any>): IncomingWebOrder {
  const id = String(row.id || `web-${Date.now()}`);
  const branchId = String(row.branch_id || row.branchId || 'slm-flagship-01');
  const webOrderNo = String(
    row.web_order_no ||
      row.order_number ||
      row.order_no ||
      row.invoice_no ||
      `WEB-SLM-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const receivedAt = String(row.created_at || row.received_at || new Date().toISOString());
  const customerName = String(row.customer_name || row.customerName || row.name || 'Web Customer');
  const customerPhone = String(
    row.customer_phone || row.customerPhone || row.phone || '+965 2224 8910'
  );
  const area = String(row.area || 'Salmiya');
  const blockNo = String(row.block_no || row.block || 'Block 10');
  const streetNo = String(row.street_no || row.street || 'Salem Al-Mubarak St');
  const buildingNo = String(row.building_no || row.building || 'Bldg 24');
  const floorApt = String(row.floor_apt || row.floor || row.apt || 'Apt 4');
  const landmarkNotes = String(row.landmark_notes || row.landmark || row.notes || 'Near Marina Mall');
  const paymentMode = (row.payment_mode || row.payment_method || 'K-Net Online') as
    | 'K-Net Online'
    | 'Wamd Instant'
    | 'Cash on Delivery';
  const isPaid = Boolean(row.is_paid !== undefined ? row.is_paid : paymentMode !== 'Cash on Delivery');

  const rawTotal = Number(row.total_kwd ?? row.total ?? row.grand_total ?? row.total_amount ?? 0);
  const totalKwd = roundKWD(isNaN(rawTotal) ? 0 : rawTotal);

  const rawSubtotal = Number(
    row.subtotal_kwd ?? row.subtotal ?? (totalKwd > 0.5 ? totalKwd - 0.5 : totalKwd)
  );
  const subtotalKwd = roundKWD(isNaN(rawSubtotal) ? 0 : rawSubtotal);

  const rawFee = Number(row.delivery_fee_kwd ?? row.delivery_fee ?? 0.5);
  const deliveryFeeKwd = roundKWD(isNaN(rawFee) ? 0.5 : rawFee);

  let rawItems = row.items_payload || row.items || row.order_items || [];
  if (typeof rawItems === 'string') {
    try {
      rawItems = JSON.parse(rawItems);
    } catch {
      rawItems = [];
    }
  }

  const items: WebOrderLine[] =
    Array.isArray(rawItems) && rawItems.length > 0
      ? rawItems.map((it: any, idx: number) => {
          const styleLower = String(it.prepStyle || it.prep_style || '').toLowerCase();
          const cleanStyle: PrepStyle =
            styleLower === 'regular' ? 'Regular' : styleLower === 'mixed' ? 'Mixed' : 'Spicy';

          return {
            refId: String(it.refId || it.id || it.menu_item_id || `item-${idx + 1}`),
            type: ((it.type || (it.comboSubItems ? 'COMBO' : 'ITEM')) as string).toUpperCase() === 'COMBO'
              ? ('COMBO' as const)
              : ('ITEM' as const),
            titleEn: String(it.titleEn || it.name || it.name_en || `Item ${idx + 1}`),
            titleAr: String(it.titleAr || it.name_ar || it.titleEn || it.name || `Item ${idx + 1}`),
            quantity: Number(it.quantity || it.qty || 1),
            unitPriceKwd: roundKWD(Number(it.unitPriceKwd || it.price || it.unit_price || 0)),
            prepStyle: cleanStyle,
            notes: it.notes || '',
            comboSubItems: it.comboSubItems || it.combo_includes || [],
          };
        })
      : [
          {
            refId: 'itm-generic-web',
            type: 'ITEM' as const,
            titleEn: `${SHORT_NAME} Special Meal`,
            titleAr: 'وجبة شيكارو الخاصة',
            quantity: 1,
            unitPriceKwd: subtotalKwd,
            prepStyle: 'Spicy' as PrepStyle,
            notes: '',
          },
        ];

  const rawStatus = String(
    row.dispatch_status || row.status || row.order_status || 'Pending'
  ).toLowerCase();
  const status = rawStatus.includes('cook')
    ? 'Cooking'
    : rawStatus.includes('ready')
    ? 'Ready'
    : rawStatus.includes('deliv')
    ? 'Delivered'
    : rawStatus.includes('out')
    ? 'Out for Delivery'
    : 'Pending';

  return {
    id,
    branchId,
    webOrderNo,
    receivedAt,
    customerName,
    customerPhone,
    area,
    blockNo,
    streetNo,
    buildingNo,
    floorApt,
    landmarkNotes,
    paymentMode,
    isPaid,
    subtotalKwd,
    deliveryFeeKwd,
    totalKwd,
    status,
    items,
  };
}

/**
 * Update order status in Supabase `web_orders`, `orders`, and `pos_orders` tables.
 */
export async function updateOrderStatusInSupabase(
  orderIdOrNo: string,
  newStatus: 'cooking' | 'accepted' | 'completed' | 'cancelled' | 'voided'
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const isCancelledOrVoided = newStatus === 'cancelled' || newStatus === 'voided';
    const webStatus =
      newStatus === 'cooking' || newStatus === 'accepted'
        ? 'Cooking'
        : isCancelledOrVoided
        ? 'Cancelled'
        : 'Delivered';

    const dbStatus = isCancelledOrVoided ? 'cancelled' : newStatus;

    // 1. Update web_orders table
    const { error: err1 } = await supabase
      .from('web_orders')
      .update({
        dispatch_status: webStatus,
        accepted_at: new Date().toISOString(),
      })
      .or(`id.eq.${orderIdOrNo},web_order_no.eq.${orderIdOrNo}`);

    if (err1) {
      console.warn('[Supabase Cloud Sync] web_orders status update notice:', err1.message);
    } else {
      console.info(
        `[Supabase Cloud Sync] web_orders status updated to "${webStatus}" for ${orderIdOrNo}`
      );
    }

    // 2. Update orders table (customer-facing website backend)
    const { error: err2 } = await supabase
      .from('orders')
      .update({
        status: dbStatus,
        order_status: dbStatus,
      })
      .or(`id.eq.${orderIdOrNo},order_number.eq.${orderIdOrNo}`);

    if (err2) {
      console.warn('[Supabase Cloud Sync] orders status update notice:', err2.message);
    } else {
      console.info(
        `[Supabase Cloud Sync] orders status updated to "${dbStatus}" for ${orderIdOrNo}`
      );
    }

    // 3. Update pos_orders table if present (enum order_lifecycle_status uses 'voided', not 'cancelled')
    try {
      await supabase
        .from('pos_orders')
        .update({
          status: isCancelledOrVoided ? 'voided' : dbStatus,
        })
        .or(`id.eq.${orderIdOrNo},invoice_no.eq.${orderIdOrNo}`);
    } catch {}
  } catch (err) {
    console.warn('[Supabase Cloud Sync] Exception updating order status:', err);
  }
}

/**
 * Real-Time Supabase Subscription Helper for Incoming Web Orders:
 * Listens to postgres_changes on web_orders and orders tables
 */
export function subscribeToIncomingWebOrders(
  onNewOrder: (order: IncomingWebOrder) => void
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel('public:incoming_web_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'web_orders' },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            console.info('[Supabase Realtime] web_orders change:', payload.new);
            const mapped = mapDbRowToIncomingWebOrder(payload.new);
            onNewOrder(mapped);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            console.info('[Supabase Realtime] orders change:', payload.new);
            const mapped = mapDbRowToIncomingWebOrder(payload.new);
            onNewOrder(mapped);
          }
        }
      )
      .subscribe((status) => {
        console.info('[Supabase Realtime] Web orders channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Web orders subscription warning:', err);
    return () => {};
  }
}

/**
 * Supabase Cloud fetch: Raw Ingredients (ERP Recipe, BOM & Stock).
 * Strictly sourced from `raw_ingredients` — no local mock inventory.
 */
export async function fetchRawIngredientsFromSupabase(): Promise<{
  data: RawIngredient[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.from('raw_ingredients').select('*');
    if (error) {
      console.warn('[Supabase Cloud Sync] raw_ingredients fetch notice:', error.message);
      return { data: null, error: new Error(error.message) };
    }
    const mapped: RawIngredient[] = (data || []).map((row: Record<string, any>) => ({
      id: String(row.id),
      sku: String(row.sku ?? ''),
      name: String(row.name ?? ''),
      unit: (row.unit || 'pcs') as RawIngredient['unit'],
      currentStock: Number(row.current_stock ?? 0),
      reorderLevel: Number(row.reorder_level ?? 0),
      unitCostKwd: Number(row.unit_cost_kwd ?? 0),
      supplier: String(row.supplier_name ?? ''),
      lastRestockedAt: String(row.last_restocked_at ?? new Date().toISOString()),
    }));
    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Supabase Cloud fetch: Recipe BOM lines (`recipe_bom_items`) keyed by menu item id.
 */
export async function fetchRecipeBomFromSupabase(): Promise<{
  data: Record<string, BomRecipeLine[]> | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.from('recipe_bom_items').select('*');
    if (error) {
      console.warn('[Supabase Cloud Sync] recipe_bom_items fetch notice:', error.message);
      return { data: null, error: new Error(error.message) };
    }
    const byItem: Record<string, BomRecipeLine[]> = {};
    (data || []).forEach((row: Record<string, any>) => {
      const key = String(row.menu_item_id);
      (byItem[key] ||= []).push({
        rawIngredientId: String(row.raw_ingredient_id),
        qtyPerUnit: Number(row.qty_per_unit ?? 0),
      });
    });
    return { data: byItem, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Supabase Cloud fetch: Staff accounts (`staff_users`). No local demo users.
 */
export type StaffFetchError = Error & { code?: string; kind: 'table_missing' | 'error' };

/**
 * Loads the staff directory. Errors are classified (never swallowed) so the UI can tell
 * "table not created yet" apart from a real network / auth / RLS failure.
 */
export async function fetchStaffUsersFromSupabase(): Promise<{
  data: StaffAccount[] | null;
  error: StaffFetchError | null;
}> {
  try {
    // select('*') on purpose: the live table may use different column names than the reference
    // schema (e.g. name/pin instead of full_name/pin_code), so every column is mapped tolerantly
    // below. is_active is filtered client-side: only an explicit false/"false"/0 excludes a row.
    const { data, error } = await supabase.from('staff_users').select('*');
    if (error) {
      const tableMissing = error.code === 'PGRST205' || error.code === '42P01' || /could not find the table/i.test(error.message);
      console.error('[Supabase Auth] staff_users fetch FAILED:', { code: error.code, message: error.message, hint: error.hint });
      const err = Object.assign(new Error(error.message), {
        code: error.code,
        kind: tableMissing ? ('table_missing' as const) : ('error' as const),
      });
      return { data: null, error: err };
    }
    const rows = (data || []) as Record<string, any>[];
    const isInactive = (v: unknown) => v === false || v === 0 || /^(false|0|no|inactive)$/i.test(String(v ?? ''));
    const normalizeRole = (v: unknown): StaffAccount['role'] => {
      const r = String(v ?? '').trim().toLowerCase();
      if (['admin', 'administrator', 'owner', 'superadmin', 'super_admin'].includes(r)) return 'admin';
      if (['manager', 'supervisor', 'branch_manager', 'branch manager'].includes(r)) return 'manager';
      return 'staff';
    };
    const mapped: StaffAccount[] = rows
      .filter((row) => !isInactive(row.is_active))
      .map((row) => {
        const id = String(row.id ?? row.staff_id ?? row.user_id ?? '');
        const name = String(row.name ?? row.full_name ?? row.username ?? row.email ?? 'Staff').trim();
        const role = normalizeRole(row.role ?? row.role_tier ?? row.user_role);
        const pin = String(row.pin ?? row.pin_code ?? row.passcode ?? '').trim();
        const password = String(row.password ?? row.pass ?? '').trim();
        const employeeCode = String(
          row.employee_code ?? row.staff_code ?? row.username ?? row.code ?? `${role.toUpperCase().slice(0, 3)}-${id.slice(0, 4).toUpperCase()}`
        ).trim();
        return {
          id,
          employeeCode,
          name,
          title: String(row.title ?? (role === 'admin' ? 'Administrator' : role === 'manager' ? 'Branch Manager' : 'Cashier')),
          role,
          pin,
          password,
          maxDiscountPct: Number(row.max_discount_pct ?? (role === 'admin' ? 100 : role === 'manager' ? 50 : 10)),
          canVoidBills: role !== 'staff' || row.can_void_bills === true,
          canManageCombos: role !== 'staff' || row.can_manage_combos === true,
          canViewMargins: role === 'admin' || row.can_view_margins === true,
          avatarBadge: name
            .split(/s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join(''),
        };
      })
      .filter((a) => a.id && (a.pin || a.password));
    console.info(
      `[Supabase Auth] staff_users: ${rows.length} row(s) returned, ${mapped.length} usable account(s) after mapping`
    );
    if (rows.length === 0) {
      console.warn(
        '[Supabase Auth] staff_users returned 0 rows. If the table has data, Row Level Security is hiding it from the anon key: add a SELECT policy (see supabase_staff_users.sql).'
      );
    }
    return { data: mapped, error: null };
  } catch (err: any) {
    console.error('[Supabase Auth] staff_users fetch threw (network?):', err);
    const base = err instanceof Error ? err : new Error(String(err));
    return { data: null, error: Object.assign(base, { kind: 'error' as const }) };
  }
}

/**
 * Supabase Cloud fetch: Branches (`branches` joined with parent `tenants`).
 */
export async function fetchBranchesFromSupabase(): Promise<{
  data: TenantBranch[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*, tenants(*)')
      .eq('is_active', true);
    if (error) {
      console.warn('[Supabase Cloud Sync] branches fetch notice:', error.message);
      return { data: null, error: new Error(error.message) };
    }
    const mapped: TenantBranch[] = (data || []).map((row: Record<string, any>) => {
      const tenant = row.tenants || {};
      const comm = tenant.aggregator_commissions || {};
      return {
        id: String(row.id),
        tenantId: row.tenant_id ? String(row.tenant_id) : undefined,
        tenantName: String(tenant.brand_name ?? BRAND_NAME),
        tenantSlug: String(tenant.slug ?? ''),
        branchCode: String(row.branch_code ?? ''),
        branchName: String(row.name ?? ''),
        area: String(row.area ?? ''),
        address: String(row.address_line ?? ''),
        phone: String(row.phone ?? ''),
        printerIp: String(row.printer_ip ?? ''),
        websiteDomain: String(tenant.website_domain ?? ''),
        commissions: {
          keeta: Number(comm.keeta ?? 18),
          chikarro_web: Number(comm.web ?? 0),
        },
      };
    });
    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
