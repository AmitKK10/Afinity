import Dexie, { type Table } from 'dexie';
import {
  Bank,
  BankAccount,
  FixedDepositAccount,
  CashHoldingAccount,
  DigitalWallet,
  WalletTransaction,
  CreditCard,
  CreditLimitGroup,
  CreditCardPayment,
  InvestmentHolding,
  IPOApplication,
  KhatabookEntry,
  SIPRecord,
  InternalTransferRecord,
  FinancialSnapshot,
  BalanceHistoryRecord,
  AuditEvent,
  UserSettings,
} from '../types';

export class AfinityDatabase extends Dexie {
  banks!: Table<Bank, string>;
  bankAccounts!: Table<BankAccount, string>;
  fixedDeposits!: Table<FixedDepositAccount, string>;
  cashHoldings!: Table<CashHoldingAccount, string>;
  wallets!: Table<DigitalWallet, string>;
  walletTransactions!: Table<WalletTransaction, string>;
  creditCards!: Table<CreditCard, string>;
  creditLimitGroups!: Table<CreditLimitGroup, string>;
  creditCardPayments!: Table<CreditCardPayment, string>;
  investmentHoldings!: Table<InvestmentHolding, string>;
  ipoApplications!: Table<IPOApplication, string>;
  khatabookEntries!: Table<KhatabookEntry, string>;
  sips!: Table<SIPRecord, string>;
  transfers!: Table<InternalTransferRecord, string>;
  snapshots!: Table<FinancialSnapshot, string>;
  balanceHistory!: Table<BalanceHistoryRecord, string>;
  auditEvents!: Table<AuditEvent, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('AfinityDB');

    // Version 1 (Baseline)
    this.version(1).stores({
      bankAccounts: 'id, name, status, accountType, createdAt, updatedAt',
      fixedDeposits: 'id, name, status, bankName, maturityDate, createdAt, updatedAt',
      cashHoldings: 'id, name, status, location, createdAt, updatedAt',
      wallets: 'id, name, status, provider, createdAt, updatedAt',
      creditCards: 'id, cardName, bankName, status, owner, sharedLimitGroupId, createdAt, updatedAt',
      creditLimitGroups: 'id, bankName, createdAt',
      investmentHoldings: 'id, name, type, platform, status, createdAt, updatedAt',
      ipoApplications: 'id, symbol, ipoStatus, applicationDate, createdAt',
      khatabookEntries: 'id, personName, type, isSettled, status, createdAt, updatedAt',
      snapshots: 'id, timestamp, dateString',
      balanceHistory: 'id, entityType, entityId, timestamp',
      auditEvents: 'id, type, entityType, entityId, timestamp',
      settings: 'id',
    });

    // Version 2 (Step 4: Banks, BankAccounts with bankId, and Transfers)
    this.version(2).stores({
      banks: 'id, name, shortCode, status, createdAt, updatedAt',
      bankAccounts: 'id, bankId, name, status, accountType, createdAt, updatedAt',
      fixedDeposits: 'id, bankId, name, status, bankName, maturityDate, createdAt, updatedAt',
      transfers: 'id, fromEntityId, toEntityId, transferType, timestamp',
    });

    // Version 3 (Step 5A: Digital Wallet Transactions & Enhanced Indices)
    this.version(3).stores({
      wallets: 'id, name, status, provider, walletType, owner, includeInNetWorth, createdAt, updatedAt',
      walletTransactions: 'id, walletId, type, direction, date, createdAt',
    });

    // Version 4 (Step 6A: Credit Card Foundation & Shared Limit Groups)
    this.version(4).stores({
      creditCards: 'id, cardName, issuer, bankName, status, owner, managedBy, creditLimitGroupId, sharedLimitGroupId, includeInNetWorth, createdAt, updatedAt',
      creditLimitGroups: 'id, name, issuer, bankName, status, createdAt, updatedAt',
    });

    // Version 5 (Step 6C: Credit Card Payments & Billing Tracking)
    this.version(5).stores({
      creditCardPayments: 'id, cardId, paymentDate, paymentMethod, createdAt',
    });

    // Version 6 (Step 7A: Investment Holdings & IPO Foundations)
    this.version(6).stores({
      investmentHoldings: 'id, name, assetType, type, broker, platform, status, includeInNetWorth, createdAt, updatedAt',
      ipoApplications: 'id, symbol, companyName, ipoStatus, applicationDate, includeInNetWorth, createdAt, updatedAt',
    });

    // Version 7 (Step 8A: Khatabook Receivables & Payables Foundation)
    this.version(7)
      .stores({
        khatabookEntries: 'id, personName, entryType, type, status, isSettled, includeInNetWorth, dueDate, createdAt, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('khatabookEntries')
          .toCollection()
          .modify((entry: any) => {
            const orig = entry.originalAmount !== undefined ? Number(entry.originalAmount) : Number(entry.amount || 0);
            const paid = Number(entry.paidAmount || (entry.isSettled ? orig : 0));
            const remaining = Math.max(0, orig - paid);
            const rawType = (entry.entryType || entry.type || 'receivable').toString().toUpperCase();
            const entryType = rawType === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE';

            entry.originalAmount = orig;
            entry.paidAmount = paid;
            entry.remainingAmount = remaining;
            entry.amount = remaining;
            entry.entryType = entryType;
            entry.type = entryType.toLowerCase();
            entry.status = entry.status || (entry.isSettled || remaining === 0 ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : 'OPEN');
            if (entry.includeInNetWorth === undefined) entry.includeInNetWorth = true;
          });
      });

    // Version 8 (Step 9A: Historical Net Worth Snapshots & Comparison Data Engine)
    this.version(8)
      .stores({
        snapshots: 'id, timestamp, date, dateString, label, snapshotType, createdAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('snapshots')
          .toCollection()
          .modify((snap: any) => {
            if (!snap.date && snap.timestamp) {
              snap.date = snap.timestamp.slice(0, 10);
            }
            if (snap.netWorth === undefined && snap.totalNetWorth !== undefined) {
              snap.netWorth = snap.totalNetWorth;
            }
            if (snap.totalCash === undefined && snap.cashTotal !== undefined) {
              snap.totalCash = snap.cashTotal;
            }
            if (snap.totalBankBalance === undefined && snap.bankTotal !== undefined) {
              snap.totalBankBalance = snap.bankTotal;
            }
            if (snap.totalFixedDeposits === undefined) {
              snap.totalFixedDeposits = 0;
            }
            if (snap.totalWalletBalance === undefined) {
              snap.totalWalletBalance = 0;
            }
            if (snap.totalInvestments === undefined && snap.investmentTotal !== undefined) {
              snap.totalInvestments = snap.investmentTotal;
            }
            if (snap.totalReceivables === undefined && snap.receivablesTotal !== undefined) {
              snap.totalReceivables = snap.receivablesTotal;
            }
            if (snap.totalCreditCardDue === undefined && snap.creditCardTotal !== undefined) {
              snap.totalCreditCardDue = snap.creditCardTotal;
            }
            if (snap.totalPayables === undefined && snap.payablesTotal !== undefined) {
              snap.totalPayables = snap.payablesTotal;
            }
            if (snap.totalOverdraftLiabilities === undefined) {
              snap.totalOverdraftLiabilities = 0;
            }
            if (snap.totalIPOBlocked === undefined) {
              snap.totalIPOBlocked = 0;
            }
            if (!snap.snapshotType) {
              snap.snapshotType = 'monthly';
            }
            if (!snap.label) {
              snap.label = 'Monthly';
            }
          });
      });

    // Version 9 (Step 10A: Systematic Investment Plan (SIP) Management & Payment Safety Engine)
    this.version(9).stores({
      sips: 'id, fundName, bankAccountId, sipStatus, status, deductionDay, frequency, createdAt, updatedAt',
    });
  }
}

export const db = new AfinityDatabase();
