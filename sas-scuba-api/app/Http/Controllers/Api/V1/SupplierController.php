<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    use AuthorizesDiveCenterAccess;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = Supplier::query();

            if ($user && $user->dive_center_id) {
                $query->where('dive_center_id', $user->dive_center_id);
            }

            // Filter by status if provided
            if ($request->has('status') && $request->get('status')) {
                $query->where('status', $request->get('status'));
            }

            // Search functionality
            if ($request->has('search') && !empty($request->get('search'))) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('contact_no', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%");
                });
            }

            return $query->orderBy('name')->get();
        } catch (\Exception $e) {
            Log::error('Supplier index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'error' => 'Failed to fetch suppliers',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred while fetching suppliers'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $diveCenterId = $request->user()->dive_center_id;
        $request->merge(['dive_center_id' => $diveCenterId]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('suppliers', 'name')->where('dive_center_id', $diveCenterId)
            ],
            'address' => 'nullable|string',
            'contact_no' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'gst_tin' => 'nullable|string|max:255',
            'currency' => ['nullable', Rule::in(['USD', 'MVR'])],
            'status' => ['nullable', Rule::in(['Active', 'Suspended'])],
            'dive_center_id' => 'required|exists:dive_centers,id',
        ]);

        // Set default values
        $validated['currency'] = $validated['currency'] ?? 'MVR';
        $validated['status'] = $validated['status'] ?? 'Active';

        $supplier = Supplier::create($validated);
        return response()->json($supplier, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Supplier $supplier)
    {
        // Verify supplier belongs to user's dive center
        $this->authorizeDiveCenterAccess($supplier, 'Unauthorized access to this supplier');

        return $supplier;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Supplier $supplier)
    {
        // Verify supplier belongs to user's dive center
        $this->authorizeDiveCenterAccess($supplier, 'Unauthorized access to this supplier');

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('suppliers', 'name')
                    ->ignore($supplier->id)
                    ->where('dive_center_id', $supplier->dive_center_id)
            ],
            'address' => 'nullable|string',
            'contact_no' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'gst_tin' => 'nullable|string|max:255',
            'currency' => ['nullable', Rule::in(['USD', 'MVR'])],
            'status' => ['nullable', Rule::in(['Active', 'Suspended'])],
        ]);

        $supplier->update($validated);
        return response()->json($supplier);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier)
    {
        // Verify supplier belongs to user's dive center
        $this->authorizeDiveCenterAccess($supplier, 'Unauthorized access to this supplier');

        $supplier->delete();
        return response()->noContent();
    }
}
