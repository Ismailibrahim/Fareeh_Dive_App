<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\CustomerCertification;

class CustomerCertificationController extends Controller
{
    public function index(Request $request)
    {
        $query = CustomerCertification::query();

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        return $query->with('customer')->latest()->get();
    }

    public function store(Request $request)
    {
        try {
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

    public function show($id)
    {
        return CustomerCertification::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $certification = CustomerCertification::findOrFail($id);

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

        $certification->update($validated);
        return response()->json($certification);
    }

    public function destroy($id)
    {
        $certification = CustomerCertification::findOrFail($id);
        $certification->delete();
        return response()->json(null, 204);
    }
}
