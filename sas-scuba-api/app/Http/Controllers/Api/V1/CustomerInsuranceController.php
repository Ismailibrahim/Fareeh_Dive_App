<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\CustomerInsurance;

class CustomerInsuranceController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = CustomerInsurance::query();

            if ($request->has('customer_id')) {
                $query->where('customer_id', $request->customer_id);
            }

            return $query->with('customer')->latest()->get();
        } catch (\Exception $e) {
            Log::error('Error fetching customer insurances: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to fetch insurances',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while fetching insurances'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'customer_id' => 'required|exists:customers,id',
                'insurance_provider' => 'nullable|string',
                'insurance_no' => 'nullable|string',
                'insurance_hotline_no' => 'nullable|string',
                'file_url' => 'nullable|string',
                'expiry_date' => 'nullable|date',
                'status' => 'nullable|boolean',
            ]);

            $insurance = CustomerInsurance::create($validated);
            
            // Load customer relationship safely
            try {
                $insurance->load('customer');
            } catch (\Exception $e) {
                Log::warning('Could not load customer relationship: ' . $e->getMessage());
            }
            
            return response()->json($insurance, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating customer insurance: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            Log::error('Request data: ' . json_encode($request->all()));
            return response()->json([
                'message' => 'Failed to create insurance',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while creating the insurance'
            ], 500);
        }
    }

    public function show($id)
    {
        return CustomerInsurance::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $insurance = CustomerInsurance::findOrFail($id);

        $validated = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'insurance_provider' => 'nullable|string',
            'insurance_no' => 'nullable|string',
            'insurance_hotline_no' => 'nullable|string',
            'file_url' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'status' => 'nullable|boolean',
        ]);

        $insurance->update($validated);
        return response()->json($insurance);
    }

    public function destroy($id)
    {
        $insurance = CustomerInsurance::findOrFail($id);
        $insurance->delete();
        return response()->json(null, 204);
    }
}
