/**
 * useCurrency.js
 *
 * Hook to manage the currently selected currency and format monetary values.
 * Uses localStorage for persistence and Intl.NumberFormat for locale-aware formatting.
 *
 * Returns:
 *   currency    - { code, symbol, locale, label }
 *   setCurrency - updates the currency and persists it
 *   fmt         - formatter function: (number) => string
 *   CURRENCIES  - exported list of all supported currencies
 */

import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../lib/constants';

/** Supported currencies with locale strings for formatting. */
export const CURRENCIES = [
  { code: 'USD', symbol: '$', locale: 'en-US', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', label: 'Euro' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP', label: 'Japanese Yen' },
  { code: 'PHP', symbol: '₱', locale: 'en-PH', label: 'Philippine Peso' },
  { code: 'SGD', symbol: 'S$', locale: 'en-SG', label: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', locale: 'en-CA', label: 'Canadian Dollar' },
  { code: 'INR', symbol: '₹', locale: 'en-IN', label: 'Indian Rupee' },
  { code: 'IDR', symbol: 'Rp', locale: 'id-ID', label: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', locale: 'ms-MY', label: 'Malaysian Ringgit' },
  { code: 'KRW', symbol: '₩', locale: 'ko-KR', label: 'South Korean Won' },
];


function getStored() {
  const code = localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'USD';
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState(getStored);

  const setCurrency = useCallback((code) => {
    const found = CURRENCIES.find(c => c.code === code);
    if (!found) return;
    localStorage.setItem(STORAGE_KEYS.CURRENCY, code);
    setCurrencyState(found);
  }, []);

  const fmt = useCallback((amount) => {
    // JPY and KRW have no decimal places
    const noDecimal = ['JPY', 'KRW', 'IDR'].includes(currency.code);
    try {
      return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: noDecimal ? 0 : 2,
        maximumFractionDigits: noDecimal ? 0 : 2,
      }).format(amount);
    } catch {
      // Fallback: manual symbol
      return `${currency.symbol}${amount.toFixed(noDecimal ? 0 : 2)}`;
    }
  }, [currency]);

  return { currency, setCurrency, fmt, CURRENCIES };
}
