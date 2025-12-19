<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\CustomerAccommodation;

class CustomerAccommodationController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = CustomerAccommodation::query();

            if ($request->has('customer_id')) {
                $query->where('customer_id', $request->customer_id);
            }

            return $query->with('customer')->latest()->get();
        } catch (\Exception $e) {
            Log::error('Error fetching customer accommodations: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to fetch accommodations',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while fetching accommodations'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'customer_id' => 'required|exists:customers,id',
                'name' => 'nullable|string',
                'address' => 'nullable|string',
                'contact_no' => 'nullable|string',
                'island' => 'nullable|string',
                'room_no' => 'nullable|string',
            ]);

            $accommodation = CustomerAccommodation::create($validated);
            
            // Load customer relationship safely
            try {
                $accommodation->load('customer');
            } catch (\Exception $e) {
                Log::warning('Could not load customer relationship: ' . $e->getMessage());
            }
            
            return response()->json($accommodation, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating customer accommodation: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            Log::error('Request data: ' . json_encode($request->all()));
            return response()->json([
                'message' => 'Failed to create accommodation',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while creating the accommodation'
            ], 500);
        }
    }

    public function show($id)
    {
        return CustomerAccommodation::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $accommodation = CustomerAccommodation::findOrFail($id);

        $validated = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'name' => 'nullable|string',
            'address' => 'nullable|string',
            'contact_no' => 'nullable|string',
            'island' => 'nullable|string',
        ]);

        $accommodation->update($validated);
        return response()->json($accommodation);
    }

    public function destroy($id)
    {
        $accommodation = CustomerAccommodation::findOrFail($id);
        $accommodation->delete();
        return response()->json(null, 204);
    }
}
