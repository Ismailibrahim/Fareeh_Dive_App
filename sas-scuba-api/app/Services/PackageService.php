<?php

namespace App\Services;

use App\Models\Package;
use App\Models\PackageComponent;
use App\Models\PackageOption;
use App\Models\PackagePricingTier;
use Illuminate\Support\Facades\DB;

class PackageService
{
    /**
     * Calculate total price for a package with given parameters
     */
    public function calculatePrice(int $packageId, int $persons, array $optionIds = []): float
    {
        $package = Package::findOrFail($packageId);
        return $package->calculatePrice($persons, $optionIds);
    }

    /**
     * Validate that package components sum to base_price
     */
    public function validateBreakdown(int $packageId): array
    {
        $package = Package::with('components')->findOrFail($packageId);
        
        $isValid = $package->validateBreakdown();
        $componentsTotal = $package->components()
            ->where('is_inclusive', true)
            ->sum('total_price');
        
        return [
            'is_valid' => $isValid,
            'base_price' => (float) $package->base_price,
            'components_total' => (float) $componentsTotal,
            'difference' => abs($componentsTotal - $package->base_price),
        ];
    }

    /**
     * Get formatted breakdown for display
     */
    public function getBreakdown(int $packageId): array
    {
        $package = Package::with(['components' => function ($query) {
            $query->orderBy('sort_order');
        }])->findOrFail($packageId);
        
        return $package->getBreakdown();
    }

    /**
     * Create package with components, options, and tiers
     */
    public function createPackage(array $packageData, array $components = [], array $options = [], array $tiers = []): Package
    {
        DB::beginTransaction();
        try {
            $package = Package::create($packageData);

            // Create components
            foreach ($components as $componentData) {
                $package->components()->create($componentData);
            }

            // Create options
            foreach ($options as $optionData) {
                $package->options()->create($optionData);
            }

            // Create pricing tiers
            foreach ($tiers as $tierData) {
                $package->pricingTiers()->create($tierData);
            }

            DB::commit();
            return $package->load(['components', 'options', 'pricingTiers']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update package with related entities
     */
    public function updatePackage(Package $package, array $packageData, array $components = [], array $options = [], array $tiers = []): Package
    {
        DB::beginTransaction();
        try {
            $package->update($packageData);

            // Update components (delete and recreate for simplicity)
            $package->components()->delete();
            foreach ($components as $componentData) {
                $package->components()->create($componentData);
            }

            // Update options
            $package->options()->delete();
            foreach ($options as $optionData) {
                $package->options()->create($optionData);
            }

            // Update pricing tiers
            $package->pricingTiers()->delete();
            foreach ($tiers as $tierData) {
                $package->pricingTiers()->create($tierData);
            }

            DB::commit();
            return $package->load(['components', 'options', 'pricingTiers']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}

