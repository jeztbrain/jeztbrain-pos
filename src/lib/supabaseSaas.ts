import { supabase, isSupabaseConfigured } from './supabase';
import {
  ClosedShiftReport,
  CustomerRecord,
  PosOrderRecord,
  PromoCode,
} from '../types/pos';

/**
 * SaaS data layer: POS order persistence, shift Z-reports, customers (CRM) and promo codes.
 * Every function is best-effort and never throws, so a Supabase outage can't break billing.
 * Hard DELETEs are never issued; promo codes are deactivated, orders are soft-cancelled.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v?: string | null): v is string => !!v && UUID_RE.test(v);
export const newUuid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

const savedItemOrderIds = new Set<string>();

const LIFECYCLE: Record<string, string> = {
  cooking: 'cooking',
  ready: 'ready',
  completed: 'completed',
  voided: 'voided',
  cancelled: 'voided',
};

const PAYMENT_ENUM = ['cash', 'knet', 'wamd', 'payment_link', 'split', 'aggregator_prepaid'];

/** Upserts a POS bill (and, once, its line items) into `pos_orders` / `pos_order_items`. */
export async function savePosOrderToSupabase(
  order: PosOrderRecord,
  tenantId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || !isUuid(order.id) || !isUuid(order.branchId)) {
    return false;
  }
  try {
    const row = {
      id: order.id,
      tenant_id: tenantId,
      branch_id: order.branchId,
      invoice_no: order.invoiceNo,
      token_no: order.tokenNo,
      channel: order.channel,
      status: LIFECYCLE[order.status] || 'completed',
      table_no: order.tableNo ?? null,
      customer_name: order.customerName || null,
      customer_phone: order.customerPhone || null,
      delivery_address: order.deliveryAddress || null,
      subtotal_kwd: order.subtotalKwd,
      discount_kwd: order.discountKwd,
      discount_reason: order.discountReason ?? null,
      delivery_fee_kwd: order.deliveryFeeKwd,
      grand_total_kwd: order.grandTotalKwd,
      payment_method: PAYMENT_ENUM.includes(order.paymentMethod) ? order.paymentMethod : 'cash',
      cash_tendered_kwd: order.cashTenderedKwd,
      knet_tendered_kwd: order.knetTenderedKwd,
      change_due_kwd: order.changeDueKwd,
      cashier_id: isUuid(order.cashierId) ? order.cashierId : null,
      cashier_name: order.cashierName,
      void_reason: order.voidReason ?? null,
      web_order_ref: order.webOrderRef ?? null,
      created_at: order.createdAt,
    };
    const { error } = await supabase.from('pos_orders').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase Cloud Sync] pos_orders upsert notice:', error.message);
      return false;
    }

    if (!savedItemOrderIds.has(order.id)) {
      const items = order.items
        .filter((it) => isUuid(it.refId))
        .map((it) => ({
          id: newUuid(),
          order_id: order.id,
          item_type: it.type,
          ref_id: it.refId,
          title_en: it.titleEn,
          title_ar: it.titleAr,
          quantity: it.quantity,
          unit_price_kwd: it.unitPriceKwd,
          line_total_kwd: Math.round(it.unitPriceKwd * it.quantity * 1000) / 1000,
          prep_style: it.customization?.prepStyle ?? null,
          side_choice: it.customization?.sideChoice?.nameEn ?? null,
          drink_choice: it.customization?.drinkChoice?.nameEn ?? null,
          addons_json: it.customization?.addons ?? [],
          combo_sub_items_json: it.comboSubItems ?? [],
          kitchen_notes: it.customization?.kitchenNotes ?? null,
        }));
      if (items.length > 0) {
        const { error: itemErr } = await supabase.from('pos_order_items').insert(items);
        if (itemErr) console.warn('[Supabase Cloud Sync] pos_order_items insert notice:', itemErr.message);
      }
      savedItemOrderIds.add(order.id);
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Cloud Sync] savePosOrder exception:', err);
    return false;
  }
}

/** Persists a closed shift Z-report to `shift_z_reports`. */
export async function saveShiftReportToSupabase(
  report: ClosedShiftReport,
  tenantId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || !isUuid(report.branchId)) return false;
  try {
    const { error } = await supabase.from('shift_z_reports').insert({
      tenant_id: tenantId,
      branch_id: report.branchId,
      shift_code: report.shiftCode,
      opened_at: report.openedAt,
      closed_at: report.closedAt,
      closed_by: isUuid(report.closedById) ? report.closedById : null,
      opening_float_kwd: report.openingCashKwd,
      cash_sales_kwd: report.cashSalesKwd,
      knet_sales_kwd: report.knetSalesKwd,
      wamd_sales_kwd: report.wamdSalesKwd,
      link_sales_kwd: report.linkSalesKwd,
      aggregator_sales_kwd: report.aggregatorSalesKwd,
      cash_expenses_kwd: report.cashExpensesKwd,
      expected_cash_kwd: report.expectedCashKwd,
      actual_cash_counted_kwd: report.actualCashKwd,
      voided_orders_count: report.voidedCount,
      voided_amount_kwd: report.voidedAmountKwd,
      closing_notes: report.notes || null,
    });
    if (error) {
      console.warn('[Supabase Cloud Sync] shift_z_reports insert notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Cloud Sync] saveShiftReport exception:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// CRM: customers
// ---------------------------------------------------------------------------
const normalizePhone = (p: string) => p.replace(/[^0-9+]/g, '');

const mapCustomer = (r: Record<string, any>): CustomerRecord => ({
  id: String(r.id),
  name: String(r.name ?? ''),
  phone: String(r.phone ?? ''),
  address: String(r.address ?? ''),
  totalOrders: Number(r.total_orders ?? 0),
  totalSpentKwd: Number(r.total_spent_kwd ?? 0),
  lastOrderAt: String(r.last_order_at ?? r.created_at ?? ''),
  createdAt: String(r.created_at ?? ''),
});

export async function fetchCustomersFromSupabase(): Promise<CustomerRecord[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('total_spent_kwd', { ascending: false });
    if (error) {
      console.warn('[Supabase Cloud Sync] customers fetch notice:', error.message);
      return null;
    }
    return (data || []).map(mapCustomer);
  } catch {
    return null;
  }
}

/**
 * Auto-saves / updates a customer by phone number and increments loyalty totals.
 * Call exactly once per settled (paid) bill.
 */
export async function recordCustomerOrderInSupabase(
  customer: { name: string; phone: string; address: string },
  orderTotalKwd: number,
  tenantId?: string
): Promise<CustomerRecord | null> {
  const phone = normalizePhone(customer.phone || '');
  if (!isSupabaseConfigured() || phone.length < 6) return null;
  try {
    const { data: existing, error: selErr } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    if (selErr) {
      console.warn('[Supabase Cloud Sync] customers lookup notice:', selErr.message);
      return null;
    }
    const nowIso = new Date().toISOString();
    if (existing) {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: customer.name || existing.name,
          address: customer.address || existing.address,
          total_orders: Number(existing.total_orders ?? 0) + 1,
          total_spent_kwd:
            Math.round((Number(existing.total_spent_kwd ?? 0) + orderTotalKwd) * 1000) / 1000,
          last_order_at: nowIso,
        })
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      if (error) {
        console.warn('[Supabase Cloud Sync] customers update notice:', error.message);
        return null;
      }
      return data ? mapCustomer(data) : null;
    }
    const { data, error } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenantId ?? null,
        name: customer.name,
        phone,
        address: customer.address,
        total_orders: 1,
        total_spent_kwd: Math.round(orderTotalKwd * 1000) / 1000,
        last_order_at: nowIso,
      })
      .select()
      .maybeSingle();
    if (error) {
      console.warn('[Supabase Cloud Sync] customers insert notice:', error.message);
      return null;
    }
    return data ? mapCustomer(data) : null;
  } catch (err) {
    console.warn('[Supabase Cloud Sync] recordCustomerOrder exception:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------
const mapPromo = (r: Record<string, any>): PromoCode => ({
  id: String(r.id),
  code: String(r.code ?? '').toUpperCase(),
  type: r.discount_type === 'fixed' ? 'fixed' : 'percentage',
  value: Number(r.discount_value ?? 0),
  minOrderKwd: Number(r.min_order_kwd ?? 0),
  maxUses: r.max_uses === null || r.max_uses === undefined ? null : Number(r.max_uses),
  usedCount: Number(r.used_count ?? 0),
  expiresAt: r.expires_at ? String(r.expires_at) : null,
  isActive: r.is_active !== false,
  createdAt: String(r.created_at ?? ''),
});

export async function fetchPromoCodesFromSupabase(): Promise<PromoCode[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[Supabase Cloud Sync] promo_codes fetch notice:', error.message);
      return null;
    }
    return (data || []).map(mapPromo);
  } catch {
    return null;
  }
}

export async function savePromoCodeToSupabase(
  promo: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'> & { id?: string },
  tenantId?: string
): Promise<PromoCode | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const payload = {
      tenant_id: tenantId ?? null,
      code: promo.code.trim().toUpperCase(),
      discount_type: promo.type,
      discount_value: promo.value,
      min_order_kwd: promo.minOrderKwd,
      max_uses: promo.maxUses,
      expires_at: promo.expiresAt,
      is_active: promo.isActive,
    };
    const q = promo.id
      ? supabase.from('promo_codes').update(payload).eq('id', promo.id)
      : supabase.from('promo_codes').insert(payload);
    const { data, error } = await q.select().maybeSingle();
    if (error) {
      console.warn('[Supabase Cloud Sync] promo_codes save notice:', error.message);
      return null;
    }
    return data ? mapPromo(data) : null;
  } catch {
    return null;
  }
}

/** Increments redemption count after a promo is used on a settled bill. */
export async function incrementPromoUseInSupabase(promo: PromoCode): Promise<void> {
  if (!isSupabaseConfigured() || !isUuid(promo.id)) return;
  try {
    await supabase
      .from('promo_codes')
      .update({ used_count: promo.usedCount + 1 })
      .eq('id', promo.id);
  } catch {
    // best-effort
  }
}
