<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiveCenter extends Model
{
    protected $fillable = [
        'name',
        'legal_name',
        'email',
        'phone',
        'website',
        'address',
        'city',
        'state',
        'zip',
        'country',
        'timezone',
        'currency',
        'logo',
        'status',
        'settings'
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    /**
     * Get the price list for this dive center.
     */
    public function priceList()
    {
        return $this->hasOne(PriceList::class);
    }

    /**
     * Get currency rates from settings.
     */
    public function getCurrencyRates()
    {
        return $this->settings['currency_rates'] ?? [];
    }

    /**
     * Set currency rates in settings.
     */
    public function setCurrencyRates(array $rates)
    {
        $settings = $this->settings ?? [];
        $settings['currency_rates'] = $rates;
        $this->settings = $settings;
        return $this;
    }

    /**
     * Get available currencies (base currency + currencies with rates).
     */
    public function getAvailableCurrencies()
    {
        $rates = $this->getCurrencyRates();
        $currencies = array_keys($rates);
        
        // Always include base currency
        $baseCurrency = $this->currency;
        if ($baseCurrency && !in_array($baseCurrency, $currencies)) {
            array_unshift($currencies, $baseCurrency);
        }
        
        return $currencies;
    }
}
