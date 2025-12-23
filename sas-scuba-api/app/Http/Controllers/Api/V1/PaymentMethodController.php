<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    use AuthorizesDiveCenterAccess;

    /**
     * Display a listing of payment methods for the current dive center.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $query = PaymentMethod::where('dive_center_id', $diveCenterId);

        // Filter by method type if provided
        if ($request->has('method_type')) {
            $query->where('method_type', $request->input('method_type'));
        }

        // Filter by active status if provided
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        } else {
            // By default, show only active payment methods
            $query->where('is_active', true);
        }

        return $query->orderBy('method_type')->orderBy('name')->get();
    }

    /**
     * Store a newly created payment method.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'method_type' => 'required|in:Bank Transfer,Crypto,Credit Card,Wallet,Cash',
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
        ]);

        $paymentMethod = PaymentMethod::create([
            'dive_center_id' => $diveCenterId,
            'method_type' => $validated['method_type'],
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
            'settings' => $validated['settings'] ?? null,
        ]);

        return response()->json($paymentMethod, 201);
    }

    /**
     * Display the specified payment method.
     */
    public function show(Request $request, PaymentMethod $paymentMethod)
    {
        $this->authorizeDiveCenterAccess($paymentMethod, 'Unauthorized access to this payment method');

        return response()->json($paymentMethod);
    }

    /**
     * Update the specified payment method.
     */
    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $this->authorizeDiveCenterAccess($paymentMethod, 'Unauthorized access to this payment method');

        $validated = $request->validate([
            'method_type' => 'sometimes|in:Bank Transfer,Crypto,Credit Card,Wallet,Cash',
            'name' => 'sometimes|string|max:255',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
        ]);

        $paymentMethod->update($validated);

        return response()->json($paymentMethod);
    }

    /**
     * Remove the specified payment method.
     */
    public function destroy(Request $request, PaymentMethod $paymentMethod)
    {
        $this->authorizeDiveCenterAccess($paymentMethod, 'Unauthorized access to this payment method');

        // Check if payment method is being used
        if ($paymentMethod->payments()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete payment method that has been used in payments'
            ], 422);
        }

        $paymentMethod->delete();

        return response()->noContent();
    }
}
