import React, { useMemo } from 'react';
import { BrainCircuit, Flame, TrendingDown, TrendingUp } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { PosOrderRecord } from '../types/pos';
import { CURRENCY } from '../config/brandConfig';
import { isCancelledOrder } from '../utils/orderStatus';
import { formatKWD } from '../utils/formatters';

const LOOKBACK_DAYS = 28;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

/**
 * JeztBrain Predictive Analytics: forecasts today's busy hours and suggested prep volumes from the
 * live transaction history (same-weekday seasonality over the last 4 weeks, plus a 7-day trend).
 */
export const PredictiveAnalyticsWidget: React.FC = () => {
  const { posOrders } = usePos();

  const forecast = useMemo(() => {
    const now = new Date();
    const todayDow = now.getDay();
    const since = now.getTime() - LOOKBACK_DAYS * 86400000;

    const history = posOrders.filter(
      (o) => !isCancelledOrder(o) && new Date(o.createdAt).getTime() >= since
    );
    if (history.length === 0) return null;

    // Distinct calendar days that actually had trading (so averages aren't diluted by closed days)
    const tradingDays = new Set(history.map((o) => new Date(o.createdAt).toDateString()));
    const sameDowDays = new Set(
      history
        .filter((o) => new Date(o.createdAt).getDay() === todayDow)
        .map((o) => new Date(o.createdAt).toDateString())
    );
    // Seasonality: prefer same weekday; fall back to all days if there is no same-weekday history.
    const useDow = sameDowDays.size >= 1;
    const basis = useDow
      ? history.filter((o) => new Date(o.createdAt).getDay() === todayDow)
      : history;
    const basisDays = Math.max(1, useDow ? sameDowDays.size : tradingDays.size);

    const hourOrders = new Array(24).fill(0) as number[];
    const hourRevenue = new Array(24).fill(0) as number[];
    basis.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      hourOrders[h] += 1;
      hourRevenue[h] += o.grandTotalKwd;
    });
    const avgOrders = hourOrders.map((n) => n / basisDays);
    const avgRevenue = hourRevenue.map((n) => n / basisDays);

    const activeHours = avgOrders.map((v, h) => ({ h, v })).filter((x) => x.v > 0);
    const minH = Math.min(...activeHours.map((x) => x.h));
    const maxH = Math.max(...activeHours.map((x) => x.h));
    const peakOrders = Math.max(...avgOrders);

    const busiest = [...activeHours].sort((a, b) => b.v - a.v).slice(0, 3);
    // Consecutive busiest hours collapse into a human-readable window
    const peakWindowHours = busiest.map((b) => b.h).sort((a, b) => a - b);

    // Item prep volumes: average units per trading day (same-weekday basis) with +10% safety buffer
    const itemMap = new Map<string, { name: string; units: number }>();
    basis.forEach((o) =>
      o.items.forEach((l) => {
        const key = `${l.type}:${l.refId}`;
        const cur = itemMap.get(key) || { name: l.titleEn, units: 0 };
        cur.units += l.quantity;
        itemMap.set(key, cur);
      })
    );
    const prep = Array.from(itemMap.values())
      .map((i) => ({ name: i.name, perDay: i.units / basisDays }))
      .sort((a, b) => b.perDay - a.perDay)
      .slice(0, 6)
      .map((i) => ({ ...i, suggested: Math.ceil(i.perDay * 1.1) }));

    // 7-day vs previous 7-day revenue trend
    const d7 = now.getTime() - 7 * 86400000;
    const d14 = now.getTime() - 14 * 86400000;
    const rev = (from: number, to: number) =>
      history
        .filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= from && t < to;
        })
        .reduce((s, o) => s + o.grandTotalKwd, 0);
    const last7 = rev(d7, now.getTime() + 1);
    const prev7 = rev(d14, d7);
    const trendPct = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : null;

    const expectedDayOrders = avgOrders.reduce((s, v) => s + v, 0);
    const expectedDayRevenue = avgRevenue.reduce((s, v) => s + v, 0);

    return {
      avgOrders,
      minH,
      maxH,
      peakOrders,
      peakWindowHours,
      prep,
      trendPct,
      expectedDayOrders: Math.round(expectedDayOrders),
      expectedDayRevenue,
      tradingDays: tradingDays.size,
      useDow,
      weekday: WEEKDAYS[todayDow],
      currentHour: now.getHours(),
    };
  }, [posOrders]);

  const confidence =
    !forecast ? 0 : Math.min(95, Math.round((Math.min(forecast.tradingDays, LOOKBACK_DAYS) / LOOKBACK_DAYS) * 100));

  return (
    <div className="rounded-2xl bg-white border border-violet-200 shadow-sm p-5 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-sm text-stone-900">
              JeztBrain Predictive Analytics
            </h3>
            <p className="text-[11px] font-mono text-stone-500">
              {forecast
                ? `Forecast for ${forecast.weekday} • based on ${forecast.tradingDays} trading day(s)`
                : 'Demand forecast from live transaction trends'}
            </p>
          </div>
        </div>
        {forecast && (
          <span className="px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-[11px] font-mono font-extrabold text-violet-800">
            Confidence {confidence}%
          </span>
        )}
      </div>

      {!forecast ? (
        <div className="py-10 text-center text-xs font-mono text-stone-400">
          Not enough transaction history yet. Forecasts appear automatically as orders accumulate.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Hourly demand curve */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-stone-500">
                Predicted busy hours
              </span>
              {forecast.peakWindowHours.map((h) => (
                <span
                  key={h}
                  className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-mono font-extrabold text-rose-800 flex items-center gap-1"
                >
                  <Flame className="w-3 h-3" />
                  {hourLabel(h)}
                </span>
              ))}
            </div>

            <div className="flex items-end gap-1 h-28">
              {Array.from({ length: forecast.maxH - forecast.minH + 1 }, (_, i) => forecast.minH + i).map(
                (h) => {
                  const v = forecast.avgOrders[h];
                  const pct = forecast.peakOrders > 0 ? Math.max(3, (v / forecast.peakOrders) * 100) : 3;
                  const isPeak = forecast.peakWindowHours.includes(h);
                  return (
                    <div key={h} className="flex-1 flex flex-col items-center justify-end h-full min-w-[14px]">
                      <div
                        title={`${hourLabel(h)} • ~${v.toFixed(1)} orders`}
                        className={`w-full rounded-t-md ${
                          isPeak ? 'bg-rose-500' : h === forecast.currentHour ? 'bg-violet-500' : 'bg-violet-300'
                        }`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                  );
                }
              )}
            </div>
            <div className="flex gap-1 text-[9px] font-mono text-stone-400">
              {Array.from({ length: forecast.maxH - forecast.minH + 1 }, (_, i) => forecast.minH + i).map(
                (h) => (
                  <div key={h} className="flex-1 text-center min-w-[14px]">
                    {String(h).padStart(2, '0')}
                  </div>
                )
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] p-2.5">
                <div className="text-[10px] font-mono text-stone-500 uppercase">Expected orders</div>
                <div className="font-display font-black text-xl text-stone-900">{forecast.expectedDayOrders}</div>
              </div>
              <div className="rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] p-2.5">
                <div className="text-[10px] font-mono text-stone-500 uppercase">Expected sales</div>
                <div className="font-display font-black text-xl text-stone-900">
                  {formatKWD(forecast.expectedDayRevenue, false)}
                  <span className="text-[10px] font-mono text-stone-500 ml-1">{CURRENCY}</span>
                </div>
              </div>
              <div className="rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] p-2.5">
                <div className="text-[10px] font-mono text-stone-500 uppercase">7-day trend</div>
                <div
                  className={`font-display font-black text-xl flex items-center justify-center gap-1 ${
                    forecast.trendPct === null
                      ? 'text-stone-400'
                      : forecast.trendPct >= 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {forecast.trendPct === null ? (
                    '—'
                  ) : (
                    <>
                      {forecast.trendPct >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {Math.abs(forecast.trendPct).toFixed(1)}%
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Suggested prep volumes */}
          <div className="lg:col-span-5">
            <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-stone-500 mb-2">
              Suggested prep volume today
            </div>
            {forecast.prep.length === 0 ? (
              <div className="text-xs font-mono text-stone-400">No item history.</div>
            ) : (
              <ul className="space-y-1.5">
                {forecast.prep.map((p) => (
                  <li
                    key={p.name}
                    className="flex items-center justify-between rounded-xl bg-[#FAF6F0] border border-[#E8E1D5] px-3 py-2 text-xs font-mono"
                  >
                    <span className="font-bold text-stone-800 truncate pr-2">{p.name}</span>
                    <span className="shrink-0 text-violet-800 font-extrabold">
                      prep {p.suggested}
                      <span className="text-stone-400 font-medium"> (avg {p.perDay.toFixed(1)})</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[10px] font-mono text-stone-400">
              {forecast.useDow
                ? `Based on previous ${forecast.weekday}s with a 10% safety buffer.`
                : 'No same-weekday history yet; using all trading days with a 10% safety buffer.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
