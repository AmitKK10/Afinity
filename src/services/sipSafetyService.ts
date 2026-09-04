/**
 * Afinity SIP Payment Safety & Balance Evaluator Service
 * Deterministic, non-destructive safety validator for recurring SIP installments.
 * Never touches or modifies financial records or balances.
 */

import {
  SIPRecord,
  BankAccount,
  SIPSafetyReport,
  SIPIndividualSafetyEvaluation,
  SIPBankSafetyEvaluation,
  SIPSafetyStatus,
} from '../types';
import { calculateNextSIPDeductionDate, formatDayOrdinal } from '../utils/sipDateUtils';

export class SIPSafetyService {
  /**
   * Deterministically evaluates the safety of all active and upcoming SIPs against linked bank accounts.
   */
  evaluatePaymentSafety(
    sips: SIPRecord[],
    bankAccounts: BankAccount[],
    referenceDate: Date = new Date()
  ): SIPSafetyReport {
    const bankMap = new Map<string, BankAccount>();
    bankAccounts.forEach((b) => {
      if (b.id) bankMap.set(b.id, b);
      if (b.bankId) bankMap.set(b.bankId, b);
    });

    const activeSIPs = sips.filter((s) => s.sipStatus === 'active' && s.status !== 'archived');
    const stoppedSIPs = sips.filter((s) => s.sipStatus === 'stopped' && s.status !== 'archived');

    const totalActiveSIPs = activeSIPs.length;
    const totalStoppedSIPs = stoppedSIPs.length;

    const totalMonthlyCommitment = activeSIPs.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const totalStoppedCommitment = stoppedSIPs.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // 1. Evaluate Individual SIPs
    const sipEvaluations: SIPIndividualSafetyEvaluation[] = sips.map((sip) => {
      let bank = sip.bankAccountId ? bankMap.get(sip.bankAccountId) || null : null;
      if (!bank && sip.bankAccountId) {
        bank =
          bankAccounts.find(
            (b) => b.id === sip.bankAccountId || (b.bankId && b.bankId === sip.bankAccountId)
          ) || null;
      }
      if (!bank && sip.bankName) {
        bank =
          bankAccounts.find(
            (b) =>
              (b.institutionName &&
                sip.bankName &&
                b.institutionName.toLowerCase() === sip.bankName.toLowerCase()) ||
              (b.bankName &&
                sip.bankName &&
                b.bankName.toLowerCase() === sip.bankName.toLowerCase()) ||
              (b.displayName &&
                sip.bankName &&
                b.displayName.toLowerCase() === sip.bankName.toLowerCase())
          ) || null;
      }

      const bankName =
        bank?.institutionName ||
        bank?.displayName ||
        bank?.bankName ||
        bank?.name ||
        sip.bankName ||
        'Unknown Bank';
      const accountDisplayName = bank?.displayName || bank?.name || sip.accountName || 'Account';
      const accountNumberMasked =
        bank?.accountNumberMasked ||
        (bank?.last4 ? `•••• ${bank.last4}` : sip.accountNumberMasked || '');
      const availableBalance = Number(bank?.balance ?? 0);
      const requiredAmount = Number(sip.amount || 0);

      const dateInfo = calculateNextSIPDeductionDate(
        sip.deductionDay,
        sip.frequency,
        sip.sipStatus,
        referenceDate
      );

      let status: SIPSafetyStatus = 'SUFFICIENT';
      let isInsufficient = false;
      let shortfall = 0;
      let warningMessage: string | undefined = undefined;
      let safetyStatus: 'SAFE' | 'AT_RISK' | 'CRITICAL_INSUFFICIENT' | 'NO_BANK_LINKED' | 'STOPPED' =
        'SAFE';

      if (sip.sipStatus === 'stopped') {
        status = 'STOPPED';
        safetyStatus = 'STOPPED';
      } else if (!bank) {
        status = 'NO_BANK_LINKED';
        safetyStatus = 'NO_BANK_LINKED';
        isInsufficient = true;
        warningMessage = 'No valid deduction bank account linked';
      } else if (availableBalance < requiredAmount) {
        status = 'INSUFFICIENT';
        safetyStatus = 'CRITICAL_INSUFFICIENT';
        isInsufficient = true;
        shortfall = Math.max(0, requiredAmount - availableBalance);
        warningMessage = `Insufficient balance for upcoming SIP. Required ₹${requiredAmount.toLocaleString('en-IN')}, Available ₹${availableBalance.toLocaleString('en-IN')}. Shortfall of ₹${shortfall.toLocaleString('en-IN')}.`;
      } else if (availableBalance < requiredAmount * 1.2) {
        status = 'SUFFICIENT';
        safetyStatus = 'AT_RISK';
        isInsufficient = false;
      } else {
        status = 'SUFFICIENT';
        safetyStatus = 'SAFE';
        isInsufficient = false;
      }

      return {
        sipId: sip.id,
        sip,
        bankAccount: bank,
        bankName,
        accountDisplayName,
        bankDisplayName: bankName,
        accountNumberMasked,
        bankAccountNumberMasked: accountNumberMasked,
        availableBalance,
        bankCurrentBalance: availableBalance,
        requiredAmount,
        amount: requiredAmount,
        shortfall,
        isInsufficient,
        status,
        safetyStatus,
        nextDeductionDate: dateInfo.nextDateString,
        nextDeductionFormatted: dateInfo.formattedDate || dateInfo.nextDateString,
        daysUntilDeduction: dateInfo.daysUntil,
        daysUntil: dateInfo.daysUntil,
        relativeDateLabel: dateInfo.relativeLabel,
        relativeDaysLabel: dateInfo.relativeLabel,
        isDueWithin7Days: dateInfo.isDueWithin7Days,
        isDueWithin30Days: dateInfo.isDueWithin30Days,
        fundName: sip.fundName,
        isStopped: sip.sipStatus === 'stopped',
        warningMessage,
      };
    });

    // 2. Evaluate Bank-Level Commitments (Multiple SIPs on Same Bank & Dates)
    const bankGroups = new Map<string, SIPRecord[]>();
    activeSIPs.forEach((sip) => {
      const bankId = sip.bankAccountId || 'unlinked';
      const list = bankGroups.get(bankId) || [];
      list.push(sip);
      bankGroups.set(bankId, list);
    });

    const bankEvaluations: SIPBankSafetyEvaluation[] = [];

    bankGroups.forEach((bankSips, bankId) => {
      const bank = bankMap.get(bankId) || null;
      const bankName = bank?.displayName || bank?.bankName || bank?.name || bankSips[0]?.bankName || 'Unknown Bank';
      const accountDisplayName = bank?.displayName || bank?.name || 'Bank Account';
      const accountNumberMasked = bank?.accountNumberMasked || (bank?.last4 ? `•••• ${bank.last4}` : '');
      const availableBalance = Number(bank?.balance || 0);

      const totalRequiredAmount = bankSips.reduce((sum, s) => sum + Number(s.amount || 0), 0);
      const isInsufficient = availableBalance < totalRequiredAmount;
      const shortfall = Math.max(0, totalRequiredAmount - availableBalance);

      // Subgroup by deduction day
      const sameDateMap = new Map<number, SIPRecord[]>();
      bankSips.forEach((s) => {
        const day = s.deductionDay || 1;
        const subList = sameDateMap.get(day) || [];
        subList.push(s);
        sameDateMap.set(day, subList);
      });

      const sameDateGroups = Array.from(sameDateMap.entries()).map(([day, groupedSips]) => {
        const req = groupedSips.reduce((acc, s) => acc + Number(s.amount || 0), 0);
        const groupDateInfo = calculateNextSIPDeductionDate(day, 'monthly', 'active', referenceDate);
        return {
          date: groupDateInfo.formattedDate,
          day,
          requiredAmount: req,
          shortfall: Math.max(0, req - availableBalance),
          isInsufficient: availableBalance < req,
          sips: groupedSips,
        };
      });

      // Earliest upcoming deduction date for this bank
      const sortedSipsByDate = [...bankSips].sort((a, b) => {
        const aDate = calculateNextSIPDeductionDate(a.deductionDay, a.frequency, a.sipStatus, referenceDate);
        const bDate = calculateNextSIPDeductionDate(b.deductionDay, b.frequency, b.sipStatus, referenceDate);
        return aDate.daysUntil - bDate.daysUntil;
      });

      const earliestDateInfo = sortedSipsByDate[0]
        ? calculateNextSIPDeductionDate(
            sortedSipsByDate[0].deductionDay,
            sortedSipsByDate[0].frequency,
            sortedSipsByDate[0].sipStatus,
            referenceDate
          ).formattedDate
        : '';

      bankEvaluations.push({
        bankAccountId: bankId,
        bankName,
        accountDisplayName,
        bankDisplayName: bankName,
        accountNumberMasked,
        availableBalance,
        totalRequiredAmount,
        totalCommittedNext30Days: totalRequiredAmount,
        shortfall,
        isInsufficient,
        activeSipCount: bankSips.length,
        sips: bankSips,
        sipsDue: bankSips.map((s) => ({
          sipId: s.id,
          fundName: s.fundName,
          amount: Number(s.amount || 0),
        })),
        nextDeductionDate: earliestDateInfo,
        sameDateGroups,
      });
    });

    // 3. Overall Next Upcoming SIP
    const activeEvaluations = sipEvaluations.filter((e) => e.sip.sipStatus === 'active');
    activeEvaluations.sort((a, b) => a.daysUntilDeduction - b.daysUntilDeduction);

    const nextUpcomingEvaluation = activeEvaluations[0] || null;
    const nextUpcomingSIP = nextUpcomingEvaluation ? nextUpcomingEvaluation.sip : null;
    const nextDeductionDate = nextUpcomingEvaluation ? nextUpcomingEvaluation.nextDeductionDate : null;
    const daysUntilNextSIP = nextUpcomingEvaluation ? nextUpcomingEvaluation.daysUntilDeduction : null;

    // 4. Totals due in 7 and 30 days
    const totalDueNext7Days = activeEvaluations
      .filter((e) => e.isDueWithin7Days)
      .reduce((sum, e) => sum + e.requiredAmount, 0);

    const totalDueNext30Days = activeEvaluations
      .filter((e) => e.isDueWithin30Days)
      .reduce((sum, e) => sum + e.requiredAmount, 0);

    // 5. Overall Shortfall across all banks
    const insufficientBanks = bankEvaluations.filter((b) => b.isInsufficient);
    const hasInsufficientBalance = insufficientBanks.length > 0;
    const totalShortfallAmount = insufficientBanks.reduce((sum, b) => sum + b.shortfall, 0);
    const insufficientSipsCount = activeEvaluations.filter((e) => e.isInsufficient).length;

    return {
      evaluatedAt: new Date().toISOString(),
      totalActiveSIPs,
      totalStoppedSIPs,
      totalMonthlyCommitment,
      totalStoppedCommitment,
      nextUpcomingSIP,
      nextDeductionDate,
      daysUntilNextSIP,
      totalDueNext7Days,
      totalDueNext30Days,
      requiredInNext7Days: totalDueNext7Days,
      requiredInNext30Days: totalDueNext30Days,
      hasInsufficientBalance,
      insufficientSipsCount,
      atRiskSIPsCount: insufficientSipsCount,
      totalShortfallAmount,
      totalShortfall: totalShortfallAmount,
      bankEvaluations,
      insufficientBankAccounts: insufficientBanks,
      sipEvaluations,
      evaluations: sipEvaluations,
    };
  }
}

export const sipSafetyService = new SIPSafetyService();
