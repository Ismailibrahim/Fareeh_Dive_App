<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\CustomerCertification;

class CustomerCertificationController extends Controller
{
    use AuthorizesDiveCenterAccess;
    public function index(Request $request)
    {
        $user = $request->user();
        $query = CustomerCertification::query();

        // Filter by dive center (via customer relationship)
        if ($user->dive_center_id) {
            $query->whereHas('customer', function($q) use ($user) {
                $q->where('dive_center_id', $user->dive_center_id);
            });
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        return $query->with('customer')->latest()->get();
    }

    public function store(Request $request)
    {
        try {
            $user = $request->user();
            
            $validated = $request->validate([
                'customer_id' => 'required|exists:customers,id',
                'certification_name' => 'required|string',
                'certification_no' => 'nullable|string',
                'certification_date' => 'required|date',
                'expiry_date' => 'nullable|date',
                'agency' => 'nullable|string',
                'instructor' => 'nullable|string',
                'file_url' => 'nullable|string',
                'license_status' => 'nullable|boolean',
            ]);

            // Verify customer belongs to user's dive center
            $customer = \App\Models\Customer::findOrFail($validated['customer_id']);
            $this->authorizeDiveCenterAccess($customer, 'Customer does not belong to your dive center');

            $certification = CustomerCertification::create($validated);
            
            // Load customer relationship safely
            try {
                $certification->load('customer');
            } catch (\Exception $e) {
                Log::warning('Could not load customer relationship: ' . $e->getMessage());
            }
            
            return response()->json($certification, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating customer certification: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            Log::error('Request data: ' . json_encode($request->all()));
            return response()->json([
                'message' => 'Failed to create certification',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while creating the certification'
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        $certification = CustomerCertification::with('customer')->findOrFail($id);
        
        // Verify certification belongs to user's dive center (via customer relationship)
        if (!$certification->customer) {
            abort(404, 'Certification not found');
        }
        $this->authorizeDiveCenterAccess($certification->customer, 'Unauthorized access to this certification');
        
        return $certification;
    }

    public function update(Request $request, $id)
    {
        $certification = CustomerCertification::with('customer')->findOrFail($id);
        
        // Verify certification belongs to user's dive center (via customer relationship)
        if (!$certification->customer) {
            abort(404, 'Certification not found');
        }
        $this->authorizeDiveCenterAccess($certification->customer, 'Unauthorized access to this certification');

        $validated = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'certification_name' => 'sometimes|string',
            'certification_no' => 'nullable|string',
            'certification_date' => 'sometimes|date',
            'expiry_date' => 'nullable|date',
            'agency' => 'nullable|string',
            'instructor' => 'nullable|string',
            'file_url' => 'nullable|string',
            'license_status' => 'nullable|boolean',
        ]);

        // If customer_id is being changed, verify new customer belongs to user's dive center
        if (isset($validated['customer_id']) && $validated['customer_id'] != $certification->customer_id) {
            $newCustomer = \App\Models\Customer::findOrFail($validated['customer_id']);
            $this->authorizeDiveCenterAccess($newCustomer, 'Customer does not belong to your dive center');
        }

        $certification->update($validated);
        return response()->json($certification);
    }

    public function destroy(Request $request, $id)
    {
        $certification = CustomerCertification::with('customer')->findOrFail($id);
        
        // Verify certification belongs to user's dive center (via customer relationship)
        if (!$certification->customer) {
            abort(404, 'Certification not found');
        }
        $this->authorizeDiveCenterAccess($certification->customer, 'Unauthorized access to this certification');
        
        $certification->delete();
        return response()->json(null, 204);
    }
}
