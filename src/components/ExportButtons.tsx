import React from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { PosOrderRecord } from '../types/pos';
import { exportSalesCsv, exportSalesPdf } from '../utils/salesExport';

interface ExportButtonsProps {
  orders: PosOrderRecord[];
  rangeLabel: string;
  /** 'light' for white surfaces, 'dark' for the red dashboard header. */
  tone?: 'light' | 'dark';
}

/** Prominent Export CSV / Export PDF actions for the sales audit tables. */
export const ExportButtons: React.FC<ExportButtonsProps> = ({ orders, rangeLabel, tone = 'light' }) => {
  const { currentUser } = usePos();
  const disabled = orders.length === 0;
  const base =
    'px-3.5 py-2 rounded-xl text-xs font-mono font-extrabold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs';
  const csvCls =
    tone === 'dark'
      ? 'bg-white text-emerald-800 hover:bg-emerald-50'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white';
  const pdfCls =
    tone === 'dark'
      ? 'bg-white text-[#C8102E] hover:bg-rose-50'
      : 'bg-[#C8102E] hover:bg-[#A50D25] text-white';
  const meta = { rangeLabel, generatedBy: currentUser?.name };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => exportSalesCsv(orders, meta)}
        title={disabled ? 'No bills to export' : `Export ${orders.length} bills as CSV`}
        className={`${base} ${csvCls}`}
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>Export CSV</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => exportSalesPdf(orders, meta)}
        title={disabled ? 'No bills to export' : `Export ${orders.length} bills as PDF`}
        className={`${base} ${pdfCls}`}
      >
        <FileText className="w-4 h-4" />
        <span>Export PDF</span>
      </button>
    </div>
  );
};
