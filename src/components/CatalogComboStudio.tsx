import React, { useMemo, useState } from 'react';
import { CURRENCY } from '../config/brandConfig';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit3,
  Eye,
  FolderTree,
  Layers,
  Minus,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { Category, ComboOffer, ComboSubItem, MenuItem } from '../types/pos';
import { formatKWD, playTerminalSound, roundKWD } from '../utils/formatters';

export const CatalogComboStudio: React.FC = () => {
  const {
    currentUser,
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
    toggleItemStockTracking,
    updateItemStockQuantity,
    setActiveModule,
    language,
  } = usePos();

  const isEnglish = language === 'en';

  const [activeTab, setActiveTab] = useState<
    'combo-studio' | 'menu-manager' | 'category-manager'
  >('combo-studio');

  // =========================================================================
  // INTERACTIVE COMBO OFFER STUDIO STATE
  // =========================================================================
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [comboCode, setComboCode] = useState<string>('');
  const [headingEn, setHeadingEn] = useState<string>('');
  const [headingAr, setHeadingAr] = useState<string>('');
  const [promoTag, setPromoTag] = useState<string>('');
  const [comboPriceInput, setComboPriceInput] = useState<string>('');
  const [isComboAvailable, setIsComboAvailable] = useState<boolean>(true);
  const [bundleSearch, setBundleSearch] = useState<string>('');

  const [bundledItems, setBundledItems] = useState<ComboSubItem[]>([]);

  // Menu Item Form State
  const [newItemSku, setNewItemSku] = useState<string>('');
  const [newItemNameEn, setNewItemNameEn] = useState<string>('');
  const [newItemNameAr, setNewItemNameAr] = useState<string>('');
  const [newItemCatId, setNewItemCatId] = useState<string>(categories[0]?.id || '');
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [newItemCost, setNewItemCost] = useState<string>('');
  const [newItemEmoji, setNewItemEmoji] = useState<string>('🍗');
  const [editingPriceMap, setEditingPriceMap] = useState<Record<string, string>>({});

  // Category Management Form State
  const [newCatNameEn, setNewCatNameEn] = useState<string>('');
  const [newCatNameAr, setNewCatNameAr] = useState<string>('');
  const [newCatSlug, setNewCatSlug] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('none');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editNameEn, setEditNameEn] = useState<string>('');
  const [editNameAr, setEditNameAr] = useState<string>('');
  const [editIcon, setEditIcon] = useState<string>('none');

  // Live Financial Intelligence Calculations
  const totalIndividualValueKwd = useMemo(
    () =>
      roundKWD(
        bundledItems.reduce((sum, item) => sum + item.unitPriceKwd * item.quantity, 0)
      ),
    [bundledItems]
  );

  const totalRecipeFoodCostKwd = useMemo(
    () =>
      roundKWD(
        bundledItems.reduce((sum, item) => sum + item.unitCostKwd * item.quantity, 0)
      ),
    [bundledItems]
  );

  const parsedComboSellingPriceKwd = roundKWD(parseFloat(comboPriceInput) || 0);
  const guestSavingsAmountKwd = roundKWD(
    Math.max(0, totalIndividualValueKwd - parsedComboSellingPriceKwd)
  );
  const guestSavingsPercentage =
    totalIndividualValueKwd > 0
      ? Math.round((guestSavingsAmountKwd / totalIndividualValueKwd) * 100)
      : 0;

  const estimatedGrossProfitKwd = roundKWD(
    parsedComboSellingPriceKwd - totalRecipeFoodCostKwd
  );
  const grossProfitMarginPct =
    parsedComboSellingPriceKwd > 0
      ? (
          (estimatedGrossProfitKwd / parsedComboSellingPriceKwd) *
          100
        ).toFixed(1)
      : '0.0';

  const handleAddBundledItem = (menuItem: MenuItem) => {
    playTerminalSound('tap');
    setBundledItems((prev) => {
      const idx = prev.findIndex((i) => i.menuItemId === menuItem.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          nameEn: menuItem.nameEn,
          nameAr: menuItem.nameAr,
          quantity: 1,
          unitPriceKwd: menuItem.priceKwd,
          unitCostKwd: menuItem.costKwd,
        },
      ];
    });
  };

  const handleUpdateBundleQty = (menuItemId: string, delta: number) => {
    playTerminalSound('tap');
    setBundledItems((prev) =>
      prev
        .map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleEditExistingCombo = (combo: ComboOffer) => {
    setEditingComboId(combo.id);
    setComboCode(combo.code);
    setHeadingEn(combo.headingEn);
    setHeadingAr(combo.headingAr);
    setPromoTag(combo.promoTag);
    setComboPriceInput(combo.comboPriceKwd.toFixed(3));
    setIsComboAvailable(combo.isAvailable);
    setBundledItems(combo.items);
    playTerminalSound('tap');
  };

  const handlePublishCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headingEn.trim() || bundledItems.length === 0) return;

    const comboPayload: ComboOffer = {
      id: editingComboId || `cmb-custom-${Date.now()}`,
      code: comboCode.trim().toUpperCase() || `CMB-${Math.floor(100 + Math.random() * 900)}`,
      headingEn: headingEn.trim(),
      headingAr: headingAr.trim() || headingEn.trim(),
      promoTag: promoTag.trim().toUpperCase() || 'SPECIAL DEAL',
      items: bundledItems,
      originalValueKwd: totalIndividualValueKwd,
      comboPriceKwd: parsedComboSellingPriceKwd,
      totalCostKwd: totalRecipeFoodCostKwd,
      isAvailable: isComboAvailable,
      accentColor: 'crimson',
      createdAt: new Date().toISOString(),
    };

    saveComboOffer(comboPayload);
    setEditingComboId(null);
  };

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemNameEn.trim()) return;
    const price = roundKWD(parseFloat(newItemPrice) || 1.5);
    const cost = roundKWD(parseFloat(newItemCost) || 0.65);

    const created: MenuItem = {
      id: `itm-${Date.now()}`,
      categoryId: newItemCatId,
      sku: newItemSku.trim().toUpperCase() || `SKU-${Math.floor(100 + Math.random() * 900)}`,
      nameEn: newItemNameEn.trim(),
      nameAr: newItemNameAr.trim() || newItemNameEn.trim(),
      description: 'Freshly prepared Salmiya signature recipe.',
      priceKwd: price,
      costKwd: cost,
      requiresCustomization: true,
      prepTimeMins: 8,
      badge: 'NEW',
      visualEmoji: newItemEmoji || '🍗',
      accentGradient: 'from-amber-50 to-stone-50',
      isAvailable: true,
      bom: [],
    };

    saveMenuItem(created);
    setNewItemNameEn('');
    setNewItemNameAr('');
    setNewItemSku(`CHK-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Category CRUD Handlers
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameEn.trim()) return;
    const slug = newCatSlug.trim().toLowerCase() || newCatNameEn.trim().toLowerCase().replace(/\s+/g, '-');
    addCategory({
      nameEn: newCatNameEn.trim(),
      nameAr: newCatNameAr.trim() || newCatNameEn.trim(),
      slug,
      icon: newCatIcon === 'none' ? null : newCatIcon,
      sortOrder: categories.length + 1,
      showIcon: newCatIcon !== 'none',
    });
    setNewCatNameEn('');
    setNewCatNameAr('');
    setNewCatSlug('');
    setNewCatIcon('none');
  };

  const handleSaveCategoryEdit = (catId: string) => {
    updateCategory(catId, {
      nameEn: editNameEn.trim(),
      nameAr: editNameAr.trim(),
      icon: editIcon === 'none' ? null : editIcon,
      showIcon: editIcon !== 'none',
    });
    setEditingCatId(null);
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const copy = [...categories];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    reorderCategories(copy);
  };

  const filteredPickerProducts = useMemo(() => {
    const q = bundleSearch.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter(
      (m) =>
        m.nameEn.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q)
    );
  }, [menuItems, bundleSearch]);

  return (
    <div className="no-print h-[calc(100vh-52px)] w-full overflow-y-auto bg-[#FAF6F0] p-4 md:p-6 text-[#1E293B]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E8E1D5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-mono text-xs font-bold uppercase">
                /catalog • MENU, COMBOS &amp; CATEGORIES
              </span>
              <span className="text-xs font-mono font-bold text-stone-500">
                {currentUser?.role.toUpperCase()} CONSOLE
              </span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-[#1E293B] mt-1">
              Menu Architecture, Combo Offers &amp; Category Manager
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Sub-Tabs */}
            <div className="flex p-1 rounded-xl bg-white border border-[#E8E1D5]">
              <button
                type="button"
                onClick={() => setActiveTab('combo-studio')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'combo-studio'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Combos ({comboOffers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('menu-manager')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'menu-manager'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Items ({menuItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('category-manager')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'category-manager'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Categories ({categories.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveModule('pos')}
              className="px-3.5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Live POS</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: DYNAMIC COMBO OFFER STUDIO
           ========================================================================= */}
        {activeTab === 'combo-studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT 7 COLS: COMBO BUILDER */}
            <form
              onSubmit={handlePublishCombo}
              className="lg:col-span-7 bg-white border border-[#E8E1D5] rounded-2xl p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div>
                  <h2 className="text-base font-display font-bold text-[#1E293B]">
                    {editingComboId ? 'Edit Combo Offer' : 'Create New Combo Deal'}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Bundle multiple items into a single promotional package with live financial margin preview.
                  </p>
                </div>

                {editingComboId && (
                  <button
                    type="button"
                    onClick={() => setEditingComboId(null)}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-mono font-bold text-stone-700"
                  >
                    + New Deal
                  </button>
                )}
              </div>

              {/* Title Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                    English Heading *
                  </label>
                  <input
                    type="text"
                    required
                    value={headingEn}
                    onChange={(e) => setHeadingEn(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs text-[#1E293B] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                    Arabic Heading
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={headingAr}
                    onChange={(e) => setHeadingAr(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs text-[#1E293B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                    Combo Code
                  </label>
                  <input
                    type="text"
                    value={comboCode}
                    onChange={(e) => setComboCode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] font-mono text-xs text-[#1E293B] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                    Promo Tag
                  </label>
                  <input
                    type="text"
                    value={promoTag}
                    onChange={(e) => setPromoTag(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs text-[#1E293B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-[#C8102E] mb-1">
                    Selling Price ({CURRENCY}) *
                  </label>
                  <input
                    type="number"
                    step="0.050"
                    required
                    value={comboPriceInput}
                    onChange={(e) => setComboPriceInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#C8102E] font-mono text-xs font-extrabold text-[#C8102E]"
                  />
                </div>
              </div>

              {/* Bundled Sub-Items */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1E293B]">
                    Bundled Sub-Items ({bundledItems.length})
                  </span>
                  <span className="font-mono text-stone-500">
                    Individual Value: {formatKWD(totalIndividualValueKwd)}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {bundledItems.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#1E293B] truncate">
                          {item.nameEn}
                        </div>
                        <div className="text-[10px] font-mono text-stone-500">
                          {formatKWD(item.unitPriceKwd)} each
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateBundleQty(item.menuItemId, -1)}
                          className="w-6 h-6 rounded bg-white border border-[#E8E1D5] text-xs font-bold flex items-center justify-center text-stone-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateBundleQty(item.menuItemId, 1)}
                          className="w-6 h-6 rounded bg-white border border-[#E8E1D5] text-xs font-bold flex items-center justify-center text-stone-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition"
              >
                {editingComboId ? 'Update & Sync Combo Offer' : '+ Publish Combo to POS'}
              </button>
            </form>

            {/* RIGHT 5 COLS: PRODUCT PICKER FOR BUNDLE */}
            <div className="lg:col-span-5 bg-white border border-[#E8E1D5] rounded-2xl p-5 shadow-xs space-y-3 h-fit">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="font-display font-bold text-sm text-[#1E293B]">
                  Add Products to Deal
                </h3>
                <span className="text-[10px] font-mono text-stone-400">
                  Click + to bundle
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={bundleSearch}
                  onChange={(e) => setBundleSearch(e.target.value)}
                  placeholder="Filter products..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#FAF6F0] border border-[#E8E1D5] text-xs"
                />
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {filteredPickerProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 rounded-lg bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#1E293B] truncate">
                        {p.nameEn}
                      </div>
                      <div className="text-[10px] font-mono text-[#C8102E]">
                        {formatKWD(p.priceKwd)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddBundledItem(p)}
                      className="px-2 py-1 rounded bg-[#C8102E] text-white text-xs font-bold hover:bg-[#A50D25]"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MENU ITEMS & PRICING MANAGER
           ========================================================================= */}
        {activeTab === 'menu-manager' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateMenuItem}
              className="lg:col-span-4 bg-white border border-[#E8E1D5] rounded-2xl p-5 shadow-xs space-y-3 h-fit"
            >
              <h3 className="text-base font-display font-bold text-[#1E293B] border-b border-stone-100 pb-2">
                Add New Menu Item
              </h3>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                  Item Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={newItemNameEn}
                  onChange={(e) => setNewItemNameEn(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs text-[#1E293B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                  Item Name (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={newItemNameAr}
                  onChange={(e) => setNewItemNameAr(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs text-[#1E293B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                    Category
                  </label>
                  <select
                    value={newItemCatId}
                    onChange={(e) => setNewItemCatId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs text-[#1E293B]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] font-mono text-xs text-[#1E293B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-[#C8102E] mb-1">
                    Price ({CURRENCY}) *
                  </label>
                  <input
                    type="number"
                    step="0.050"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] font-mono text-xs font-bold text-[#C8102E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                    Est. Food Cost
                  </label>
                  <input
                    type="number"
                    step="0.050"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] font-mono text-xs text-stone-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-bold text-xs uppercase tracking-wider"
              >
                + Add Item
              </button>
            </form>

            {/* Menu Items List with Instant Price Edit */}
            <div className="lg:col-span-8 bg-white border border-[#E8E1D5] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="font-display font-bold text-sm text-[#1E293B]">
                  Menu Catalog ({menuItems.length} SKUs)
                </h3>
              </div>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl">{item.visualEmoji}</span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-[#1E293B] truncate">
                          {item.nameEn}
                        </div>
                        <div className="text-[10px] font-mono text-stone-400">
                          {item.sku}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Direct Stock Level Badge & Tracking */}
                      {item.trackStock ? (
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded font-extrabold ${
                              (item.stockQuantity ?? 0) <= 0
                                ? 'bg-rose-100 text-rose-700'
                                : (item.stockQuantity ?? 0) <= (item.lowStockThreshold || 5)
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {(item.stockQuantity ?? 0) <= 0
                              ? '0 Stock'
                              : `${item.stockQuantity} left`}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateItemStockQuantity(
                                item.id,
                                (item.stockQuantity ?? 0) + 10
                              )
                            }
                            className="px-1.5 py-0.5 rounded bg-white hover:bg-emerald-50 border border-[#E8E1D5] text-[10px] font-bold text-stone-700"
                            title="Add +10 stock"
                          >
                            +10
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            toggleItemStockTracking(item.id, true);
                            updateItemStockQuantity(item.id, 25);
                          }}
                          className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-500 font-mono text-[10px] font-semibold"
                        >
                          + Track
                        </button>
                      )}

                      <input
                        type="number"
                        step="0.050"
                        defaultValue={item.priceKwd.toFixed(3)}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val && val > 0) updateMenuItemPrice(item.id, val);
                        }}
                        className="w-20 px-2 py-1 rounded border border-[#E8E1D5] font-mono text-xs font-bold text-[#C8102E] text-right"
                      />
                      <button
                        type="button"
                        onClick={() => toggleMenuItemAvailability(item.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold ${
                          item.isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.isAvailable ? 'ACTIVE' : 'OFF'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: CATEGORY ARCHITECTURE & DYNAMIC ICON CONTROL (ADMIN)
           ========================================================================= */}
        {activeTab === 'category-manager' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Add Category Form */}
            <form
              onSubmit={handleAddCategorySubmit}
              className="lg:col-span-4 bg-white border border-[#E8E1D5] rounded-2xl p-5 shadow-xs space-y-3 h-fit"
            >
              <div className="border-b border-stone-100 pb-2">
                <h3 className="font-display font-bold text-base text-[#1E293B]">
                  Add Menu Category
                </h3>
                <p className="text-xs text-stone-500">
                  Create a new category to appear in the vertical POS menu sidebar.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                  Category Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  placeholder="e.g. Loaded Fries"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs text-[#1E293B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                  Category Name (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={newCatNameAr}
                  onChange={(e) => setNewCatNameAr(e.target.value)}
                  placeholder="مثال: بطاطس محملة"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs text-[#1E293B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                  URL / System Slug
                </label>
                <input
                  type="text"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  placeholder="e.g. fries"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] font-mono text-xs text-[#1E293B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-stone-600 mb-1">
                  Category Icon Rule
                </label>
                <select
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] text-xs text-[#1E293B]"
                >
                  <option value="none">No Icon (Clean Text Style - Default)</option>
                  <option value="CupSoda">Beverages (CupSoda)</option>
                  <option value="Utensils">Individual Meals (Utensils)</option>
                  <option value="Sandwich">Zinger &amp; Wraps (Sandwich)</option>
                </select>
                <p className="text-[10px] text-stone-400 mt-1">
                  Rule: Only Beverages, Individual Meals, and Zinger &amp; Wraps show icons by default.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-bold text-xs uppercase tracking-wider shadow-xs"
              >
                + Add Category
              </button>
            </form>

            {/* Existing Categories List with Reordering & Renaming */}
            <div className="lg:col-span-8 bg-white border border-[#E8E1D5] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div>
                  <h3 className="font-display font-bold text-base text-[#1E293B]">
                    Active Menu Categories ({categories.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Reorder, rename, or edit icon settings dynamically for the cashier vertical sidebar.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] flex items-center justify-between gap-3"
                  >
                    {editingCatId === cat.id ? (
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={editNameEn}
                          onChange={(e) => setEditNameEn(e.target.value)}
                          className="px-2 py-1 rounded bg-white border border-[#E8E1D5] text-xs font-bold text-[#1E293B]"
                        />
                        <input
                          type="text"
                          dir="rtl"
                          value={editNameAr}
                          onChange={(e) => setEditNameAr(e.target.value)}
                          className="px-2 py-1 rounded bg-white border border-[#E8E1D5] text-xs text-[#1E293B]"
                        />
                        <select
                          value={editIcon}
                          onChange={(e) => setEditIcon(e.target.value)}
                          className="px-2 py-1 rounded bg-white border border-[#E8E1D5] text-xs"
                        >
                          <option value="none">No Icon</option>
                          <option value="CupSoda">CupSoda</option>
                          <option value="Utensils">Utensils</option>
                          <option value="Sandwich">Sandwich</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSaveCategoryEdit(cat.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="px-2 py-1 rounded bg-stone-200 text-stone-700 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveCategory(idx, 'up')}
                            className="p-0.5 text-stone-400 hover:text-stone-800 disabled:opacity-20"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === categories.length - 1}
                            onClick={() => handleMoveCategory(idx, 'down')}
                            className="p-0.5 text-stone-400 hover:text-stone-800 disabled:opacity-20"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-bold">
                              #{cat.sortOrder || idx + 1}
                            </span>
                            <span className="text-sm font-bold text-[#1E293B]">
                              {cat.nameEn}
                            </span>
                            <span className="text-xs text-stone-400 font-mono">
                              ({cat.slug})
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Icon: <strong>{cat.icon || 'None (Text Only)'}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {editingCatId !== cat.id && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(cat.id);
                            setEditNameEn(cat.nameEn);
                            setEditNameAr(cat.nameAr);
                            setEditIcon(cat.icon || 'none');
                          }}
                          className="p-1.5 rounded-lg bg-white border border-[#E8E1D5] text-stone-600 hover:text-stone-900 text-xs"
                          title="Edit Category"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCategory(cat.id)}
                          className="p-1.5 rounded-lg bg-white border border-[#E8E1D5] text-stone-400 hover:text-rose-600 text-xs"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
