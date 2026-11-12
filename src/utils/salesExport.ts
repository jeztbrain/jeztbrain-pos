import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BRAND_NAME, CURRENCY } from '../config/brandConfig';
import { PosOrderRecord } from '../types/pos';
import { isCancelledOrder, orderStatusLabel } from './orderStatus';

export interface SalesExportMeta {
  /** Short description of the filter that produced the rows, e.g. "Today" or "All Time". */
  rangeLabel: string;
  generatedBy?: string;
}

const money = (v: number) => (Number.isFinite(v) ? v : 0).toFixed(3);
const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
const itemsText = (o: PosOrderRecord) => o.items.map((i) => `${i.quantity}x ${i.titleEn}`).join('; ');

const HEADERS = [
  'Invoice',
  'Token',
  'Date & Time',
  'Channel',
  'Payment',
  'Cashier',
  'Items',
  `Total (${CURRENCY})`,
  'Status',
];

const rowOf = (o: PosOrderRecord): string[] => [
  o.invoiceNo,
  String(o.tokenNo),
  fmtTime(o.createdAt),
  o.channel,
  o.paymentMethod,
  o.cashierName || '',
  itemsText(o),
  money(o.grandTotalKwd),
  orderStatusLabel(o),
];

/** Totals shown in the report footer. Cancelled bills are never part of gross. */
export function summarize(orders: PosOrderRecord[]) {
  let gross = 0;
  let cancelled = 0;
  let cancelledCount = 0;
  let completedCount = 0;
  orders.forEach((o) => {
    if (isCancelledOrder(o)) {
      cancelled += o.grandTotalKwd;
      cancelledCount += 1;
    } else {
      gross += o.grandTotalKwd;
      completedCount += 1;
    }
  });
  return { gross, cancelled, cancelledCount, activeCount: completedCount };
}

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSalesCsv(orders: PosOrderRecord[], meta: SalesExportMeta): void {
  const sum = summarize(orders);
  const lines: string[] = [
    [`${BRAND_NAME} - Sales Audit`].map(csvCell).join(','),
    [`Range: ${meta.rangeLabel}`, `Generated: ${fmtTime(new Date().toISOString())}`].map(csvCell).join(','),
    '',
    HEADERS.map(csvCell).join(','),
    ...orders.map((o) => rowOf(o).map(csvCell).join(',')),
    '',
    ['', '', '', '', '', '', 'Gross sales (excl. cancelled)', money(sum.gross), ''].map(csvCell).join(','),
    ['', '', '', '', '', '', `Cancelled (${sum.cancelledCount})`, money(sum.cancelled), ''].map(csvCell).join(','),
  ];
  // BOM so Excel opens Arabic item names correctly
  download(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' }), `sales-audit-${stamp()}.csv`);
}

export function exportSalesPdf(orders: PosOrderRecord[], meta: SalesExportMeta): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const sum = summarize(orders);
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(200, 16, 46);
  doc.rect(0, 0, pageW, 54, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${BRAND_NAME} - Sales Audit Report`, 32, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Range: ${meta.rangeLabel}   |   Generated: ${fmtTime(new Date().toISOString())}${
      meta.generatedBy ? `   |   By: ${meta.generatedBy}` : ''
    }`,
    32,
    42
  );

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Gross sales: ${money(sum.gross)} ${CURRENCY}     Cancelled: ${money(sum.cancelled)} ${CURRENCY} (${sum.cancelledCount})     Bills: ${orders.length}`,
    32,
    78
  );

  autoTable(doc, {
    startY: 90,
    head: [HEADERS],
    body: orders.map(rowOf),
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 246, 240] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 34 },
      2: { cellWidth: 82 },
      6: { cellWidth: 200 },
      7: { halign: 'right', cellWidth: 58 },
      8: { cellWidth: 62 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.raw && (data.row.raw as string[])[8] === 'CANCELLED') {
        data.cell.styles.textColor = [159, 18, 57];
      }
    },
    didDrawPage: () => {
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Page ${doc.getNumberOfPages()}  |  Powered by JeztBrain`, 32, h - 16);
    },
  });

  doc.save(`sales-audit-${stamp()}.pdf`);
}
