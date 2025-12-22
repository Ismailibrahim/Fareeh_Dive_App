<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DiveCenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DiveCenterController extends Controller
{
    /**
     * Get current user's dive center.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        return response()->json($user->diveCenter);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        $user = $request->user();
        $diveCenter = $user->diveCenter;

        if (!$diveCenter) {
            return response()->json(['message' => 'No associated dive center found.'], 404);
        }

        // Validate all profile fields (all optional to allow partial updates)
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string|max:1000',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'zip' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:255',
            'timezone' => 'nullable|string|max:255',
            'currency' => 'nullable|string|max:10',
            'settings' => 'nullable|array', // JSON field
        ]);

        // Merge existing settings with new ones if provided
        if ($request->has('settings')) {
            $existingSettings = $diveCenter->settings ?? [];
            $newSettings = $request->settings;
            // Ensure both are arrays before merging
            $existingSettings = is_array($existingSettings) ? $existingSettings : [];
            $newSettings = is_array($newSettings) ? $newSettings : [];
            
            $validated['settings'] = array_merge($existingSettings, $newSettings);
        }

        // Only update fields that are provided (partial update)
        // Remove null values but keep empty strings, 0, false, etc.
        $updateData = [];
        foreach ($validated as $key => $value) {
            if ($value !== null || $key === 'settings') {
                $updateData[$key] = $value;
            }
        }

        $diveCenter->update($updateData);

        return response()->json([
            'message' => 'Dive Center settings updated successfully.',
            'dive_center' => $diveCenter
        ]);
    }

    /**
     * Get currency rates for the dive center.
     */
    public function getCurrencyRates(Request $request)
    {
        $user = $request->user();
        $diveCenter = $user->diveCenter;

        if (!$diveCenter) {
            return response()->json(['message' => 'Dive center not found'], 404);
        }

        $rates = $diveCenter->getCurrencyRates();

        return response()->json([
            'base_currency' => $diveCenter->currency,
            'currency_rates' => $rates,
        ]);
    }

    /**
     * Update currency rates for the dive center.
     */
    public function updateCurrencyRates(Request $request)
    {
        $user = $request->user();
        $diveCenter = $user->diveCenter;

        if (!$diveCenter) {
            return response()->json(['message' => 'Dive center not found'], 404);
        }

        $validated = $request->validate([
            'currency_rates' => 'required|array',
            'currency_rates.*' => 'required|numeric|min:0',
        ]);

        // Validate currency codes are 3 uppercase letters
        foreach (array_keys($validated['currency_rates']) as $currency) {
            if (!preg_match('/^[A-Z]{3}$/', $currency)) {
                return response()->json([
                    'message' => "Invalid currency code: {$currency}. Must be 3 uppercase letters."
                ], 422);
            }
        }

        $diveCenter->setCurrencyRates($validated['currency_rates']);
        $diveCenter->save();

        return response()->json([
            'message' => 'Currency rates updated successfully.',
            'base_currency' => $diveCenter->currency,
            'currency_rates' => $diveCenter->getCurrencyRates(),
        ]);
    }

    /**
     * Get available currencies for the dive center.
     */
    public function getAvailableCurrencies(Request $request)
    {
        $user = $request->user();
        $diveCenter = $user->diveCenter;

        if (!$diveCenter) {
            return response()->json(['message' => 'Dive center not found'], 404);
        }

        $currencies = $diveCenter->getAvailableCurrencies();

        return response()->json([
            'base_currency' => $diveCenter->currency,
            'available_currencies' => $currencies,
        ]);
    }
}
