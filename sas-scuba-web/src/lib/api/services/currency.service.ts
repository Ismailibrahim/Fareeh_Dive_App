import apiClient from "../client";

export interface CurrencyRate {
    currency: string;
    rate: number;
}

export interface CurrencyRatesResponse {
    base_currency: string;
    currency_rates: Record<string, number>;
}

export interface AvailableCurrenciesResponse {
    base_currency: string;
    available_currencies: string[];
}

export interface CurrencyConversionRequest {
    price: number;
    from_currency: string;
    to_currency: string;
}

export interface CurrencyConversionResponse {
    converted_price: number;
    original_price: number;
    from_currency: string;
    to_currency: string;
    rate: number;
}

export const currencyService = {
    getCurrencyRates: async () => {
        const response = await apiClient.get<CurrencyRatesResponse>("/api/v1/dive-center/currency-rates");
        return response.data;
    },

    updateCurrencyRates: async (currencyRates: Record<string, number>) => {
        const response = await apiClient.put<CurrencyRatesResponse>("/api/v1/dive-center/currency-rates", {
            currency_rates: currencyRates,
        });
        return response.data;
    },

    getAvailableCurrencies: async () => {
        const response = await apiClient.get<AvailableCurrenciesResponse>("/api/v1/dive-center/available-currencies");
        return response.data;
    },
};

