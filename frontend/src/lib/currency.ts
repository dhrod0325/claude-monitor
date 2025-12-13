// 환율 정보 (USD 기준)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  KRW: 1400,
  JPY: 150,
  CNY: 7.2,
};

// 언어별 통화 매핑
const LANGUAGE_CURRENCY_MAP: Record<string, string> = {
  ko: 'KRW',
  en: 'USD',
  ja: 'JPY',
  zh: 'CNY',
};

// 언어별 로케일 매핑
const LANGUAGE_LOCALE_MAP: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

export interface CurrencyInfo {
  currency: string;
  locale: string;
  rate: number;
}

export function getCurrencyInfo(language: string): CurrencyInfo {
  const currency = LANGUAGE_CURRENCY_MAP[language] || 'USD';
  const locale = LANGUAGE_LOCALE_MAP[language] || 'en-US';
  const rate = EXCHANGE_RATES[currency] || 1;

  return { currency, locale, rate };
}

export function convertFromUSD(amountUSD: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES[targetCurrency] || 1;
  return amountUSD * rate;
}

export function formatCurrencyByLanguage(amountUSD: number, language: string): string {
  const { currency, locale, rate } = getCurrencyInfo(language);
  const convertedAmount = amountUSD * rate;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'KRW' || currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'KRW' || currency === 'JPY' ? 0 : 2,
  }).format(convertedAmount);
}

export function getExchangeRates(): Record<string, number> {
  return { ...EXCHANGE_RATES };
}
