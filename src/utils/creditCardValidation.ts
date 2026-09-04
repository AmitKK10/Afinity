/**
 * Credit Card & Credit Limit Group Data Validation (Step 6A)
 */

import { CreditCard, CreditLimitGroup } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a CreditCard object before saving.
 * Strict rules:
 * - Card name required
 * - Issuer required
 * - Credit limit >= 0
 * - Outstanding must be numeric (allows negative numbers for refund/credit balance)
 * - Last 4 digits: max 4 digits
 * - Statement day: 1 to 31 (if provided)
 * - Due configuration: if FIXED_DAY, dueDay 1–31; if DAYS_AFTER_STATEMENT, daysAfterStatement > 0
 */
export function validateCreditCard(data: Partial<CreditCard>): ValidationResult {
  const errors: string[] = [];

  if (!data.cardName || data.cardName.trim().length === 0) {
    errors.push('Card name is required.');
  }

  const issuer = data.issuer || data.bankName;
  if (!issuer || issuer.trim().length === 0) {
    errors.push('Issuer / Bank name is required.');
  }

  if (data.creditLimit === undefined || isNaN(Number(data.creditLimit)) || Number(data.creditLimit) < 0) {
    errors.push('Credit limit must be a positive number or zero.');
  }

  const outstanding = data.outstanding !== undefined ? data.outstanding : data.outstandingBalance;
  if (outstanding === undefined || isNaN(Number(outstanding))) {
    errors.push('Outstanding balance must be a valid numeric value.');
  }

  if (data.lastFourDigits) {
    const cleanedLast4 = String(data.lastFourDigits).trim();
    if (!/^\d{1,4}$/.test(cleanedLast4)) {
      errors.push('Last 4 digits must contain up to 4 numeric digits only.');
    }
  }

  if (data.statementDay !== undefined) {
    const sDay = Number(data.statementDay);
    if (isNaN(sDay) || sDay < 1 || sDay > 31) {
      errors.push('Statement day must be between 1 and 31.');
    }
  }

  if (data.dueDateType === 'FIXED_DAY' || data.dueDateType === 'fixed_day') {
    if (data.dueDay !== undefined) {
      const dDay = Number(data.dueDay);
      if (isNaN(dDay) || dDay < 1 || dDay > 31) {
        errors.push('Due day must be between 1 and 31 for Fixed Day due date.');
      }
    }
  } else if (data.dueDateType === 'DAYS_AFTER_STATEMENT' || data.dueDateType === 'days_after_statement') {
    if (data.daysAfterStatement !== undefined) {
      const days = Number(data.daysAfterStatement);
      if (isNaN(days) || days <= 0) {
        errors.push('Days after statement must be a positive integer greater than 0.');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a CreditLimitGroup object before saving.
 */
export function validateCreditLimitGroup(data: Partial<CreditLimitGroup>): ValidationResult {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Credit limit group name is required.');
  }

  const issuer = data.issuer || data.bankName;
  if (!issuer || issuer.trim().length === 0) {
    errors.push('Issuer is required for shared credit limit group.');
  }

  const totalLimit = data.totalLimit !== undefined ? data.totalLimit : data.sharedLimit;
  if (totalLimit === undefined || isNaN(Number(totalLimit)) || Number(totalLimit) < 0) {
    errors.push('Total shared limit must be a positive number or zero.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
