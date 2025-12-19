/**
 * Currency utility functions
 */

// Common currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    AED: 'د.إ',
    SAR: '﷼',
    QAR: '﷼',
    KWD: 'د.ك',
    BHD: '.د.ب',
    OMR: '﷼',
    EGP: '£',
    TRY: '₺',
    AUD: 'A$',
    CAD: 'C$',
    NZD: 'NZ$',
    CHF: 'CHF',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    RUB: '₽',
    ZAR: 'R',
};

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
    return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
}

/**
 * Format a price with currency symbol
 */
export function formatPrice(price: number | string, currencyCode: string): string {
    const symbol = getCurrencySymbol(currencyCode);
    // Convert to number if it's a string
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    // Handle invalid numbers
    if (isNaN(numericPrice)) {
        return `${symbol}0.00`;
    }
    // Format with 2 decimal places
    const formattedPrice = numericPrice.toFixed(2);
    // Add thousand separators
    const parts = formattedPrice.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${symbol}${parts.join('.')}`;
}

/**
 * Convert price from one currency to another using rates
 */
export function convertPrice(
    price: number,
    fromCurrency: string,
    toCurrency: string,
    rates: Record<string, number>,
    baseCurrency: string
): number {
    if (fromCurrency === toCurrency) {
        return price;
    }

    // Convert from base to target currency
    if (fromCurrency === baseCurrency && rates[toCurrency]) {
        return parseFloat((price * rates[toCurrency]).toFixed(2));
    }

    // Convert from target to base
    if (toCurrency === baseCurrency && rates[fromCurrency]) {
        return parseFloat((price / rates[fromCurrency]).toFixed(2));
    }

    // Convert between two non-base currencies
    if (rates[fromCurrency] && rates[toCurrency]) {
        // Convert to base first
        const basePrice = price / rates[fromCurrency];
        // Then convert to target
        return parseFloat((basePrice * rates[toCurrency]).toFixed(2));
    }

    // If conversion not possible, return original price
    return price;
}

/**
 * Validate currency code format (3 uppercase letters)
 */
export function isValidCurrencyCode(currencyCode: string): boolean {
    return /^[A-Z]{3}$/.test(currencyCode);
}

