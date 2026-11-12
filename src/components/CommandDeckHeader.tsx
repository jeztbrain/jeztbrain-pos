import React, { useEffect, useState } from 'react';
import { BRAND_TAGLINE, PRINTER_NAME, SHORT_NAME } from '../config/brandConfig';
import {
  AlertCircle,
  Bell,
  BookOpen,
  Building2,
  Clock,
  Cloud,
  Globe,
  Layers,
  LogOut,
  Printer,
  Receipt,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { ActiveModule } from '../types/pos';
import { SalesHistoryModal } from './SalesHistoryModal';
import { PrinterSettingsModal } from './PrinterSettingsModal';
import { isDesktopApp } from '../lib/printService';
import { formatKWD } from '../utils/formatters';

export const CommandDeckHeader: React.FC = () => {
  const {
    multiBranchMode,
    branches,
    activeBranch,
    setActiveBranchId,
    currentUser,
    logout,
    activeModule,
    setActiveModule,
    pendingWebOrdersCount,
    printerStatus,
    lowStockIngredients,
    allLowStockItems,
    language,
    toggleLanguage,
    categories,
    menuItems,
    isCloudSyncing,
    cloudSyncStatus,
    refetchCloudCatalog,
    dailyGrossSalesKwd,
  } = usePos();

  const [elapsedShift, setElapsedShift] = useState<string>('00:00:00');
  const [showLowStockDropdown, setShowLowStockDropdown] = useState<boolean>(false);
  const [showSalesHistory, setShowSalesHistory] = useState<boolean>(false);
  const [showPrinterSetup, setShowPrinterSetup] = useState<boolean>(false);

  useEffect(() => {
    const startMs = Date.now(); // shift timer starts when this terminal session opens
    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - startMs) / 1000);
      const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      setElapsedShift(`${hrs}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) return null;

  const isStaff = currentUser.role === 'staff';
  const isAdmin = currentUser.role === 'admin';

  // Role-Based Navigation Dock Filter:
  // Staff sees ONLY POS Terminal.
  // Manager & Admin see expanded operations.
  const navItems: {
    id: ActiveModule;
    label: string;
    labelAr: string;
    icon: React.ReactNode;
    badgeCount?: number;
    badgeTone?: 'red' | 'amber' | 'emerald';
  }[] = [
    {
      id: 'pos',
      label: 'POS Billing',
      labelAr: 'نقطة البيع',
      icon: <ShoppingBag className="w-4 h-4" />,
    },
    ...(!isStaff
      ? [
          {
            id: 'web-orders' as ActiveModule,
            label: 'Web Orders',
            labelAr: 'طلبات الموقع',
            icon: <Globe className="w-4 h-4" />,
            badgeCount: pendingWebOrdersCount,
            badgeTone: 'amber' as const,
          },
          {
            id: 'catalog' as ActiveModule,
            label: 'Menu & Combos',
            labelAr: 'المنيو والكومبو',
            icon: <BookOpen className="w-4 h-4" />,
          },
          {
            id: 'print-engine' as ActiveModule,
            label: '80mm Queue',
            labelAr: 'طابعات الفواتير',
            icon: <Printer className="w-4 h-4" />,
          },
          {
            id: 'erp' as ActiveModule,
            label: 'ERP & Z-Report',
            labelAr: 'المخزون والتقرير',
            icon: <Layers className="w-4 h-4" />,
            badgeCount: !isStaff && lowStockIngredients.length > 0 ? lowStockIngredients.length : 0,
            badgeTone: 'red' as const,
          },
        ]
      : []),
  ];

  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-[#E8E1D5] shadow-xs px-3.5 py-2 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* LEFT: Bespoke Brand Header (CHIKARRO with FRIED CHICKEN directly beneath in bright QSR yellow) */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col justify-center select-none">
            <span className="font-display font-black text-xl md:text-2xl tracking-tight text-[#C8102E] leading-none">
              {SHORT_NAME}
            </span>
            <span className="text-[10px] md:text-[11px] font-black tracking-widest text-[#EAB308] uppercase leading-none mt-1">
              {BRAND_TAGLINE}
            </span>
          </div>

          {/* Multi-Branch Switcher: Completely HIDDEN unless multiBranchMode is enabled & Admin */}
          {multiBranchMode && isAdmin && (
            <div className="flex items-center gap-1.5 bg-[#FAF6F0] border border-[#E8E1D5] rounded-lg px-2 py-1 ml-2">
              <Building2 className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <select
                aria-label="Active Tenant Branch"
                value={activeBranch.id}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#1E293B] focus:outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchCode} • {b.branchName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* CENTER: Role-Specific Navigation Dock */}
        {!isStaff && (
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-[#FAF6F0] border border-[#E8E1D5]">
            {navItems.map((item) => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#C8102E] text-white shadow-xs'
                      : 'text-[#1E293B] hover:text-[#C8102E] hover:bg-white'
                  }`}
                >
                  {item.icon}
                  <span>{language === 'ar' ? item.labelAr : item.label}</span>
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                        isActive
                          ? 'bg-white text-[#C8102E]'
                          : item.badgeTone === 'red'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* RIGHT: Telemetry + Role Badge & Lock */}
        <div className="flex items-center gap-2">
          {/* Subtle Language Switcher */}
          <button
            type="button"
            onClick={() => toggleLanguage()}
            className="px-2 py-1 rounded-md text-xs font-bold bg-[#FAF6F0] border border-[#E8E1D5] text-[#1E293B] hover:border-amber-300 transition"
            title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          >
            {language === 'en' ? 'AR' : 'EN'}
          </button>

          {/* Supabase Cloud Menu Sync & Telemetry */}
          <button
            type="button"
            onClick={() => refetchCloudCatalog()}
            disabled={isCloudSyncing}
            title={
              cloudSyncStatus === 'synced'
                ? `Supabase Cloud Synced (${menuItems.length} items, ${categories.length} categories). Click to refresh.`
                : cloudSyncStatus === 'syncing'
                ? 'Syncing menu with Supabase Cloud...'
                : 'Offline Menu Fallback Active (Local catalog). Click to retry Supabase sync.'
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold transition active:scale-95 ${
              cloudSyncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : cloudSyncStatus === 'syncing'
                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-stone-50 text-stone-700 border-[#E8E1D5] hover:bg-stone-100'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-500'
                  : cloudSyncStatus === 'syncing'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-amber-400'
              }`}
            />
            {isCloudSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-stone-500" />
            )}
            <span className="hidden lg:inline uppercase font-bold text-[10px]">
              {cloudSyncStatus === 'synced'
                ? `CLOUD SYNCED (${menuItems.length})`
                : cloudSyncStatus === 'syncing'
                ? 'SYNCING...'
                : 'OFFLINE CACHE'}
            </span>
          </button>

          {/* 80mm Printer Status (live: print-bridge health, or system printer when no bridge) */}
          <div
            onClick={() => isDesktopApp() && setShowPrinterSetup(true)}
            role={isDesktopApp() ? 'button' : undefined}
            title={`${PRINTER_NAME}${activeBranch.printerIp ? ` @ ${activeBranch.printerIp}` : ''}`}
            className={`hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono font-semibold text-stone-600 ${
              isDesktopApp() ? 'cursor-pointer hover:border-amber-300' : ''
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                printerStatus === 'connected'
                  ? 'bg-emerald-500'
                  : printerStatus === 'checking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <Printer className="w-3.5 h-3.5 text-stone-500" />
            <span>
              {printerStatus === 'connected'
                ? 'PRINTER CONNECTED'
                : printerStatus === 'checking'
                ? 'CHECKING PRINTER'
                : 'PRINTER OFFLINE'}
            </span>
          </div>

          {/* Active Shift Timer */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#FAF6F0] border border-[#E8E1D5] text-xs font-mono font-semibold text-stone-700">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>{elapsedShift}</span>
          </div>

          {/* Persistent Low-Stock Alert Bell (<= 5 Threshold) */}
          {allLowStockItems.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLowStockDropdown((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-300 text-xs font-bold transition shadow-xs animate-pulse"
                title="View items and ingredients running low (<= 5 units)"
              >
                <Bell className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                <span className="font-mono font-extrabold">{allLowStockItems.length} LOW STOCK</span>
              </button>

              {/* Flyout Dropdown */}
              {showLowStockDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border-2 border-rose-300 shadow-2xl p-3 z-50 space-y-2 text-left">
                  <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-2">
                    <span className="text-xs font-extrabold text-[#1E293B] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Low Stock Alerts (&le; 5 units)
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                      {allLowStockItems.length} Alerts
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                    {allLowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#1E293B]">{item.name}</div>
                          <div className="text-[10px] font-mono text-stone-500">
                            SKU: {item.sku} • {item.type === 'menu_item' ? 'Menu Product' : 'Raw Ingredient'}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-xs font-extrabold text-rose-700">
                            {item.currentStock} {item.unit}
                          </div>
                          <div className="text-[9px] text-stone-500">
                            Threshold: &le;{item.threshold}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!isStaff && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowLowStockDropdown(false);
                        setActiveModule('erp');
                      }}
                      className="w-full py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#A50D25] text-white font-mono text-xs font-bold text-center transition"
                    >
                      Open ERP Inventory &amp; Restock
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Total Sales (opens Transaction History / Sales Audit) */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#E8E1D5]">
            <button
              type="button"
              onClick={() => setShowSalesHistory(true)}
              title={language === 'ar' ? 'سجل المبيعات والفواتير' : 'Open Transaction History & Sales Audit'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold font-mono transition active:scale-95 shadow-xs cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
              <span>
                {language === 'ar'
                  ? `إجمالي المبيعات: ${formatKWD(dailyGrossSalesKwd)}`
                  : `Total Sales: ${formatKWD(dailyGrossSalesKwd)}`}
              </span>
            </button>

            <button
              onClick={logout}
              title="Lock Screen / Switch User"
              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      {showPrinterSetup && <PrinterSettingsModal onClose={() => setShowPrinterSetup(false)} />}
      {showSalesHistory && <SalesHistoryModal onClose={() => setShowSalesHistory(false)} />}
    </header>
  );
};
