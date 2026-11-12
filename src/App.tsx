import React from 'react';
import { CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { CatalogComboStudio } from './components/CatalogComboStudio';
import { CommandDeckHeader } from './components/CommandDeckHeader';
import { ErpConsole } from './components/ErpConsole';
import { UpdateBanner } from './components/UpdateBanner';
import { FirstRunAdminSetup } from './components/FirstRunAdminSetup';
import { LoginPortal } from './components/LoginPortal';
import { ManagerOverrideModal } from './components/ManagerOverrideModal';
import { OpeningCashModal } from './components/OpeningCashModal';
import { PosTerminal } from './components/PosTerminal';
import { PrintQueueModule } from './components/PrintQueueModule';
import { ThermalPrintModal } from './components/ThermalPrintModal';
import { WebOrderAlertBanner } from './components/WebOrderAlertBanner';
import { WebOrdersHub } from './components/WebOrdersHub';
import { PosProvider, usePos } from './context/PosContext';

const CommandDeckWorkspace: React.FC = () => {
  const { currentUser, activeModule, toastMessage, activeShift, staffAccounts, staffDirectory } = usePos();

  if (!currentUser) {
    // No staff accounts anywhere (Supabase staff_users empty/missing, nothing saved locally):
    // offer a one-time administrator setup instead of a login that can never succeed.
    // Never on a network/auth/RLS error: that must surface as a connection problem on the login
    // screen, not look like "no accounts exist".
    if (
      staffAccounts.length === 0 &&
      (staffDirectory.status === 'ok' || staffDirectory.status === 'table_missing')
    ) {
      return <FirstRunAdminSetup />;
    }
    return <LoginPortal />;
  }

  return (
    <div className="h-screen max-h-screen w-screen max-w-[100vw] bg-[#FAF6F0] text-[#1E293B] flex flex-col overflow-hidden select-none">
      {/* Top Floating Command Header (HUD) */}
      <CommandDeckHeader />
      <UpdateBanner />

      {/* Silent Floating Web Order Pop-up Notification & Instant Accept Banner */}
      <WebOrderAlertBanner />

      {/* Active Spatial Workspace */}
      <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col relative">
        {activeModule === 'pos' && <PosTerminal />}
        {activeModule === 'web-orders' && <WebOrdersHub />}
        {activeModule === 'catalog' && <CatalogComboStudio />}
        {activeModule === 'print-engine' && <PrintQueueModule />}
        {activeModule === 'erp' && <ErpConsole />}
      </main>

      {/* Global Security & 80mm Print Engine Modals */}
      <ManagerOverrideModal />
      {!activeShift && <OpeningCashModal />}
      <ThermalPrintModal />

      {/* Light Theme Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-4 right-4 z-50 max-w-md animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl border shadow-lg backdrop-blur-xl flex items-center gap-2.5 text-xs font-mono font-bold ${
              toastMessage.type === 'warning'
                ? 'bg-red-50 border-red-300 text-red-800'
                : toastMessage.type === 'info'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            {toastMessage.type === 'warning' ? (
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <PosProvider>
      <CommandDeckWorkspace />
    </PosProvider>
  );
}

export default App;

