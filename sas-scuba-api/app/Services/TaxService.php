<?php

namespace App\Services;

use App\Models\Tax;
use Illuminate\Support\Facades\Cache;

class TaxService
{
    /**
     * Get T-GST tax percentage (cached)
     */
    public function getTGSTPercentage(): float
    {
        return Cache::remember('tax_tgst_percentage', 3600, function () {
            $tgstTax = Tax::where('name', 'T-GST')
                ->orWhere('name', 't-gst')
                ->orWhere('name', 'TGST')
                ->first();
            
            return $tgstTax ? (float) $tgstTax->percentage : 0;
        });
    }

    /**
     * Get Service Charge percentage (cached)
     */
    public function getServiceChargePercentage(): float
    {
        return Cache::remember('tax_service_charge_percentage', 3600, function () {
            $serviceChargeTax = Tax::where('name', 'Service Charge')
                ->orWhere('name', 'service charge')
                ->orWhere('name', 'SERVICE CHARGE')
                ->first();
            
            return $serviceChargeTax ? (float) $serviceChargeTax->percentage : 0;
        });
    }

    /**
     * Clear tax cache (call when taxes are updated)
     */
    public function clearCache(): void
    {
        Cache::forget('tax_tgst_percentage');
        Cache::forget('tax_service_charge_percentage');
    }
}

