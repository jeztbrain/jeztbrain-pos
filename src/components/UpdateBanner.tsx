import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

/**
 * Desktop-only auto-update notice. Updates download silently in the background; this banner
 * tells the cashier when one is downloading and when it is ready, and lets them restart now or
 * keep working (the update then installs automatically the next time the app is closed).
 */
export const UpdateBanner: React.FC = () => {
  const [status, setStatus] = useState<PosUpdateStatus | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [installing, setInstalling] = useState<boolean>(false);
  const api = window.posDesktop;

  useEffect(() => {
    if (!api) return;
    api.getUpdateStatus().then(setStatus).catch(() => undefined);
    return api.onUpdateStatus((next) => {
      setStatus(next);
      // A newly downloaded version re-shows the banner even if a previous one was dismissed.
      if (next.state === 'downloaded') setDismissed(false);
    });
  }, [api]);

  if (!api || !status || dismissed) return null;
  if (!['downloading', 'downloaded'].includes(status.state)) return null;

  const ready = status.state === 'downloaded';

  return (
    <div
      className={`no-print shrink-0 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold border-b ${
        ready ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-sky-50 border-sky-200 text-sky-900'
      }`}
      role="status"
    >
      <div className="flex items-center gap-2">
        {ready ? <Download className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
        <span>
          {ready
            ? `Update ${status.version ?? ''} is ready. Restart now to install, or it will install when you close the app.`
            : `Downloading update ${status.version ?? ''}... ${status.percent}%`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {ready && (
          <button
            type="button"
            disabled={installing}
            onClick={async () => {
              setInstalling(true);
              const res = await api.installUpdate();
              if (!res.ok) setInstalling(false);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold"
          >
            {installing ? 'Restarting...' : 'Restart & Update'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="p-1.5 rounded-lg hover:bg-black/5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
