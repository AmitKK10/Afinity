/**
 * Afinity Credit Card Due & Payment Safety Service
 * Deterministic, non-destructive safety evaluator for credit card dues,
 * auto-pay requirements, and combined SIP + Credit Card liquidity protection.
 * Never modifies financial records or balances.
 */

import {
  CreditCard,
  BankAccount,
  SIPRecord,
  CreditCardSafetyReport,
  CreditCardSafetyEvaluation,
  CreditCardSafetyStatus,
  CombinedBankPaymentSafety,
  CombinedPaymentSafetyReport,
  PaymentRiskSource,
  SIPSafetyReport,
} from '../types';
import { calculateCardBillingCycle } from './calculations';
import { sipSafetyService } from './sipSafetyService';
import { formatFinancialDate } from '../utils/formatters';

export class CreditSafetyService {
  /**
   * Evaluates Payment Safety for all active Credit Cards with Auto-Pay enabled against linked bank accounts.
   */
  evaluateCreditCardSafety(
    creditCards: CreditCard[],
    bankAccounts: BankAccount[],
    referenceDate: Date = new Date()
  ): CreditCardSafetyReport {
    const bankMap = new Map<string, BankAccount>();
    bankAccounts.forEach((b) => {
      if (b.id) bankMap.set(b.id, b);
      if (b.bankId) bankMap.set(b.bankId, b);
    });

    const activeCards = (creditCards || []).filter((c) => c.status !== 'archived' && c.status !== 'closed');
    const autoPayCards = activeCards.filter((c) => c.autoPay === true || c.isAutoPayEnabled === true);

    const evaluations: CreditCardSafetyEvaluation[] = autoPayCards.map((card) => {
      // Find linked bank account
      let bank: BankAccount | null = null;
      if (card.paymentBankAccountId) {
        bank = bankMap.get(card.paymentBankAccountId) ||
          bankAccounts.find((b) => b.id === card.paymentBankAccountId || (b.bankId && b.bankId === card.paymentBankAccountId)) || null;
      }
      if (!bank && card.paymentBankName) {
        bank = bankAccounts.find(
          (b) =>
            (b.institutionName && card.paymentBankName && b.institutionName.toLowerCase() === card.paymentBankName.toLowerCase()) ||
            (b.displayName && card.paymentBankName && b.displayName.toLowerCase() === card.paymentBankName.toLowerCase()) ||
            (b.bankName && card.paymentBankName && b.bankName.toLowerCase() === card.paymentBankName.toLowerCase()) ||
            (b.name && card.paymentBankName && b.name.toLowerCase() === card.paymentBankName.toLowerCase())
        ) || null;
      }

      const bankName = bank?.displayName || bank?.institutionName || bank?.name || card.paymentBankName || 'No Bank Linked';
      const availableBalance = Number(bank?.balance ?? 0);
      const outstanding = Number(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0);
      const minAmountDue = Number(card.minAmountDue !== undefined ? card.minAmountDue : card.minimumDue || 0);
      const requiredAmount = Math.max(0, outstanding);

      const billing = calculateCardBillingCycle(card, referenceDate);
      const daysUntilDue = billing.daysUntilDue;
      const isOverdue = billing.isOverdue;
      const isDueSoon = !isOverdue && daysUntilDue >= 0 && daysUntilDue <= 7;
      const dueDateFormatted = billing.currentDueDate
        ? formatFinancialDate(billing.currentDueDate)
        : (card.dueDate || 'Date not set');

      let status: CreditCardSafetyStatus = 'SUFFICIENT';
      let isInsufficient = false;
      let shortfall = 0;
      let warningMessage: string | undefined = undefined;

      if (requiredAmount <= 0) {
        status = 'NO_DUE';
        isInsufficient = false;
      } else if (!bank) {
        status = 'NO_BANK_LINKED';
        isInsufficient = true;
        shortfall = requiredAmount;
        warningMessage = 'No valid auto-pay bank account linked';
      } else if (availableBalance < requiredAmount) {
        status = 'INSUFFICIENT';
        isInsufficient = true;
        shortfall = Math.max(0, requiredAmount - availableBalance);
        warningMessage = `Insufficient balance for Auto-Pay. Required ₹${requiredAmount.toLocaleString('en-IN')}, Available ₹${availableBalance.toLocaleString('en-IN')}. Shortfall of ₹${shortfall.toLocaleString('en-IN')}.`;
      } else {
        status = 'SUFFICIENT';
        isInsufficient = false;
      }

      return {
        cardId: card.id,
        card,
        cardDisplayName: card.displayName || card.cardName,
        cardNickname: card.cardNickname || card.nickname,
        issuer: card.issuer || card.bankName || 'Bank',
        lastFourDigits: card.lastFourDigits || '••••',
        maskedCardNumber: card.maskedCardNumber || `•••• •••• •••• ${card.lastFourDigits || '••••'}`,
        creditLimit: card.creditLimit,
        outstanding,
        minAmountDue,
        requiredAmount,
        autoPayEnabled: true,
        bankAccountId: bank?.id || card.paymentBankAccountId,
        bankName,
        bankAccount: bank,
        availableBalance,
        shortfall,
        isInsufficient,
        status,
        dueDateFormatted,
        daysUntilDue,
        isOverdue,
        isDueSoon,
        warningMessage,
      };
    });

    const insufficientCards = evaluations.filter((e) => e.isInsufficient);
    const totalShortfall = insufficientCards.reduce((sum, e) => sum + e.shortfall, 0);
    const totalAutoPayCommitment = evaluations.reduce((sum, e) => sum + e.requiredAmount, 0);

    return {
      evaluatedAt: new Date().toISOString(),
      totalCardsWithAutoPay: autoPayCards.length,
      totalAutoPayCommitment,
      hasInsufficientBalance: insufficientCards.length > 0,
      insufficientCardsCount: insufficientCards.length,
      totalShortfall,
      evaluations,
    };
  }

  /**
   * Combined SIP + Credit Card Safety Evaluator
   * Computes per-bank liquidity safety:
   * Available Balance - Upcoming SIPs - Upcoming Auto-Pay Credit Cards
   * Pinpoints exact risk origin: Credit Card, SIP, or Combined
   */
  evaluateCombinedPaymentSafety(
    sips: SIPRecord[],
    creditCards: CreditCard[],
    bankAccounts: BankAccount[],
    referenceDate: Date = new Date()
  ): CombinedPaymentSafetyReport {
    const sipSafety: SIPSafetyReport = sipSafetyService.evaluatePaymentSafety(sips, bankAccounts, referenceDate);
    const creditCardSafety: CreditCardSafetyReport = this.evaluateCreditCardSafety(creditCards, bankAccounts, referenceDate);

    const activeBanks = (bankAccounts || []).filter((b) => b.status === 'active');
    const activeSIPs = (sips || []).filter((s) => s.sipStatus === 'active' && s.status !== 'archived');
    const activeCards = (creditCards || []).filter((c) => c.status !== 'archived' && c.status !== 'closed');
    const autoPayCards = activeCards.filter((c) => (c.autoPay === true || c.isAutoPayEnabled === true) && (c.outstanding || 0) > 0);

    // Group obligations by Bank Account
    const bankEvaluations: CombinedBankPaymentSafety[] = activeBanks.map((bank) => {
      const bankId = bank.id;
      const bankName = bank.displayName || bank.institutionName || bank.name || 'Bank Account';
      const accountDisplayName = bank.displayName || bank.name || 'Account';
      const accountNumberMasked = bank.accountNumberMasked || (bank.last4 ? `•••• ${bank.last4}` : '');
      const availableBalance = Number(bank.balance ?? 0);

      // SIPs linked to this bank
      const linkedSIPs = activeSIPs.filter(
        (s) => s.bankAccountId === bankId || (s.bankName && s.bankName.toLowerCase() === bankName.toLowerCase())
      );
      const sipCommitment = linkedSIPs.reduce((sum, s) => sum + Number(s.amount || 0), 0);

      // Auto-Pay Credit Cards linked to this bank
      const linkedCards = autoPayCards.filter(
        (c) =>
          c.paymentBankAccountId === bankId ||
          (c.paymentBankName && c.paymentBankName.toLowerCase() === bankName.toLowerCase())
      );
      const creditCardCommitment = linkedCards.reduce(
        (sum, c) => sum + Math.max(0, Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0)),
        0
      );

      const totalRequiredAmount = sipCommitment + creditCardCommitment;
      const remainingBalance = availableBalance - totalRequiredAmount;
      const isInsufficient = remainingBalance < 0;
      const shortfall = isInsufficient ? Math.abs(remainingBalance) : 0;

      // Determine precise Risk Source
      let riskSource: PaymentRiskSource = 'NONE';
      let riskLabel = 'Sufficient Balance';

      if (isInsufficient) {
        const sipAloneDeficit = availableBalance < sipCommitment;
        const ccAloneDeficit = availableBalance < creditCardCommitment;

        if (sipCommitment > 0 && creditCardCommitment === 0) {
          riskSource = 'SIP';
          riskLabel = 'Payment Risk (SIP)';
        } else if (creditCardCommitment > 0 && sipCommitment === 0) {
          riskSource = 'CREDIT_CARD';
          riskLabel = 'Payment Risk (Credit Card)';
        } else if (sipAloneDeficit && !ccAloneDeficit) {
          riskSource = 'SIP';
          riskLabel = 'Payment Risk (SIP)';
        } else if (!sipAloneDeficit && ccAloneDeficit) {
          riskSource = 'CREDIT_CARD';
          riskLabel = 'Payment Risk (Credit Card)';
        } else if (sipAloneDeficit && ccAloneDeficit) {
          riskSource = 'COMBINED';
          riskLabel = 'Payment Risk (Credit Card + SIP combined)';
        } else {
          // Both individually <= available balance, but together exceed available balance!
          riskSource = 'COMBINED';
          riskLabel = 'Payment Risk (Credit Card + SIP combined)';
        }
      }

      return {
        bankAccountId: bankId,
        bankName,
        accountDisplayName,
        accountNumberMasked,
        availableBalance,
        sipCommitment,
        creditCardCommitment,
        totalRequiredAmount,
        remainingBalance,
        shortfall,
        isInsufficient,
        riskSource,
        riskLabel,
        sips: linkedSIPs,
        creditCards: linkedCards,
      };
    });

    // Filter banks with active commitments or risk
    const evaluatedBanks = bankEvaluations.filter(
      (b) => b.totalRequiredAmount > 0 || b.isInsufficient
    );

    const riskBanks = bankEvaluations.filter((b) => b.isInsufficient);
    const totalShortfall = riskBanks.reduce((sum, b) => sum + b.shortfall, 0);

    return {
      evaluatedAt: new Date().toISOString(),
      sipSafety,
      creditCardSafety,
      bankEvaluations: evaluatedBanks.length > 0 ? evaluatedBanks : bankEvaluations,
      hasRisk: riskBanks.length > 0,
      riskBankCount: riskBanks.length,
      totalShortfall,
    };
  }
}

export const creditSafetyService = new CreditSafetyService();
