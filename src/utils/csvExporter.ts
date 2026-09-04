/**
 * Afinity CSV Exporter Utility
 * Generates comprehensive, standards-compliant CSV data for external analysis (Excel, Google Sheets, Python/Pandas, etc.)
 */

import { ExportedBackupData } from '../types';

/**
 * Escapes a field for safe CSV output.
 * Handles strings containing commas, quotes, line breaks, null/undefined, and objects.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }

  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }

  if (typeof val === 'object') {
    try {
      const json = JSON.stringify(val);
      return `"${json.replace(/"/g, '""')}"`;
    } catch {
      return '""';
    }
  }

  const str = String(val);
  // Always wrap strings in double quotes, escaping internal double quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Converts a table of rows into a CSV string.
 */
export function rowsToCsv(headers: string[], rows: (string | number | boolean | null | undefined | object)[][]): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

export interface CsvDataset {
  filename: string;
  category: string;
  description: string;
  rowCount: number;
  csvContent: string;
}

/**
 * Converts the full IndexedDB backup repository into individual structured CSV datasets
 * as well as a single master combined CSV archive.
 */
export function generateRepositoryCsvs(data: ExportedBackupData): {
  datasets: CsvDataset[];
  masterCsv: string;
} {
  const datasets: CsvDataset[] = [];
  const timestamp = new Date().toISOString().slice(0, 10);

  // 1. Bank Accounts
  const bankHeaders = [
    'Account ID',
    'Bank Name',
    'Account Name',
    'Account Type',
    'Last 4 Digits',
    'Balance (INR)',
    'Status',
    'Currency',
    'Overdraft Limit',
    'IFSC Code',
    'Opening Balance',
    'Opening Date',
    'Last Updated',
    'Created At',
    'Notes',
  ];
  const bankRows = (data.bankAccounts || []).map((acc) => [
    acc.id,
    acc.bankName || acc.institutionName || '',
    acc.name,
    acc.accountType,
    acc.last4 || '',
    acc.balance,
    acc.status,
    acc.currency,
    acc.overdraftLimit || 0,
    acc.ifscCode || '',
    acc.openingBalance || 0,
    acc.openingDate || '',
    acc.lastUpdated || acc.updatedAt || '',
    acc.createdAt,
    acc.notes || '',
  ]);
  const bankCsv = rowsToCsv(bankHeaders, bankRows);
  datasets.push({
    filename: `afinity_bank_accounts_${timestamp}.csv`,
    category: 'Bank Accounts',
    description: 'Savings, Current, Salary, and Overdraft accounts with active balances',
    rowCount: bankRows.length,
    csvContent: bankCsv,
  });

  // 2. Fixed Deposits
  const fdHeaders = [
    'FD ID',
    'FD Name / Number',
    'Bank Name',
    'Principal Amount (INR)',
    'Interest Rate (%)',
    'Start Date',
    'Maturity Date',
    'Maturity Amount (INR)',
    'Interest Type',
    'Status',
    'Auto Renew',
    'Estimated Current Value',
    'Linked Bank Account ID',
    'Created At',
    'Notes',
  ];
  const fdRows = (data.fixedDeposits || []).map((fd) => [
    fd.id,
    fd.name,
    fd.bankName,
    fd.principal || fd.balance || 0,
    fd.interestRate,
    fd.startDate || '',
    fd.maturityDate,
    fd.maturityAmount,
    fd.interestType || 'cumulative',
    fd.fdStatus || fd.status,
    fd.autoRenew ? 'Yes' : 'No',
    fd.estimatedCurrentValue || fd.principal || 0,
    fd.linkedAccountId || '',
    fd.createdAt,
    fd.notes || '',
  ]);
  const fdCsv = rowsToCsv(fdHeaders, fdRows);
  datasets.push({
    filename: `afinity_fixed_deposits_${timestamp}.csv`,
    category: 'Fixed Deposits',
    description: 'FD instruments with principal, rates, maturity schedules, and accrued yield',
    rowCount: fdRows.length,
    csvContent: fdCsv,
  });

  // 3. Cash Vaults & Physical Currency
  const cashHeaders = [
    'Vault ID',
    'Vault Name',
    'Location',
    'Total Cash Balance (INR)',
    'Status',
    'Denomination Breakdown',
    'Last Updated',
    'Created At',
    'Notes',
  ];
  const cashRows = (data.cashHoldings || []).map((c) => {
    const denomSummary = (c.denominations || [])
      .filter((d) => d.count > 0)
      .map((d) => `₹${d.denomination} x ${d.count}`)
      .join('; ');
    return [
      c.id,
      c.name,
      c.location || '',
      c.balance,
      c.status,
      denomSummary,
      c.lastUpdated || c.updatedAt || '',
      c.createdAt,
      c.notes || '',
    ];
  });
  const cashCsv = rowsToCsv(cashHeaders, cashRows);
  datasets.push({
    filename: `afinity_cash_holdings_${timestamp}.csv`,
    category: 'Cash Vaults',
    description: 'Physical cash vaults and note/coin denomination breakdowns',
    rowCount: cashRows.length,
    csvContent: cashCsv,
  });

  // 4. Digital Wallets & Stored Value
  const walletHeaders = [
    'Wallet ID',
    'Wallet Name',
    'Provider',
    'Wallet Type',
    'Owner',
    'Current Balance (INR)',
    'Include In Net Worth',
    'Status',
    'Linked Mobile',
    'Last Updated',
    'Created At',
    'Notes',
  ];
  const walletRows = (data.wallets || []).map((w) => [
    w.id,
    w.name,
    w.providerName || w.provider,
    w.walletType || 'DIGITAL_WALLET',
    w.owner || 'SELF',
    w.balance,
    w.includeInNetWorth !== false ? 'Yes' : 'No',
    w.status,
    w.linkedMobile || '',
    w.lastUpdated || w.updatedAt || '',
    w.createdAt,
    w.notes || '',
  ]);
  const walletCsv = rowsToCsv(walletHeaders, walletRows);
  datasets.push({
    filename: `afinity_digital_wallets_${timestamp}.csv`,
    category: 'Digital Wallets',
    description: 'Stored-value wallets, cashback vaults, and trading wallet balances',
    rowCount: walletRows.length,
    csvContent: walletCsv,
  });

  // 5. Credit Cards & Shared Limit Accounts
  const cardHeaders = [
    'Card ID',
    'Card Name',
    'Issuer / Bank',
    'Card Type',
    'Owner',
    'Managed By',
    'Last 4 Digits',
    'Outstanding Balance (INR)',
    'Total Credit Limit (INR)',
    'Available Limit (INR)',
    'Statement Day',
    'Payment Due Date',
    'Include In Net Worth',
    'Status',
    'Shared Limit Group ID',
    'Card Network',
    'Created At',
    'Notes',
  ];
  const cardRows = (data.creditCards || []).map((cc) => [
    cc.id,
    cc.cardName,
    cc.issuer || cc.bankName || '',
    cc.cardType || 'CREDIT_CARD',
    cc.owner || 'SELF',
    cc.managedBy || (cc.iPayThisCard ? 'ME' : 'OWNER'),
    cc.lastFourDigits || '',
    cc.outstanding ?? cc.outstandingBalance ?? 0,
    cc.creditLimit || 0,
    cc.availableLimit ?? Math.max(0, (cc.creditLimit || 0) - (cc.outstanding || 0)),
    cc.statementDay || cc.billingCycleDate || '',
    cc.dueDate || cc.paymentDueDate || '',
    cc.includeInNetWorth !== false ? 'Yes' : 'No',
    cc.status,
    cc.creditLimitGroupId || cc.sharedLimitGroupId || '',
    cc.cardNetwork || '',
    cc.createdAt,
    cc.notes || '',
  ]);
  const cardCsv = rowsToCsv(cardHeaders, cardRows);
  datasets.push({
    filename: `afinity_credit_cards_${timestamp}.csv`,
    category: 'Credit Cards',
    description: 'Credit cards with credit limits, statement dates, outstanding dues, and ownership',
    rowCount: cardRows.length,
    csvContent: cardCsv,
  });

  // 6. Credit Card Payments
  const ccPaymentHeaders = [
    'Payment ID',
    'Card ID',
    'Card Name',
    'Payment Amount (INR)',
    'Payment Date',
    'Payment Method',
    'Source Account ID',
    'Previous Outstanding (INR)',
    'New Outstanding (INR)',
    'Created At',
    'Notes',
  ];
  const ccPaymentRows = (data.creditCardPayments || []).map((p) => [
    p.id,
    p.cardId,
    p.cardName || '',
    p.amount,
    p.paymentDate,
    p.paymentMethod,
    p.sourceAccountId || '',
    p.previousOutstanding || 0,
    p.newOutstanding || 0,
    p.createdAt,
    p.notes || '',
  ]);
  const ccPaymentCsv = rowsToCsv(ccPaymentHeaders, ccPaymentRows);
  datasets.push({
    filename: `afinity_credit_card_payments_${timestamp}.csv`,
    category: 'Card Payments',
    description: 'Settled credit card payments, repayment methods, and outstanding adjustments',
    rowCount: ccPaymentRows.length,
    csvContent: ccPaymentCsv,
  });

  // 7. Investment Holdings & Portfolio
  const investmentHeaders = [
    'Holding ID',
    'Asset Name',
    'Symbol / Ticker',
    'Asset Type',
    'Broker / Platform',
    'Quantity / Units',
    'Unit Type',
    'Average Buy Price (INR)',
    'Invested Amount (INR)',
    'Current Market Price (INR)',
    'Current Valuation (INR)',
    'Unrealized P&L (INR)',
    'Unrealized P&L (%)',
    'Price Source',
    'Price Updated At',
    'Include In Net Worth',
    'Status',
    'ISIN / Scheme Code',
    'Created At',
    'Notes',
  ];
  const investmentRows = (data.investmentHoldings || []).map((inv) => {
    const qty = Number(inv.quantity ?? inv.unitsHeld ?? 1);
    const avgPrice = Number(inv.averageBuyPrice || 0);
    const invested = Number(inv.investedAmount || qty * avgPrice);
    const currPrice = Number(inv.currentPrice || 0);
    const currVal = Number(inv.currentValue || qty * currPrice);
    const pnl = Number(inv.unrealizedProfitLoss ?? (currVal - invested));
    const pnlPercent = Number(inv.unrealizedProfitLossPercentage ?? (invested > 0 ? (pnl / invested) * 100 : 0));

    return [
      inv.id,
      inv.name,
      inv.symbol || '',
      inv.assetType || inv.type || 'STOCK',
      inv.broker || inv.platform || 'Groww',
      qty,
      inv.unit || 'SHARES',
      avgPrice,
      invested,
      currPrice,
      currVal,
      pnl,
      pnlPercent.toFixed(2),
      inv.priceSource || 'MARKET',
      inv.priceUpdatedAt || inv.lastUpdated || '',
      inv.includeInNetWorth !== false ? 'Yes' : 'No',
      inv.status,
      inv.isin || inv.schemeCode || '',
      inv.createdAt,
      inv.notes || '',
    ];
  });
  const investmentCsv = rowsToCsv(investmentHeaders, investmentRows);
  datasets.push({
    filename: `afinity_investment_holdings_${timestamp}.csv`,
    category: 'Investments',
    description: 'Equities, Mutual Funds, SGBs, Gold holdings with buy price, current NAV, and P&L',
    rowCount: investmentRows.length,
    csvContent: investmentCsv,
  });

  // 8. IPO Applications
  const ipoHeaders = [
    'IPO ID',
    'Company Name',
    'Symbol',
    'Bid Price (INR)',
    'Lots Applied',
    'Shares Per Lot',
    'Blocked Amount (INR)',
    'IPO Status',
    'Application Date',
    'Allotment Date',
    'Listing Date',
    'Bank Used',
    'Created At',
    'Notes',
  ];
  const ipoRows = (data.ipoApplications || []).map((ipo) => [
    ipo.id,
    ipo.companyName || ipo.name || ipo.symbol,
    ipo.symbol,
    ipo.bidPrice,
    ipo.lotsApplied,
    ipo.sharesPerLot,
    ipo.blockedAmount,
    ipo.ipoStatus,
    ipo.applicationDate,
    ipo.allotmentDate,
    ipo.listingDate || '',
    ipo.bankUsed,
    ipo.createdAt,
    ipo.notes || '',
  ]);
  const ipoCsv = rowsToCsv(ipoHeaders, ipoRows);
  datasets.push({
    filename: `afinity_ipo_applications_${timestamp}.csv`,
    category: 'IPO Applications',
    description: 'IPO ASBA applications, blocked funds, and allotment tracking',
    rowCount: ipoRows.length,
    csvContent: ipoCsv,
  });

  // 9. Khatabook (Receivables & Payables Ledger)
  const khatabookHeaders = [
    'Entry ID',
    'Counterparty Name',
    'Phone / Contact',
    'Ledger Type (RECEIVABLE / PAYABLE)',
    'Original Transaction Amount (INR)',
    'Paid / Settled Amount (INR)',
    'Remaining Outstanding Balance (INR)',
    'Status',
    'Entry Date',
    'Due Date',
    'Include In Net Worth',
    'Is Settled',
    'Settled Date',
    'Created At',
    'Notes / Purpose',
  ];
  const khatabookRows = (data.khatabookEntries || []).map((k) => {
    const rawType = (k.entryType || k.type || 'RECEIVABLE').toString().toUpperCase();
    const entryType = rawType === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE';
    const orig = Number(k.originalAmount ?? k.amount ?? 0);
    const paid = Number(k.paidAmount ?? (k.isSettled ? orig : 0));
    const remaining = Number(k.remainingAmount ?? (orig - paid));

    return [
      k.id,
      k.personName || k.name,
      k.phone || k.contactNumber || '',
      entryType,
      orig,
      paid,
      remaining,
      k.status || (remaining === 0 ? 'PAID' : 'OPEN'),
      k.date || k.createdAt.slice(0, 10),
      k.dueDate || '',
      k.includeInNetWorth !== false ? 'Yes' : 'No',
      k.isSettled || remaining === 0 ? 'Yes' : 'No',
      k.settledDate || '',
      k.createdAt,
      k.notes || k.reason || '',
    ];
  });
  const khatabookCsv = rowsToCsv(khatabookHeaders, khatabookRows);
  datasets.push({
    filename: `afinity_khatabook_ledger_${timestamp}.csv`,
    category: 'Khatabook Ledger',
    description: 'Personal peer-to-peer receivables and payables ledger with settlement progress',
    rowCount: khatabookRows.length,
    csvContent: khatabookCsv,
  });

  // 10. Internal Transfer Audit Records
  const transferHeaders = [
    'Transfer ID',
    'Date & Time',
    'Transfer Type',
    'From Entity Type',
    'From Account Name',
    'From Account ID',
    'To Entity Type',
    'To Account Name',
    'To Account ID',
    'Amount (INR)',
    'Reference Number',
    'Notes',
  ];
  const transferRows = (data.transfers || []).map((t) => [
    t.id,
    t.timestamp,
    t.transferType,
    t.fromEntityType,
    t.fromEntityName,
    t.fromEntityId,
    t.toEntityType,
    t.toEntityName,
    t.toEntityId,
    t.amount,
    t.referenceNumber || '',
    t.notes || '',
  ]);
  const transferCsv = rowsToCsv(transferHeaders, transferRows);
  datasets.push({
    filename: `afinity_internal_transfers_${timestamp}.csv`,
    category: 'Internal Transfers',
    description: 'Complete money movement logs between accounts, vaults, wallets, and settlements',
    rowCount: transferRows.length,
    csvContent: transferCsv,
  });

  // 11. Historical Net Worth Snapshots
  const snapshotHeaders = [
    'Snapshot ID',
    'Date',
    'Date String',
    'Timestamp',
    'Snapshot Label',
    'Snapshot Type',
    'Net Worth (INR)',
    'Total Assets (INR)',
    'Total Liabilities (INR)',
    'Cash Total (INR)',
    'Bank Total (INR)',
    'FD Total (INR)',
    'Wallet Total (INR)',
    'Investments Total (INR)',
    'Receivables Total (INR)',
    'Credit Card Due (INR)',
    'Payables Total (INR)',
    'Overdraft Liabilities (INR)',
    'IPO Blocked (INR)',
    'Notes',
  ];
  const snapshotRows = (data.snapshots || []).map((s) => [
    s.id,
    s.date || s.timestamp.slice(0, 10),
    s.dateString || '',
    s.timestamp,
    s.label || 'Monthly',
    s.snapshotType || 'monthly',
    s.netWorth ?? s.totalNetWorth ?? 0,
    s.totalAssets || 0,
    s.totalLiabilities || 0,
    s.totalCash ?? s.cashTotal ?? 0,
    s.totalBankBalance ?? s.bankTotal ?? 0,
    s.totalFixedDeposits || 0,
    s.totalWalletBalance || 0,
    s.totalInvestments ?? s.investmentTotal ?? 0,
    s.totalReceivables ?? s.receivablesTotal ?? 0,
    s.totalCreditCardDue ?? s.creditCardTotal ?? 0,
    s.totalPayables ?? s.payablesTotal ?? 0,
    s.totalOverdraftLiabilities || 0,
    s.totalIPOBlocked || 0,
    s.note || '',
  ]);
  const snapshotCsv = rowsToCsv(snapshotHeaders, snapshotRows);
  datasets.push({
    filename: `afinity_networth_snapshots_${timestamp}.csv`,
    category: 'Historical Snapshots',
    description: 'Daily and monthly portfolio valuation checkpoints and historical asset breakdowns',
    rowCount: snapshotRows.length,
    csvContent: snapshotCsv,
  });

  // 12. Balance History Logs
  const historyHeaders = [
    'Log ID',
    'Timestamp',
    'Entity Type',
    'Entity Name',
    'Entity ID',
    'Previous Balance (INR)',
    'New Balance (INR)',
    'Change Amount (INR)',
    'Notes',
  ];
  const historyRows = (data.balanceHistory || []).map((h) => [
    h.id,
    h.timestamp,
    h.entityType,
    h.entityName,
    h.entityId,
    h.previousBalance,
    h.newBalance,
    h.changeAmount,
    h.notes || '',
  ]);
  const historyCsv = rowsToCsv(historyHeaders, historyRows);
  datasets.push({
    filename: `afinity_balance_history_${timestamp}.csv`,
    category: 'Balance History',
    description: 'Granular point-in-time balance change logs and audit trail',
    rowCount: historyRows.length,
    csvContent: historyCsv,
  });

  // 13. System Audit Events
  const auditHeaders = [
    'Audit ID',
    'Timestamp',
    'Event Type',
    'Entity Type',
    'Entity Name',
    'Entity ID',
    'Metadata JSON',
  ];
  const auditRows = (data.auditEvents || []).map((a) => [
    a.id,
    a.timestamp,
    a.type,
    a.entityType,
    a.entityName || '',
    a.entityId,
    a.metadata ? JSON.stringify(a.metadata) : '',
  ]);
  const auditCsv = rowsToCsv(auditHeaders, auditRows);
  datasets.push({
    filename: `afinity_audit_logs_${timestamp}.csv`,
    category: 'Audit Logs',
    description: 'Security and system operation event logs with timestamp verification',
    rowCount: auditRows.length,
    csvContent: auditCsv,
  });

  // Master Comprehensive Combined CSV with Section Headers for single-file analysis
  const masterLines: string[] = [
    `# =========================================================================`,
    `# AFINITY FINANCIAL DATA VAULT COMPLETE CSV EXPORT`,
    `# Exported At: ${new Date().toISOString()}`,
    `# Schema Version: ${data.version || 2}`,
    `# Data Enclave: Client-Side IndexedDB (Dexie)`,
    `# =========================================================================`,
    ``,
  ];

  for (const ds of datasets) {
    masterLines.push(`### SECTION: ${ds.category.toUpperCase()} (${ds.rowCount} Records)`);
    masterLines.push(`### Description: ${ds.description}`);
    masterLines.push(ds.csvContent);
    masterLines.push(``);
  }

  const masterCsv = masterLines.join('\r\n');

  return {
    datasets,
    masterCsv,
  };
}

/**
 * Initiates a browser download for a CSV string with proper UTF-8 BOM for Excel compatibility.
 */
export function downloadCsvFile(content: string, filename: string): void {
  // UTF-8 BOM (\uFEFF) ensures Excel opens foreign characters and Rupee symbols properly
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
