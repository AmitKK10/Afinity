/**
 * Afinity Data Service & Repository Layer
 * Isolates UI and State layers from IndexedDB (Dexie).
 * Manages full lifecycle, history tracking, audit events, and data export/import.
 */

import { db } from './db';
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
  CreditCardPaymentMethod,
  InvestmentHolding,
  InvestmentPriceStatus,
  IPOApplication,
  KhatabookEntry,
  KhatabookType,
  KhatabookStatus,
  SettleKhatabookParams,
  KhatabookSettlementResult,
  SIPRecord,
  AddSIPInput,
  UpdateSIPInput,
  SIPSafetyReport,
  InternalTransferRecord,
  FinancialSnapshot,
  BalanceHistoryRecord,
  AuditEvent,
  AuditEventType,
  UserSettings,
  ExportedBackupData,
  CashDenomination,
  AccountCategory,
  CashbackSource,
  CashbackType,
  BankAverageBalanceRecord,
} from '../types';
import {
  normalizeKhatabookType,
  getKhatabookOriginalAmount,
  getKhatabookPaidAmount,
  getKhatabookRemainingAmount,
  getKhatabookStatus,
} from './calculations';
import {
  DEFAULT_USER_SETTINGS,
  DEMO_BANKS,
  DEMO_BANK_ACCOUNTS,
  DEMO_FIXED_DEPOSITS,
  DEMO_CASH_HOLDINGS,
  DEMO_WALLETS,
  DEMO_CREDIT_CARDS,
  DEMO_CREDIT_LIMIT_GROUPS,
  DEMO_CREDIT_CARD_PAYMENTS,
  DEMO_INVESTMENTS,
  DEMO_IPO_APPLICATIONS,
  DEMO_KHATABOOK_ENTRIES,
  DEMO_SIPS,
  DEMO_TRANSFERS,
  DEMO_HISTORICAL_SNAPSHOTS,
} from '../data/demoData';
import { sipSafetyService } from './sipSafetyService';

// Helper to create stable IDs
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

class RepositoryService {
  /**
   * Initializes the database.
   * If empty on first launch (no settings record found), populates demo seed data.
   * If database was already initialized (even if all balances are 0 or empty), leaves user data untouched.
   */
  async initDatabase(): Promise<boolean> {
    try {
      const existingSettings = await db.settings.get('user_settings');
      if (!existingSettings) {
        // First launch ever: Seed initial data idempotently
        await this.seedInitialData();
        return true;
      }
      // Ensure historical snapshots have full 24-month coverage if existing seed had fewer items
      const snapshotCount = await db.snapshots.count();
      if (snapshotCount > 0 && snapshotCount <= 8) {
        await db.snapshots.bulkPut(DEMO_HISTORICAL_SNAPSHOTS);
      }
      // Populate demo SIPs if existing database has bank accounts but no SIPs
      const sipCount = await db.sips.count();
      if (sipCount === 0) {
        const bankCount = await db.bankAccounts.count();
        if (bankCount > 0) {
          await db.sips.bulkPut(DEMO_SIPS);
        }
      }
      return false;
    } catch (err) {
      console.warn('Recovering from local database init issue:', err);
      try {
        const existingSettings = await db.settings.get('user_settings');
        if (!existingSettings) {
          await this.seedInitialData();
          return true;
        }
        return false;
      } catch (fallbackErr) {
        console.error('Failed to initialize database on fallback:', fallbackErr);
        return false;
      }
    }
  }

  /**
   * Seeds demo data on initial fresh start
   */
  async seedInitialData(): Promise<void> {
    await db.transaction(
      'rw',
      [
        db.banks,
        db.bankAccounts,
        db.fixedDeposits,
        db.cashHoldings,
        db.wallets,
        db.creditCards,
        db.creditLimitGroups,
        db.creditCardPayments,
        db.investmentHoldings,
        db.ipoApplications,
        db.khatabookEntries,
        db.sips,
        db.transfers,
        db.snapshots,
        db.settings,
        db.auditEvents,
      ],
      async () => {
        await db.banks.bulkPut(DEMO_BANKS);
        await db.bankAccounts.bulkPut(DEMO_BANK_ACCOUNTS);
        await db.fixedDeposits.bulkPut(DEMO_FIXED_DEPOSITS);
        await db.cashHoldings.bulkPut(DEMO_CASH_HOLDINGS);
        await db.wallets.bulkPut(DEMO_WALLETS);
        await db.creditCards.bulkPut(DEMO_CREDIT_CARDS);
        await db.creditLimitGroups.bulkPut(DEMO_CREDIT_LIMIT_GROUPS);
        await db.creditCardPayments.bulkPut(DEMO_CREDIT_CARD_PAYMENTS);
        await db.investmentHoldings.bulkPut(DEMO_INVESTMENTS);
        await db.ipoApplications.bulkPut(DEMO_IPO_APPLICATIONS);
        await db.khatabookEntries.bulkPut(DEMO_KHATABOOK_ENTRIES);
        await db.sips.bulkPut(DEMO_SIPS);
        await db.transfers.bulkPut(DEMO_TRANSFERS);
        await db.snapshots.bulkPut(DEMO_HISTORICAL_SNAPSHOTS);
        await db.settings.put(DEFAULT_USER_SETTINGS);

        // Log initial seed audit event
        await db.auditEvents.add({
          id: generateId('audit'),
          type: 'DATA_RESET',
          entityType: 'system',
          entityId: 'vault',
          entityName: 'Initial Seed Data',
          timestamp: new Date().toISOString(),
          metadata: { source: 'first_launch_seed' },
        });
      }
    );
  }

  /**
   * Clears all sample and user data to start with a pristine, 100% empty vault.
   * Retains user settings so demo data is never auto-re-seeded on reload.
   */
  async clearAllData(): Promise<void> {
    await db.transaction(
      'rw',
      [
        db.banks,
        db.bankAccounts,
        db.fixedDeposits,
        db.cashHoldings,
        db.wallets,
        db.walletTransactions,
        db.creditCards,
        db.creditLimitGroups,
        db.creditCardPayments,
        db.investmentHoldings,
        db.ipoApplications,
        db.khatabookEntries,
        db.sips,
        db.transfers,
        db.snapshots,
        db.balanceHistory,
        db.auditEvents,
        db.settings,
      ],
      async () => {
        await Promise.all([
          db.banks.clear(),
          db.bankAccounts.clear(),
          db.fixedDeposits.clear(),
          db.cashHoldings.clear(),
          db.wallets.clear(),
          db.walletTransactions.clear(),
          db.creditCards.clear(),
          db.creditLimitGroups.clear(),
          db.creditCardPayments.clear(),
          db.investmentHoldings.clear(),
          db.ipoApplications.clear(),
          db.khatabookEntries.clear(),
          db.sips.clear(),
          db.transfers.clear(),
          db.snapshots.clear(),
          db.balanceHistory.clear(),
          db.auditEvents.clear(),
        ]);

        await db.settings.put(DEFAULT_USER_SETTINGS);

        await db.auditEvents.add({
          id: generateId('audit'),
          type: 'DATA_RESET',
          entityType: 'system',
          entityId: 'vault',
          entityName: 'Vault Cleared (Empty Start)',
          timestamp: new Date().toISOString(),
          metadata: { action: 'start_fresh_empty_vault' },
        });
      }
    );
  }

  /**
   * Resets local data to fresh initial demo state
   */
  async resetToDemoData(): Promise<void> {
    await db.transaction(
      'rw',
      [
        db.banks,
        db.bankAccounts,
        db.fixedDeposits,
        db.cashHoldings,
        db.wallets,
        db.walletTransactions,
        db.creditCards,
        db.creditLimitGroups,
        db.creditCardPayments,
        db.investmentHoldings,
        db.ipoApplications,
        db.khatabookEntries,
        db.transfers,
        db.snapshots,
        db.balanceHistory,
        db.auditEvents,
        db.settings,
      ],
      async () => {
        await Promise.all([
          db.banks.clear(),
          db.bankAccounts.clear(),
          db.fixedDeposits.clear(),
          db.cashHoldings.clear(),
          db.wallets.clear(),
          db.walletTransactions.clear(),
          db.creditCards.clear(),
          db.creditLimitGroups.clear(),
          db.creditCardPayments.clear(),
          db.investmentHoldings.clear(),
          db.ipoApplications.clear(),
          db.khatabookEntries.clear(),
          db.transfers.clear(),
          db.snapshots.clear(),
          db.balanceHistory.clear(),
          db.auditEvents.clear(),
        ]);

        await this.seedInitialData();
      }
    );
  }

  // ==================== AUDIT EVENTS & HISTORY ====================

  async logAuditEvent(
    type: AuditEventType,
    entityType: string,
    entityId: string,
    entityName?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await db.auditEvents.add({
        id: generateId('audit'),
        type,
        entityType,
        entityId,
        entityName,
        timestamp: new Date().toISOString(),
        metadata,
      });
    } catch (err) {
      console.warn('Could not record audit event:', err);
    }
  }

  async getAuditEvents(): Promise<AuditEvent[]> {
    return await db.auditEvents.reverse().sortBy('timestamp');
  }

  async recordBalanceChange(
    entityType: AccountCategory | 'credit_card' | 'investment' | 'khatabook',
    entityId: string,
    entityName: string,
    previousBalance: number,
    newBalance: number,
    notes?: string
  ): Promise<void> {
    if (previousBalance === newBalance) return; // Skip if no real change

    const record: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType,
      entityId,
      entityName,
      previousBalance,
      newBalance,
      changeAmount: Math.round((newBalance - previousBalance) * 100) / 100,
      timestamp: new Date().toISOString(),
      notes,
    };

    await db.balanceHistory.add(record);
    await this.logAuditEvent('BALANCE_UPDATED', entityType, entityId, entityName, {
      from: previousBalance,
      to: newBalance,
      delta: record.changeAmount,
      reason: notes,
    });
  }

  async getBalanceHistory(entityId?: string): Promise<BalanceHistoryRecord[]> {
    if (entityId) {
      return await db.balanceHistory.where('entityId').equals(entityId).reverse().sortBy('timestamp');
    }
    return await db.balanceHistory.reverse().sortBy('timestamp');
  }

  // ==================== BANK ENTITIES ====================

  async getAllBanks(): Promise<Bank[]> {
    return await db.banks.toArray();
  }

  async createBank(data: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bank> {
    const now = new Date().toISOString();
    const bank: Bank = {
      ...data,
      id: generateId('bank_inst'),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    await db.banks.add(bank);
    await this.logAuditEvent('ACCOUNT_CREATED', 'bank_inst', bank.id, bank.name);
    return bank;
  }

  async updateBank(id: string, updates: Partial<Bank>): Promise<Bank> {
    const existing = await db.banks.get(id);
    if (!existing) throw new Error(`Bank with ID ${id} not found`);

    const now = new Date().toISOString();
    const updated: Bank = {
      ...existing,
      ...updates,
      updatedAt: now,
    };
    await db.banks.put(updated);
    await this.logAuditEvent('ACCOUNT_UPDATED', 'bank_inst', id, updated.name);
    return updated;
  }

  async archiveBank(id: string): Promise<void> {
    const existing = await db.banks.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.banks.update(id, { status: 'archived', archivedAt: now, updatedAt: now });
    await this.logAuditEvent('ACCOUNT_ARCHIVED', 'bank_inst', id, existing.name);
  }

  // ==================== BANK ACCOUNTS ====================

  async getAllBankAccounts(): Promise<BankAccount[]> {
    return await db.bankAccounts.toArray();
  }

  async createBankAccount(
    data: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>
  ): Promise<BankAccount> {
    const now = new Date().toISOString();
    const last4 = data.last4 || (data.accountNumberMasked ? data.accountNumberMasked.slice(-4) : undefined);
    const masked = last4 ? `•••• ${last4}` : data.accountNumberMasked || '•••• ••••';

    const account: BankAccount = {
      ...data,
      accountNumberMasked: masked,
      last4,
      id: generateId('bank'),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
    };

    await db.bankAccounts.add(account);
    await this.logAuditEvent('ACCOUNT_CREATED', 'bank', account.id, account.name);

    if (data.balance !== 0) {
      await this.recordBalanceChange('bank', account.id, account.name, 0, data.balance, 'Initial opening balance');
    }

    return account;
  }

  async updateBankAccount(id: string, updates: Partial<BankAccount>): Promise<BankAccount> {
    const existing = await db.bankAccounts.get(id);
    if (!existing) throw new Error(`Bank account with ID ${id} not found`);

    const now = new Date().toISOString();
    const updated: BankAccount = {
      ...existing,
      ...updates,
      updatedAt: now,
      lastUpdated: now,
    };

    if (updates.balance !== undefined && updates.balance !== existing.balance) {
      await this.recordBalanceChange('bank', id, existing.name, existing.balance, updates.balance);
    }

    await db.bankAccounts.put(updated);
    await this.logAuditEvent('ACCOUNT_UPDATED', 'bank', id, updated.name, updates);
    return updated;
  }

  async updateBankAccountBalance(
    id: string,
    newBalance: number,
    reason?: string
  ): Promise<BankAccount> {
    const existing = await db.bankAccounts.get(id);
    if (!existing) throw new Error(`Bank account with ID ${id} not found`);

    const previousBalance = existing.balance;
    const now = new Date().toISOString();
    const updated: BankAccount = {
      ...existing,
      balance: newBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    await db.bankAccounts.put(updated);
    await this.recordBalanceChange('bank', id, existing.name, previousBalance, newBalance, reason);
    return updated;
  }

  async logBankAccountAverageBalance(
    id: string,
    recordData: Omit<BankAverageBalanceRecord, 'id' | 'createdAt'>
  ): Promise<BankAccount> {
    const existing = await db.bankAccounts.get(id);
    if (!existing) throw new Error(`Bank account with ID ${id} not found`);

    const now = new Date().toISOString();
    const reqAmount = Number(
      recordData.requiredAmount ??
        existing.averageBalanceRequirement ??
        existing.requiredAverageBalance ??
        existing.minimumBalanceRequirement ??
        0
    );
    const isMaintained = recordData.amount >= reqAmount;
    const deficit = Math.max(0, reqAmount - recordData.amount);

    const newRecord: BankAverageBalanceRecord = {
      ...recordData,
      id: generateId('mab_rec'),
      requiredAmount: reqAmount,
      isMaintained,
      deficit,
      createdAt: now,
    };

    const existingRecords = existing.averageBalanceRecords || [];
    const updatedRecords = [newRecord, ...existingRecords];

    const updated: BankAccount = {
      ...existing,
      actualAverageBalance: recordData.amount,
      averageBalancePeriod: recordData.period,
      averageBalanceSource: recordData.source,
      averageBalanceRequirement: reqAmount > 0 ? reqAmount : existing.averageBalanceRequirement,
      requiredAverageBalance: reqAmount > 0 ? reqAmount : existing.requiredAverageBalance,
      lastAverageBalanceUpdate: now,
      averageBalanceRecords: updatedRecords,
      updatedAt: now,
    };

    await db.bankAccounts.put(updated);
    await this.logAuditEvent('ACCOUNT_UPDATED', 'bank', id, existing.name, {
      action: 'average_balance_logged',
      amount: recordData.amount,
      period: recordData.period,
      source: recordData.source,
      deficit,
      isMaintained,
    });

    return updated;
  }

  async closeBankAccount(
    id: string,
    closureDate: string,
    finalBalance: number = 0,
    closureNote?: string
  ): Promise<BankAccount> {
    const existing = await db.bankAccounts.get(id);
    if (!existing) throw new Error(`Bank account with ID ${id} not found`);

    const now = new Date().toISOString();
    const updated: BankAccount = {
      ...existing,
      balance: finalBalance,
      status: 'archived',
      archivedAt: now,
      closureDate: closureDate || now,
      closureNote,
      updatedAt: now,
      lastUpdated: now,
    };

    if (finalBalance !== existing.balance) {
      await this.recordBalanceChange('bank', id, existing.name, existing.balance, finalBalance, `Account closed: ${closureNote || 'Final settlement'}`);
    }

    await db.bankAccounts.put(updated);
    await this.logAuditEvent('ACCOUNT_CLOSED', 'bank', id, existing.name, {
      closureDate,
      finalBalance,
      closureNote,
    });
    return updated;
  }

  async archiveBankAccount(id: string): Promise<void> {
    const existing = await db.bankAccounts.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.bankAccounts.update(id, { status: 'archived', archivedAt: now, updatedAt: now });
    await this.logAuditEvent('ACCOUNT_ARCHIVED', 'bank', id, existing.name);
  }

  async restoreBankAccount(id: string): Promise<void> {
    const existing = await db.bankAccounts.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.bankAccounts.update(id, { status: 'active', archivedAt: undefined, updatedAt: now });
    await this.logAuditEvent('ACCOUNT_RESTORED', 'bank', id, existing.name);
  }

  async deleteBankAccount(id: string): Promise<void> {
    const existing = await db.bankAccounts.get(id);
    await db.bankAccounts.delete(id);
    if (existing) {
      await this.logAuditEvent('ACCOUNT_DELETED', 'bank', id, existing.name);
    }
  }

  // ==================== FIXED DEPOSITS ====================

  async getAllFixedDeposits(): Promise<FixedDepositAccount[]> {
    return await db.fixedDeposits.toArray();
  }

  async createFixedDeposit(
    data: Omit<FixedDepositAccount, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>
  ): Promise<FixedDepositAccount> {
    const now = new Date().toISOString();
    const fd: FixedDepositAccount = {
      ...data,
      principal: data.principal || data.balance,
      balance: data.principal || data.balance,
      id: generateId('fd'),
      status: 'active',
      fdStatus: 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
    };
    await db.fixedDeposits.add(fd);
    await this.logAuditEvent('FD_CREATED', 'fd', fd.id, fd.name, {
      principal: fd.principal,
      interestRate: fd.interestRate,
      maturityDate: fd.maturityDate,
    });
    return fd;
  }

  async updateFixedDeposit(id: string, updates: Partial<FixedDepositAccount>): Promise<FixedDepositAccount> {
    const existing = await db.fixedDeposits.get(id);
    if (!existing) throw new Error(`Fixed Deposit with ID ${id} not found`);

    const now = new Date().toISOString();
    const updated: FixedDepositAccount = {
      ...existing,
      ...updates,
      updatedAt: now,
      lastUpdated: now,
    };
    await db.fixedDeposits.put(updated);
    await this.logAuditEvent('ACCOUNT_UPDATED', 'fd', id, updated.name, updates);
    return updated;
  }

  async matureOrWithdrawFD(
    fdId: string,
    destinationBankId?: string,
    payoutAmount?: number,
    action: 'withdraw' | 'renew' | 'close' = 'withdraw',
    notes?: string
  ): Promise<{ fd: FixedDepositAccount; bank?: BankAccount }> {
    const fd = await db.fixedDeposits.get(fdId);
    if (!fd) throw new Error(`Fixed Deposit with ID ${fdId} not found`);

    const now = new Date().toISOString();
    const finalAmount = payoutAmount !== undefined ? payoutAmount : (fd.maturityAmount || fd.principal);

    let updatedBank: BankAccount | undefined;

    if (action === 'withdraw' && destinationBankId) {
      const bank = await db.bankAccounts.get(destinationBankId);
      if (bank) {
        updatedBank = await this.updateBankAccount(destinationBankId, {
          balance: Number(bank.balance || 0) + finalAmount,
        });
        await this.recordBalanceChange('bank', destinationBankId, bank.name, bank.balance, updatedBank.balance, `FD Maturity Payout: ${fd.name}`);
      }
    }

    const updatedFd: FixedDepositAccount = {
      ...fd,
      status: 'archived',
      fdStatus: action === 'renew' ? 'matured' : 'closed',
      balance: 0,
      archivedAt: now,
      updatedAt: now,
      notes: notes ? `${fd.notes || ''} | ${action.toUpperCase()}: ₹${finalAmount}` : fd.notes,
    };

    await db.fixedDeposits.put(updatedFd);
    await this.logAuditEvent('FD_WITHDRAWN', 'fd', fdId, fd.name, {
      action,
      destinationBankId,
      payoutAmount: finalAmount,
      notes,
    });

    return { fd: updatedFd, bank: updatedBank };
  }

  async renewFD(
    oldFdId: string,
    newPrincipal: number,
    newInterestRate: number,
    newMaturityDate: string,
    notes?: string
  ): Promise<{ oldFd: FixedDepositAccount; newFd: FixedDepositAccount }> {
    const oldFd = await db.fixedDeposits.get(oldFdId);
    if (!oldFd) throw new Error(`Original FD with ID ${oldFdId} not found`);

    const now = new Date().toISOString();

    // Mark old FD as matured & archived
    const updatedOldFd: FixedDepositAccount = {
      ...oldFd,
      status: 'archived',
      fdStatus: 'matured',
      archivedAt: now,
      updatedAt: now,
      notes: `${oldFd.notes || ''} | Renewed into new FD on ${now.split('T')[0]}`,
    };
    await db.fixedDeposits.put(updatedOldFd);

    // Create new renewed FD record
    const newFd: FixedDepositAccount = {
      ...oldFd,
      id: generateId('fd'),
      name: `${oldFd.name} (Renewal)`,
      principal: newPrincipal,
      balance: newPrincipal,
      interestRate: newInterestRate,
      startDate: now.split('T')[0],
      maturityDate: newMaturityDate,
      status: 'active',
      fdStatus: 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      notes: notes || `Renewed from ${oldFd.name}`,
    };
    await db.fixedDeposits.add(newFd);

    await this.logAuditEvent('FD_RENEWED', 'fd', newFd.id, newFd.name, {
      fromFdId: oldFdId,
      principal: newPrincipal,
      rate: newInterestRate,
      maturityDate: newMaturityDate,
    });

    return { oldFd: updatedOldFd, newFd };
  }

  async archiveFixedDeposit(id: string): Promise<void> {
    const existing = await db.fixedDeposits.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.fixedDeposits.update(id, { status: 'archived', archivedAt: now, updatedAt: now });
    await this.logAuditEvent('ACCOUNT_ARCHIVED', 'fd', id, existing.name);
  }

  async restoreFixedDeposit(id: string): Promise<void> {
    const existing = await db.fixedDeposits.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.fixedDeposits.update(id, { status: 'active', archivedAt: undefined, updatedAt: now });
    await this.logAuditEvent('ACCOUNT_RESTORED', 'fd', id, existing.name);
  }

  async deleteFixedDeposit(id: string): Promise<void> {
    const existing = await db.fixedDeposits.get(id);
    await db.fixedDeposits.delete(id);
    if (existing) {
      await this.logAuditEvent('ACCOUNT_DELETED', 'fd', id, existing.name);
    }
  }

  // ==================== INTERNAL TRANSFERS & MOVEMENTS ====================

  async getAllTransfers(): Promise<InternalTransferRecord[]> {
    return await db.transfers.reverse().sortBy('timestamp');
  }

  /**
   * Bank to Bank Internal Transfer
   */
  async transferBankToBank(
    fromBankId: string,
    toBankId: string,
    amount: number,
    notes?: string
  ): Promise<{ from: BankAccount; to: BankAccount; transfer: InternalTransferRecord }> {
    if (fromBankId === toBankId) throw new Error('Source and destination accounts cannot be identical');
    if (amount <= 0) throw new Error('Transfer amount must be greater than zero');

    const from = await db.bankAccounts.get(fromBankId);
    const to = await db.bankAccounts.get(toBankId);
    if (!from || !to) throw new Error('Source or destination bank account not found');

    const updatedFrom = await this.updateBankAccount(fromBankId, {
      balance: Number(from.balance || 0) - amount,
    });

    const updatedTo = await this.updateBankAccount(toBankId, {
      balance: Number(to.balance || 0) + amount,
    });

    const now = new Date().toISOString();
    const transfer: InternalTransferRecord = {
      id: generateId('trf'),
      fromEntityType: 'bank',
      fromEntityId: fromBankId,
      fromEntityName: from.name,
      toEntityType: 'bank',
      toEntityId: toBankId,
      toEntityName: to.name,
      amount,
      timestamp: now,
      transferType: 'bank_to_bank',
      notes,
    };

    await db.transfers.add(transfer);
    await this.logAuditEvent('BANK_TRANSFER', 'bank', fromBankId, `Transferred ₹${amount} from ${from.name} to ${to.name}`, {
      toBankId,
      amount,
      notes,
    });

    return { from: updatedFrom, to: updatedTo, transfer };
  }

  /**
   * Bank to Cash (ATM Withdrawal)
   */
  async withdrawBankToCash(
    bankId: string,
    cashId: string,
    amount: number,
    notes?: string
  ): Promise<{ bank: BankAccount; cash: CashHoldingAccount; transfer: InternalTransferRecord }> {
    if (amount <= 0) throw new Error('Withdrawal amount must be greater than zero');

    const bank = await db.bankAccounts.get(bankId);
    const cash = await db.cashHoldings.get(cashId);
    if (!bank || !cash) throw new Error('Bank account or cash vault not found');

    const updatedBank = await this.updateBankAccount(bankId, {
      balance: Number(bank.balance || 0) - amount,
    });

    const updatedCash = await this.updateCashHolding(cashId, {
      balance: Number(cash.balance || 0) + amount,
      notes: notes ? `${cash.notes || ''} | ATM withdrawal ₹${amount} from ${bank.name}` : cash.notes,
    });

    const now = new Date().toISOString();
    const transfer: InternalTransferRecord = {
      id: generateId('trf'),
      fromEntityType: 'bank',
      fromEntityId: bankId,
      fromEntityName: bank.name,
      toEntityType: 'cash',
      toEntityId: cashId,
      toEntityName: cash.name,
      amount,
      timestamp: now,
      transferType: 'bank_to_cash',
      notes: notes || 'ATM cash withdrawal',
    };

    await db.transfers.add(transfer);
    await this.logAuditEvent('ATM_WITHDRAWAL', 'cash', cashId, `ATM Withdrawal ₹${amount} from ${bank.name} to ${cash.name}`);
    return { bank: updatedBank, cash: updatedCash, transfer };
  }

  /**
   * Cash to Bank Deposit
   */
  async transferCashToBank(
    cashId: string,
    bankId: string,
    amount: number,
    notes?: string
  ): Promise<{ cash: CashHoldingAccount; bank: BankAccount; transfer: InternalTransferRecord }> {
    if (amount <= 0) throw new Error('Deposit amount must be greater than zero');

    const cash = await db.cashHoldings.get(cashId);
    const bank = await db.bankAccounts.get(bankId);
    if (!cash || !bank) throw new Error('Cash vault or bank account not found');

    const updatedCash = await this.updateCashHolding(cashId, {
      balance: Number(cash.balance || 0) - amount,
    });

    const updatedBank = await this.updateBankAccount(bankId, {
      balance: Number(bank.balance || 0) + amount,
      notes: notes ? `${bank.notes || ''} | Cash deposit ₹${amount} from ${cash.name}` : bank.notes,
    });

    const now = new Date().toISOString();
    const transfer: InternalTransferRecord = {
      id: generateId('trf'),
      fromEntityType: 'cash',
      fromEntityId: cashId,
      fromEntityName: cash.name,
      toEntityType: 'bank',
      toEntityId: bankId,
      toEntityName: bank.name,
      amount,
      timestamp: now,
      transferType: 'cash_to_bank',
      notes: notes || 'Cash deposit into bank account',
    };

    await db.transfers.add(transfer);
    await this.logAuditEvent('CASH_DEPOSIT', 'bank', bankId, `Cash Deposit ₹${amount} from ${cash.name} to ${bank.name}`);
    return { cash: updatedCash, bank: updatedBank, transfer };
  }

  /**
   * Bank to Wallet Transfer (Atomic Transaction)
   */
  async transferBankToWallet(
    bankId: string,
    walletId: string,
    amount: number,
    notes?: string
  ): Promise<{ bank: BankAccount; wallet: DigitalWallet; transfer: InternalTransferRecord }> {
    if (amount <= 0) throw new Error('Transfer amount must be greater than zero');

    const bank = await db.bankAccounts.get(bankId);
    const wallet = await db.wallets.get(walletId);
    if (!bank || bank.status === 'archived' || bank.status === 'closed') {
      throw new Error('Active source bank account not found');
    }
    if (!wallet || wallet.status === 'archived' || wallet.status === 'closed') {
      throw new Error('Active destination wallet not found');
    }

    // Overdraft rules check
    const bankBalance = Number(bank.balance || 0);
    const bankOverdraftLimit = Number(bank.overdraftLimit || 0);
    if (bank.accountType === 'overdraft') {
      if (bankBalance - amount < -bankOverdraftLimit) {
        throw new Error(
          `Transfer exceeds overdraft limit. Available limit: ₹${(bankBalance + bankOverdraftLimit).toLocaleString('en-IN')}`
        );
      }
    } else {
      if (bankBalance - amount < 0) {
        throw new Error(
          `Insufficient funds in ${bank.name}. Available balance: ₹${bankBalance.toLocaleString('en-IN')}`
        );
      }
    }

    const now = new Date().toISOString();
    const bankNewBalance = Math.round((bankBalance - amount) * 100) / 100;
    const walletPrevBalance = Number(wallet.balance || 0);
    const walletNewBalance = Math.round((walletPrevBalance + amount) * 100) / 100;

    const transfer: InternalTransferRecord = {
      id: generateId('trf'),
      fromEntityType: 'bank',
      fromEntityId: bankId,
      fromEntityName: bank.name,
      toEntityType: 'wallet',
      toEntityId: walletId,
      toEntityName: wallet.displayName || wallet.name,
      amount,
      timestamp: now,
      transferType: 'bank_to_wallet',
      notes: notes || 'Wallet topup from bank',
    };

    const walletTx: WalletTransaction = {
      id: generateId('wtx'),
      walletId,
      type: 'TRANSFER',
      amount,
      direction: 'in',
      previousBalance: walletPrevBalance,
      newBalance: walletNewBalance,
      reason: notes || `Loaded from ${bank.name}`,
      date: now.split('T')[0],
      createdAt: now,
      metadata: { fromBankId: bankId, fromBankName: bank.name },
    };

    const bankHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'bank',
      entityId: bankId,
      entityName: bank.name,
      previousBalance: bankBalance,
      newBalance: bankNewBalance,
      changeAmount: -amount,
      timestamp: now,
      notes: notes || `Transfer to wallet ${wallet.displayName || wallet.name}`,
    };

    const walletHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'wallet',
      entityId: walletId,
      entityName: wallet.displayName || wallet.name,
      previousBalance: walletPrevBalance,
      newBalance: walletNewBalance,
      changeAmount: amount,
      timestamp: now,
      notes: notes || `Transfer from bank ${bank.name}`,
    };

    const updatedBank: BankAccount = {
      ...bank,
      balance: bankNewBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    const updatedWallet: DigitalWallet = {
      ...wallet,
      balance: walletNewBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    // Atomic transaction execution
    await db.transaction(
      'rw',
      [db.bankAccounts, db.wallets, db.transfers, db.balanceHistory, db.walletTransactions, db.auditEvents],
      async () => {
        await db.bankAccounts.put(updatedBank);
        await db.wallets.put(updatedWallet);
        await db.transfers.add(transfer);
        await db.walletTransactions.add(walletTx);
        await db.balanceHistory.bulkAdd([bankHist, walletHist]);
        await db.auditEvents.add({
          id: generateId('audit'),
          type: 'WALLET_TRANSFER',
          entityType: 'wallet',
          entityId: walletId,
          entityName: wallet.displayName || wallet.name,
          timestamp: now,
          metadata: {
            fromBankId: bankId,
            fromBankName: bank.name,
            amount,
            transferId: transfer.id,
            notes,
          },
        });
      }
    );

    return { bank: updatedBank, wallet: updatedWallet, transfer };
  }

  /**
   * Wallet to Bank Transfer (Atomic Transaction)
   */
  async transferWalletToBank(
    walletId: string,
    bankId: string,
    amount: number,
    notes?: string
  ): Promise<{ wallet: DigitalWallet; bank: BankAccount; transfer: InternalTransferRecord }> {
    if (amount <= 0) throw new Error('Transfer amount must be greater than zero');

    const wallet = await db.wallets.get(walletId);
    const bank = await db.bankAccounts.get(bankId);
    if (!wallet || wallet.status === 'archived' || wallet.status === 'closed') {
      throw new Error('Active source digital wallet not found');
    }
    if (!bank || bank.status === 'archived' || bank.status === 'closed') {
      throw new Error('Active destination bank account not found');
    }

    const walletBalance = Number(wallet.balance || 0);
    if (!wallet.allowNegativeBalance && walletBalance - amount < 0) {
      throw new Error(
        `Wallet does not allow negative balance. Current balance: ₹${walletBalance.toLocaleString('en-IN')}`
      );
    }

    const now = new Date().toISOString();
    const walletNewBalance = Math.round((walletBalance - amount) * 100) / 100;
    const bankPrevBalance = Number(bank.balance || 0);
    const bankNewBalance = Math.round((bankPrevBalance + amount) * 100) / 100;

    const transfer: InternalTransferRecord = {
      id: generateId('trf'),
      fromEntityType: 'wallet',
      fromEntityId: walletId,
      fromEntityName: wallet.displayName || wallet.name,
      toEntityType: 'bank',
      toEntityId: bankId,
      toEntityName: bank.name,
      amount,
      timestamp: now,
      transferType: 'wallet_to_bank',
      notes: notes || 'Wallet withdrawal to bank account',
    };

    const walletTx: WalletTransaction = {
      id: generateId('wtx'),
      walletId,
      type: 'TRANSFER',
      amount,
      direction: 'out',
      previousBalance: walletBalance,
      newBalance: walletNewBalance,
      reason: notes || `Transfer to ${bank.name}`,
      date: now.split('T')[0],
      createdAt: now,
      metadata: { toBankId: bankId, toBankName: bank.name },
    };

    const walletHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'wallet',
      entityId: walletId,
      entityName: wallet.displayName || wallet.name,
      previousBalance: walletBalance,
      newBalance: walletNewBalance,
      changeAmount: -amount,
      timestamp: now,
      notes: notes || `Transfer to bank ${bank.name}`,
    };

    const bankHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'bank',
      entityId: bankId,
      entityName: bank.name,
      previousBalance: bankPrevBalance,
      newBalance: bankNewBalance,
      changeAmount: amount,
      timestamp: now,
      notes: notes || `Transfer from wallet ${wallet.displayName || wallet.name}`,
    };

    const updatedWallet: DigitalWallet = {
      ...wallet,
      balance: walletNewBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    const updatedBank: BankAccount = {
      ...bank,
      balance: bankNewBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    // Atomic transaction execution
    await db.transaction(
      'rw',
      [db.wallets, db.bankAccounts, db.transfers, db.balanceHistory, db.walletTransactions, db.auditEvents],
      async () => {
        await db.wallets.put(updatedWallet);
        await db.bankAccounts.put(updatedBank);
        await db.transfers.add(transfer);
        await db.walletTransactions.add(walletTx);
        await db.balanceHistory.bulkAdd([walletHist, bankHist]);
        await db.auditEvents.add({
          id: generateId('audit'),
          type: 'WALLET_TRANSFER',
          entityType: 'wallet',
          entityId: walletId,
          entityName: wallet.displayName || wallet.name,
          timestamp: now,
          metadata: {
            toBankId: bankId,
            toBankName: bank.name,
            amount,
            transferId: transfer.id,
            notes,
          },
        });
      }
    );

    return { wallet: updatedWallet, bank: updatedBank, transfer };
  }

  /**
   * Wallet to Wallet Transfer (Atomic Transaction)
   */
  async transferWalletToWallet(
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    notes?: string
  ): Promise<{ from: DigitalWallet; to: DigitalWallet; transfer: InternalTransferRecord }> {
    if (amount <= 0) throw new Error('Transfer amount must be greater than zero');
    if (fromWalletId === toWalletId) throw new Error('Source and destination wallets must be different');

    const from = await db.wallets.get(fromWalletId);
    const to = await db.wallets.get(toWalletId);
    if (!from || from.status === 'archived' || from.status === 'closed') {
      throw new Error('Active source digital wallet not found');
    }
    if (!to || to.status === 'archived' || to.status === 'closed') {
      throw new Error('Active destination digital wallet not found');
    }

    const fromBalance = Number(from.balance || 0);
    if (!from.allowNegativeBalance && fromBalance - amount < 0) {
      throw new Error(
        `Source wallet does not allow negative balance. Current balance: ₹${fromBalance.toLocaleString('en-IN')}`
      );
    }

    const now = new Date().toISOString();
    const fromNewBalance = Math.round((fromBalance - amount) * 100) / 100;
    const toPrevBalance = Number(to.balance || 0);
    const toNewBalance = Math.round((toPrevBalance + amount) * 100) / 100;

    const transfer: InternalTransferRecord = {
      id: generateId('trf'),
      fromEntityType: 'wallet',
      fromEntityId: fromWalletId,
      fromEntityName: from.displayName || from.name,
      toEntityType: 'wallet',
      toEntityId: toWalletId,
      toEntityName: to.displayName || to.name,
      amount,
      timestamp: now,
      transferType: 'wallet_to_wallet',
      notes: notes || 'Peer wallet transfer',
    };

    const fromTx: WalletTransaction = {
      id: generateId('wtx'),
      walletId: fromWalletId,
      type: 'TRANSFER',
      amount,
      direction: 'out',
      previousBalance: fromBalance,
      newBalance: fromNewBalance,
      reason: notes || `Transfer to ${to.displayName || to.name}`,
      date: now.split('T')[0],
      createdAt: now,
      metadata: { toWalletId, toWalletName: to.displayName || to.name },
    };

    const toTx: WalletTransaction = {
      id: generateId('wtx'),
      walletId: toWalletId,
      type: 'TRANSFER',
      amount,
      direction: 'in',
      previousBalance: toPrevBalance,
      newBalance: toNewBalance,
      reason: notes || `Transfer from ${from.displayName || from.name}`,
      date: now.split('T')[0],
      createdAt: now,
      metadata: { fromWalletId, fromWalletName: from.displayName || from.name },
    };

    const fromHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'wallet',
      entityId: fromWalletId,
      entityName: from.displayName || from.name,
      previousBalance: fromBalance,
      newBalance: fromNewBalance,
      changeAmount: -amount,
      timestamp: now,
      notes: notes || `Transfer to ${to.displayName || to.name}`,
    };

    const toHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'wallet',
      entityId: toWalletId,
      entityName: to.displayName || to.name,
      previousBalance: toPrevBalance,
      newBalance: toNewBalance,
      changeAmount: amount,
      timestamp: now,
      notes: notes || `Transfer from ${from.displayName || from.name}`,
    };

    const updatedFrom: DigitalWallet = {
      ...from,
      balance: fromNewBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    const updatedTo: DigitalWallet = {
      ...to,
      balance: toNewBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    // Atomic transaction execution
    await db.transaction(
      'rw',
      [db.wallets, db.transfers, db.balanceHistory, db.walletTransactions, db.auditEvents],
      async () => {
        await db.wallets.put(updatedFrom);
        await db.wallets.put(updatedTo);
        await db.transfers.add(transfer);
        await db.walletTransactions.bulkAdd([fromTx, toTx]);
        await db.balanceHistory.bulkAdd([fromHist, toHist]);
        await db.auditEvents.add({
          id: generateId('audit'),
          type: 'WALLET_TRANSFER',
          entityType: 'wallet',
          entityId: fromWalletId,
          entityName: from.displayName || from.name,
          timestamp: now,
          metadata: {
            toWalletId,
            toWalletName: to.displayName || to.name,
            amount,
            transferId: transfer.id,
            notes,
          },
        });
      }
    );

    return { from: updatedFrom, to: updatedTo, transfer };
  }

  /**
   * Cash to Wallet Transfer (Atomic Transaction)
   */
  async transferCashToWallet(
    cashId: string,
    walletId: string,
    amount: number,
    notes?: string
  ): Promise<{ cash: CashHoldingAccount; wallet: DigitalWallet; transfer: InternalTransferRecord }> {
    if (amount <= 0) throw new Error('Transfer amount must be greater than zero');

    const cash = await db.cashHoldings.get(cashId);
    const wallet = await db.wallets.get(walletId);
    if (!cash || cash.status === 'archived' || cash.status === 'closed') {
      throw new Error('Active source cash vault not found');
    }
    if (!wallet || wallet.status === 'archived' || wallet.status === 'closed') {
      throw new Error('Active destination digital wallet not found');
    }

    const cashBalance = Number(cash.balance || 0);
    if (cashBalance - amount < 0) {
      throw new Error(
        `Insufficient cash in vault ${cash.name}. Available cash: ₹${cashBalance.toLocaleString('en-IN')}`
      );
    }

    const now = new Date().toISOString();
    const cashNewBalance = Math.round((cashBalance - amount) * 100) / 100;
    const walletPrevBalance = Number(wallet.balance || 0);
    const walletNewBalance = Math.round((walletPrevBalance + amount) * 100) / 100;

    const transfer: InternalTransferRecord = {
      id: generateId('trf'),
      fromEntityType: 'cash',
      fromEntityId: cashId,
      fromEntityName: cash.name,
      toEntityType: 'wallet',
      toEntityId: walletId,
      toEntityName: wallet.displayName || wallet.name,
      amount,
      timestamp: now,
      transferType: 'cash_to_wallet',
      notes: notes || 'Cash deposit into digital wallet',
    };

    const walletTx: WalletTransaction = {
      id: generateId('wtx'),
      walletId,
      type: 'TRANSFER',
      amount,
      direction: 'in',
      previousBalance: walletPrevBalance,
      newBalance: walletNewBalance,
      reason: notes || `Deposit from ${cash.name}`,
      date: now.split('T')[0],
      createdAt: now,
      metadata: { fromCashId: cashId, fromCashName: cash.name },
    };

    const cashHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'cash',
      entityId: cashId,
      entityName: cash.name,
      previousBalance: cashBalance,
      newBalance: cashNewBalance,
      changeAmount: -amount,
      timestamp: now,
      notes: notes || `Transfer to digital wallet ${wallet.displayName || wallet.name}`,
    };

    const walletHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'wallet',
      entityId: walletId,
      entityName: wallet.displayName || wallet.name,
      previousBalance: walletPrevBalance,
      newBalance: walletNewBalance,
      changeAmount: amount,
      timestamp: now,
      notes: notes || `Cash deposit from ${cash.name}`,
    };

    const updatedCash: CashHoldingAccount = {
      ...cash,
      balance: cashNewBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    const updatedWallet: DigitalWallet = {
      ...wallet,
      balance: walletNewBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    // Atomic transaction execution
    await db.transaction(
      'rw',
      [db.cashHoldings, db.wallets, db.transfers, db.balanceHistory, db.walletTransactions, db.auditEvents],
      async () => {
        await db.cashHoldings.put(updatedCash);
        await db.wallets.put(updatedWallet);
        await db.transfers.add(transfer);
        await db.walletTransactions.add(walletTx);
        await db.balanceHistory.bulkAdd([cashHist, walletHist]);
        await db.auditEvents.add({
          id: generateId('audit'),
          type: 'WALLET_TRANSFER',
          entityType: 'wallet',
          entityId: walletId,
          entityName: wallet.displayName || wallet.name,
          timestamp: now,
          metadata: {
            fromCashId: cashId,
            fromCashName: cash.name,
            amount,
            transferId: transfer.id,
            notes,
          },
        });
      }
    );

    return { cash: updatedCash, wallet: updatedWallet, transfer };
  }

  /**
   * Wallet to Cash Withdrawal (Atomic Transaction)
   */
  async transferWalletToCash(
    walletId: string,
    cashId: string,
    amount: number,
    notes?: string
  ): Promise<{ wallet: DigitalWallet; cash: CashHoldingAccount; transfer: InternalTransferRecord }> {
    if (amount <= 0) throw new Error('Withdrawal amount must be greater than zero');

    const wallet = await db.wallets.get(walletId);
    const cash = await db.cashHoldings.get(cashId);
    if (!wallet || wallet.status === 'archived' || wallet.status === 'closed') {
      throw new Error('Active source digital wallet not found');
    }
    if (!cash || cash.status === 'archived' || cash.status === 'closed') {
      throw new Error('Active destination cash vault not found');
    }

    const walletBalance = Number(wallet.balance || 0);
    if (!wallet.allowNegativeBalance && walletBalance - amount < 0) {
      throw new Error(
        `Wallet does not allow negative balance. Current balance: ₹${walletBalance.toLocaleString('en-IN')}`
      );
    }

    const now = new Date().toISOString();
    const walletNewBalance = Math.round((walletBalance - amount) * 100) / 100;
    const cashPrevBalance = Number(cash.balance || 0);
    const cashNewBalance = Math.round((cashPrevBalance + amount) * 100) / 100;

    const transfer: InternalTransferRecord = {
      id: generateId('trf'),
      fromEntityType: 'wallet',
      fromEntityId: walletId,
      fromEntityName: wallet.displayName || wallet.name,
      toEntityType: 'cash',
      toEntityId: cashId,
      toEntityName: cash.name,
      amount,
      timestamp: now,
      transferType: 'wallet_to_cash',
      notes: notes || 'Wallet cash redemption',
    };

    const walletTx: WalletTransaction = {
      id: generateId('wtx'),
      walletId,
      type: 'TRANSFER',
      amount,
      direction: 'out',
      previousBalance: walletBalance,
      newBalance: walletNewBalance,
      reason: notes || `Redemption to ${cash.name}`,
      date: now.split('T')[0],
      createdAt: now,
      metadata: { toCashId: cashId, toCashName: cash.name },
    };

    const walletHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'wallet',
      entityId: walletId,
      entityName: wallet.displayName || wallet.name,
      previousBalance: walletBalance,
      newBalance: walletNewBalance,
      changeAmount: -amount,
      timestamp: now,
      notes: notes || `Cash withdrawal to ${cash.name}`,
    };

    const cashHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'cash',
      entityId: cashId,
      entityName: cash.name,
      previousBalance: cashPrevBalance,
      newBalance: cashNewBalance,
      changeAmount: amount,
      timestamp: now,
      notes: notes || `Cash redemption from ${wallet.displayName || wallet.name}`,
    };

    const updatedWallet: DigitalWallet = {
      ...wallet,
      balance: walletNewBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    const updatedCash: CashHoldingAccount = {
      ...cash,
      balance: cashNewBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    // Atomic transaction execution
    await db.transaction(
      'rw',
      [db.wallets, db.cashHoldings, db.transfers, db.balanceHistory, db.walletTransactions, db.auditEvents],
      async () => {
        await db.wallets.put(updatedWallet);
        await db.cashHoldings.put(updatedCash);
        await db.transfers.add(transfer);
        await db.walletTransactions.add(walletTx);
        await db.balanceHistory.bulkAdd([walletHist, cashHist]);
        await db.auditEvents.add({
          id: generateId('audit'),
          type: 'WALLET_TRANSFER',
          entityType: 'wallet',
          entityId: walletId,
          entityName: wallet.displayName || wallet.name,
          timestamp: now,
          metadata: {
            toCashId: cashId,
            toCashName: cash.name,
            amount,
            transferId: transfer.id,
            notes,
          },
        });
      }
    );

    return { wallet: updatedWallet, cash: updatedCash, transfer };
  }

  // ==================== CASH HOLDINGS ====================

  async getAllCashHoldings(): Promise<CashHoldingAccount[]> {
    return await db.cashHoldings.toArray();
  }

  async createCashHolding(data: Omit<CashHoldingAccount, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>): Promise<CashHoldingAccount> {
    const now = new Date().toISOString();
    const cash: CashHoldingAccount = {
      ...data,
      id: generateId('cash'),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
    };
    await db.cashHoldings.add(cash);
    await this.logAuditEvent('ACCOUNT_CREATED', 'cash', cash.id, cash.name);
    return cash;
  }

  async updateCashHolding(id: string, updates: Partial<CashHoldingAccount>): Promise<CashHoldingAccount> {
    const existing = await db.cashHoldings.get(id);
    if (!existing) throw new Error(`Cash holding with ID ${id} not found`);

    const now = new Date().toISOString();
    const updated: CashHoldingAccount = {
      ...existing,
      ...updates,
      updatedAt: now,
      lastUpdated: now,
    };

    if (updates.balance !== undefined && updates.balance !== existing.balance) {
      await this.recordBalanceChange('cash', id, existing.name, existing.balance, updates.balance);
    }

    await db.cashHoldings.put(updated);
    await this.logAuditEvent('ACCOUNT_UPDATED', 'cash', id, updated.name, updates);
    return updated;
  }

  async updateCashDenominations(id: string, denominations: CashDenomination[]): Promise<CashHoldingAccount> {
    const normalizedDenominations: CashDenomination[] = denominations.map((d) => {
      const explicitVariantsTotal = Number(d.oldCount || 0) + Number(d.newCount || 0);
      const count = Math.max(
        0,
        Number(d.count !== undefined ? d.count : explicitVariantsTotal)
      );
      const oldCount = Math.max(0, Number(d.oldCount || 0));
      const newCount = Math.max(
        0,
        Number(d.newCount !== undefined && d.newCount > 0 ? d.newCount : Math.max(0, count - oldCount))
      );
      return {
        ...d,
        count,
        oldCount,
        newCount,
      };
    });

    const totalBalance = normalizedDenominations.reduce(
      (sum, d) => sum + Number(d.denomination) * Number(d.count),
      0
    );

    let targetId = id;
    let existing = id ? await db.cashHoldings.get(id) : undefined;
    if (!existing) {
      const allHoldings = await db.cashHoldings.toArray();
      existing = allHoldings.find((c) => c.status === 'active') || allHoldings[0];
      if (existing) {
        targetId = existing.id;
      }
    }

    if (!existing) {
      return await this.createCashHolding({
        name: 'Home Locker Cash',
        displayName: 'Home Locker Cash',
        category: 'cash',
        balance: totalBalance,
        currency: 'INR',
        status: 'active',
        location: 'Primary Locker Vault',
        denominations: normalizedDenominations,
      });
    }

    return await this.updateCashHolding(targetId, {
      denominations: normalizedDenominations,
      balance: totalBalance,
    });
  }

  async transferCashBetweenVaults(
    fromId: string,
    toId: string,
    amount: number,
    notes?: string
  ): Promise<{ from: CashHoldingAccount; to: CashHoldingAccount }> {
    const from = await db.cashHoldings.get(fromId);
    const to = await db.cashHoldings.get(toId);
    if (!from || !to) throw new Error('One or both cash vaults not found');

    const updatedFrom = await this.updateCashHolding(fromId, {
      balance: Number(from.balance || 0) - amount,
      notes: notes ? `${from.notes || ''} | Transferred ₹${amount} to ${to.name}` : from.notes,
    });

    const updatedTo = await this.updateCashHolding(toId, {
      balance: Number(to.balance || 0) + amount,
      notes: notes ? `${to.notes || ''} | Received ₹${amount} from ${from.name}` : to.notes,
    });

    await this.logAuditEvent('CASH_TRANSFERRED', 'cash', fromId, `Transferred ₹${amount} from ${from.name} to ${to.name}`);
    return { from: updatedFrom, to: updatedTo };
  }

  async archiveCashHolding(id: string): Promise<void> {
    const existing = await db.cashHoldings.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.cashHoldings.update(id, { status: 'archived', archivedAt: now, updatedAt: now });
    await this.logAuditEvent('ACCOUNT_ARCHIVED', 'cash', id, existing.name);
  }

  async restoreCashHolding(id: string): Promise<void> {
    const existing = await db.cashHoldings.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.cashHoldings.update(id, { status: 'active', archivedAt: undefined, updatedAt: now });
    await this.logAuditEvent('ACCOUNT_RESTORED', 'cash', id, existing.name);
  }

  async deleteCashHolding(id: string): Promise<void> {
    const existing = await db.cashHoldings.get(id);
    await db.cashHoldings.delete(id);
    if (existing) {
      await this.logAuditEvent('ACCOUNT_DELETED', 'cash', id, existing.name);
    }
  }

  // ==================== WALLETS ====================

  async getAllWallets(): Promise<DigitalWallet[]> {
    return await db.wallets.toArray();
  }

  async getWallets(): Promise<DigitalWallet[]> {
    return await db.wallets.toArray();
  }

  async getWallet(id: string): Promise<DigitalWallet | undefined> {
    return await db.wallets.get(id);
  }

  async createWallet(data: Omit<DigitalWallet, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>): Promise<DigitalWallet> {
    const now = new Date().toISOString();
    const wallet: DigitalWallet = {
      ...data,
      id: generateId('wallet'),
      status: 'active',
      includeInNetWorth: data.includeInNetWorth !== undefined ? data.includeInNetWorth : true,
      allowNegativeBalance: data.allowNegativeBalance !== undefined ? data.allowNegativeBalance : false,
      walletType: data.walletType || 'DIGITAL_WALLET',
      owner: data.owner || 'SELF',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
    };
    await db.wallets.add(wallet);
    await this.logAuditEvent('WALLET_CREATED', 'wallet', wallet.id, wallet.name);

    if (data.balance !== 0) {
      await this.recordBalanceChange('wallet', wallet.id, wallet.name, 0, data.balance, 'Initial opening balance');
      await this.createWalletTransaction({
        walletId: wallet.id,
        type: 'OPENING_BALANCE',
        amount: Math.abs(data.balance),
        direction: data.balance >= 0 ? 'in' : 'out',
        previousBalance: 0,
        newBalance: data.balance,
        reason: 'Initial opening balance',
        date: now.split('T')[0],
      });
    }

    return wallet;
  }

  async updateWallet(id: string, updates: Partial<DigitalWallet>): Promise<DigitalWallet> {
    const existing = await db.wallets.get(id);
    if (!existing) throw new Error(`Wallet with ID ${id} not found`);

    const now = new Date().toISOString();
    const updated: DigitalWallet = {
      ...existing,
      ...updates,
      updatedAt: now,
      lastUpdated: now,
    };

    if (updates.balance !== undefined && updates.balance !== existing.balance) {
      await this.recordBalanceChange('wallet', id, existing.name, existing.balance, updates.balance);
    }

    await db.wallets.put(updated);
    await this.logAuditEvent('WALLET_UPDATED', 'wallet', id, updated.name, updates);
    return updated;
  }

  async updateWalletBalance(
    id: string,
    newBalance: number,
    reason?: string,
    metadata?: Record<string, unknown>
  ): Promise<DigitalWallet> {
    const existing = await db.wallets.get(id);
    if (!existing) throw new Error(`Wallet with ID ${id} not found`);

    const previousBalance = existing.balance;
    const delta = newBalance - previousBalance;
    const now = new Date().toISOString();
    const updated: DigitalWallet = {
      ...existing,
      balance: newBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    await db.wallets.put(updated);
    await this.recordBalanceChange('wallet', id, existing.name, previousBalance, newBalance, reason || 'Manual balance adjustment');
    
    if (delta !== 0) {
      await this.createWalletTransaction({
        walletId: id,
        type: 'BALANCE_ADJUSTMENT',
        amount: Math.abs(delta),
        direction: delta >= 0 ? 'in' : 'out',
        previousBalance,
        newBalance,
        reason: reason || 'Balance correction',
        date: now.split('T')[0],
        metadata,
      });
    }

    await this.logAuditEvent('WALLET_BALANCE_UPDATED', 'wallet', id, `Updated balance of ${existing.name} to ₹${newBalance}`, {
      previousBalance,
      newBalance,
      delta,
      reason,
      metadata,
    });
    return updated;
  }

  async addCashbackCredit(
    id: string,
    amount: number,
    reason?: string
  ): Promise<DigitalWallet> {
    if (amount <= 0) throw new Error('Cashback amount must be greater than zero');
    const existing = await db.wallets.get(id);
    if (!existing) throw new Error(`Wallet with ID ${id} not found`);

    const previousBalance = Number(existing.balance || 0);
    const newBalance = previousBalance + amount;
    const now = new Date().toISOString();
    const updated: DigitalWallet = {
      ...existing,
      balance: newBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    await db.wallets.put(updated);
    await this.recordBalanceChange('wallet', id, existing.name, previousBalance, newBalance, `Cashback Added: ${reason || 'Reward credit'}`);
    await this.createWalletTransaction({
      walletId: id,
      type: 'CASHBACK',
      amount,
      direction: 'in',
      previousBalance,
      newBalance,
      reason: reason || 'Cashback reward credit',
      date: now.split('T')[0],
    });
    await this.logAuditEvent('CASHBACK_CREDIT', 'wallet', id, `Added ₹${amount} cashback to ${existing.name}`, {
      amount,
      previousBalance,
      newBalance,
      reason,
    });
    return updated;
  }

  async recordWalletSpend(
    id: string,
    amount: number,
    reason?: string
  ): Promise<DigitalWallet> {
    if (amount <= 0) throw new Error('Spend amount must be greater than zero');
    const existing = await db.wallets.get(id);
    if (!existing) throw new Error(`Wallet with ID ${id} not found`);

    const previousBalance = Number(existing.balance || 0);
    const newBalance = previousBalance - amount;
    const now = new Date().toISOString();
    const updated: DigitalWallet = {
      ...existing,
      balance: newBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    await db.wallets.put(updated);
    await this.recordBalanceChange('wallet', id, existing.name, previousBalance, newBalance, `Wallet Spend: ${reason || 'Purchase / Redemption'}`);
    await this.createWalletTransaction({
      walletId: id,
      type: 'SPEND',
      amount,
      direction: 'out',
      previousBalance,
      newBalance,
      reason: reason || 'Wallet payment / spend',
      date: now.split('T')[0],
    });
    await this.logAuditEvent('WALLET_REDEMPTION', 'wallet', id, `Spent ₹${amount} from ${existing.name}`, {
      amount,
      previousBalance,
      newBalance,
      reason,
    });
    return updated;
  }

  /**
   * Step 5D: Record Cashback Earned (Atomic Transaction)
   * Credits cashback amount to wallet balance and records history, transaction, and audit event.
   */
  async recordCashbackEarned(
    walletId: string,
    amount: number,
    source: CashbackSource | string = 'Other',
    date?: string,
    description?: string
  ): Promise<{ wallet: DigitalWallet; transaction: WalletTransaction }> {
    if (amount <= 0) throw new Error('Cashback earned amount must be greater than zero');
    const existing = await db.wallets.get(walletId);
    if (!existing || existing.status === 'archived' || existing.status === 'closed') {
      throw new Error('Active digital wallet or cashback account not found');
    }

    const previousBalance = Number(existing.balance || 0);
    const newBalance = Math.round((previousBalance + amount) * 100) / 100;
    const now = new Date().toISOString();
    const txDate = date || now.split('T')[0];
    const reasonText = description || `Cashback from ${source}`;

    const updatedWallet: DigitalWallet = {
      ...existing,
      balance: newBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    const transaction: WalletTransaction = {
      id: generateId('wtx'),
      walletId,
      type: 'CASHBACK_EARNED',
      amount,
      direction: 'in',
      previousBalance,
      newBalance,
      reason: reasonText,
      source,
      date: txDate,
      createdAt: now,
      metadata: { source, description },
    };

    const balanceHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'wallet',
      entityId: walletId,
      entityName: existing.displayName || existing.name,
      previousBalance,
      newBalance,
      changeAmount: amount,
      timestamp: now,
      notes: reasonText,
    };

    await db.transaction('rw', [db.wallets, db.walletTransactions, db.balanceHistory, db.auditEvents], async () => {
      await db.wallets.put(updatedWallet);
      await db.walletTransactions.add(transaction);
      await db.balanceHistory.add(balanceHist);
      await db.auditEvents.add({
        id: generateId('audit'),
        type: 'CASHBACK_EARNED',
        entityType: 'wallet',
        entityId: walletId,
        entityName: existing.displayName || existing.name,
        timestamp: now,
        metadata: {
          amount,
          source,
          description,
          previousBalance,
          newBalance,
        },
      });
    });

    return { wallet: updatedWallet, transaction };
  }

  /**
   * Step 5D: Record Cashback Used (Atomic Transaction)
   * Debits cashback amount from wallet balance with overdraft/negative balance validation.
   */
  async recordCashbackUsed(
    walletId: string,
    amount: number,
    source: CashbackSource | string = 'Shopping',
    date?: string,
    description?: string
  ): Promise<{ wallet: DigitalWallet; transaction: WalletTransaction }> {
    if (amount <= 0) throw new Error('Cashback used amount must be greater than zero');
    const existing = await db.wallets.get(walletId);
    if (!existing || existing.status === 'archived' || existing.status === 'closed') {
      throw new Error('Active digital wallet or cashback account not found');
    }

    const previousBalance = Number(existing.balance || 0);
    if (!existing.allowNegativeBalance && previousBalance - amount < 0) {
      throw new Error(
        `Insufficient cashback balance. Available: ₹${previousBalance.toLocaleString('en-IN')}, requested: ₹${amount.toLocaleString('en-IN')}`
      );
    }

    const newBalance = Math.round((previousBalance - amount) * 100) / 100;
    const now = new Date().toISOString();
    const txDate = date || now.split('T')[0];
    const reasonText = description || `Cashback used for ${source}`;

    const updatedWallet: DigitalWallet = {
      ...existing,
      balance: newBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    const transaction: WalletTransaction = {
      id: generateId('wtx'),
      walletId,
      type: 'CASHBACK_USED',
      amount,
      direction: 'out',
      previousBalance,
      newBalance,
      reason: reasonText,
      source,
      date: txDate,
      createdAt: now,
      metadata: { source, description },
    };

    const balanceHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'wallet',
      entityId: walletId,
      entityName: existing.displayName || existing.name,
      previousBalance,
      newBalance,
      changeAmount: -amount,
      timestamp: now,
      notes: reasonText,
    };

    await db.transaction('rw', [db.wallets, db.walletTransactions, db.balanceHistory, db.auditEvents], async () => {
      await db.wallets.put(updatedWallet);
      await db.walletTransactions.add(transaction);
      await db.balanceHistory.add(balanceHist);
      await db.auditEvents.add({
        id: generateId('audit'),
        type: 'CASHBACK_USED',
        entityType: 'wallet',
        entityId: walletId,
        entityName: existing.displayName || existing.name,
        timestamp: now,
        metadata: {
          amount,
          source,
          description,
          previousBalance,
          newBalance,
        },
      });
    });

    return { wallet: updatedWallet, transaction };
  }

  /**
   * Step 5D: Record Cashback Adjustment (Atomic Transaction)
   */
  async recordCashbackAdjustment(
    walletId: string,
    newBalance: number,
    source: CashbackSource | string = 'Other',
    date?: string,
    description?: string
  ): Promise<{ wallet: DigitalWallet; transaction: WalletTransaction }> {
    const existing = await db.wallets.get(walletId);
    if (!existing || existing.status === 'archived' || existing.status === 'closed') {
      throw new Error('Active digital wallet or cashback account not found');
    }

    const previousBalance = Number(existing.balance || 0);
    const delta = Math.round((newBalance - previousBalance) * 100) / 100;
    const now = new Date().toISOString();
    const txDate = date || now.split('T')[0];
    const reasonText = description || `Cashback adjustment (${delta >= 0 ? '+' : ''}₹${delta})`;

    const updatedWallet: DigitalWallet = {
      ...existing,
      balance: newBalance,
      updatedAt: now,
      lastUpdated: now,
    };

    const transaction: WalletTransaction = {
      id: generateId('wtx'),
      walletId,
      type: 'CASHBACK_ADJUSTMENT',
      amount: Math.abs(delta),
      direction: delta >= 0 ? 'in' : 'out',
      previousBalance,
      newBalance,
      reason: reasonText,
      source,
      date: txDate,
      createdAt: now,
      metadata: { source, description, delta },
    };

    const balanceHist: BalanceHistoryRecord = {
      id: generateId('hist'),
      entityType: 'wallet',
      entityId: walletId,
      entityName: existing.displayName || existing.name,
      previousBalance,
      newBalance,
      changeAmount: delta,
      timestamp: now,
      notes: reasonText,
    };

    await db.transaction('rw', [db.wallets, db.walletTransactions, db.balanceHistory, db.auditEvents], async () => {
      await db.wallets.put(updatedWallet);
      await db.walletTransactions.add(transaction);
      await db.balanceHistory.add(balanceHist);
      await db.auditEvents.add({
        id: generateId('audit'),
        type: 'CASHBACK_ADJUSTMENT',
        entityType: 'wallet',
        entityId: walletId,
        entityName: existing.displayName || existing.name,
        timestamp: now,
        metadata: {
          previousBalance,
          newBalance,
          delta,
          source,
          description,
        },
      });
    });

    return { wallet: updatedWallet, transaction };
  }

  async archiveWallet(
    id: string,
    closureDate?: string,
    finalBalance?: number,
    closureNote?: string
  ): Promise<DigitalWallet> {
    const existing = await db.wallets.get(id);
    if (!existing) throw new Error(`Wallet with ID ${id} not found`);

    const now = new Date().toISOString();
    const bal = finalBalance !== undefined ? finalBalance : existing.balance;

    if (finalBalance !== undefined && finalBalance !== existing.balance) {
      await this.recordBalanceChange('wallet', id, existing.name, existing.balance, finalBalance, 'Settled on wallet closure');
    }

    const updated: DigitalWallet = {
      ...existing,
      balance: bal,
      status: 'archived',
      archivedAt: now,
      closureDate: closureDate || now.split('T')[0],
      closureNote: closureNote || 'Wallet archived',
      updatedAt: now,
      lastUpdated: now,
    };

    await db.wallets.put(updated);
    await this.logAuditEvent('WALLET_ARCHIVED', 'wallet', id, `Archived wallet ${existing.name}`);
    return updated;
  }

  async restoreWallet(id: string): Promise<DigitalWallet> {
    const existing = await db.wallets.get(id);
    if (!existing) throw new Error(`Wallet with ID ${id} not found`);

    const now = new Date().toISOString();
    const updated: DigitalWallet = {
      ...existing,
      status: 'active',
      archivedAt: undefined,
      closureDate: undefined,
      closureNote: undefined,
      updatedAt: now,
      lastUpdated: now,
    };

    await db.wallets.put(updated);
    await this.logAuditEvent('WALLET_RESTORED', 'wallet', id, `Restored wallet ${existing.name}`);
    return updated;
  }

  async deleteWallet(id: string): Promise<void> {
    const existing = await db.wallets.get(id);
    if (!existing) return;
    await db.wallets.delete(id);
    await this.logAuditEvent('WALLET_ARCHIVED', 'wallet', id, `Deleted wallet ${existing.name}`);
  }

  async getWalletTransactions(walletId?: string): Promise<WalletTransaction[]> {
    if (walletId) {
      return await db.walletTransactions
        .where('walletId')
        .equals(walletId)
        .reverse()
        .sortBy('createdAt');
    }
    return await db.walletTransactions.reverse().sortBy('createdAt');
  }

  async createWalletTransaction(
    data: Omit<WalletTransaction, 'id' | 'createdAt'>
  ): Promise<WalletTransaction> {
    const now = new Date().toISOString();
    const transaction: WalletTransaction = {
      ...data,
      id: generateId('wtx'),
      createdAt: now,
    };
    await db.walletTransactions.add(transaction);
    return transaction;
  }

  // ==================== CREDIT CARDS (Step 6A) ====================

  async getAllCreditCards(): Promise<CreditCard[]> {
    return await db.creditCards.toArray();
  }

  async getCreditCards(filter?: {
    status?: string;
    owner?: string;
    managedBy?: string;
    creditLimitGroupId?: string;
  }): Promise<CreditCard[]> {
    let cards = await db.creditCards.toArray();

    if (filter?.status) {
      cards = cards.filter((c) => (c.status || 'active').toLowerCase() === filter.status!.toLowerCase());
    }
    if (filter?.owner) {
      cards = cards.filter((c) => (c.owner || '').toUpperCase() === filter.owner!.toUpperCase());
    }
    if (filter?.managedBy) {
      cards = cards.filter((c) => (c.managedBy || '').toUpperCase() === filter.managedBy!.toUpperCase());
    }
    if (filter?.creditLimitGroupId) {
      cards = cards.filter(
        (c) =>
          c.creditLimitGroupId === filter.creditLimitGroupId ||
          c.sharedLimitGroupId === filter.creditLimitGroupId
      );
    }
    return cards;
  }

  async getCreditCard(id: string): Promise<CreditCard | undefined> {
    return await db.creditCards.get(id);
  }

  async createCreditCard(
    data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>
  ): Promise<CreditCard> {
    const now = new Date().toISOString();
    const issuer = data.issuer || data.bankName || 'Unknown Bank';
    const rawOutstanding = data.outstanding !== undefined ? data.outstanding : (data.outstandingBalance || 0);
    const outstanding = Number(rawOutstanding);

    // Derive iPayThisCard if not explicitly provided
    let iPayThisCard = data.iPayThisCard;
    if (iPayThisCard === undefined) {
      if (data.managedBy) {
        const m = data.managedBy.toUpperCase();
        iPayThisCard = m === 'ME' || m === 'SELF';
      } else {
        const o = String(data.owner || 'SELF').toUpperCase();
        iPayThisCard = o === 'SELF';
      }
    }

    const card: CreditCard = {
      ...data,
      id: generateId('card'),
      issuer,
      bankName: issuer,
      cardName: data.cardName,
      cardType: data.cardType || 'CREDIT_CARD',
      owner: data.owner || 'SELF',
      managedBy: data.managedBy || (data.owner === 'PARENT' || data.owner === 'Parent' ? 'ME' : 'ME'),
      iPayThisCard,
      lastFourDigits: data.lastFourDigits || '',
      creditLimit: Number(data.creditLimit || 0),
      outstanding,
      outstandingBalance: outstanding,
      status: data.status || 'active',
      includeInNetWorth: data.includeInNetWorth !== undefined ? data.includeInNetWorth : true,
      statementDay: data.statementDay || data.billingCycleDate,
      billingCycleDate: data.statementDay || data.billingCycleDate || 15,
      dueDateType: data.dueDateType || 'DAYS_AFTER_STATEMENT',
      daysAfterStatement: data.daysAfterStatement !== undefined ? data.daysAfterStatement : 20,
      dueDay: data.dueDay,
      dueDate: data.dueDate || data.paymentDueDate,
      paymentDueDate: data.dueDate || data.paymentDueDate || '',
      cardNickname: data.cardNickname || data.nickname || '',
      nickname: data.cardNickname || data.nickname || '',
      maskedCardNumber: data.maskedCardNumber || (data.lastFourDigits ? `•••• •••• •••• ${data.lastFourDigits}` : ''),
      minAmountDue: data.minAmountDue !== undefined ? Number(data.minAmountDue) : (data.minimumDue !== undefined ? Number(data.minimumDue) : 0),
      minimumDue: data.minAmountDue !== undefined ? Number(data.minAmountDue) : (data.minimumDue !== undefined ? Number(data.minimumDue) : 0),
      paymentBankAccountId: data.paymentBankAccountId || '',
      paymentBankName: data.paymentBankName || '',
      autoPay: data.autoPay !== undefined ? Boolean(data.autoPay) : (data.isAutoPayEnabled !== undefined ? Boolean(data.isAutoPayEnabled) : false),
      isAutoPayEnabled: data.autoPay !== undefined ? Boolean(data.autoPay) : (data.isAutoPayEnabled !== undefined ? Boolean(data.isAutoPayEnabled) : false),
      notes: data.notes || '',
      creditLimitGroupId: data.creditLimitGroupId || data.sharedLimitGroupId,
      sharedLimitGroupId: data.creditLimitGroupId || data.sharedLimitGroupId,
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
    };

    await db.creditCards.add(card);
    await this.logAuditEvent('CREDIT_CARD_CREATED', 'credit_card', card.id, card.cardName, {
      issuer: card.issuer,
      creditLimit: card.creditLimit,
      outstanding: card.outstanding,
      owner: card.owner,
      managedBy: card.managedBy,
    });

    if (outstanding !== 0) {
      await this.recordBalanceChange(
        'credit_card',
        card.id,
        card.cardName,
        0,
        outstanding,
        'Initial credit card balance'
      );
    }

    return card;
  }

  async updateCreditCard(id: string, updates: Partial<CreditCard>): Promise<CreditCard> {
    const existing = await db.creditCards.get(id);
    if (!existing) throw new Error(`Credit card with ID ${id} not found`);

    const now = new Date().toISOString();
    const previousOutstanding = existing.outstanding !== undefined ? existing.outstanding : (existing.outstandingBalance || 0);

    let newOutstanding = previousOutstanding;
    if (updates.outstanding !== undefined) {
      newOutstanding = Number(updates.outstanding);
    } else if (updates.outstandingBalance !== undefined) {
      newOutstanding = Number(updates.outstandingBalance);
    }

    // Synchronize aliases
    const issuer = updates.issuer || updates.bankName || existing.issuer || existing.bankName;
    const creditLimitGroupId = updates.creditLimitGroupId !== undefined
      ? updates.creditLimitGroupId
      : (updates.sharedLimitGroupId !== undefined ? updates.sharedLimitGroupId : existing.creditLimitGroupId);

    const cardNickname = updates.cardNickname !== undefined
      ? updates.cardNickname
      : (updates.nickname !== undefined ? updates.nickname : existing.cardNickname || existing.nickname);

    const minAmountDue = updates.minAmountDue !== undefined
      ? Number(updates.minAmountDue)
      : (updates.minimumDue !== undefined ? Number(updates.minimumDue) : (existing.minAmountDue !== undefined ? Number(existing.minAmountDue) : (existing.minimumDue ? Number(existing.minimumDue) : 0)));

    const autoPay = updates.autoPay !== undefined
      ? Boolean(updates.autoPay)
      : (updates.isAutoPayEnabled !== undefined ? Boolean(updates.isAutoPayEnabled) : (existing.autoPay !== undefined ? Boolean(existing.autoPay) : Boolean(existing.isAutoPayEnabled)));

    const lastFourDigits = updates.lastFourDigits || existing.lastFourDigits;
    const maskedCardNumber = updates.maskedCardNumber || (lastFourDigits ? `•••• •••• •••• ${lastFourDigits}` : existing.maskedCardNumber);

    let iPayThisCard = updates.iPayThisCard !== undefined ? updates.iPayThisCard : existing.iPayThisCard;
    if (updates.managedBy && updates.iPayThisCard === undefined) {
      const m = updates.managedBy.toUpperCase();
      iPayThisCard = m === 'ME' || m === 'SELF';
    }

    const updated: CreditCard = {
      ...existing,
      ...updates,
      issuer,
      bankName: issuer,
      cardNickname,
      nickname: cardNickname,
      minAmountDue,
      minimumDue: minAmountDue,
      autoPay,
      isAutoPayEnabled: autoPay,
      lastFourDigits,
      maskedCardNumber,
      outstanding: newOutstanding,
      outstandingBalance: newOutstanding,
      iPayThisCard,
      creditLimitGroupId,
      sharedLimitGroupId: creditLimitGroupId,
      updatedAt: now,
      lastUpdated: now,
    };

    if (newOutstanding !== previousOutstanding) {
      await this.recordBalanceChange(
        'credit_card',
        id,
        existing.cardName,
        previousOutstanding,
        newOutstanding,
        'Credit card balance change'
      );
    }

    await db.creditCards.put(updated);
    await this.logAuditEvent('CREDIT_CARD_UPDATED', 'credit_card', id, updated.cardName, updates);
    return updated;
  }

  /**
   * Updates Outstanding Balance of a Credit Card with full audit trail.
   */
  async updateCreditCardOutstanding(
    id: string,
    newOutstanding: number,
    reason?: string
  ): Promise<CreditCard> {
    const existing = await db.creditCards.get(id);
    if (!existing) throw new Error(`Credit card with ID ${id} not found`);

    const previousOutstanding = existing.outstanding !== undefined ? existing.outstanding : (existing.outstandingBalance || 0);
    const delta = Math.round((newOutstanding - previousOutstanding) * 100) / 100;
    const now = new Date().toISOString();
    const reasonText = reason || `Manual outstanding balance adjustment (${delta >= 0 ? '+' : ''}₹${delta})`;

    const updated: CreditCard = {
      ...existing,
      outstanding: newOutstanding,
      outstandingBalance: newOutstanding,
      updatedAt: now,
      lastUpdated: now,
    };

    await db.transaction('rw', [db.creditCards, db.balanceHistory, db.auditEvents], async () => {
      await db.creditCards.put(updated);
      await db.balanceHistory.add({
        id: generateId('hist'),
        entityType: 'credit_card',
        entityId: id,
        entityName: existing.cardName,
        previousBalance: previousOutstanding,
        newBalance: newOutstanding,
        changeAmount: delta,
        timestamp: now,
        notes: reasonText,
      });
      await db.auditEvents.add({
        id: generateId('audit'),
        type: 'CREDIT_CARD_BALANCE_ADJUSTED',
        entityType: 'credit_card',
        entityId: id,
        entityName: existing.cardName,
        timestamp: now,
        metadata: {
          previousOutstanding,
          newOutstanding,
          delta,
          reason: reasonText,
        },
      });
    });

    return updated;
  }

  async archiveCreditCard(id: string): Promise<void> {
    const existing = await db.creditCards.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.creditCards.update(id, { status: 'archived', archivedAt: now, updatedAt: now });
    await this.logAuditEvent('CREDIT_CARD_ARCHIVED', 'credit_card', id, existing.cardName);
  }

  async restoreCreditCard(id: string): Promise<void> {
    const existing = await db.creditCards.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.creditCards.update(id, { status: 'active', archivedAt: undefined, updatedAt: now });
    await this.logAuditEvent('CREDIT_CARD_RESTORED', 'credit_card', id, existing.cardName);
  }

  async deleteCreditCard(id: string): Promise<void> {
    const existing = await db.creditCards.get(id);
    if (!existing) return;
    await db.creditCards.delete(id);
    await this.logAuditEvent('CREDIT_CARD_ARCHIVED', 'credit_card', id, `Deleted card ${existing.cardName}`);
  }

  // ==================== CREDIT CARD PAYMENTS (Step 6C) ====================

  async getCreditCardPayments(cardId?: string): Promise<CreditCardPayment[]> {
    if (cardId) {
      return await db.creditCardPayments
        .where('cardId')
        .equals(cardId)
        .reverse()
        .sortBy('createdAt');
    }
    return await db.creditCardPayments.reverse().sortBy('createdAt');
  }

  /**
   * Records a Credit Card Payment (Atomic Transaction)
   * Decreases card outstanding balance (can result in negative balance for overpayments / refund credits).
   * If payment method is Bank Account and source account provided, deducts from Bank Account balance.
   * If payment method is Cash and source vault provided, deducts from Cash Holding.
   * Creates BalanceHistory records, InternalTransferRecord, CreditCardPayment record, and AuditEvent.
   * Atomic rollback on any failure.
   */
  async recordCreditCardPayment(params: {
    cardId: string;
    amount: number;
    paymentDate?: string;
    paymentMethod: CreditCardPaymentMethod;
    sourceAccountId?: string;
    notes?: string;
  }): Promise<{
    card: CreditCard;
    payment: CreditCardPayment;
    bank?: BankAccount;
    cash?: CashHoldingAccount;
    transfer?: InternalTransferRecord;
  }> {
    const { cardId, amount, paymentDate, paymentMethod, sourceAccountId, notes } = params;

    if (!amount || amount <= 0 || isNaN(amount)) {
      throw new Error('Payment amount must be greater than zero');
    }

    const card = await db.creditCards.get(cardId);
    if (!card) {
      throw new Error(`Credit card with ID ${cardId} not found`);
    }
    if (card.status === 'closed') {
      throw new Error('Cannot record payments against a closed credit card');
    }

    const previousOutstanding = Number(
      card.outstanding !== undefined ? card.outstanding : (card.outstandingBalance || 0)
    );
    const newOutstanding = Math.round((previousOutstanding - amount) * 100) / 100;
    const now = new Date().toISOString();
    const payDate = paymentDate || now.split('T')[0];

    let updatedBank: BankAccount | undefined;
    let updatedCash: CashHoldingAccount | undefined;
    let transferRecord: InternalTransferRecord | undefined;
    let sourceAccountName: string | undefined;

    const historyRecords: BalanceHistoryRecord[] = [];

    // 1. Source Account Handling
    const isBank = paymentMethod === 'bank_account' || paymentMethod === 'Bank' || paymentMethod === 'bank';
    const isCash = paymentMethod === 'cash' || paymentMethod === 'Cash';

    if (isBank && sourceAccountId) {
      const bank = await db.bankAccounts.get(sourceAccountId);
      if (!bank || bank.status === 'archived' || bank.status === 'closed') {
        throw new Error('Active source bank account not found');
      }

      const bankBalance = Number(bank.balance || 0);
      const overdraftLimit = Number(bank.overdraftLimit || 0);
      if (!bank.allowNegativeBalance && bankBalance - amount < -overdraftLimit) {
        throw new Error(
          `Insufficient funds in bank account ${bank.name}. Available balance: ₹${(bankBalance + overdraftLimit).toLocaleString('en-IN')}`
        );
      }

      const bankNewBalance = Math.round((bankBalance - amount) * 100) / 100;
      sourceAccountName = bank.name;

      updatedBank = {
        ...bank,
        balance: bankNewBalance,
        updatedAt: now,
        lastUpdated: now,
      };

      historyRecords.push({
        id: generateId('hist'),
        entityType: 'bank',
        entityId: bank.id,
        entityName: bank.name,
        previousBalance: bankBalance,
        newBalance: bankNewBalance,
        changeAmount: -amount,
        timestamp: now,
        notes: notes || `Credit Card Payment to ${card.cardName}`,
      });

      transferRecord = {
        id: generateId('trf'),
        fromEntityType: 'bank',
        fromEntityId: bank.id,
        fromEntityName: bank.name,
        toEntityType: 'credit_card',
        toEntityId: card.id,
        toEntityName: card.displayName || card.cardName,
        amount,
        timestamp: now,
        transferType: 'bank_to_card' as any,
        notes: notes || `Credit card bill payment from ${bank.name}`,
      };
    } else if (isCash && sourceAccountId) {
      const cashHolding = await db.cashHoldings.get(sourceAccountId);
      if (!cashHolding || cashHolding.status === 'archived' || cashHolding.status === 'closed') {
        throw new Error('Active source cash vault not found');
      }

      const cashBalance = Number(cashHolding.balance || 0);
      if (cashBalance - amount < 0) {
        throw new Error(
          `Insufficient cash in vault ${cashHolding.name}. Available balance: ₹${cashBalance.toLocaleString('en-IN')}`
        );
      }

      const cashNewBalance = Math.round((cashBalance - amount) * 100) / 100;
      sourceAccountName = cashHolding.displayName || cashHolding.name;

      updatedCash = {
        ...cashHolding,
        balance: cashNewBalance,
        updatedAt: now,
        lastUpdated: now,
      };

      historyRecords.push({
        id: generateId('hist'),
        entityType: 'cash',
        entityId: cashHolding.id,
        entityName: cashHolding.name,
        previousBalance: cashBalance,
        newBalance: cashNewBalance,
        changeAmount: -amount,
        timestamp: now,
        notes: notes || `Cash Payment to Credit Card ${card.cardName}`,
      });

      transferRecord = {
        id: generateId('trf'),
        fromEntityType: 'cash',
        fromEntityId: cashHolding.id,
        fromEntityName: cashHolding.name,
        toEntityType: 'credit_card',
        toEntityId: card.id,
        toEntityName: card.displayName || card.cardName,
        amount,
        timestamp: now,
        transferType: 'cash_to_card' as any,
        notes: notes || `Cash payment for credit card bill`,
      };
    }

    // 2. Updated Credit Card Entity
    const updatedCard: CreditCard = {
      ...card,
      outstanding: newOutstanding,
      outstandingBalance: newOutstanding,
      updatedAt: now,
      lastUpdated: now,
    };

    // 3. Card Balance History Record
    historyRecords.push({
      id: generateId('hist'),
      entityType: 'credit_card',
      entityId: card.id,
      entityName: card.displayName || card.cardName,
      previousBalance: previousOutstanding,
      newBalance: newOutstanding,
      changeAmount: -amount,
      timestamp: now,
      notes: notes || `Credit Card Payment (${isBank ? 'Bank Account' : isCash ? 'Cash' : 'Other'})`,
    });

    // 4. Payment History Record
    const paymentRecord: CreditCardPayment = {
      id: generateId('ccpay'),
      cardId: card.id,
      cardName: card.displayName || card.cardName,
      amount,
      paymentDate: payDate,
      paymentMethod,
      sourceAccountId,
      sourceAccountName,
      previousOutstanding,
      newOutstanding,
      notes,
      createdAt: now,
    };

    // 5. Audit Event
    const auditRecord: AuditEvent = {
      id: generateId('audit'),
      type: 'CREDIT_CARD_PAYMENT',
      entityType: 'credit_card',
      entityId: card.id,
      entityName: card.displayName || card.cardName,
      timestamp: now,
      metadata: {
        amount,
        previousOutstanding,
        newOutstanding,
        paymentDate: payDate,
        paymentMethod,
        sourceAccountId,
        sourceAccountName,
        notes,
      },
    };

    // 6. Execute in atomic transaction
    await db.transaction(
      'rw',
      [
        db.creditCards,
        db.bankAccounts,
        db.cashHoldings,
        db.transfers,
        db.creditCardPayments,
        db.balanceHistory,
        db.auditEvents,
      ],
      async () => {
        await db.creditCards.put(updatedCard);
        if (updatedBank) await db.bankAccounts.put(updatedBank);
        if (updatedCash) await db.cashHoldings.put(updatedCash);
        if (transferRecord) await db.transfers.add(transferRecord);
        await db.creditCardPayments.add(paymentRecord);
        await db.balanceHistory.bulkAdd(historyRecords);
        await db.auditEvents.add(auditRecord);
      }
    );

    return {
      card: updatedCard,
      payment: paymentRecord,
      bank: updatedBank,
      cash: updatedCash,
      transfer: transferRecord,
    };
  }

  async deleteCreditCardPayment(id: string): Promise<void> {
    const existing = await db.creditCardPayments.get(id);
    if (!existing) return;
    await db.creditCardPayments.delete(id);
  }

  // ==================== CREDIT LIMIT GROUPS (Step 6A) ====================

  async getAllCreditLimitGroups(): Promise<CreditLimitGroup[]> {
    return await db.creditLimitGroups.toArray();
  }

  async getCreditLimitGroups(filter?: { status?: string }): Promise<CreditLimitGroup[]> {
    let groups = await db.creditLimitGroups.toArray();
    if (filter?.status) {
      groups = groups.filter((g) => (g.status || 'active').toLowerCase() === filter.status!.toLowerCase());
    }
    return groups;
  }

  async getCreditLimitGroup(id: string): Promise<CreditLimitGroup | undefined> {
    return await db.creditLimitGroups.get(id);
  }

  async createCreditLimitGroup(
    data: Omit<CreditLimitGroup, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CreditLimitGroup> {
    const now = new Date().toISOString();
    const issuer = data.issuer || data.bankName || 'Unknown Bank';
    const totalLimit = data.totalLimit !== undefined ? data.totalLimit : (data.sharedLimit || 0);

    const group: CreditLimitGroup = {
      ...data,
      id: generateId('grp'),
      name: data.name,
      issuer,
      bankName: issuer,
      totalLimit,
      sharedLimit: totalLimit,
      status: data.status || 'active',
      cardIds: data.cardIds || [],
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };

    await db.creditLimitGroups.add(group);
    await this.logAuditEvent('CREDIT_LIMIT_GROUP_CREATED', 'credit_limit_group', group.id, group.name, {
      issuer: group.issuer,
      totalLimit: group.totalLimit,
    });
    return group;
  }

  async updateCreditLimitGroup(
    id: string,
    updates: Partial<CreditLimitGroup>
  ): Promise<CreditLimitGroup> {
    const existing = await db.creditLimitGroups.get(id);
    if (!existing) throw new Error(`Credit limit group with ID ${id} not found`);

    const now = new Date().toISOString();
    const issuer = updates.issuer || updates.bankName || existing.issuer || existing.bankName;
    const totalLimit = updates.totalLimit !== undefined
      ? updates.totalLimit
      : (updates.sharedLimit !== undefined ? updates.sharedLimit : existing.totalLimit);

    const updated: CreditLimitGroup = {
      ...existing,
      ...updates,
      issuer,
      bankName: issuer,
      totalLimit,
      sharedLimit: totalLimit,
      updatedAt: now,
    };

    await db.creditLimitGroups.put(updated);
    await this.logAuditEvent('CREDIT_LIMIT_GROUP_UPDATED', 'credit_limit_group', id, updated.name, updates);
    return updated;
  }

  async archiveCreditLimitGroup(id: string): Promise<void> {
    const existing = await db.creditLimitGroups.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.creditLimitGroups.update(id, { status: 'archived', archivedAt: now, updatedAt: now });
    await this.logAuditEvent('CREDIT_LIMIT_GROUP_ARCHIVED', 'credit_limit_group', id, existing.name);
  }

  async deleteCreditLimitGroup(id: string): Promise<void> {
    const existing = await db.creditLimitGroups.get(id);
    if (!existing) return;
    await db.creditLimitGroups.delete(id);
  }

  // ==================== INVESTMENTS (Step 7A) ====================

  async getInvestmentHoldings(filter?: {
    status?: string;
    assetType?: string;
    broker?: string;
  }): Promise<InvestmentHolding[]> {
    let holdings = await db.investmentHoldings.toArray();

    if (filter?.status) {
      const s = filter.status.toLowerCase();
      holdings = holdings.filter((h) => (h.status || 'active').toLowerCase() === s);
    }

    if (filter?.assetType) {
      const at = filter.assetType.toUpperCase();
      holdings = holdings.filter((h) => {
        const itemType = (h.assetType || h.type || '').toUpperCase();
        return itemType === at || (at === 'MUTUAL_FUND' && itemType === 'MUTUAL_FUNDS');
      });
    }

    if (filter?.broker) {
      const b = filter.broker.toLowerCase();
      holdings = holdings.filter((h) => (h.broker || h.platform || '').toLowerCase() === b);
    }

    return holdings;
  }

  async getAllInvestments(): Promise<InvestmentHolding[]> {
    return await this.getInvestmentHoldings();
  }

  async getInvestmentHolding(id: string): Promise<InvestmentHolding | undefined> {
    return await db.investmentHoldings.get(id);
  }

  async createInvestmentHolding(
    data: Omit<InvestmentHolding, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>
  ): Promise<InvestmentHolding> {
    if (!data.name || !data.name.trim()) {
      throw new Error('Investment name is required');
    }

    const qty = Math.max(0, Number(data.quantity !== undefined ? data.quantity : data.unitsHeld || 0));
    const avgBuy = Math.max(0, Number(data.averageBuyPrice || 0));
    const currPrice = Math.max(0, Number(data.currentPrice || 0));

    const investedAmount =
      data.investedAmount !== undefined && data.investedAmount > 0
        ? Number(data.investedAmount)
        : Math.round(qty * avgBuy * 100) / 100;

    const currentValue =
      data.currentValue !== undefined && data.currentValue > 0
        ? Number(data.currentValue)
        : Math.round(qty * currPrice * 100) / 100;

    const unrealizedProfitLoss = Math.round((currentValue - investedAmount) * 100) / 100;
    const unrealizedProfitLossPercentage =
      investedAmount > 0 ? Math.round((unrealizedProfitLoss / investedAmount) * 10000) / 100 : 0;

    const now = new Date().toISOString();
    const assetType = data.assetType || (data.type as any) || 'STOCK';
    const broker = data.broker || (data.platform as any) || 'Groww';

    const holding: InvestmentHolding = {
      ...data,
      id: generateId('inv'),
      name: data.name.trim(),
      displayName: data.displayName || data.name.trim(),
      assetType,
      type: (data.type || assetType.toLowerCase()) as any,
      broker,
      platform: (data.platform || broker) as any,
      quantity: qty,
      unitsHeld: qty,
      unit: data.unit || (assetType.toString().toUpperCase() === 'GOLD' ? 'GRAM' : 'UNIT'),
      averageBuyPrice: avgBuy,
      investedAmount,
      currentPrice: currPrice,
      currentValue,
      unrealizedProfitLoss,
      unrealizedProfitLossPercentage,
      priceSource: data.priceSource || 'MANUAL',
      priceUpdatedAt: data.priceUpdatedAt || now,
      includeInNetWorth: data.includeInNetWorth !== false,
      status: data.status || 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
    };

    await db.investmentHoldings.add(holding);
    await this.logAuditEvent('ACCOUNT_CREATED', 'investment', holding.id, holding.name, {
      assetType: holding.assetType,
      broker: holding.broker,
      currentValue: holding.currentValue,
      investedAmount: holding.investedAmount,
    });

    return holding;
  }

  async createInvestment(
    data: Omit<InvestmentHolding, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>
  ): Promise<InvestmentHolding> {
    return await this.createInvestmentHolding(data);
  }

  async updateInvestmentHolding(
    id: string,
    updates: Partial<InvestmentHolding>
  ): Promise<InvestmentHolding> {
    const existing = await db.investmentHoldings.get(id);
    if (!existing) throw new Error(`Investment with ID ${id} not found`);

    const now = new Date().toISOString();
    const qty = updates.quantity !== undefined
      ? Math.max(0, Number(updates.quantity))
      : updates.unitsHeld !== undefined
      ? Math.max(0, Number(updates.unitsHeld))
      : Number(existing.quantity !== undefined ? existing.quantity : existing.unitsHeld || 0);

    const avgBuy = updates.averageBuyPrice !== undefined
      ? Math.max(0, Number(updates.averageBuyPrice))
      : Number(existing.averageBuyPrice || 0);

    const currPrice = updates.currentPrice !== undefined
      ? Math.max(0, Number(updates.currentPrice))
      : Number(existing.currentPrice || 0);

    const investedAmount = updates.investedAmount !== undefined
      ? Number(updates.investedAmount)
      : Math.round(qty * avgBuy * 100) / 100;

    const currentValue = updates.currentValue !== undefined
      ? Number(updates.currentValue)
      : Math.round(qty * currPrice * 100) / 100;

    const unrealizedProfitLoss = Math.round((currentValue - investedAmount) * 100) / 100;
    const unrealizedProfitLossPercentage =
      investedAmount > 0 ? Math.round((unrealizedProfitLoss / investedAmount) * 10000) / 100 : 0;

    const updated: InvestmentHolding = {
      ...existing,
      ...updates,
      quantity: qty,
      unitsHeld: qty,
      averageBuyPrice: avgBuy,
      currentPrice: currPrice,
      investedAmount,
      currentValue,
      unrealizedProfitLoss,
      unrealizedProfitLossPercentage,
      updatedAt: now,
      lastUpdated: now,
    };

    if (updates.currentPrice !== undefined && updates.currentPrice !== existing.currentPrice) {
      updated.previousPrice = existing.currentPrice;
      updated.previousValue = existing.currentValue;
      updated.priceUpdatedAt = now;
    }

    if (currentValue !== existing.currentValue) {
      await this.recordBalanceChange('investment', id, existing.name, existing.currentValue, currentValue);
    }

    await db.investmentHoldings.put(updated);
    await this.logAuditEvent('ACCOUNT_UPDATED', 'investment', id, updated.name, updates);
    return updated;
  }

  async updateInvestment(id: string, updates: Partial<InvestmentHolding>): Promise<InvestmentHolding> {
    return await this.updateInvestmentHolding(id, updates);
  }

  async updateInvestmentPrice(
    id: string,
    newPrice: number,
    priceSource?: 'MARKET' | 'MANUAL' | 'UNKNOWN' | 'AMFI' | 'NSE' | 'BSE' | string,
    metadata?: {
      priceUpdatedAt?: string;
      priceAsOfDate?: string;
      priceFetchedAt?: string;
      priceStatus?: InvestmentPriceStatus;
      dayChange?: number;
      dayChangePercentage?: number;
      priceFailureReason?: string;
    }
  ): Promise<InvestmentHolding> {
    const existing = await db.investmentHoldings.get(id);
    if (!existing) throw new Error(`Investment holding with ID ${id} not found`);

    const validPrice = Math.max(0, Number(newPrice || 0));
    const qty = Number(existing.quantity !== undefined ? existing.quantity : existing.unitsHeld || 0);
    const newCurrentValue = Math.round(qty * validPrice * 100) / 100;
    const investedAmount = Number(existing.investedAmount || 0);
    const pnl = Math.round((newCurrentValue - investedAmount) * 100) / 100;
    const pnlPct = investedAmount > 0 ? Math.round((pnl / investedAmount) * 10000) / 100 : 0;
    const now = new Date().toISOString();

    const updated: InvestmentHolding = {
      ...existing,
      previousPrice: existing.currentPrice,
      previousValue: existing.currentValue,
      currentPrice: validPrice,
      currentValue: newCurrentValue,
      unrealizedProfitLoss: pnl,
      unrealizedProfitLossPercentage: pnlPct,
      priceSource: (priceSource as any) || 'MANUAL',
      priceUpdatedAt: metadata?.priceUpdatedAt || now,
      priceAsOfDate: metadata?.priceAsOfDate || existing.priceAsOfDate,
      priceFetchedAt: metadata?.priceFetchedAt || now,
      priceStatus: metadata?.priceStatus || 'updated',
      dayChange: metadata?.dayChange !== undefined ? metadata.dayChange : existing.dayChange,
      dayChangePercentage: metadata?.dayChangePercentage !== undefined ? metadata.dayChangePercentage : existing.dayChangePercentage,
      priceFailureReason: metadata?.priceFailureReason || undefined,
      updatedAt: now,
      lastUpdated: now,
    };

    if (newCurrentValue !== existing.currentValue) {
      await this.recordBalanceChange('investment', id, existing.name, existing.currentValue, newCurrentValue, `Price updated to ₹${validPrice}`);
    }

    await db.investmentHoldings.put(updated);
    await this.logAuditEvent('ACCOUNT_UPDATED', 'investment', id, updated.name, {
      previousPrice: existing.currentPrice,
      newPrice: validPrice,
      previousValue: existing.currentValue,
      newValue: newCurrentValue,
      priceSource: updated.priceSource,
      priceAsOfDate: updated.priceAsOfDate,
    });

    return updated;
  }

  async archiveInvestmentHolding(id: string): Promise<void> {
    const existing = await db.investmentHoldings.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.investmentHoldings.update(id, { status: 'archived', archivedAt: now, updatedAt: now });
    await this.logAuditEvent('ACCOUNT_ARCHIVED', 'investment', id, existing.name);
  }

  async archiveInvestment(id: string): Promise<void> {
    await this.archiveInvestmentHolding(id);
  }

  async restoreInvestmentHolding(id: string): Promise<void> {
    const existing = await db.investmentHoldings.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.investmentHoldings.update(id, { status: 'active', archivedAt: undefined, updatedAt: now });
    await this.logAuditEvent('ACCOUNT_RESTORED', 'investment', id, existing.name);
  }

  async restoreInvestment(id: string): Promise<void> {
    await this.restoreInvestmentHolding(id);
  }

  async deleteInvestmentHolding(id: string): Promise<void> {
    const existing = await db.investmentHoldings.get(id);
    await db.investmentHoldings.delete(id);
    if (existing) {
      await this.logAuditEvent('HOLDING_DELETED', 'investment', id, existing.name);
    }
  }

  async deleteInvestment(id: string): Promise<void> {
    await this.deleteInvestmentHolding(id);
  }

  async deleteIPOApplication(id: string): Promise<void> {
    const existing = await db.ipoApplications.get(id);
    await db.ipoApplications.delete(id);
    if (existing) {
      await this.logAuditEvent('IPO_DELETED', 'ipo', id, existing.companyName);
    }
  }

  // ==================== IPO APPLICATIONS (Step 7A) ====================

  async getAllIPOApplications(): Promise<IPOApplication[]> {
    return await db.ipoApplications.toArray();
  }

  async getIPOApplications(filter?: { status?: string; ipoStatus?: string }): Promise<IPOApplication[]> {
    let list = await db.ipoApplications.toArray();
    if (filter?.status) {
      list = list.filter((i) => (i.status || 'active').toLowerCase() === filter.status!.toLowerCase());
    }
    if (filter?.ipoStatus) {
      list = list.filter((i) => (i.ipoStatus || '').toLowerCase() === filter.ipoStatus!.toLowerCase());
    }
    return list;
  }

  async getIPOApplication(id: string): Promise<IPOApplication | undefined> {
    return await db.ipoApplications.get(id);
  }

  async createIPOApplication(data: Omit<IPOApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<IPOApplication> {
    const now = new Date().toISOString();
    const lots = Math.max(1, Number(data.lotsApplied || 1));
    const sharesPerLot = Math.max(1, Number(data.sharesPerLot || 1));
    const bidPrice = Math.max(0, Number(data.bidPrice || 0));
    const computedBlocked = Math.round(lots * sharesPerLot * bidPrice * 100) / 100;
    const blockedAmount = data.blockedAmount !== undefined ? data.blockedAmount : computedBlocked;

    const ipo: IPOApplication = {
      ...data,
      id: generateId('ipo'),
      name: data.name || data.companyName || 'IPO Application',
      companyName: data.companyName || data.name || 'IPO Application',
      lotsApplied: lots,
      sharesPerLot,
      bidPrice,
      blockedAmount,
      applicationAmount: data.applicationAmount || blockedAmount,
      ipoStatus: data.ipoStatus || 'applied',
      status: data.status || 'active',
      includeInNetWorth: data.includeInNetWorth === true, // Default false to avoid double counting bank balances
      createdAt: now,
      updatedAt: now,
    };
    await db.ipoApplications.add(ipo);
    await this.logAuditEvent('ACCOUNT_CREATED', 'ipo', ipo.id, ipo.companyName, {
      blockedAmount: ipo.blockedAmount,
      status: ipo.ipoStatus,
    });
    return ipo;
  }

  async updateIPOApplication(id: string, updates: Partial<IPOApplication>): Promise<IPOApplication> {
    const existing = await db.ipoApplications.get(id);
    if (!existing) throw new Error(`IPO application with ID ${id} not found`);
    const now = new Date().toISOString();
    const updated: IPOApplication = {
      ...existing,
      ...updates,
      updatedAt: now,
    };
    await db.ipoApplications.put(updated);
    await this.logAuditEvent('ACCOUNT_UPDATED', 'ipo', id, updated.companyName, updates);
    return updated;
  }

  async archiveIPOApplication(id: string): Promise<void> {
    const existing = await db.ipoApplications.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.ipoApplications.update(id, { status: 'archived', archivedAt: now, updatedAt: now });
    await this.logAuditEvent('ACCOUNT_ARCHIVED', 'ipo', id, existing.companyName);
  }

  async restoreIPOApplication(id: string): Promise<void> {
    const existing = await db.ipoApplications.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.ipoApplications.update(id, { status: 'active', archivedAt: undefined, updatedAt: now });
    await this.logAuditEvent('ACCOUNT_RESTORED', 'ipo', id, existing.companyName);
  }

  // ==================== KHATABOOK (RECEIVABLES / PAYABLES) ====================

  async getAllKhatabookEntries(): Promise<KhatabookEntry[]> {
    return await db.khatabookEntries.toArray();
  }

  async getKhatabookEntries(filter?: { status?: string; type?: string; personName?: string }): Promise<KhatabookEntry[]> {
    let list = await db.khatabookEntries.toArray();
    if (filter?.status) {
      const fStatus = filter.status.toUpperCase();
      list = list.filter((e) => (e.status || '').toString().toUpperCase() === fStatus);
    }
    if (filter?.type) {
      const fType = normalizeKhatabookType(filter.type);
      list = list.filter((e) => normalizeKhatabookType(e.entryType || e.type) === fType);
    }
    if (filter?.personName) {
      const target = filter.personName.trim().toLowerCase();
      list = list.filter((e) => (e.personName || '').trim().toLowerCase() === target);
    }
    return list;
  }

  async getKhatabookEntry(id: string): Promise<KhatabookEntry | undefined> {
    return await db.khatabookEntries.get(id);
  }

  async createKhatabookEntry(
    data: Omit<KhatabookEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'> & {
      id?: string;
      createdAt?: string;
      updatedAt?: string;
    }
  ): Promise<KhatabookEntry> {
    const personName = (data.personName || data.name || '').trim();
    if (!personName) {
      throw new Error('Person name is required for Khatabook entry');
    }

    const rawOrig = data.originalAmount !== undefined ? Number(data.originalAmount) : Number(data.amount || 0);
    const origAmount = Math.max(0, Math.round(rawOrig * 100) / 100);
    if (origAmount <= 0) {
      throw new Error('Transaction amount must be greater than zero');
    }

    const paidAmount = Math.max(0, Math.round(Number(data.paidAmount || (data.isSettled ? origAmount : 0)) * 100) / 100);
    if (paidAmount > origAmount) {
      throw new Error('Paid amount cannot exceed original amount');
    }

    const remainingAmount = Math.max(0, Math.round((origAmount - paidAmount) * 100) / 100);
    const entryType = normalizeKhatabookType(data.entryType || data.type);
    const isSettled = data.isSettled === true || remainingAmount === 0;
    const now = new Date().toISOString();

    const entry: KhatabookEntry = {
      ...data,
      id: data.id || generateId('khata'),
      name: data.name || personName,
      personName,
      phone: data.phone || data.contactNumber,
      contactNumber: data.contactNumber || data.phone,
      entryType,
      type: entryType.toLowerCase() as any,
      originalAmount: origAmount,
      paidAmount,
      remainingAmount,
      amount: remainingAmount,
      date: data.date || now.split('T')[0],
      dueDate: data.dueDate,
      status: data.status && data.status.toString().toUpperCase() !== 'ACTIVE'
        ? (data.status as KhatabookStatus)
        : isSettled
        ? 'PAID'
        : paidAmount > 0
        ? 'PARTIALLY_PAID'
        : 'OPEN',
      notes: data.notes || data.reason,
      reason: data.reason || data.notes,
      includeInNetWorth: data.includeInNetWorth !== false,
      isSettled,
      settledDate: isSettled ? data.settledDate || now : undefined,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      lastUpdated: now,
    };

    await db.khatabookEntries.add(entry);
    await this.logAuditEvent('KHATABOOK_ENTRY_CREATED', 'khatabook', entry.id, entry.personName, {
      entryType: entry.entryType,
      originalAmount: entry.originalAmount,
      status: entry.status,
    });

    return entry;
  }

  async updateKhatabookEntry(id: string, updates: Partial<KhatabookEntry>): Promise<KhatabookEntry> {
    const existing = await db.khatabookEntries.get(id);
    if (!existing) throw new Error(`Khatabook entry with ID ${id} not found`);

    const personName = updates.personName !== undefined ? updates.personName.trim() : existing.personName;
    if (updates.personName !== undefined && !personName) {
      throw new Error('Person name cannot be empty');
    }

    const origAmount = updates.originalAmount !== undefined
      ? Math.max(0, Number(updates.originalAmount))
      : updates.amount !== undefined && updates.remainingAmount === undefined
      ? Math.max(0, Number(updates.amount))
      : getKhatabookOriginalAmount(existing);

    const paidAmount = updates.paidAmount !== undefined
      ? Math.max(0, Number(updates.paidAmount))
      : getKhatabookPaidAmount(existing);

    if (paidAmount > origAmount) {
      throw new Error('Paid amount cannot exceed original amount');
    }

    const remainingAmount = updates.remainingAmount !== undefined
      ? Math.max(0, Number(updates.remainingAmount))
      : Math.max(0, Math.round((origAmount - paidAmount) * 100) / 100);

    const entryType = normalizeKhatabookType(updates.entryType || updates.type || existing.entryType || existing.type);
    const isSettled = updates.isSettled !== undefined ? updates.isSettled : remainingAmount === 0;
    const prevRemaining = getKhatabookRemainingAmount(existing);
    const now = new Date().toISOString();

    const updated: KhatabookEntry = {
      ...existing,
      ...updates,
      personName,
      entryType,
      type: entryType.toLowerCase() as any,
      originalAmount: origAmount,
      paidAmount,
      remainingAmount,
      amount: remainingAmount,
      isSettled,
      status: updates.status || (isSettled ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'OPEN'),
      settledDate: isSettled ? updates.settledDate || existing.settledDate || now : undefined,
      updatedAt: now,
      lastUpdated: now,
    };

    if (remainingAmount !== prevRemaining) {
      await this.recordBalanceChange(
        'khatabook',
        id,
        updated.personName,
        prevRemaining,
        remainingAmount,
        updates.notes || `Balance updated: ₹${prevRemaining} -> ₹${remainingAmount}`
      );
    }

    await db.khatabookEntries.put(updated);
    await this.logAuditEvent('KHATABOOK_ENTRY_UPDATED', 'khatabook', id, updated.personName, updates);

    return updated;
  }

  async archiveKhatabookEntry(id: string): Promise<void> {
    const existing = await db.khatabookEntries.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    await db.khatabookEntries.update(id, { status: 'ARCHIVED', archivedAt: now, updatedAt: now, lastUpdated: now });
    await this.logAuditEvent('KHATABOOK_ENTRY_ARCHIVED', 'khatabook', id, existing.personName);
  }

  async deleteKhatabookEntry(id: string): Promise<void> {
    const existing = await db.khatabookEntries.get(id);
    if (!existing) return;
    await db.khatabookEntries.delete(id);
    await this.logAuditEvent('KHATABOOK_ENTRY_DELETED', 'khatabook', id, existing.personName);
  }

  async restoreKhatabookEntry(id: string): Promise<void> {
    const existing = await db.khatabookEntries.get(id);
    if (!existing) return;
    const now = new Date().toISOString();
    const remaining = getKhatabookRemainingAmount(existing);
    const paid = getKhatabookPaidAmount(existing);
    const restoredStatus: KhatabookStatus = remaining === 0 ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : 'OPEN';
    await db.khatabookEntries.update(id, { status: restoredStatus, archivedAt: undefined, updatedAt: now, lastUpdated: now });
    await this.logAuditEvent('KHATABOOK_ENTRY_RESTORED', 'khatabook', id, existing.personName);
  }

  async settleKhatabookEntry(params: SettleKhatabookParams): Promise<KhatabookSettlementResult> {
    const {
      entryId,
      amount,
      settlementDate = new Date().toISOString(),
      sourceOrDestinationType = 'none',
      sourceOrDestinationAccountId,
      notes,
      referenceNumber,
    } = params;

    const validAmount = Math.round(Number(amount || 0) * 100) / 100;
    if (validAmount <= 0) {
      throw new Error('Settlement payment amount must be greater than zero');
    }

    const existing = await db.khatabookEntries.get(entryId);
    if (!existing) {
      throw new Error(`Khatabook entry with ID ${entryId} not found`);
    }

    const entryType = normalizeKhatabookType(existing.entryType || existing.type);
    const origAmount = getKhatabookOriginalAmount(existing);
    const currentPaid = getKhatabookPaidAmount(existing);
    const currentRemaining = getKhatabookRemainingAmount(existing);

    if (currentRemaining <= 0) {
      throw new Error(`Khatabook entry for ${existing.personName} is already fully settled`);
    }

    if (validAmount > currentRemaining) {
      throw new Error(
        `Settlement amount (₹${validAmount.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${currentRemaining.toLocaleString('en-IN')})`
      );
    }

    const newPaidAmount = Math.round((currentPaid + validAmount) * 100) / 100;
    const newRemainingAmount = Math.max(0, Math.round((origAmount - newPaidAmount) * 100) / 100);
    const isFullySettled = newRemainingAmount === 0;
    const newStatus: KhatabookStatus = isFullySettled ? 'PAID' : 'PARTIALLY_PAID';
    const now = new Date().toISOString();

    let updatedBank: BankAccount | undefined;
    let updatedCash: CashHoldingAccount | undefined;
    let updatedWallet: DigitalWallet | undefined;
    let transferRecord: InternalTransferRecord | undefined;

    const updatedEntry: KhatabookEntry = {
      ...existing,
      entryType,
      type: entryType.toLowerCase() as any,
      originalAmount: origAmount,
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      amount: newRemainingAmount,
      status: newStatus,
      isSettled: isFullySettled,
      settledDate: isFullySettled ? settlementDate : existing.settledDate,
      updatedAt: now,
      lastUpdated: now,
    };

    await db.transaction(
      'rw',
      [
        db.khatabookEntries,
        db.bankAccounts,
        db.cashHoldings,
        db.wallets,
        db.walletTransactions,
        db.transfers,
        db.balanceHistory,
        db.auditEvents,
      ],
      async () => {
        // 1. Handle Account Impact if linked to an account
        if (sourceOrDestinationType === 'bank' && sourceOrDestinationAccountId) {
          const bank = await db.bankAccounts.get(sourceOrDestinationAccountId);
          if (!bank) throw new Error(`Bank account with ID ${sourceOrDestinationAccountId} not found`);
          const prevBal = Number(bank.balance || 0);
          // If RECEIVABLE (person pays user): Bank increases
          // If PAYABLE (user pays person): Bank decreases
          const nextBal =
            entryType === 'RECEIVABLE'
              ? Math.round((prevBal + validAmount) * 100) / 100
              : Math.round((prevBal - validAmount) * 100) / 100;

          updatedBank = {
            ...bank,
            balance: nextBal,
            lastUpdated: now,
            updatedAt: now,
          };
          await db.bankAccounts.put(updatedBank);
          await this.recordBalanceChange(
            'bank',
            bank.id,
            bank.name,
            prevBal,
            nextBal,
            entryType === 'RECEIVABLE'
              ? `Khatabook settlement received from ${existing.personName}: ₹${validAmount}`
              : `Khatabook settlement paid to ${existing.personName}: ₹${validAmount}`
          );

          transferRecord = {
            id: generateId('trf'),
            fromEntityType: entryType === 'RECEIVABLE' ? 'receivable' : 'bank',
            fromEntityId: entryType === 'RECEIVABLE' ? existing.id : bank.id,
            fromEntityName: entryType === 'RECEIVABLE' ? existing.personName : bank.name,
            toEntityType: entryType === 'RECEIVABLE' ? 'bank' : 'payable',
            toEntityId: entryType === 'RECEIVABLE' ? bank.id : existing.id,
            toEntityName: entryType === 'RECEIVABLE' ? bank.name : existing.personName,
            amount: validAmount,
            timestamp: settlementDate,
            transferType: (entryType === 'RECEIVABLE' ? 'khatabook_receipt' : 'khatabook_payment') as any,
            notes:
              notes ||
              (entryType === 'RECEIVABLE'
                ? `Settlement received from ${existing.personName}`
                : `Settlement paid to ${existing.personName}`),
            referenceNumber,
          };
          await db.transfers.add(transferRecord);
        } else if (sourceOrDestinationType === 'cash' && sourceOrDestinationAccountId) {
          const cash = await db.cashHoldings.get(sourceOrDestinationAccountId);
          if (!cash) throw new Error(`Cash holding with ID ${sourceOrDestinationAccountId} not found`);
          const prevBal = Number(cash.balance || 0);
          const nextBal =
            entryType === 'RECEIVABLE'
              ? Math.round((prevBal + validAmount) * 100) / 100
              : Math.max(0, Math.round((prevBal - validAmount) * 100) / 100);

          updatedCash = {
            ...cash,
            balance: nextBal,
            lastUpdated: now,
            updatedAt: now,
          };
          await db.cashHoldings.put(updatedCash);
          await this.recordBalanceChange(
            'cash',
            cash.id,
            cash.name,
            prevBal,
            nextBal,
            entryType === 'RECEIVABLE'
              ? `Khatabook cash received from ${existing.personName}: ₹${validAmount}`
              : `Khatabook cash paid to ${existing.personName}: ₹${validAmount}`
          );

          transferRecord = {
            id: generateId('trf'),
            fromEntityType: entryType === 'RECEIVABLE' ? 'receivable' : 'cash',
            fromEntityId: entryType === 'RECEIVABLE' ? existing.id : cash.id,
            fromEntityName: entryType === 'RECEIVABLE' ? existing.personName : cash.name,
            toEntityType: entryType === 'RECEIVABLE' ? 'cash' : 'payable',
            toEntityId: entryType === 'RECEIVABLE' ? cash.id : existing.id,
            toEntityName: entryType === 'RECEIVABLE' ? cash.name : existing.personName,
            amount: validAmount,
            timestamp: settlementDate,
            transferType: (entryType === 'RECEIVABLE' ? 'khatabook_receipt' : 'khatabook_payment') as any,
            notes:
              notes ||
              (entryType === 'RECEIVABLE'
                ? `Cash settlement from ${existing.personName}`
                : `Cash settlement to ${existing.personName}`),
            referenceNumber,
          };
          await db.transfers.add(transferRecord);
        } else if (sourceOrDestinationType === 'wallet' && sourceOrDestinationAccountId) {
          const wallet = await db.wallets.get(sourceOrDestinationAccountId);
          if (!wallet) throw new Error(`Digital wallet with ID ${sourceOrDestinationAccountId} not found`);
          const prevBal = Number(wallet.balance || 0);
          const nextBal =
            entryType === 'RECEIVABLE'
              ? Math.round((prevBal + validAmount) * 100) / 100
              : Math.round((prevBal - validAmount) * 100) / 100;

          updatedWallet = {
            ...wallet,
            balance: nextBal,
            lastUpdated: now,
            updatedAt: now,
          };
          await db.wallets.put(updatedWallet);
          await this.recordBalanceChange(
            'wallet',
            wallet.id,
            wallet.name,
            prevBal,
            nextBal,
            entryType === 'RECEIVABLE'
              ? `Khatabook settlement received into wallet from ${existing.personName}: ₹${validAmount}`
              : `Khatabook settlement paid from wallet to ${existing.personName}: ₹${validAmount}`
          );

          const wTx: WalletTransaction = {
            id: generateId('wtx'),
            walletId: wallet.id,
            type: entryType === 'RECEIVABLE' ? 'TRANSFER' : 'SPEND',
            direction: entryType === 'RECEIVABLE' ? 'in' : 'out',
            amount: validAmount,
            previousBalance: prevBal,
            newBalance: nextBal,
            date: settlementDate,
            reason:
              entryType === 'RECEIVABLE'
                ? `Khatabook settlement from ${existing.personName}`
                : `Khatabook payment to ${existing.personName}`,
            source: 'Other',
            createdAt: now,
          };
          await db.walletTransactions.add(wTx);

          transferRecord = {
            id: generateId('trf'),
            fromEntityType: entryType === 'RECEIVABLE' ? 'receivable' : 'wallet',
            fromEntityId: entryType === 'RECEIVABLE' ? existing.id : wallet.id,
            fromEntityName: entryType === 'RECEIVABLE' ? existing.personName : wallet.name,
            toEntityType: entryType === 'RECEIVABLE' ? 'wallet' : 'payable',
            toEntityId: entryType === 'RECEIVABLE' ? wallet.id : existing.id,
            toEntityName: entryType === 'RECEIVABLE' ? wallet.name : existing.personName,
            amount: validAmount,
            timestamp: settlementDate,
            transferType: (entryType === 'RECEIVABLE' ? 'khatabook_receipt' : 'khatabook_payment') as any,
            notes:
              notes ||
              (entryType === 'RECEIVABLE'
                ? `Wallet settlement from ${existing.personName}`
                : `Wallet settlement to ${existing.personName}`),
            referenceNumber,
          };
          await db.transfers.add(transferRecord);
        }

        // 2. Update Khatabook Entry
        await db.khatabookEntries.put(updatedEntry);

        // 3. Record Balance History for Khatabook Entry
        await this.recordBalanceChange(
          'khatabook',
          existing.id,
          existing.personName,
          currentRemaining,
          newRemainingAmount,
          notes ||
            (entryType === 'RECEIVABLE'
              ? `Received payment of ₹${validAmount} from ${existing.personName} (Remaining: ₹${newRemainingAmount})`
              : `Paid ₹${validAmount} to ${existing.personName} (Remaining: ₹${newRemainingAmount})`)
        );

        // 4. Log Audit Event
        await this.logAuditEvent(
          entryType === 'RECEIVABLE' ? 'KHATABOOK_RECEIVABLE_SETTLED' : 'KHATABOOK_PAYABLE_SETTLED',
          'khatabook',
          existing.id,
          existing.personName,
          {
            previousRemaining: currentRemaining,
            paymentAmount: validAmount,
            newRemaining: newRemainingAmount,
            status: newStatus,
            settlementDate,
            accountType: sourceOrDestinationType,
            accountId: sourceOrDestinationAccountId,
            notes,
          }
        );
      }
    );

    return {
      entry: updatedEntry,
      bank: updatedBank,
      cash: updatedCash,
      wallet: updatedWallet,
      transfer: transferRecord,
    };
  }

  // ==================== SNAPSHOTS ====================

  async getAllSnapshots(): Promise<FinancialSnapshot[]> {
    const list = await db.snapshots.toArray();
    // Sort chronologically ascending
    return list.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  async getSnapshotById(id: string): Promise<FinancialSnapshot | undefined> {
    return await db.snapshots.get(id);
  }

  async getSnapshotByDate(dateStr: string): Promise<FinancialSnapshot | undefined> {
    const all = await db.snapshots.toArray();
    return all.find((s) => s.date === dateStr || (s.timestamp && s.timestamp.slice(0, 10) === dateStr));
  }

  async createSnapshot(snapshot: Omit<FinancialSnapshot, 'id'>): Promise<FinancialSnapshot> {
    return await this.createFinancialSnapshot(snapshot);
  }

  async createFinancialSnapshot(snapshot: Omit<FinancialSnapshot, 'id'>): Promise<FinancialSnapshot> {
    const nowIso = snapshot.timestamp || new Date().toISOString();
    const date = snapshot.date || nowIso.slice(0, 10);
    const dateString =
      snapshot.dateString ||
      new Date(nowIso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

    const netWorth = snapshot.netWorth !== undefined ? snapshot.netWorth : Number(snapshot.totalNetWorth || 0);

    const snap: FinancialSnapshot = {
      ...snapshot,
      id: generateId('snap'),
      timestamp: nowIso,
      date,
      dateString,
      netWorth,
      totalNetWorth: netWorth,
      totalCash: snapshot.totalCash !== undefined ? snapshot.totalCash : Number(snapshot.cashTotal || 0),
      totalBankBalance: snapshot.totalBankBalance !== undefined ? snapshot.totalBankBalance : Number(snapshot.bankTotal || 0),
      totalFixedDeposits: snapshot.totalFixedDeposits !== undefined ? snapshot.totalFixedDeposits : 0,
      totalWalletBalance: snapshot.totalWalletBalance !== undefined ? snapshot.totalWalletBalance : 0,
      totalInvestments: snapshot.totalInvestments !== undefined ? snapshot.totalInvestments : Number(snapshot.investmentTotal || 0),
      totalReceivables: snapshot.totalReceivables !== undefined ? snapshot.totalReceivables : Number(snapshot.receivablesTotal || 0),
      totalCreditCardDue: snapshot.totalCreditCardDue !== undefined ? snapshot.totalCreditCardDue : Number(snapshot.creditCardTotal || 0),
      totalOverdraftLiabilities: snapshot.totalOverdraftLiabilities !== undefined ? snapshot.totalOverdraftLiabilities : 0,
      totalPayables: snapshot.totalPayables !== undefined ? snapshot.totalPayables : Number(snapshot.payablesTotal || 0),
      totalIPOBlocked: snapshot.totalIPOBlocked !== undefined ? snapshot.totalIPOBlocked : 0,
      label: snapshot.label || 'Daily',
      snapshotType: snapshot.snapshotType || 'daily',
      createdAt: snapshot.createdAt || nowIso,
    };

    await db.snapshots.add(snap);
    await this.logAuditEvent('SNAPSHOT_RECORDED', 'snapshot', snap.id, snap.dateString, {
      netWorth: snap.netWorth,
      label: snap.label,
      type: snap.snapshotType,
    });
    return snap;
  }

  async updateSnapshot(id: string, updates: Partial<FinancialSnapshot>): Promise<FinancialSnapshot> {
    const existing = await db.snapshots.get(id);
    if (!existing) throw new Error(`Snapshot with ID ${id} not found`);

    const updated: FinancialSnapshot = {
      ...existing,
      ...updates,
    };
    await db.snapshots.put(updated);
    return updated;
  }

  /**
   * Saves or updates the daily snapshot for the given date.
   * Prevents creating duplicate daily snapshots for the same day while keeping today's valuation current.
   */
  async saveOrUpdateDailySnapshot(
    snapshotData: Omit<FinancialSnapshot, 'id'>
  ): Promise<{ snapshot: FinancialSnapshot; isUpdated: boolean }> {
    const targetDate = snapshotData.date || (snapshotData.timestamp ? snapshotData.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10));
    
    // Look for existing daily snapshot for targetDate
    const existingList = await db.snapshots.toArray();
    const existingDaily = existingList.find(
      (s) => (s.date === targetDate || (s.timestamp && s.timestamp.slice(0, 10) === targetDate)) &&
             (s.snapshotType === 'daily' || s.label === 'Daily' || !s.snapshotType)
    );

    if (existingDaily) {
      // Update existing daily snapshot with latest figures
      const updated: FinancialSnapshot = {
        ...existingDaily,
        ...snapshotData,
        id: existingDaily.id, // Retain original ID
        date: targetDate,
        timestamp: snapshotData.timestamp || existingDaily.timestamp,
        netWorth: snapshotData.netWorth !== undefined ? snapshotData.netWorth : Number(snapshotData.totalNetWorth || 0),
        totalNetWorth: snapshotData.netWorth !== undefined ? snapshotData.netWorth : Number(snapshotData.totalNetWorth || 0),
      };
      await db.snapshots.put(updated);
      return { snapshot: updated, isUpdated: true };
    }

    // Create fresh daily snapshot
    const created = await this.createFinancialSnapshot({
      ...snapshotData,
      date: targetDate,
      label: snapshotData.label || 'Daily',
      snapshotType: 'daily',
    });
    return { snapshot: created, isUpdated: false };
  }

  /**
   * Ensures an end-of-month snapshot exists for previous months.
   */
  async ensureMonthlySnapshot(
    snapshotData: Omit<FinancialSnapshot, 'id'>,
    monthString: string // e.g. "2026-07"
  ): Promise<FinancialSnapshot | null> {
    const existingList = await db.snapshots.toArray();
    const existingMonthly = existingList.find(
      (s) => (s.date && s.date.startsWith(monthString)) || (s.timestamp && s.timestamp.startsWith(monthString))
    );

    if (existingMonthly) {
      return existingMonthly;
    }

    return await this.createFinancialSnapshot({
      ...snapshotData,
      label: 'Monthly',
      snapshotType: 'monthly',
    });
  }

  async deleteSnapshot(id: string): Promise<void> {
    const existing = await db.snapshots.get(id);
    if (!existing) return;
    await db.snapshots.delete(id);
    await this.logAuditEvent('SNAPSHOT_DELETED' as any, 'snapshot', id, existing.dateString);
  }

  // ==================== SYSTEMATIC INVESTMENT PLANS (SIPS) ====================

  async getAllSIPs(): Promise<SIPRecord[]> {
    return await db.sips.toArray();
  }

  async getActiveSIPs(): Promise<SIPRecord[]> {
    return await db.sips.filter((s) => s.sipStatus === 'active' && s.status !== 'archived').toArray();
  }

  async getSIP(id: string): Promise<SIPRecord | undefined> {
    return await db.sips.get(id);
  }

  async createSIP(input: AddSIPInput): Promise<SIPRecord> {
    const now = new Date().toISOString();
    const fundName = (input.fundName || '').trim();
    if (!fundName) {
      throw new Error('Fund name is required for SIP');
    }

    const amount = Math.max(100, Math.round(Number(input.amount || 0)));
    const deductionDay = Math.max(1, Math.min(31, Math.round(Number(input.deductionDay || 1))));

    // Fetch linked bank account for metadata
    let bankName = '';
    let accountName = '';
    let accountNumberMasked = '';
    if (input.bankAccountId) {
      const bank = await db.bankAccounts.get(input.bankAccountId);
      if (bank) {
        bankName = bank.displayName || bank.bankName || bank.name;
        accountName = bank.name || bank.displayName;
        accountNumberMasked = bank.accountNumberMasked || (bank.last4 ? `•••• ${bank.last4}` : '');
      }
    }

    const sip: SIPRecord = {
      id: generateId('sip'),
      name: fundName,
      fundName,
      schemeCode: input.schemeCode,
      symbol: input.symbol,
      holdingId: input.holdingId,
      amount,
      deductionDay,
      frequency: input.frequency || 'monthly',
      bankAccountId: input.bankAccountId,
      bankName,
      accountName,
      accountNumberMasked,
      sipStatus: input.sipStatus || 'active',
      status: 'active',
      startDate: input.startDate || now.split('T')[0],
      endDate: input.endDate,
      folioNumber: input.folioNumber,
      platform: input.platform || 'Direct',
      category: input.category || 'Mutual Fund',
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    await db.sips.add(sip);
    await this.logAuditEvent('SIP_CREATED' as any, 'sip', sip.id, sip.fundName, {
      amount: sip.amount,
      deductionDay: sip.deductionDay,
      bankAccountId: sip.bankAccountId,
      sipStatus: sip.sipStatus,
    });

    return sip;
  }

  async updateSIP(id: string, updates: UpdateSIPInput): Promise<SIPRecord> {
    const existing = await db.sips.get(id);
    if (!existing) {
      throw new Error(`SIP with ID ${id} not found`);
    }

    const now = new Date().toISOString();
    const fundName = updates.fundName !== undefined ? updates.fundName.trim() : existing.fundName;
    const amount = updates.amount !== undefined ? Math.max(100, Math.round(Number(updates.amount))) : existing.amount;
    const deductionDay = updates.deductionDay !== undefined ? Math.max(1, Math.min(31, Math.round(Number(updates.deductionDay)))) : existing.deductionDay;

    let bankName = existing.bankName;
    let accountName = existing.accountName;
    let accountNumberMasked = existing.accountNumberMasked;

    if (updates.bankAccountId && updates.bankAccountId !== existing.bankAccountId) {
      const bank = await db.bankAccounts.get(updates.bankAccountId);
      if (bank) {
        bankName = bank.displayName || bank.bankName || bank.name;
        accountName = bank.name || bank.displayName;
        accountNumberMasked = bank.accountNumberMasked || (bank.last4 ? `•••• ${bank.last4}` : '');
      }
    }

    const updated: SIPRecord = {
      ...existing,
      ...updates,
      id: existing.id, // Preserved ID
      name: fundName,
      fundName,
      amount,
      deductionDay,
      bankName,
      accountName,
      accountNumberMasked,
      updatedAt: now,
      createdAt: existing.createdAt, // Preserved
    };

    await db.sips.put(updated);
    await this.logAuditEvent('SIP_UPDATED' as any, 'sip', id, updated.fundName, updates as unknown as Record<string, unknown>);

    return updated;
  }

  async toggleSIPStatus(id: string, newStatus?: 'active' | 'stopped'): Promise<SIPRecord> {
    const existing = await db.sips.get(id);
    if (!existing) {
      throw new Error(`SIP with ID ${id} not found`);
    }

    const targetStatus = newStatus || (existing.sipStatus === 'active' ? 'stopped' : 'active');
    const now = new Date().toISOString();

    const updated: SIPRecord = {
      ...existing,
      sipStatus: targetStatus,
      updatedAt: now,
    };

    await db.sips.put(updated);
    await this.logAuditEvent(
      (targetStatus === 'active' ? 'SIP_RESUMED' : 'SIP_STOPPED') as any,
      'sip',
      id,
      existing.fundName,
      { previousStatus: existing.sipStatus, newStatus: targetStatus }
    );

    return updated;
  }

  async deleteSIP(id: string): Promise<void> {
    const existing = await db.sips.get(id);
    if (!existing) return;

    await db.sips.delete(id);
    await this.logAuditEvent('SIP_DELETED' as any, 'sip', id, existing.fundName, {
      amount: existing.amount,
      deductionDay: existing.deductionDay,
    });
  }

  async evaluateSIPPaymentSafety(): Promise<SIPSafetyReport> {
    const [sips, banks] = await Promise.all([
      db.sips.toArray(),
      db.bankAccounts.toArray(),
    ]);
    return sipSafetyService.evaluatePaymentSafety(sips, banks);
  }

  // ==================== USER SETTINGS ====================

  async getSettings(): Promise<UserSettings> {
    const settings = await db.settings.get('user_settings');
    return settings || DEFAULT_USER_SETTINGS;
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated: UserSettings = {
      ...current,
      ...updates,
    };
    await db.settings.put(updated);
    return updated;
  }

  // ==================== BACKUP EXPORT & IMPORT ====================

  async exportAllData(): Promise<ExportedBackupData> {
    const [
      banks,
      bankAccounts,
      fixedDeposits,
      cashHoldings,
      wallets,
      walletTransactions,
      creditCards,
      creditLimitGroups,
      creditCardPayments,
      investmentHoldings,
      ipoApplications,
      khatabookEntries,
      sips,
      transfers,
      snapshots,
      balanceHistory,
      auditEvents,
      settings,
    ] = await Promise.all([
      db.banks.toArray(),
      db.bankAccounts.toArray(),
      db.fixedDeposits.toArray(),
      db.cashHoldings.toArray(),
      db.wallets.toArray(),
      db.walletTransactions.toArray(),
      db.creditCards.toArray(),
      db.creditLimitGroups.toArray(),
      db.creditCardPayments.toArray(),
      db.investmentHoldings.toArray(),
      db.ipoApplications.toArray(),
      db.khatabookEntries.toArray(),
      db.sips.toArray(),
      db.transfers.toArray(),
      db.snapshots.toArray(),
      db.balanceHistory.toArray(),
      db.auditEvents.toArray(),
      this.getSettings(),
    ]);

    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      dataVersion: 2,
      banks,
      bankAccounts,
      fixedDeposits,
      cashHoldings,
      wallets,
      walletTransactions,
      creditCards,
      creditLimitGroups,
      creditCardPayments,
      investmentHoldings,
      ipoApplications,
      khatabookEntries,
      sips,
      transfers,
      snapshots,
      balanceHistory,
      auditEvents,
      settings,
    };
  }

  async importAllData(backup: ExportedBackupData): Promise<boolean> {
    if (!backup || (!backup.dataVersion && !backup.version)) {
      throw new Error('Invalid Afinity backup JSON payload');
    }

    await db.transaction(
      'rw',
      [
        db.banks,
        db.bankAccounts,
        db.fixedDeposits,
        db.cashHoldings,
        db.wallets,
        db.walletTransactions,
        db.creditCards,
        db.creditLimitGroups,
        db.creditCardPayments,
        db.investmentHoldings,
        db.ipoApplications,
        db.khatabookEntries,
        db.sips,
        db.transfers,
        db.snapshots,
        db.balanceHistory,
        db.auditEvents,
        db.settings,
      ],
      async () => {
        // Clear current data
        await Promise.all([
          db.banks.clear(),
          db.bankAccounts.clear(),
          db.fixedDeposits.clear(),
          db.cashHoldings.clear(),
          db.wallets.clear(),
          db.walletTransactions.clear(),
          db.creditCards.clear(),
          db.creditLimitGroups.clear(),
          db.creditCardPayments.clear(),
          db.investmentHoldings.clear(),
          db.ipoApplications.clear(),
          db.khatabookEntries.clear(),
          db.sips.clear(),
          db.transfers.clear(),
          db.snapshots.clear(),
          db.balanceHistory.clear(),
          db.auditEvents.clear(),
        ]);

        // Bulk restore
        if (backup.banks?.length) await db.banks.bulkPut(backup.banks);
        if (backup.bankAccounts?.length) await db.bankAccounts.bulkPut(backup.bankAccounts);
        if (backup.fixedDeposits?.length) await db.fixedDeposits.bulkPut(backup.fixedDeposits);
        if (backup.cashHoldings?.length) await db.cashHoldings.bulkPut(backup.cashHoldings);
        if (backup.wallets?.length) await db.wallets.bulkPut(backup.wallets);
        if (backup.walletTransactions?.length) await db.walletTransactions.bulkPut(backup.walletTransactions);
        if (backup.creditCards?.length) await db.creditCards.bulkPut(backup.creditCards);
        if (backup.creditLimitGroups?.length) await db.creditLimitGroups.bulkPut(backup.creditLimitGroups);
        if (backup.creditCardPayments?.length) await db.creditCardPayments.bulkPut(backup.creditCardPayments);
        if (backup.investmentHoldings?.length) await db.investmentHoldings.bulkPut(backup.investmentHoldings);
        if (backup.ipoApplications?.length) await db.ipoApplications.bulkPut(backup.ipoApplications);
        if (backup.khatabookEntries?.length) await db.khatabookEntries.bulkPut(backup.khatabookEntries);
        if (backup.sips?.length) await db.sips.bulkPut(backup.sips);
        if (backup.transfers?.length) await db.transfers.bulkPut(backup.transfers);
        if (backup.snapshots?.length) await db.snapshots.bulkPut(backup.snapshots);
        if (backup.balanceHistory?.length) await db.balanceHistory.bulkPut(backup.balanceHistory);
        if (backup.auditEvents?.length) await db.auditEvents.bulkPut(backup.auditEvents);
        if (backup.settings) await db.settings.put(backup.settings);

        await db.auditEvents.add({
          id: generateId('audit'),
          type: 'DATA_IMPORTED',
          entityType: 'system',
          entityId: 'vault',
          entityName: 'Backup Restored',
          timestamp: new Date().toISOString(),
          metadata: { exportedAt: backup.exportedAt },
        });
      }
    );

    return true;
  }
}

export const repository = new RepositoryService();
