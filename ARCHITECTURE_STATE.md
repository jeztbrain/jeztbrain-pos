# ARCHITECTURE_STATE.md — JeztBrain Multi-Tenant QSR Cloud POS & ERP System

## 1. Platform Overview & Identity
- **Flagship Tenant**: `CHIKARRO Fried Chicken` — Salmiya Branch (Salem Al-Mubarak St, Kuwait)
- **Platform Creator & Signature Branding**: **JeztBrain** (Strictly formatted as a single word — never spaced out, no glowing green dot. Placed discreetly in the login portal and thermal receipt footers to maintain an uncluttered POS interface).
- **Currency Standard**: Strictly Kuwaiti Dinar (`0.000 KWD` — 3 decimal places via `formatKWD()` and `roundKWD()` across all calculations, modifiers, combo packages, raw BOM ingredient costing, expense vouchers, and thermal receipts).
- **Order Channels & Aggregators**: Strictly `Dine-In`, `Takeaway`, `Web Direct`, and `Keeta` (all Talabat and Deliveroo references completely removed).
- **Default Language**: English Only (`en`) default for optimal staff speed (with toggleable Arabic mode).

---

## 2. Multi-Branch Master Architecture
- **Master Switch (`multiBranchMode`)**: Default: **OFF (Single-Branch Mode)**.
- **When OFF**: The system operates strictly as a high-performance Single-Branch QSR for Chikarro Salmiya Flagship (`KW-SLM-01`). All multi-tenant dropdowns, secondary branch switchers, and cross-branch analytics are hidden from the cashier and manager interfaces to guarantee maximum operational speed and zero clutter.
- **When ON (Admin Configured)**: Multi-branch capabilities activate dynamically, revealing branch selectors for:
  - Branch 1: `CHIKARRO Salmiya Flagship (KW-SLM-01)` — `chikarrasalmiya.com`
  - Branch 2: `CHIKARRO Hawally Tunis St Express (KW-HWL-02)`
  - Branch 3: `CHIKARRO Mahboula Coastal Cloud Kitchen (KW-MHB-03)`

---

## 3. Design Architecture & Visual Engineering

### Warm Restaurant Theme (Zero Eye-Strain, Food-Appetizing)
- **Background**: Soft Warm Cream / Sand (`#FAF6F0`).
- **Cards & Surfaces**: Pure crisp white (`#FFFFFF`) with subtle warm borders (`#E8E1D5`) and soft shadows (`box-shadow: 0 1px 3px rgba(0,0,0,0.04)`).
- **Text & Typography**: Deep Charcoal (`#1E293B`) for maximum daylight legibility under commercial kitchen/counter lighting.
- **Brand Accents**: Chikarro Crimson Red (`#C8102E`, hover `#A50D25`) and Warm Amber (`#D97706`). All previous blue color schemes and blue flame icons have been completely eliminated.

### Top Command Header (HUD)
- Ultra-clean and focused: removed "Salmiya Flagship (KW-SLM-01)" and "CASHIER COUNTER TERMINAL • HIGH-VELOCITY MODE" to eliminate redundant noise.
- Provider branding formatted as single word "JeztBrain" discreetly placed in the login and footer areas.
- Active shift counter, live hardware telemetry (80mm thermal spooler, web order sync pulse), active user badge, and one-click user lock/switch.

### "All Menu" + "Find It" Vertical Category Sidebar & Prominent Search
- **Eliminated**: Horizontal scrolling category ribbon tabs.
- **Prominent Search Bar**: High-contrast, highlighted search bar at the top of the menu workspace for instant filtering by item title or SKU code.
- **Two Master Mode Buttons**:
  - **"All Menu"**: Displays all menu items across all categories in a clean, compact grid.
  - **"Find It" (Categories)**: Opens/pins a dedicated vertical category sidebar on the left side of the menu grid.
- **Category Icon Rules**:
  - Icons are displayed ONLY for:
    - **Beverages** (`CupSoda`)
    - **Individual Meals** (`Utensils`)
    - **Zinger & Wraps** (`Sandwich`)
  - All other categories (Combos & Deals, Broasted Buckets, Loaded Fries, Sides & Dips) display **NO icon** for an ultra-clean vertical text list.
- **Dynamic Category Manager (`/catalog` Tab 3)**:
  - Admin can add new categories, rename existing categories, reorder them (move up/down), delete custom categories, and toggle category icons on/off with immediate localStorage persistence.

### Compact Product Cards
- Touch-friendly 4-column layout on desktop.
- High-contrast typography with item thumbnail badge, prep-time tag, bold title, `0.000 KWD` price in Crimson Red, and large `+` add button.

### 100vh Laptop Viewport & Pinned Bottom Checkout Deck
- Strict `h-screen overflow-hidden flex flex-col` / `h-[calc(100vh-52px)]` container architecture.
- Right Cart line items scroll internally (`flex-1 overflow-y-auto`).
- **Permanently Pinned Bottom Deck (`shrink-0`)**:
  - Subtotal & Discount rows
  - Grand Total in large Crimson Red monospace typography (`0.000 KWD`)
  - Hold / Recall Cart buttons
  - Quick Tenders: `Cash`, `K-Net`, `Wamd`
  - Giant "Pay & Print Bill" action button
  - Pinned controls are never cut off or pushed off-screen on 1366x768 and 1920x1080 laptop viewports.

---

## 4. Role-Based Simplified Navigation Matrix

| Feature / Workspace | Staff (Cashier) | Manager | Admin (Super HQ) |
| :--- | :---: | :---: | :---: |
| **High-Velocity POS Terminal (`/pos`)** | Yes (Pure Billing Terminal) | Yes | Yes |
| **Incoming Web Orders Hub (`/web-orders`)** | View & Accept | Full Dispatch | Full Control |
| **Combo Studio & Category Manager (`/catalog`)** | Hidden | Full Builder | Full Builder + Categories |
| **80mm Print Queue Spooler (`/print-engine`)** | Hidden | Full Management | Full Management |
| **Shift Z-Report & Cash Audit (`/erp`)** | Hidden | Reconcile & Print | Full Audit |
| **Daily Shop Expenses Entry (`/erp`)** | Hidden | Record Expenses | Audit & Record |
| **Raw BOM Inventory & Restock (`/erp`)** | Hidden | View & Restock | Full Control |
| **Multi-Branch Master Toggle (`/erp`)** | Hidden | Hidden | **Master Switch** |
| **Staff Accounts & PIN Security (`/erp`)** | Hidden | Hidden | Full Access |
| **Aggregator Commission Rates (`/erp`)** | Hidden | Hidden | Full Control (Keeta) |
| **Sales Audit Log & Movement Analytics (`/erp`)** | Fast & Slow Moving Modal | Fast & Slow Moving Modal | Full Audit & Movement Matrix |
| **Direct Product Stock Tracking & Restock (`/erp`)** | Hidden | View Stock Levels | Full Universal Stock & Threshold Control |

---

## 5. Critical POS Operational Engines & Upgrades

### 1. KOT-First Kitchen Printing Workflow
- **Kitchen Ticket Priority**: Real QSR order flow requires sending orders to the kitchen immediately before or separate from cashier settlement.
- **Dual Oversized Action Buttons** in Right Cart bottom deck (`min-h-[52px]`):
  - **`1. SEND & PRINT KOT (KITCHEN)`**: Instantly dispatches the 80mm Kitchen Order Ticket without monetary figures, registers order status as `'cooking'` (In Kitchen), deducts inventory, and clears active cart.
  - **`2. PAY & PRINT CUSTOMER BILL`**: Opens the settlement modal for multi-tender checkout.
- **Auto-Print KOT Before Customer Bill**: Built-in toggle in settlement modal (default: `true`), allowing cashiers to simultaneously dispatch the kitchen ticket and print the finalized customer tax invoice upon payment.

### 2. Universal Space-Insensitive & Dynamic Price Search Engine
- **Universal Search Placeholder**: `"Search any item name, words, or price (e.g., 7.450, 1.500)..."`
- **Space-Insensitive & Symbol-Agnostic Matching**: Strips all spaces, hyphens, and symbols (`replace(/[^a-z0-9.]/g, '')`) from both search queries and product/deal titles (e.g., `"zingerwrap"` matches `"Zinger Wrap"`, `"broastedchicken"` matches `"Broasted Chicken"`, `"hot&crispy"` matches `"Hot & Crispy"`).
- **Multi-Word Any-Order Token Matching**: Splits queries by spaces and ensures all tokens exist in item metadata (e.g., `"chicken crispy spicy"` matches any item with these terms in any order).
- **Universal Dynamic Price Matching (Exact & Partial)**: Extracts numerical currency queries and compares against all menu item prices and combo deals dynamically (`price.toFixed(3)` and partial matching like `7.45` or `7.450`) across all categories with ZERO hardcoded rules.

### 3. Touch-Screen Ergonomics & Redesigned Touch Discount Modal
- **Oversized Touch Action Buttons**: `min-h-[52px]` for **HOLD**, **RECALL**, **CLEAR**, and **DISCOUNT** buttons on the POS counter screen for fast tactile interaction on 15" and 21" touch displays.
- **Touch Discount Modal**:
  - **Segmented Mode Switch**: `% Percentage` vs `0.000 KWD Flat Dinar` concession.
  - **Quick Presets**: `5%`, `10%`, `15%`, `20%` / `0.250`, `0.500`, `1.000`, `2.000 KWD`.
  - **4x3 On-Screen Touch Keypad**: Large touch keys (`1-9`, `.`, `0`, `⌫`, and `Clear Numpad`).
  - **Live Calculation Display**: Shows Cart Subtotal, Discount Deduction, and Net Order Payable in real-time.
  - **Manager Limit Enforcement**: Automatically calculates effective percentage and prompts for Manager PIN authorization if the rate exceeds the cashier's discount limit (e.g., >10%).
  - **Reason Note Chips**: One-touch preset chips (`"Regular Guest"`, `"Staff Meal"`, `"Manager Promo"`, `"Goodwill / Delay"`, `"Spill / Remake"`) plus custom note field.

### 4. Sales Audit Log & Item Movement Velocity Analytics
- **Staff View**: Prominent **"Fast & Slow Moving"** button in POS top navigation opening a dedicated modal displaying today's fast-moving bestsellers (ranked #1, #2, #3... with units sold and revenue) and slow-moving items with upsell recommendations.
- **Admin View (`/erp` Tab: "Sales Audit & Item Movement")**:
  - **Comprehensive Transaction Log**: Complete audit table of all bills with Invoice #, Token #, Timestamps, Cashier, Channel, Tender Method, Items summary, Discount history, and Status.
  - **Filter Deck**: Instant filtering by Channel (Dine-In, Takeaway, Web Direct, Keeta), Tender Method (Cash, K-Net, Wamd, Split), and Order Status (Settled, Cooking, Voided).
  - **Actions**: One-click Re-print 80mm Customer Bill and Re-print Kitchen KOT slip on any past transaction.
  - **Item Velocity Matrix**: In-depth fast vs. slow moving analytics, unit volumes, and revenue share percentage.

### 5. Universal Admin-Configurable Stock Tracking & Low-Stock Alerts
- **Dynamic Stock Tracking on ANY Item**: Admin can toggle stock tracking for ANY menu item or beverage directly from `/erp` (Recipe & Stock tab) or `/catalog` (Menu Manager).
- **Live Inventory Deduction**: Automatically decrements tracked item stock upon POS checkout or Web Direct settlement.
- **Configurable Low-Stock Threshold**: Defaults to `<= 5` units (configurable per item).
- **Persistent Top Header Alert Bell**: High-visibility animated bell indicator in the Top Command Header with item count badge, showing a dropdown of all items `<= 5` or out-of-stock with direct restock links.
- **Visual Stock Badges in POS**:
  - `OUT OF STOCK (0 LEFT)` in bold red with card disabled from ordering.
  - `LOW STOCK: X LEFT` in bold amber/red alert pill.
  - `X in stock` in clean emerald pill.

### 6. Cart Clear Permission, Combo Accordion & Receipt Compactness Refinements
- **Instant Unbilled Cart Clear (No Manager PIN Prompt)**: Cashiers/staff can instantly empty the active unbilled cart with a single tap on the **CLEAR** button. Manager PIN authorization is reserved strictly for voiding settled/historical tickets or cashier discount limits.
- **Collapsible Combo Accordion in Right POS Cart**: When combo items are added to the active cart, included sub-items are collapsed by default. An interactive dropdown arrow pill (`[X items ▾]`) next to the combo heading allows staff to toggle open or collapse the pack breakdown without crowding the billing deck.
- **Smart Combo Breakdown on Customer Bill (Short Receipt Optimization)**: On the 80mm Customer Tax Invoice, the detailed `[COMBO BUNDLE INCLUDES]` sub-items list is printed ONLY when the entire order consists strictly of a single combo item (`order.items.length === 1 && order.items[0].type === 'COMBO' && order.items[0].quantity === 1`). For all multi-item orders (e.g., 2 combos, or 1 combo + any extra item like a burger or fries), only the combo title, KWD price, and prep notes are printed, keeping receipts compact and preventing paper wastage. (On the Kitchen KOT, all component pack items are always printed for kitchen preparation).
- **Dine-In Customer Bill Token Rule**: On 80mm Customer Tax Invoices for Dine-In orders, the giant `ORDER TOKEN NUMBER` block is completely hidden, rendering only the clean, prominent `DINE-IN • TABLE T-XX` hospitality badge. The giant token block is displayed strictly for Takeaway and counter pickup orders.

### 7. UI Polish, Web Orders Compactness, ERP Stock Logic, Sales Filters & Role PIN Matrix
- **Compact Web Orders Queue Cards (`/web-orders`)**:
  - Reduced vertical height and card padding for rapid scanning of incoming delivery and pickup orders.
  - Collapsible combo pack sub-items: sub-items are collapsed by default with an interactive `[X pack items ▾]` toggle pill, reducing vertical card height by over 40% and fitting multiple orders per screen without excessive scrolling.
  - Cleaned order action buttons with clear transactional labels (`"ACCEPT & AUTO-BILL • ISSUE KOT & RECEIPT"`).
- **ERP Data-Driven Raw Ingredient Restock Modal (`/erp`)**:
  - Eliminated arbitrary dummy `+25` quick-add buttons.
  - Implemented a dedicated "Receive Stock" modal where managers/storekeepers input exact received quantities, supplier invoice / PO references (e.g. `AL-WAZZAN-PO-8821`), and delivery quality inspection notes.
  - Automatically recalculates projected stock and logs an immutable audit trail in `inventoryLogs`.
- **Instant Sales Audit Segment Filter Chips (`/erp`)**:
  - 8 instant-filtering chips in the Sales Audit Log: `All Bills`, `Cash`, `K-Net`, `Wamd`, `Web Direct`, `Keeta`, `Dine-In`, and `Takeaway`.
  - Live count badges on each chip reflecting the exact number of matching settled tickets for instant 1-tap cashier and accountant reconciliation.
- **Management Roles & Editable PIN Matrix (`/erp` Admin Executive Tab)**:
  - Header renamed to **"Management Roles & PINs"**.
  - Added an **Edit (`✎`)** button beside each user row opening a dedicated Profile & Security Modal to modify names, employee codes, roles, designations, PIN codes, discount ceilings, and permissions (`canVoidBills`, `canManageCombos`).
  - Extended role hierarchy beyond basic tiers to support specialized QSR operational roles: `staff` (Team Member), `cashier` (Counter), `supervisor` (Floor), `storekeeper` (Inventory), `manager` (Shift), and `admin` (System Administrator).
- **Brand Typography & Zero AI Artifacts Polish**:
  - Header brand display cleanly formatted with **"CHIKARRO"** in Crimson Red (`#C8102E`) and **"FRIED CHICKEN"** positioned directly beneath in vibrant QSR yellow (`#EAB308`), removing awkward side-by-side cramped alignment.
  - Removed all AI artifacts (such as `✦` sparkles or stray `→` arrows) from module navigation labels, buttons, and system toasts.

### 8. KOT Manager Drawer & Unified Enterprise Login Portal
- **Removal of Bottom Floating KOT Chips**:
  - Completely removed the small, cramped recent order chips docked at the bottom of the screen.
- **KOT Queue Action Buttons & Binding State**:
  - In the Right Billing Panel top bar, right next to the "Hold" button, added a prominent **"KOT Queue"** button with a live active kitchen ticket counter badge: `KOT (4)`.
  - In the Right Billing Panel bottom action deck, added an oversized tactile bar button: `"ACTIVE KITCHEN ORDERS • KOT (4)"`.
  - When a kitchen ticket is loaded into the cart, an amber banner displays `KITCHEN TICKET #XXX (Loaded for Settlement) • [✕ Unbind]`.
- **Spacious KOT Manager Drawer & Modal**:
  - High-capacity modal listing all active kitchen orders (Tokens #401, #402, #403, #404, etc.) with their items, quantities, prep style (`** REGULAR **` or `** SPICY **`), and kitchen notes.
  - Fast channel filter chips (`All`, `Dine-In`, `Takeaway`, `Keeta`) and instant search bar.
  - Interactive Action Deck on each KOT card:
    - **"Load into Billing Deck"**: Loads the ticket into the active cart for review or extra items.
    - **Quick 1-Tap Pay**: Instant settlement via `Cash`, `K-Net`, or `Wamd`, issuing the 80mm Customer Tax Invoice and freeing the table.
    - **"Print KOT"**: Re-prints the 80mm kitchen ticket.
- **Unified Enterprise Login Portal (`/login`)**:
  - Replaced the verbose multi-box PIN matrix, role tabs, and permission walls with a clean, centralized enterprise login card.
  - Features two simple input fields: **Username / Staff ID** and **Password / Access PIN** (with toggleable password visibility).
  - **Smart Role Routing**: Authenticates across all user tiers without requiring manual tab selection:
    - Super Admin (`admin` / `5232` / `CHK-ADM-999`) -> Routes directly to **Admin HQ** (`/erp`).
    - Branch Manager / Supervisor (`manager` / `2222` / `CHK-MGR-201`) -> Routes directly to **Manager Console** (`/catalog`).
    - Staff Cashier / Storekeeper (`staff` / `1111` / `CHK-STF-104`) -> Routes directly to **Staff POS** (`/pos`).
  - **Clean Enterprise Security Styling**: Stripped all address subtitles, floating debug labels, currency status text, and demo credential buttons for a clean, secure enterprise authentication screen.

### 9. Admin Receipt Header & Footer Customizer (Direct 80mm Binding)
- **Dedicated Editor in Admin Settings (`/erp` Tab: Admin Executive)**:
  - Admin can configure and persist store branding directly to all printed 80mm customer tax invoices.
  - **Editable Fields**:
    - Store Title (e.g., `CHIKARRO FRIED CHICKEN`)
    - Arabic Subtitle (e.g., `شيكارو للدجاج المقلي - السالمية`)
    - Address Line 1 (Street & Block, e.g., `Block 10, Salem Al-Mubarak St`)
    - Address Line 2 (Building & Area, e.g., `Building 24, Salmiya, Kuwait`)
    - Contact Phone Number (e.g., `+965 2224 8910`)
    - Website Domain (e.g., `chikarrasalmiya.com`)
    - Custom Thank-You Footer Message (e.g., `THANK YOU FOR DINING WITH CHIKARRO!`)
  - **Live 80mm Layout Preview**: Real-time 280px thermal receipt preview reflecting edits instantly before saving.
  - **LocalStorage & Context Synchronization**: Saved settings persist immediately to `ReceiptStoreConfig` via `updateReceiptConfig()`.

### 10. Direct Tap-to-Cart & Universal "Regular" Preparation Default
- **Instant Tap-to-Cart**: Clicking or tapping any menu item or combo package in the POS grid immediately adds 1 unit to the active cart with default settings, drastically reducing checkout friction.
- **Universal "Regular" Default**: Chicken preparation style defaults to **`Regular`** across all single items, combos, and modal pickers. Cashiers only change to `Spicy` or `Mixed` when explicitly customized by the customer.
- **Dedicated Tactile "Prep" Button**: Every product card and combo card features a tactile `Prep` button (`SlidersHorizontal` icon) allowing cashiers to open the customization drawer to select spice levels, dips, and special kitchen instructions when requested.

### 11. Direct Silent / Instant 80mm Thermal Printing
- **Elimination of On-Screen Modal Friction**: Clicking `"1. Send & Print KOT"` or `"2. Pay & Print Customer Bill"` spools directly to the printer via native `window.print()` using an off-screen print DOM container (`#thermal-print-root`).
- Cashiers can seamlessly ring up transactions and dispatch kitchen tickets without clicking through multi-step preview dialogs.

### 12. Staff Purchase & Credit Ledger Workflow (GAAP Segregation)
- **Top Command Deck Integration**:
  - Cashiers can select a staff member from the `"Staff Purchase ▼"` dropdown selector on the POS counter screen.
  - Active cart enters **Staff Purchase Mode** with a prominent Amber banner: `STAFF PURCHASE: [Employee Name] - CREDIT`.
- **Zero-Cash / Payroll Deduction Tender**: Checkout registers payment method as `'staff_credit'` without requiring cash payment.
- **Strict Accounting Segregation**:
  - Staff Credit amounts are **strictly excluded** from Gross Customer Sales Revenue, Net Customer Sales, and Cash/K-Net cash drawer counts.
  - Segregated into a dedicated `totalStaffCredit` ledger metric to maintain strict GAAP compliance for payroll meal deductions.
- **Dedicated Staff Credit Ledger Tab (`/erp`)**:
  - Full audit trail of staff meals with timestamps, employee codes, invoice refs, item summaries, and amounts.
  - Summary metrics: Total Unpaid Credit, Total Settled Credit, Cumulative Staff Meals.
  - Filters by payment status (`All`, `Unpaid`, `Settled`), staff member, and search query.
  - One-click **"Mark Deducted"** settlement action linked to monthly payroll runs.

### 13. Seamless Login Virtual Keyboard & Viewport Lift
- **Initial Hidden State**: The virtual keyboard is completely hidden on initial load, leaving a clean, centered enterprise login card.
- **Focus Slide-Up & Viewport Lift**: Tapping Username or Password slides the virtual keyboard smoothly into view while lifting the login card (`-translate-y-20 sm:-translate-y-28 md:-translate-y-32`) so the card, inputs, and red `"SIGN IN TO TERMINAL"` button remain 100% visible and unobstructed above the keys.
- **Seamless Hardware Terminal Styling**: Removed all floating white boxes, borders, and drop-shadows around the keyboard. Keys sit directly on the warm `#FAF6F0` background frame as integrated hardware touch buttons.
- **Outside Tap Dismissal**: Tapping anywhere outside the login card and keyboard instantly dismisses the virtual keyboard.

### 14. Supabase Cloud Menu Sync & Real-Time Fetch Architecture
- **Dynamic Supabase Client (`src/lib/supabase.ts`)**:
  - Direct integration with Supabase cloud database (`https://ntnjinkhxntenmkcufjb.supabase.co`) via `@supabase/supabase-js`.
  - Typed query calls: `supabase.from('categories').select('*')`, `supabase.from('menu_items').select('*')`, and `supabase.from('store_settings').select('*')`.
- **Dynamic Ingestion & 3-Decimal Kuwaiti Dinar Normalization**:
  - `mapDbMenuItemToMenuItem()` enforces strict 3-decimal KWD pricing (`0.000 KWD`) via `roundKWD()` across all incoming cloud items.
  - Automatically maps both snake_case and camelCase database columns.
  - `mapDbCategoryToCategory()` applies icon visibility rules (drinks, meals, burgers, deals).
- **Graceful Offline / Empty Fallback**:
  - If cloud network fails or tables are initializing, the system falls back seamlessly to the verified local seed catalog (`SEED_CATEGORIES`, `SEED_MENU_ITEMS`, `DEFAULT_RECEIPT_CONFIG`).
  - Synced cloud items are immediately cached in `localStorage` for zero-delay offline loading on subsequent app launches.
- **Real-Time Postgres Subscriptions**:
  - Subscribes via `supabase.channel('public:pos_cloud_catalog')` to listen for live `INSERT`, `UPDATE`, and `DELETE` events on `categories`, `menu_items`, and `store_settings`.
- **Top Command Deck Telemetry**:
  - Tactile Cloud Sync indicator pill (`CLOUD SYNCED (X)`, `SYNCING...`, or `OFFLINE CACHE`) with live 1-click re-fetch trigger.

### 15. Menu Restructuring, 11 Split Categories & Live Combo Offer Engine
- **11 Split Category Architecture**:
  - To prevent cluttered lists, beverage and side dishes are segregated into dedicated, focused categories:
    1. `deals` — Deals & Combos (`Flame` icon)
    2. `individual` — Individual Meals & Boxes (`Utensils` icon)
    3. `burgers` — Burgers, Sandwiches & Wraps (`Sandwich` icon)
    4. `prawns` — Prawns Specials (`Utensils` icon)
    5. `loaded-fries` — Loaded Fries
    6. `fries-buns` — Fries & Buns
    7. `sides-snacks` — Sides & Snacks
    8. `sauces-dips` — Sauces & Dips
    9. `shakes-juices` — Shakes & Juices (`CupSoda` icon)
    10. `lassi-mojitos` — Lassi & Mojitos (`CupSoda` icon)
    11. `soft-drinks` — Soft Drinks (`CupSoda` icon)
- **Supabase Cloud Combo Offer Ingestion (`mapDbItemToComboOffer`)**:
  - Supabase `menu_items` with `is_combo: true` are dynamically ingested into typed `ComboOffer` models with parsed `comboIncludes` components and 3-decimal KWD pricing.
  - Legacy local mock combo packages (e.g. `"12 Pcs Salmiya Mega Bucket Deal"`, `"Weekend Diwaniya Super Saver"`) have been completely purged from frontend state and localStorage.
  - Only official live Chikarro combos (e.g. `"Super Deal Combo (8 Pcs)"`, `"Family Meal (12 Pcs)"`, `"Party Meal (16 Pcs)"`, etc.) render on screen.
- **Product Card Typography & Wrapping Architecture**:
  - Titles on product and combo cards utilize `line-clamp-2 min-h-[2.4rem] leading-snug break-words` to ensure that long product titles (such as `"Double Pat Zinger..."` or `"Chikarro Protein Smoothie (Dates & Dry Fruits)"`) wrap smoothly across two lines without awkward truncation or irregular card sizing.
- **Staff Purchase Dropdown UI Polish**:
  - Removed duplicate visual arrow artifact (`Staff Purchase` instead of `Staff Purchase ▼ ˅`).

### 16. Category Deduplication, Count Badge Accuracy & Live Catalog Ingestion Fix
- **Canonical Slug Normalization (`normalizeCategorySlug`)**:
  - All categories mapped from Supabase UUIDs or name variants are normalized to the canonical slugs.
  - Duplicates are keyed and eliminated in memory (`categoriesMap.set(mapped.slug, mapped)`).
  - In `PosTerminal`, `displayCategories` filters out duplicate slugs and completely hides empty categories showing 0 items.
- **True Product Category Item Counts**:
  - Removed the `!m.isCombo` exclusion on individual categories.
  - Individual meals (e.g., `IND-SNK2`, `IND-CMB4`, `IND-STR10`, `IND-HBG`) accurately display their exact active count (`7` items) in the sidebar badge and load in full upon category selection.
  - "Burgers, Sandwiches & Wraps" accurately displays `13` items, and "Prawns Specials" displays `10` items.
- **Deals Restoration (Elimination of Generic "Combo Deal" / 0.000 KWD Placeholders)**:
  - `mapDbItemToComboOffer` supports both raw DB row keys (`name`, `price`, `combo_includes`) and mapped `MenuItem` properties (`nameEn`, `priceKwd`, `comboIncludes`).
  - Corrupted localStorage caches containing generic `"Combo Deal"` with `0.000 KWD` are automatically sanitized and restored to live catalog data on startup.

### 17. Admin / Manager Secure Bill Void & Stock Reversal Engine
- **Docked "Void Bill" Trigger**:
  - Pinned in the POS Order Cart top bar (`<RotateCcw /> Void Bill`) for instant cashier access.
- **Interactive Void Modal (`showVoidBillModal`)**:
  - **Bill Search & Recent Quick-Select**: Look up by Invoice # (e.g., `INV-SLM-20401`), Token # (`401`), or select directly from the 6 most recent completed transactions.
  - **Live Order Preview**: Displays full line item breakdown, customer/channel metadata, cashier identity, payment method, and 3-decimal KWD totals.
  - **Mandatory Audit Reason**: Selectable quick chips (*Customer Cancelled / Walkout*, *Cashier Punching Mistake*, *Kitchen 86*, *Duplicate Bill*, etc.) + custom explanation notes.
  - **Supervisor / Admin PIN Authorization**: Touch keypad and secure validation strictly checking Manager (`2222` Tariq) or Admin (`5232` Nawaf) authority.
- **Automatic Stock & Inventory Reversal**:
  - Direct tracked product stock is added back immediately.
  - Raw BOM ingredients are restocked and logged to `inventoryLogs` under `txType: 'VOID_RESTOCK'` referencing `VOID:[invoiceNo]`.
- **GAAP Shift Z-Report Integrity**:
  - Voided transactions are automatically flagged as `status: 'voided'` and excluded from gross sales, net revenue, cash drawers, and K-Net settlement tallies.
- **80mm Thermal Void Audit Slip**:
  - Provides a 1-click print action for a dedicated 80mm thermal cancellation voucher featuring `*** VOID / CANCELLED BILL ***`, supervisor authorization, timestamp, and cancellation reason.

### 18. Strict 11-Category Standardization & Direct Supabase Catalog Ingestion
- **Official 11-Category Supabase Schema Architecture**:
  - Standardized the category hierarchy to strictly match the 11 official categories in `public.categories` ordered by `display_order` ASC:
    1. `Deals & Combos` (`879809c5-bf5b-4aa4-a497-85549906c7a3`) — Icon: `Flame`
    2. `Burgers & Wraps` (`c2161df6-9ba0-4a32-81ad-581038df3dad`) — Icon: `Sandwich`
    3. `Prawns Special` (`46c81c0a-300c-4349-8b41-6bdb62780c7b`) — Icon: `Utensils`
    4. `Loaded Fries` (`1ece624d-a9f2-4ab7-82cc-567932e1416a`) — Icon: `Sparkles`
    5. `Kids Meals` (`ff643ddf-60db-4c7a-9703-0fc77954bac6`) — Icon: `Smile`
    6. `Sides & Snacks` (`46ea24e0-00aa-4367-9e7b-06c08c4d05a1`) — Icon: `Layers`
    7. `Juices & Mojitos` (`23608f56-935a-47ff-b8fd-b4c7502f9255`) — Icon: `GlassWater`
    8. `Shake & Lassi` (`ab566596-4f71-4221-a74b-cb1e2852121f`) — Icon: `CupSoda`
    9. `Dips & Sauce` (`89044163-601e-459f-8bb5-ecc31d49a732`) — Icon: `Soup`
    10. `Add On` (`5be775a6-c5e3-43f8-a70c-cb51d67decef`) — Icon: `PlusCircle`
    11. `Soft Drinks` (`a4546fcd-6f32-4898-8061-e36fcd835ec9`) — Icon: `CupSoda`
- **Soft Drinks Active Visibility Retention**:
  - Soft Drinks is strictly preserved and visible in both the POS Category Sidebar and Admin Category Selectors even when its item count is 0, enabling the Store Admin to add soft drink products directly.
  - Added a dedicated empty state in the POS grid for categories with 0 items: `"No products currently in [Category Name]. Products added by Admin will appear here."`
- **Direct Supabase Item Binding & Legacy Mock Combo Purge**:
  - Completely purged the redundant `filteredCombos` block that caused items to render as generic `"Combo Deal"` with `"0.000 KWD"`.
  - All 89 products (including all 12 deals in Deals & Combos) bind directly to `item.name` and `Number(item.price).toFixed(3)` from Supabase `public.menu_items`.
  - Sidebar badges calculate exact item counts dynamically mapped to each category UUID.
- **Strict Search Filter (No Category Leakage)**:
  - `checkStrictSearchMatch` matches strictly against `item.nameEn`, `item.nameAr`, `item.sku`, or exact/partial price digits.
  - Eliminated category name matching from the search filter, preventing accidental category leakage where searching a term would return all unrelated items from an entire category.

### 19. QSR POS Responsive Viewport Architecture & Multi-Container Isolated Scrolling
- **Strict 100vh Viewport Locking (`App.tsx` & Root Layout)**:
  - Outer app container locked strictly via `h-screen max-h-screen w-screen max-w-[100vw] overflow-hidden flex flex-col select-none`.
  - Top Command Header (`shrink-0`) and main workspace (`flex-1 min-h-0 w-full overflow-hidden`) ensure the POS terminal operates within the exact bounds of the browser window without outer body scrollbars or page bouncing.
- **Left Category Sidebar Dedicated Independent Scrolling**:
  - The left category sidebar containing all 11 categories (including "Soft Drinks") is wrapped in an independent scrolling container (`w-40 sm:w-44 md:w-48 lg:w-52 h-full overflow-y-auto overscroll-contain`).
  - Scrolling through categories with touch or mousewheel stays strictly isolated to the category list via `overscroll-contain` and never triggers scrolling on the product grid, order ticket, or outer window.
  - Pinned category header (`sticky top-0 bg-white/95 backdrop-blur-xs z-10`) keeps category navigation clear during fast counter interaction.
- **Right Billing Panel & Cart Viewport Optimization (Laptops & Tablets)**:
  - Side-by-side split layout (`flex-row`) is enforced across all Desktop, Laptop, and Tablet screen sizes, preventing the billing panel from collapsing underneath the catalog on tablets.
  - Cart line items list has dedicated internal scrolling (`flex-1 min-h-[85px] sm:min-h-[100px] overflow-y-auto overscroll-contain`).
  - **Permanently Pinned Bottom Checkout Deck (`shrink-0`)**:
    - Compact financial summary (Subtotal, Discount, Delivery fee, and prominent Crimson Red Grand Total).
    - Compact Active Kitchen Orders KOT bar button.
    - Responsive oversized touch row (`min-h-[42px] sm:min-h-[46px]` for HOLD, RECALL, CLEAR, DISCOUNT).
    - Oversized primary workflow buttons (`min-h-[44px] sm:min-h-[48px]` for `"1. SEND & PRINT KOT"` and `"2. PAY & PRINT BILL"`).
    - Entire billing and checkout action deck remains permanently docked in full view on standard 1366x768 laptops and 768px-1024px tablets with zero cut-off or awkward page scrolling.

### 20. Cart Combo Accordion Breakdown & KOT Queue UI Refinements
- **Universal Cart Combo Accordion (Toggleable ▼ / ▶ Dropdown)**:
  - For any combo deal, bucket meal, family meal, burger combo, or special box added to the cart, an interactive toggle button displaying `▼` (when expanded) or `▶` (when collapsed) is rendered next to the item title.
  - Automatically extracts the exact items included in the meal:
    - Checks structured `line.comboSubItems` (from combo studio offers).
    - Checks structured `line.comboIncludes` (from menu item models).
    - Dynamically parses `line.description` directly from the Supabase database, splitting entries by pipe (`|`), plus (`+`), bullet (`•`), or newline (`\n`).
  - Smooth expandable drawer reveals every component clearly (e.g. `Fried Chicken-08`, `Bun-03`, `Fries-M`, `Coleslaw-L`, `Soft Drink 1.25 Ltr`), allowing counter staff to immediately explain meal contents and answer customer inquiries in real time.
- **KOT Queue Elapsed Timer Formatting**:
  - Kitchen Order Ticket elapsed time automatically formats into hours and minutes when exceeding 60 minutes (e.g. `1h 27m in kitchen`, `2h 10m in kitchen`), and minutes (`18m in kitchen`) when under 60 minutes.
- **Cleaned KOT Bento Card Interface**:
  - Removed cluttered payment shortcut buttons (Cash, K-Net, Wamd, Print KOT) from individual kitchen order cards.
  - Cards feature a single, high-contrast action button: `"Load into Billing Deck • Review & Pay"`, ensuring staff use the standardized cashier settlement flow without accidental 1-tap mis-tenders.

### 21. Silent Web Order Real-Time Pop-Up Notification & Instant 1-Tap Accept
- **Real-Time Supabase Listener (`subscribeToIncomingWebOrders`)**:
  - Automatically listens via Supabase Realtime channel (`postgres_changes`) for new orders inserted into `web_orders` and `orders` tables.
  - Parses payload fields with safe type fallback (`mapDbRowToIncomingWebOrder`), normalizing customer contact, items, address, and 3-decimal KWD totals (`0.000 KWD`).
- **Strictly Silent Visual Pop-up Banner**:
  - Smooth floating notification card slides down smoothly from the top of the POS screen (`top-14 left-1/2 -translate-x-1/2 z-50`).
  - **Zero Audio Interference**: Audio chime is completely disabled inside the POS counter screen, preserving cashier silence (audio alert handled separately on the website admin panel).
  - Displays complete incoming web order information:
    - Pulsing red dot with `NEW WEB ORDER` and `chikarrasalmiya.com` badge.
    - Channel pill: `Web Direct / Delivery` or `Web Direct / Pickup`.
    - Multi-order carousel controls (`1 of N Orders`) if multiple web orders arrive simultaneously.
    - Order Token # (e.g. `WEB-SLM-8891`), customer name, phone number, and area.
    - Structured items summary (e.g. `2 Items: 1x 12 Pcs Super Deal Combo, 1x Pepsi Cola Can`).
    - Total Amount in 3-decimal Kuwaiti Dinar (`0.000 KWD`) with payment status (`K-Net Online • PAID` / `COD`).
- **Instant Direct "Accept Order" Action Button**:
  - Direct 1-tap button (`bg-[#C8102E] text-white`) immediately converts the web order into an active kitchen order / KOT ticket in POS state (`activeKotOrders`).
  - Updates order status to `cooking` / `accepted` in both `web_orders` and `orders` tables in Supabase cloud, automatically updating the customer website backend.
  - Deducts recipe BOM inventory stock automatically.
  - Seamlessly dismisses the banner without opening intrusive full-screen modal windows.
  - Counter staff manages the incoming web order instantly without ever leaving or displacing their active `/pos` billing screen.
- **Dismiss & Deep Navigation**:
  - Staff can dismiss the banner via `✕` without losing the pending web order.
  - Includes a shortcut button (`ExternalLink`) to jump to `/web-orders` for full fleet rider assignment if required.

### 22. Admin Order Deletion & Test Data Purge Engine (Shop Handover Readiness)
- **Multi-Table Supabase Purge (`deleteOrderFromSupabase`)**:
  - Securely deletes target orders and all associated line items from Supabase cloud database across `order_items`, `orders`, `pos_order_items`, `pos_orders`, and `web_orders`.
  - Cleans both matching UUIDs, order numbers (e.g. `WEB-SLM-8891`), and invoice numbers (e.g. `INV-WEB-20401`).
- **Admin Web Orders Hub Deletion**:
  - Each web order card in `WebOrdersHub.tsx` features a dedicated delete button (`<Trash2 />`) in both the card header and footer.
  - Interactive Confirmation Dialog details order number, customer name, phone, item counts, and grand total in 3-decimal KWD (`0.000 KWD`).
- **Admin Sales Audit Log Deletion**:
  - Each sales audit record in `ErpConsole.tsx` features an explicit delete action button in the actions column.
  - Removing an order updates live valid order tallies, gross revenue, and Z-report calculations.
- **Bulk Purge Test Orders (`purgeAllOrdersFromSupabase`)**:
  - High-visibility "Purge Test Orders" trigger in both the Web Orders Hub and Sales Audit header bars.
  - Wipes all test/dummy data from the local state and Supabase cloud tables with 1 click, leaving the POS system in a pristine 0-order state ready for restaurant floor opening.

### 23. Production Mock Data Purge & Zero-State Handover (100% Real Live Data Engine)
- **Fleet & Delivery Mock Data Removal**:
  - Completely purged hardcoded delivery driver arrays (Mahmoud, Rajan, Arafat, Suresh) from frontend code.
  - `SEED_DELIVERY_RIDERS` initialized strictly to an empty array `[]`.
  - Added `fetchDeliveryRidersFromSupabase()` in `src/lib/supabase.ts` querying `public.delivery_riders`.
  - When no drivers exist in the database, the Fleet bar renders a clean, quiet `"No active drivers"` empty state, and the order card rider selector defaults cleanly without error.
- **ERP, Z-Report & Financial Mock Data Purge**:
  - Purged hardcoded demo sales (`SEED_INITIAL_POS_ORDERS`), expenses (`SEED_SHOP_EXPENSES`), inventory deductions (`[log-init-1, log-init-2]`), and staff credit records (`SEED_STAFF_CREDIT_RECORDS`) down to empty arrays `[]`.
  - Default `openingFloatKwd` initialized strictly to `0.000` KWD.
  - All financial metrics (Gross Revenue, Cash Drawer Sales, K-Net Terminal Batch, Wamd Instant, Staff Credit, Net Operating Profit) dynamically evaluate to strictly `0.000 KWD` until genuine Supabase transactions occur.
  - Added dedicated empty states for Daily Shop Expenses ("No shop expenses recorded today. Total Outflow: 0.000 KWD") and set expense input defaults to empty strings (`''`).
- **Web Orders & Kitchen KOT Zero-State**:
  - `SEED_INCOMING_WEB_ORDERS` stripped to `[]`.
  - Web Orders Hub renders a clean "No Incoming Web Orders" empty state with real-time listening indicators.
  - Kitchen KOT queue (`activeKotOrders`) initializes to `[]` with clean "No Active Kitchen Orders Found" messaging.
- **State Versioning & Cache Busting**:
  - Bumped state persistence key to `JEZTBRAIN_CHIKARRO_POS_ERP_STATE_V3`.
  - Added automatic mount purge for legacy cached states (`_V1` and `_V2`), guaranteeing that opening the application starts from a fresh, zero-mock slate across all browser sessions.

### 24. Unified Order Ingress, Status Mapping & Sales Audit Integration
- **Removal of Strict Source/Status Filters**:
  - Purged restrictive frontend filters (`source === 'POS'` or `order_type === 'POS'`).
  - Added [`fetchAllOrdersFromSupabase()`](file:///d:/jeztbrain-pos-erp/src/lib/supabase.ts) which queries all orders across `orders`, `pos_orders`, and `web_orders` tables without artificial segregation.
  - Added [`subscribeToAllOrdersRealtime()`](file:///d:/jeztbrain-pos-erp/src/lib/supabase.ts) listening to live inserts/updates across `orders`, `pos_orders`, and `web_orders`.
- **Unified Status & Accounting Integration**:
  - Web orders with statuses `Delivered`, `Completed`, or `Accepted` are unified with POS `completed` (Settled / Paid).
  - Automatically accounted in gross revenue, cash/K-Net/Wamd channel aggregates, and web direct sales metrics.
  - Item movement metrics (`itemVelocityStats`) extract item and combo quantities from all live web orders, updating fast-moving/slow-moving bestselling analytics dynamically.
- **Sales Audit Visual Distinction**:
  - Web orders render a vibrant, high-contrast `WEB` pill next to the invoice number (`INV-SLM-...` / `WEB-SLM-...`).
  - Channel badge displays `WEB DELIVERY` for online customer orders.
  - Status column renders explicit badges: `DELIVERED` (emerald), `ACCEPTED` (sky), `SETTLED` (emerald), `COOKING` (amber), `READY` (indigo), or `VOIDED` (rose).
  - Sales audit status filter dropdown allows filtering specifically by `Completed / Settled`, `Delivered (Web)`, `Accepted (Web)`, `Cooking`, `Ready`, or `Voided`.

### 25. UI Artifact Cleanup, Login Autocomplete Elimination, KOT Cancellation Workflow & Past Order Voiding Receipts
- **Login Autocomplete & Credential Fix**:
  - In [`LoginPortal.tsx`](file:///d:/jeztbrain-pos-erp/src/components/LoginPortal.tsx), enforced `autoComplete="off"` on form and `name="chikarro_user_no_autofill"` on username input, and `autoComplete="new-password"` on password input. Added `autoCorrect="off"`, `autoCapitalize="none"`, `spellCheck="false"`.
  - Initialized all authentication states strictly empty (`''`) to eliminate auto-fill of legacy/test credentials.
  - Enforced `autoComplete="new-password"` on all Supervisor/Admin PIN inputs in [`PosTerminal.tsx`](file:///d:/jeztbrain-pos-erp/src/components/PosTerminal.tsx) and [`ErpConsole.tsx`](file:///d:/jeztbrain-pos-erp/src/components/ErpConsole.tsx).
- **UI Artifact & Toast Noise Removal**:
  - Replaced the terminal prompt icon (`>_` from `<Terminal />`) with `<ShoppingBag className="w-4 h-4" />` next to "POS Billing" in [`CommandDeckHeader.tsx`](file:///d:/jeztbrain-pos-erp/src/components/CommandDeckHeader.tsx), providing an intuitive, polished restaurant POS icon.
  - Silenced recurring `"Supabase Cloud Connected: Loaded X live items..."` toast notifications inside [`PosContext.tsx`](file:///d:/jeztbrain-pos-erp/src/context/PosContext.tsx) `refetchCloudCatalog()`, preserving only the visual telemetry pill indicator in the top header.
- **Kitchen Queue (KOT) Cancellation & Kitchen Alert Print**:
  - Added an explicit **"Cancel Order"** button on each active KOT card in the Kitchen Queue drawer ([`PosTerminal.tsx`](file:///d:/jeztbrain-pos-erp/src/components/PosTerminal.tsx)).
  - Clicking opens a dedicated cancellation dialog with cancellation reason options and confirmation notice.
  - Implemented [`cancelKitchenOrder()`](file:///d:/jeztbrain-pos-erp/src/context/PosContext.tsx): updates order status to `'cancelled'`, unbinds dine-in tables, restocks direct and BOM ingredient inventory, and updates Supabase (`updateOrderStatusInSupabase`).
  - Automatically spools an 80mm high-contrast thermal slip with bold header `** CANCELLED KOT **`, `HALT PREPARATION IMMEDIATELY!`, large Token #, and cancellation timestamp to immediately notify kitchen line cooks.
- **Past Order Voiding & Customer Cancellation Receipt**:
  - In [`ErpConsole.tsx`](file:///d:/jeztbrain-pos-erp/src/components/ErpConsole.tsx) Sales Audit Log, added a dedicated **"Void"** action button on every settled bill.
  - Clicking opens an authorization modal requiring a cancellation reason and Manager/Admin PIN (`2222` / `5232`).
  - Once authorized, [`voidSettledOrder()`](file:///d:/jeztbrain-pos-erp/src/context/PosContext.tsx) marks the order `voided`, reverses stock, syncs with Supabase, deducts from gross revenue, and immediately spools an 80mm **Customer Cancellation Receipt** ([`ThermalPrintModal.tsx`](file:///d:/jeztbrain-pos-erp/src/components/ThermalPrintModal.tsx)) displaying `*** VOIDED / CANCELLED BILL ***` with negative refund tallies (`VOIDED TOTAL (REFUNDED): -X.XXX KWD`).

### 26. Total Sales HUD, Soft-Cancel Audit, Single Item Modifier Decoupling & KOT Combo Inclusions
- **Total Sales Header Button (`CommandDeckHeader.tsx`)**:
  - Replaced the Admin Profile display in the top HUD with a prominent, clickable `Total Sales: [Daily Gross Revenue] KWD` badge.
  - Dynamically computes non-cancelled, non-voided completed/settled orders for the current day using `dailyGrossSalesKwd`, strictly excluding staff credit ledger items.
  - One-tap triggers [`SalesHistoryModal.tsx`](file:///d:/jeztbrain-pos-erp/src/components/SalesHistoryModal.tsx) for instant live transaction reviews, shift revenue breakdown, channel filter, and manager-authorized bill cancellation.
- **Complete Elimination of Hard Deletions & Test Generators**:
  - Purged "+ Web Order" (simulation button) and "Purge Test Orders" buttons from the codebase.
  - Enforced zero hard SQL `DELETE` operations across all order tables; cancellations use soft-status transitions (`status = 'cancelled'`) that update Supabase safely and reverse inventory deductions.
- **Single Item Modifier Decoupling**:
  - Single burgers, wraps, and a la carte items (e.g. *Chikarro Special Burger*, *Zinger Burger*) no longer default to attached combo modifiers (Fries, Pepsi).
  - `ItemCustomizationModal.tsx` and `addItemToCart` set `sideChoice` and `drinkChoice` to optional/null by default for single items; sides and beverages only attach when explicitly chosen via the tactile "Prep" modal.
- **KOT Thermal Ticket Combo Sub-Item Breakdown**:
  - True combos, bucket meals, and family packs automatically extract their included sub-items (Fries, Coleslaw, Dips, Drinks) via [`getComboComponents()`](file:///d:/jeztbrain-pos-erp/src/utils/formatters.ts).
  - [`ThermalPrintModal.tsx`](file:///d:/jeztbrain-pos-erp/src/components/ThermalPrintModal.tsx) `KitchenKOT80mmPaper` explicitly renders and prints all pack components under `PACK COMBO COMPONENTS:` on 80mm thermal paper, ensuring kitchen prep cooks have complete visibility of meal pack contents.
- **Live Recipe (BOM) & ERP Inventory**:
  - Purged legacy mock recipes and dummy stock from [`ErpConsole.tsx`](file:///d:/jeztbrain-pos-erp/src/components/ErpConsole.tsx).
  - Connected Recipe (BOM) Inspector directly to live Supabase `raw_ingredients` and `recipe_bom_items` with clean fallback states.

### 27. High-Visibility KOT Thermal Print Engine & Cancel KOT Inverted Styling
- **Regular KOT — Double-Size Token & Printhead Lifespan Optimization**:
  - In [`ThermalPrintModal.tsx`](file:///d:/jeztbrain-pos-erp/src/components/ThermalPrintModal.tsx) `KitchenKOT80mmPaper`, eliminated all solid black background blocks from regular KOT tickets.
  - Formatted the regular KOT Token Number in extra-bold double-size typography (`text-5xl sm:text-6xl font-black leading-none tracking-tight`) on clean white paper.
  - Provides instant line-cook visibility across kitchen passes while minimizing thermal burn cycles to protect and prolong commercial thermal printer head lifespan.
- **Cancel KOT — High-Urgency Inverted Header & Token Presentation**:
  - Cancelled kitchen tickets (`order.status === 'cancelled'` or `'voided'`) utilize high-contrast **solid black background with white, large, extra-bold text** (`bg-black text-white p-3 border-2 border-black`).
  - Renders `*** CANCEL KOT ***` in `text-xl sm:text-2xl font-black` with an inline `HALT PREPARATION IMMEDIATELY!` badge.
  - Embeds the **Cancelled Token Number** directly inside the inverted black block in `text-5xl sm:text-6xl font-black text-white`.
  - Item rows display strike-through formatting with an explicit inverted `VOID` tag next to each line item, plus a bottom warning: `** DO NOT PREPARE • TOKEN #X CANCELLED **`.
- **Monochrome Thermal Print Engine & Color Adjust**:
  - In [`src/index.css`](file:///d:/jeztbrain-pos-erp/src/index.css), added `-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;` inside `@media print`.
  - Guarantees physical 80mm thermal receipt spools maintain 100% black saturation on cancellation inverted banners without printer driver dithering.

---

## 7. Production Codebase File Map

- **Core Config & Styling**:
  - [package.json](file:///d:/jeztbrain-pos-erp/package.json): Vite 6, React 18, `@supabase/supabase-js`, Tailwind CSS, Lucide icons.
  - [src/vite-env.d.ts](file:///d:/jeztbrain-pos-erp/src/vite-env.d.ts): TypeScript declarations for Vite client and Supabase environment variables.
  - [tailwind.config.js](file:///d:/jeztbrain-pos-erp/tailwind.config.js): Chikarro Crimson (`#C8102E`, `#A50D25`), Warm Cream background (`#FAF6F0`), Deep Charcoal (`#1E293B`), subtle borders (`#E8E1D5`).
  - [src/index.css](file:///d:/jeztbrain-pos-erp/src/index.css): Warm theme CSS tokens, warm scrollbars, 80mm thermal CSS engine.
  - [index.html](file:///d:/jeztbrain-pos-erp/index.html): Title: "CHIKARRO Fried Chicken — Smart Cloud POS & ERP | Powered by JeztBrain".
- **Supabase Cloud Engine**:
  - [src/lib/supabase.ts](file:///d:/jeztbrain-pos-erp/src/lib/supabase.ts): Supabase client initialization, category/item normalization with 3-decimal KWD formatting, query calls, real-time subscription engine, `subscribeToIncomingWebOrders`, and `updateOrderStatusInSupabase`.
- **Context & State Engine**:
  - [src/types/pos.ts](file:///d:/jeztbrain-pos-erp/src/types/pos.ts): Domain models including `ReceiptStoreConfig`, `StaffCreditRecord`, `PaymentMethod`, `CloudSyncStatus`, stock tracking, and discount types.
  - [src/context/PosContext.tsx](file:///d:/jeztbrain-pos-erp/src/context/PosContext.tsx): Global reactive state engine with dynamic Supabase cloud sync (`refetchCloudCatalog`), real-time subscription hook, safe offline fallback, receiptConfig, universal stock tracking, and silent web order alert management (`acceptWebOrderFromBanner`).
  - [src/data/seedData.ts](file:///d:/jeztbrain-pos-erp/src/data/seedData.ts): Offline fallback seed data for categories, menu items, combos, and staff accounts.
  - [src/utils/formatters.ts](file:///d:/jeztbrain-pos-erp/src/utils/formatters.ts): 3-decimal KWD currency formatter (`0.000 KWD`), date/time formatters, hardware audio alerts, and `PAYMENT_METHOD_LABELS`.
- **UI Components**:
  - [src/components/WebOrderAlertBanner.tsx](file:///d:/jeztbrain-pos-erp/src/components/WebOrderAlertBanner.tsx): Floating silent drop-down banner for real-time incoming web orders with direct 1-tap Accept Order, 3-decimal KWD totals, customer meta, item summaries, and multi-order carousel.
  - [src/components/CommandDeckHeader.tsx](file:///d:/jeztbrain-pos-erp/src/components/CommandDeckHeader.tsx): Header in Warm Restaurant Theme with **Cloud Sync Telemetry Pill**, persistent **Low Stock Alert Bell**, dynamic multi-branch selector, EN/AR toggle, and user lock.
  - [src/components/PosTerminal.tsx](file:///d:/jeztbrain-pos-erp/src/components/PosTerminal.tsx): Real-time dynamic menu rendering from Supabase, instant tap-to-cart, tactile `Prep` button, Staff Purchase selector, KOT Queue drawer, universal search, 52px touch buttons, and redesigned touch discount modal.
  - [src/components/CatalogComboStudio.tsx](file:///d:/jeztbrain-pos-erp/src/components/CatalogComboStudio.tsx): Tab 1: Dynamic Combo Builder, Tab 2: Menu Items & Stock indicators/quick restock, Tab 3: Category Architecture Manager.
  - [src/components/ErpConsole.tsx](file:///d:/jeztbrain-pos-erp/src/components/ErpConsole.tsx): Dedicated **Receipt & Store Details Editor** with live 80mm preview, dedicated **Staff Purchase & Credit Ledger** tab with GAAP revenue segregation, Sales Audit Log, Item Movement Velocity Analytics, Shift Z-Report, and Management Roles & PINs editor.
  - [src/components/LoginPortal.tsx](file:///d:/jeztbrain-pos-erp/src/components/LoginPortal.tsx): Clean Warm Restaurant Theme with unified username/password credentials, auto-hiding seamless virtual keyboard, viewport lift preventing overlap, and outside-click dismissal.
  - [src/components/ThermalPrintModal.tsx](file:///d:/jeztbrain-pos-erp/src/components/ThermalPrintModal.tsx): Dual 80mm customer bill and kitchen KOT ticket preview with dynamic store receipt config binding, staff credit notices, and off-screen direct print spooling.
- **Backend Schema**:
  - [supabase_schema.sql](file:///d:/jeztbrain-pos-erp/supabase_schema.sql): Complete PostgreSQL / Supabase multi-tenant schema with RLS policies for public POS menu read, triggers, BOM stock deduction, and Keeta channel enum.
