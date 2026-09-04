import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import {
  ExportedBackupData,
  BankAccount,
  FixedDepositAccount,
  CreditCard,
  CashHoldingAccount,
  DigitalWallet,
  InvestmentHolding,
  IPOApplication,
  KhatabookEntry,
  FinancialSnapshot,
} from '../types';
import { formatRupee, formatPercentage, formatFinancialDate } from './formatters';

export type PdfReportCategory =
  | 'all'
  | 'banks'
  | 'credit_cards'
  | 'cash'
  | 'wallets'
  | 'investments'
  | 'khatabook';

export type PdfDateRangePreset =
  | 'all_time'
  | 'last_30_days'
  | 'this_month'
  | 'last_3_months'
  | 'current_fy'
  | 'custom';

export interface PdfExportOptions {
  data: ExportedBackupData;
  category: PdfReportCategory;
  dateRangePreset: PdfDateRangePreset;
  customStartDate?: string;
  customEndDate?: string;
  currencyPrefix?: 'INR' | 'Rs.' | '₹';
  includeSummaryCards?: boolean;
  includePnL?: boolean;
  includeDenominations?: boolean;
  includeNotes?: boolean;
  orientation?: 'portrait' | 'landscape';
  reportTitle?: string;
  clientName?: string;
}

interface DateRangeBounds {
  label: string;
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Computes exact Date boundary for filtering transactions and metadata
 */
export function getDateRangeBounds(
  preset: PdfDateRangePreset,
  customStart?: string,
  customEnd?: string
): DateRangeBounds {
  const now = new Date();

  switch (preset) {
    case 'last_30_days': {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        label: 'Last 30 Days (Past Month)',
        startDate: start,
        endDate: now,
      };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        label: `${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} (MTD)`,
        startDate: start,
        endDate: now,
      };
    }
    case 'last_3_months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return {
        label: 'Last 3 Months (Quarterly Review)',
        startDate: start,
        endDate: now,
      };
    }
    case 'current_fy': {
      // Indian Financial Year: April 1 to March 31
      const currentYear = now.getFullYear();
      const fyStartYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
      const start = new Date(fyStartYear, 3, 1); // Apr 1
      const end = new Date(fyStartYear + 1, 2, 31, 23, 59, 59); // Mar 31
      return {
        label: `FY ${fyStartYear}-${(fyStartYear + 1).toString().slice(2)} (Indian Fiscal Year)`,
        startDate: start,
        endDate: end,
      };
    }
    case 'custom': {
      const start = customStart ? new Date(customStart) : null;
      const end = customEnd ? new Date(customEnd + 'T23:59:59') : null;
      let label = 'Custom Date Range';
      if (start && end) {
        label = `${formatFinancialDate(customStart!)} to ${formatFinancialDate(customEnd!)}`;
      } else if (start) {
        label = `From ${formatFinancialDate(customStart!)}`;
      } else if (end) {
        label = `Until ${formatFinancialDate(customEnd!)}`;
      }
      return { label, startDate: start, endDate: end };
    }
    case 'all_time':
    default:
      return {
        label: 'All Time (Complete Historical Vault)',
        startDate: null,
        endDate: null,
      };
  }
}

/**
 * Safe currency formatter for PDF vector text
 * Uses INR / Rs. to guarantee universal glyph rendering across all PDF readers
 */
export function formatPdfCurrency(
  val: number | null | undefined,
  prefix: 'INR' | 'Rs.' | '₹' = 'INR',
  showSign: boolean = false
): string {
  if (val === null || val === undefined || isNaN(val)) {
    return `${prefix} 0.00`;
  }
  const isNeg = val < 0;
  const absVal = Math.abs(val);
  const fixed = absVal.toFixed(2);
  const parts = fixed.split('.');
  let intPart = parts[0];
  const decPart = `.${parts[1]}`;

  if (intPart.length > 3) {
    const lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  const sign = isNeg ? '-' : showSign && val > 0 ? '+' : '';
  return `${sign}${prefix} ${intPart}${decPart}`;
}

/**
 * Core PDF Document Builder using jsPDF & autoTable
 */
export async function buildFinancialPdfDoc(options: PdfExportOptions): Promise<jsPDF> {
  const {
    data,
    category,
    dateRangePreset,
    customStartDate,
    customEndDate,
    currencyPrefix = 'INR',
    includeSummaryCards = true,
    includePnL = true,
    includeDenominations = true,
    includeNotes = true,
    orientation = 'portrait',
    reportTitle,
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const bounds = getDateRangeBounds(dateRangePreset, customStartDate, customEndDate);
  const generatedAt = new Date();
  const generatedDateStr = generatedAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const generatedTimeStr = generatedAt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  let currentY = 14;

  // Active entity arrays with safe property fallbacks
  const activeBankAccounts = (data.bankAccounts || []).filter((a) => (a as any).status !== 'ARCHIVED' && !(a as any).archivedAt);
  const activeFDs = (data.fixedDeposits || []).filter((f) => (f as any).status !== 'ARCHIVED' && !(f as any).archivedAt);
  const activeCards = (data.creditCards || []).filter((c) => (c as any).status !== 'ARCHIVED' && !(c as any).archivedAt);
  const activeCash = (data.cashHoldings || []).filter((c) => (c as any).status !== 'ARCHIVED' && !(c as any).archivedAt);
  const activeWallets = (data.wallets || []).filter((w) => (w as any).status !== 'ARCHIVED' && !(w as any).archivedAt);
  const activeInvestments = (data.investmentHoldings || []).filter((i) => (i as any).status !== 'ARCHIVED' && !(i as any).archivedAt);
  const activeKhatabook = (data.khatabookEntries || []).filter((k) => (k as any).status !== 'ARCHIVED' && !(k as any).archivedAt);
  const activeIPOs = (data.ipoApplications || []).filter((i) => (i as any).ipoStatus === 'APPLIED' || (i as any).ipoStatus === 'ALLOTTED' || (i as any).status === 'APPLIED');

  // Compute live financial totals
  const totalBankBal = activeBankAccounts
    .filter((b) => (b as any).includeInNetWorth !== false)
    .reduce((sum, b) => sum + Number(b.balance || 0), 0);

  const totalFDBal = activeFDs
    .filter((f) => (f as any).includeInNetWorth !== false)
    .reduce((sum, f) => sum + Number((f as any).estimatedCurrentValue ?? f.principal ?? (f as any).currentAmount ?? (f as any).balance ?? 0), 0);

  const totalCashBal = activeCash
    .filter((c) => (c as any).includeInNetWorth !== false)
    .reduce((sum, c) => sum + Number(c.balance ?? (c as any).totalAmount ?? 0), 0);

  const totalWalletBal = activeWallets
    .filter((w) => w.includeInNetWorth !== false)
    .reduce((sum, w) => sum + Number(w.balance || 0) + Number((w as any).cashbackBalance || 0), 0);

  const totalInvestedAmount = activeInvestments
    .filter((i) => (i as any).includeInNetWorth !== false)
    .reduce((sum, i) => {
      const qty = Number((i as any).quantity ?? (i as any).unitsHeld ?? (i as any).units ?? 1);
      const avg = Number((i as any).averageBuyPrice ?? (i as any).buyPrice ?? 0);
      return sum + Number(i.investedAmount ?? (qty * avg));
    }, 0);

  const totalInvestCurrentVal = activeInvestments
    .filter((i) => (i as any).includeInNetWorth !== false)
    .reduce((sum, i) => {
      const qty = Number((i as any).quantity ?? (i as any).unitsHeld ?? (i as any).units ?? 1);
      const curr = Number((i as any).currentPrice ?? (i as any).currentNav ?? (i as any).averageBuyPrice ?? 0);
      return sum + Number(i.currentValue ?? (qty * curr));
    }, 0);

  const totalInvestmentPnL = totalInvestCurrentVal - totalInvestedAmount;
  const totalInvestmentPnLPct = totalInvestedAmount > 0 ? (totalInvestmentPnL / totalInvestedAmount) * 100 : 0;

  const totalKhatabookReceivables = activeKhatabook
    .filter((k) => {
      const t = ((k as any).entryType || (k as any).type || 'RECEIVABLE').toString().toUpperCase();
      return t === 'RECEIVABLE' && (k as any).includeInNetWorth !== false && !(k as any).isSettled;
    })
    .reduce((sum, k) => sum + Number((k as any).remainingAmount ?? (k as any).amount ?? (k as any).originalAmount ?? 0), 0);

  const totalKhatabookPayables = activeKhatabook
    .filter((k) => {
      const t = ((k as any).entryType || (k as any).type || 'RECEIVABLE').toString().toUpperCase();
      return t === 'PAYABLE' && (k as any).includeInNetWorth !== false && !(k as any).isSettled;
    })
    .reduce((sum, k) => sum + Number((k as any).remainingAmount ?? (k as any).amount ?? (k as any).originalAmount ?? 0), 0);

  const totalCreditCardLiab = activeCards
    .filter((c) => (c as any).includeInNetWorth !== false)
    .reduce((sum, c) => sum + Number(c.outstanding ?? (c as any).currentOutstanding ?? (c as any).outstandingBalance ?? 0), 0);

  const totalCreditLimit = activeCards.reduce((sum, c) => sum + Number(c.creditLimit ?? (c as any).totalLimit ?? 0), 0);
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditCardLiab / totalCreditLimit) * 100 : 0;

  const totalAssets = totalBankBal + totalFDBal + totalCashBal + totalWalletBal + totalInvestCurrentVal + totalKhatabookReceivables;
  const totalLiabilities = totalCreditCardLiab + totalKhatabookPayables;
  const netWorth = totalAssets - totalLiabilities;

  // Determine Title
  const categoryTitleMap: Record<PdfReportCategory, string> = {
    all: 'Complete Financial Vault & Net Worth Report',
    banks: 'Bank Accounts & Fixed Deposits Statement',
    credit_cards: 'Credit Cards & Liability Statement',
    cash: 'Physical Cash & Vault Denominations Audit',
    wallets: 'Digital Wallets & Cashback Statement',
    investments: 'Investment Portfolio & Valuation Report',
    khatabook: 'Dues & Receivables (Khatabook) Ledger',
  };

  const finalTitle = reportTitle || categoryTitleMap[category] || 'Financial Report';

  // --- HEADER SECTION ---
  // Top branding colored bar
  doc.setFillColor(15, 23, 42); // Navy top header bar
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Afinity Logo Brand badge
  doc.setFillColor(8, 145, 178);
  doc.roundedRect(marginX, 4.5, 7, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('A', marginX + 2.2, 9.5);

  // Afinity Title & Tagline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('AFINITY', marginX + 9, 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Track • Analyze • Grow  |  Personal Financial Vault', marginX + 9, 14);

  // Right Header: Date & Report Type
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(56, 189, 248); // Sky blue
  doc.text(bounds.label, pageWidth - marginX, 9.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${generatedDateStr}, ${generatedTimeStr}`, pageWidth - marginX, 14, { align: 'right' });

  currentY = 32;

  // --- REPORT TITLE BANNER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(finalTitle, marginX, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Scope: ${category === 'all' ? 'All 7 Asset & Liability Modules' : category.toUpperCase()} • Local-First Encrypted Vault • Currency: INR (Indian Rupees)`,
    marginX,
    currentY
  );

  currentY += 5;
  // Subtle divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 5;

  // --- SUMMARY KPI CARDS (If enabled) ---
  if (includeSummaryCards) {
    const cardGap = 4;
    const numCards = 4;
    const cardWidth = (pageWidth - marginX * 2 - cardGap * (numCards - 1)) / numCards;
    const cardHeight = 18;

    const cards = [
      {
        title: 'TOTAL NET WORTH',
        value: formatPdfCurrency(netWorth, currencyPrefix),
        subtitle: `Assets: ${formatPdfCurrency(totalAssets, currencyPrefix)}`,
        accentColor: [8, 145, 178], // Cyan
        bgFill: [240, 249, 255],
      },
      {
        title: 'TOTAL LIABILITIES',
        value: formatPdfCurrency(totalLiabilities, currencyPrefix),
        subtitle: `Credit + Payables`,
        accentColor: [225, 29, 72], // Rose
        bgFill: [255, 241, 242],
      },
      {
        title: 'PORTFOLIO GAIN / LOSS',
        value: `${totalInvestmentPnL >= 0 ? '+' : ''}${formatPdfCurrency(totalInvestmentPnL, currencyPrefix)}`,
        subtitle: `Return: ${formatPercentage(totalInvestmentPnLPct, true)}`,
        accentColor: totalInvestmentPnL >= 0 ? [16, 185, 129] : [225, 29, 72],
        bgFill: totalInvestmentPnL >= 0 ? [240, 253, 244] : [255, 241, 242],
      },
      {
        title: 'LIQUID CASH & BANKS',
        value: formatPdfCurrency(totalBankBal + totalFDBal + totalCashBal + totalWalletBal, currencyPrefix),
        subtitle: `Banks, FDs, Cash & Wallets`,
        accentColor: [59, 130, 246], // Blue
        bgFill: [239, 246, 255],
      },
    ];

    cards.forEach((card, idx) => {
      const cardX = marginX + idx * (cardWidth + cardGap);
      // Card Background
      doc.setFillColor(card.bgFill[0], card.bgFill[1], card.bgFill[2]);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'F');

      // Card Border
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'S');

      // Left Accent Strip
      doc.setFillColor(card.accentColor[0], card.accentColor[1], card.accentColor[2]);
      doc.roundedRect(cardX, currentY, 1.8, cardHeight, 1, 1, 'F');

      // Card Content
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.title, cardX + 3.5, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(card.accentColor[0], card.accentColor[1], card.accentColor[2]);
      doc.text(card.value, cardX + 3.5, currentY + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(card.subtitle, cardX + 3.5, currentY + 15);
    });

    currentY += cardHeight + 6;
  }

  // --- HELPER FOR SECTION HEADERS ---
  const addSectionHeader = (title: string, count: number, totalText?: string) => {
    // Check if we have enough room for header + at least 2 rows (approx 28mm)
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, 7, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), marginX + 3, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`(${count} ${count === 1 ? 'item' : 'items'})`, marginX + 4 + doc.getTextWidth(title.toUpperCase()) + 2, currentY + 4.8);

    if (totalText) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(8, 145, 178);
      doc.text(totalText, pageWidth - marginX - 3, currentY + 4.8, { align: 'right' });
    }

    currentY += 9;
  };

  // Standard autoTable styles
  const commonTableStyles: Partial<UserOptions> = {
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    margin: { left: marginX, right: marginX },
  };

  // ==========================================
  // 1. BANK ACCOUNTS & FIXED DEPOSITS
  // ==========================================
  if (category === 'all' || category === 'banks') {
    if (activeBankAccounts.length > 0) {
      addSectionHeader(
        '1. Bank Accounts (Savings & Current)',
        activeBankAccounts.length,
        `Total: ${formatPdfCurrency(totalBankBal, currencyPrefix)}`
      );

      const bankRows = activeBankAccounts.map((b) => [
        b.name || (b as any).accountName || b.bankName,
        b.bankName || (b as any).institutionName || '—',
        b.accountType ? b.accountType.replace('_', ' ').toUpperCase() : 'SAVINGS',
        b.last4 ? `•••• ${b.last4}` : (b as any).accountNumberMasked || '—',
        (b as any).includeInNetWorth !== false ? 'Included' : 'Excluded',
        formatPdfCurrency(b.balance || 0, currencyPrefix),
      ]);

      autoTable(doc, {
        ...commonTableStyles,
        startY: currentY,
        head: [['Account Name', 'Bank Entity', 'Type', 'Account No.', 'Net Worth', 'Balance']],
        body: bankRows,
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 22 },
          4: { cellWidth: 20 },
          5: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    if (activeFDs.length > 0) {
      addSectionHeader(
        '2. Fixed Deposits (Term Deposits & FDs)',
        activeFDs.length,
        `Total FD Value: ${formatPdfCurrency(totalFDBal, currencyPrefix)}`
      );

      const fdRows = activeFDs.map((f) => [
        f.name || (f as any).fdName || 'Fixed Deposit',
        f.bankName || (f as any).institution || 'Bank FD',
        formatPdfCurrency(f.principal || (f as any).principalAmount || (f as any).balance || 0, currencyPrefix),
        f.interestRate ? `${Number(f.interestRate).toFixed(2)}% p.a.` : '—',
        f.maturityDate ? formatFinancialDate(f.maturityDate) : '—',
        formatPdfCurrency(f.estimatedCurrentValue || (f as any).currentAmount || f.principal || 0, currencyPrefix),
      ]);

      autoTable(doc, {
        ...commonTableStyles,
        startY: currentY,
        head: [['Deposit Name', 'Institution', 'Principal', 'Interest Rate', 'Maturity Date', 'Current Valuation']],
        body: fdRows,
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold' },
          1: { cellWidth: 30 },
          2: { halign: 'right', cellWidth: 26 },
          3: { halign: 'center', cellWidth: 22 },
          4: { halign: 'center', cellWidth: 26 },
          5: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ==========================================
  // 2. CREDIT CARDS & LIABILITIES
  // ==========================================
  if (category === 'all' || category === 'credit_cards') {
    if (activeCards.length > 0) {
      addSectionHeader(
        category === 'all' ? '3. Credit Cards & Liabilities' : 'Credit Cards & Credit Lines',
        activeCards.length,
        `Total Outstanding: ${formatPdfCurrency(totalCreditCardLiab, currencyPrefix)} (Util: ${formatPercentage(creditUtilization, false)})`
      );

      const cardRows = activeCards.map((c) => {
        const limit = Number(c.creditLimit ?? (c as any).totalLimit ?? 0);
        const out = Number(c.outstanding ?? (c as any).currentOutstanding ?? 0);
        const util = limit > 0 ? (out / limit) * 100 : 0;
        const avail = c.availableLimit ?? Math.max(0, limit - out);
        return [
          c.cardName,
          c.issuer || (c as any).bankName || '—',
          c.lastFourDigits ? `•••• ${c.lastFourDigits}` : '—',
          formatPdfCurrency(limit, currencyPrefix),
          formatPdfCurrency(avail, currencyPrefix),
          `${formatPercentage(util, false)}`,
          formatPdfCurrency(out, currencyPrefix),
        ];
      });

      autoTable(doc, {
        ...commonTableStyles,
        startY: currentY,
        head: [['Card / Line Name', 'Issuer Bank', 'Card No.', 'Credit Limit', 'Available Credit', 'Utilization', 'Outstanding Due']],
        body: cardRows,
        columnStyles: {
          0: { cellWidth: 42, fontStyle: 'bold' },
          1: { cellWidth: 28 },
          2: { cellWidth: 20 },
          3: { halign: 'right', cellWidth: 26 },
          4: { halign: 'right', cellWidth: 26 },
          5: { halign: 'center', cellWidth: 18 },
          6: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ==========================================
  // 3. PHYSICAL CASH & DENOMINATIONS
  // ==========================================
  if (category === 'all' || category === 'cash') {
    if (activeCash.length > 0) {
      addSectionHeader(
        category === 'all' ? '4. Physical Cash & Locker Vaults' : 'Physical Cash Holdings',
        activeCash.length,
        `Total Cash: ${formatPdfCurrency(totalCashBal, currencyPrefix)}`
      );

      const cashRows = activeCash.map((c) => {
        const denomSummary =
          c.denominations && c.denominations.length > 0
            ? c.denominations
                .filter((d) => d.count > 0)
                .map((d) => `₹${d.denomination} × ${d.count}`)
                .join(', ')
            : 'Unspecified notes';

        return [
          c.name || (c as any).accountName || c.location || 'Cash Vault',
          c.location || 'Primary Wallet',
          includeDenominations ? denomSummary : '—',
          formatFinancialDate(c.lastUpdated || (c as any).updatedAt || generatedAt.toISOString()),
          formatPdfCurrency(c.balance ?? (c as any).totalAmount ?? 0, currencyPrefix),
        ];
      });

      autoTable(doc, {
        ...commonTableStyles,
        startY: currentY,
        head: [['Vault Name', 'Location', 'Notes Breakdown', 'Last Audited', 'Total Cash']],
        body: cashRows,
        columnStyles: {
          0: { cellWidth: 35, fontStyle: 'bold' },
          1: { cellWidth: 30 },
          2: { cellWidth: 60 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ==========================================
  // 4. DIGITAL WALLETS & CASHBACK
  // ==========================================
  if (category === 'all' || category === 'wallets') {
    if (activeWallets.length > 0) {
      addSectionHeader(
        category === 'all' ? '5. Digital Wallets & Prepaid Balances' : 'Digital Wallets & Cashback',
        activeWallets.length,
        `Total Wallets: ${formatPdfCurrency(totalWalletBal, currencyPrefix)}`
      );

      const walletRows = activeWallets.map((w) => [
        w.name || (w as any).walletName,
        w.providerName || (w as any).provider || 'Prepaid',
        formatPdfCurrency(w.balance || 0, currencyPrefix),
        formatPdfCurrency((w as any).cashbackBalance || 0, currencyPrefix),
        formatPdfCurrency((w.balance || 0) + Number((w as any).cashbackBalance || 0), currencyPrefix),
      ]);

      autoTable(doc, {
        ...commonTableStyles,
        startY: currentY,
        head: [['Wallet Name', 'Provider', 'Main Balance', 'Cashback / Rewards', 'Total Combined']],
        body: walletRows,
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold' },
          1: { cellWidth: 35 },
          2: { halign: 'right', cellWidth: 30 },
          3: { halign: 'right', cellWidth: 32 },
          4: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ==========================================
  // 5. INVESTMENTS (STOCKS, ETFS, MUTUAL FUNDS, GOLD, IPOS)
  // ==========================================
  if (category === 'all' || category === 'investments') {
    if (activeInvestments.length > 0) {
      addSectionHeader(
        category === 'all' ? '6. Investment Portfolio & Market Valuations' : 'Investment Portfolio & Holdings',
        activeInvestments.length,
        `Invested: ${formatPdfCurrency(totalInvestedAmount, currencyPrefix)} | Current: ${formatPdfCurrency(totalInvestCurrentVal, currencyPrefix)}`
      );

      const investRows = activeInvestments.map((inv) => {
        const qty = Number((inv as any).quantity ?? (inv as any).unitsHeld ?? (inv as any).units ?? 1);
        const avg = Number((inv as any).averageBuyPrice ?? (inv as any).buyPrice ?? 0);
        const curr = Number((inv as any).currentPrice ?? (inv as any).currentNav ?? avg);
        const invested = Number(inv.investedAmount ?? (qty * avg));
        const current = Number(inv.currentValue ?? (qty * curr));
        const pnl = Number(inv.unrealizedProfitLoss ?? (current - invested));
        const pnlPct = Number(inv.unrealizedProfitLossPercentage ?? (invested > 0 ? (pnl / invested) * 100 : 0));
        
        const rawType = ((inv as any).assetType || (inv as any).type || (inv as any).category || 'STOCK').toString().toUpperCase();
        const catLabel =
          rawType.includes('STOCK') || rawType.includes('EQUITY')
            ? 'Stock'
            : rawType.includes('MUTUAL')
            ? 'Mutual Fund'
            : rawType.includes('ETF')
            ? 'ETF'
            : rawType.includes('GOLD') || rawType.includes('SGB')
            ? 'Gold/SGB'
            : 'Other';

        return [
          inv.name || (inv as any).holdingName,
          catLabel,
          qty ? qty.toLocaleString('en-IN', { maximumFractionDigits: 3 }) : '—',
          formatPdfCurrency(avg, currencyPrefix),
          formatPdfCurrency(curr, currencyPrefix),
          formatPdfCurrency(invested, currencyPrefix),
          formatPdfCurrency(current, currencyPrefix),
          `${pnl >= 0 ? '+' : ''}${formatPdfCurrency(pnl, currencyPrefix)} (${formatPercentage(pnlPct, true)})`,
        ];
      });

      autoTable(doc, {
        ...commonTableStyles,
        startY: currentY,
        head: [['Asset / Fund Name', 'Type', 'Units', 'Avg Buy', 'Current Price', 'Invested', 'Current Val', 'Gain / Loss']],
        body: investRows,
        columnStyles: {
          0: { cellWidth: 38, fontStyle: 'bold' },
          1: { cellWidth: 18 },
          2: { halign: 'right', cellWidth: 14 },
          3: { halign: 'right', cellWidth: 20 },
          4: { halign: 'right', cellWidth: 20 },
          5: { halign: 'right', cellWidth: 22 },
          6: { halign: 'right', fontStyle: 'bold', cellWidth: 22, textColor: [15, 23, 42] },
          7: { halign: 'right', fontStyle: 'bold' },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    if (activeIPOs.length > 0) {
      addSectionHeader(
        'IPO Applications & ASBA Blocked Funds',
        activeIPOs.length,
        `Blocked Funds: ${formatPdfCurrency(
          activeIPOs.reduce((s, i) => s + Number(i.blockedAmount || 0), 0),
          currencyPrefix
        )}`
      );

      const ipoRows = activeIPOs.map((i) => [
        i.companyName || (i as any).name || i.symbol,
        (i as any).sharesPerLot && (i as any).lotsApplied ? `${(i as any).lotsApplied * (i as any).sharesPerLot} shares` : '—',
        formatPdfCurrency(i.bidPrice || (i as any).pricePerShare || 0, currencyPrefix),
        formatPdfCurrency(i.blockedAmount || 0, currencyPrefix),
        i.ipoStatus || (i as any).status || 'APPLIED',
        i.allotmentDate ? formatFinancialDate(i.allotmentDate) : 'Awaiting Allotment',
      ]);

      autoTable(doc, {
        ...commonTableStyles,
        startY: currentY,
        head: [['Company Name', 'Shares Applied', 'Cutoff / Issue Price', 'Blocked ASBA Amount', 'Status', 'Allotment Date']],
        body: ipoRows,
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold' },
          1: { halign: 'center', cellWidth: 25 },
          2: { halign: 'right', cellWidth: 28 },
          3: { halign: 'right', fontStyle: 'bold', cellWidth: 30, textColor: [15, 23, 42] },
          4: { halign: 'center', cellWidth: 22 },
          5: { halign: 'center' },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ==========================================
  // 6. KHATABOOK (DUES & RECEIVABLES)
  // ==========================================
  if (category === 'all' || category === 'khatabook') {
    if (activeKhatabook.length > 0) {
      addSectionHeader(
        category === 'all' ? '7. Dues & Receivables (Khatabook Ledger)' : 'Dues & Receivables Ledger',
        activeKhatabook.length,
        `Receivables: ${formatPdfCurrency(totalKhatabookReceivables, currencyPrefix)} | Payables: ${formatPdfCurrency(totalKhatabookPayables, currencyPrefix)}`
      );

      const khatabookRows = activeKhatabook.map((k) => {
        const rawType = ((k as any).entryType || (k as any).type || 'RECEIVABLE').toString().toUpperCase();
        const entryType = rawType === 'PAYABLE' ? 'You’ll Give (Payable)' : 'You’ll Get (Receivable)';
        const bal = Number((k as any).remainingAmount ?? (k as any).amount ?? (k as any).originalAmount ?? 0);

        return [
          k.personName || (k as any).name,
          entryType,
          k.dueDate ? formatFinancialDate(k.dueDate) : 'No due date',
          includeNotes ? k.notes || '—' : '—',
          (k as any).isSettled || k.status === 'SETTLED' ? 'Settled' : 'Active',
          formatPdfCurrency(bal, currencyPrefix),
        ];
      });

      autoTable(doc, {
        ...commonTableStyles,
        startY: currentY,
        head: [['Counterparty Name', 'Direction / Type', 'Due Date', 'Purpose / Notes', 'Status', 'Balance Amount']],
        body: khatabookRows,
        columnStyles: {
          0: { cellWidth: 38, fontStyle: 'bold' },
          1: { cellWidth: 34 },
          2: { halign: 'center', cellWidth: 24 },
          3: { cellWidth: 40 },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ==========================================
  // FOOTER & PAGE NUMBERING ON ALL PAGES
  // ==========================================
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom horizontal rule
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    // Confidentiality & Afinity Brand watermark
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Afinity Financial Report • Confidential & Encrypted • Generated locally via Afinity PWA',
      marginX,
      pageHeight - 6.5
    );

    // Page number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 6.5, { align: 'right' });
  }

  return doc;
}

/**
 * Downloads the generated PDF document directly to the client
 */
export async function downloadFinancialPdf(options: PdfExportOptions): Promise<string> {
  const doc = await buildFinancialPdfDoc(options);
  const timestamp = new Date().toISOString().slice(0, 10);
  const catSlug = options.category.replace(/_/g, '-');
  const filename = `afinity_${catSlug}_report_${timestamp}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Generates a Blob and Object URL for PDF in-browser previewing & printing
 */
export async function generateFinancialPdfBlob(options: PdfExportOptions): Promise<{
  blob: Blob;
  url: string;
  filename: string;
}> {
  const doc = await buildFinancialPdfDoc(options);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 10);
  const catSlug = options.category.replace(/_/g, '-');
  const filename = `afinity_${catSlug}_report_${timestamp}.pdf`;
  return { blob, url, filename };
}
