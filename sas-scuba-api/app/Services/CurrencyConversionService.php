<?php

namespace App\Services;

use App\Models\DiveCenter;

class CurrencyConversionService
{
    /**
     * Convert price from one currency to another.
     *
     * @param float $price
     * @param string $fromCurrency
     * @param string $toCurrency
     * @param DiveCenter $diveCenter
     * @return float
     * @throws \Exception
     */
    public function convertPrice($price, $fromCurrency, $toCurrency, DiveCenter $diveCenter)
    {
        // Get rates from dive center settings
        $rates = $diveCenter->getCurrencyRates();
        
        // If same currency, return original price
        if ($fromCurrency === $toCurrency) {
            return round($price, 2);
        }
        
        // Get base currency (from dive_centers.currency)
        $baseCurrency = $diveCenter->currency;
        
        // Convert from base to target currency
        if ($fromCurrency === $baseCurrency && isset($rates[$toCurrency])) {
            return round($price * $rates[$toCurrency], 2);
        }
        
        // Convert from target to base
        if ($toCurrency === $baseCurrency && isset($rates[$fromCurrency])) {
            return round($price / $rates[$fromCurrency], 2);
        }
        
        // Convert between two non-base currencies
        if (isset($rates[$fromCurrency]) && isset($rates[$toCurrency])) {
            // Convert to base first
            $basePrice = $price / $rates[$fromCurrency];
            // Then convert to target
            return round($basePrice * $rates[$toCurrency], 2);
        }
        
        throw new \Exception("Currency conversion rate not found for conversion from {$fromCurrency} to {$toCurrency}");
    }
    
    /**
     * Get available currencies for a dive center.
     *
     * @param DiveCenter $diveCenter
     * @return array
     */
    public function getAvailableCurrencies(DiveCenter $diveCenter)
    {
        return $diveCenter->getAvailableCurrencies();
    }
}

