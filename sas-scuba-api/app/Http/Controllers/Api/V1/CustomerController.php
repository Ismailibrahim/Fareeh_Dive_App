<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    use AuthorizesDiveCenterAccess;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            // Check if departure_flight_time column exists
            $hasFlightTimeColumn = Schema::hasColumn('customers', 'departure_flight_time');
            
            // Build select columns - conditionally include departure_flight_time
            $columns = ['id', 'full_name', 'email', 'phone', 'address', 'city', 'zip_code', 'country', 'passport_no', 'nationality', 'gender', 'date_of_birth', 'departure_date', 'departure_flight', 'departure_to', 'agent_id', 'dive_center_id', 'created_at', 'updated_at'];
            
            if ($hasFlightTimeColumn) {
                $columns[] = 'departure_flight_time';
            }
            
            // Select only needed columns for better performance
            $query = Customer::select($columns)
                ->where('dive_center_id', $user->dive_center_id);
            
            // Add server-side search with sanitization
            if ($request->has('search') && !empty($request->get('search'))) {
                $search = $request->get('search');
                // Sanitize search input: remove special characters except spaces, @, ., and -
                $search = preg_replace('/[^a-zA-Z0-9\s@.-]/', '', $search);
                // Limit search length to prevent abuse
                $search = substr($search, 0, 100);
                // Trim whitespace
                $search = trim($search);
                
                if (!empty($search)) {
                    $query->where(function($q) use ($search) {
                        $q->where('full_name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('passport_no', 'like', "%{$search}%");
                    });
                }
            }
            
            // Get pagination parameters
            $perPage = $request->get('per_page', 20);
            $perPage = min(max($perPage, 1), 100); // Limit between 1 and 100
            
            return $query->orderBy('created_at', 'desc')->paginate($perPage);
        } catch (\Exception $e) {
            Log::error('Error fetching customers: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch customers',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while fetching customers'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge(['dive_center_id' => $request->user()->dive_center_id]);

        // Convert empty string to null for departure_flight_time before validation
        if ($request->has('departure_flight_time') && $request->input('departure_flight_time') === '') {
            $request->merge(['departure_flight_time' => null]);
        }

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'zip_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:255',
            'passport_no' => 'nullable|string|max:50',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string',
            'nationality' => 'nullable|string',
            'departure_date' => 'nullable|date',
            'departure_flight' => 'nullable|string|max:255',
            'departure_flight_time' => 'nullable|string|regex:/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/',
            'departure_to' => 'nullable|string|max:255',
            'agent_id' => 'nullable|exists:agents,id',
            'dive_center_id' => 'required|exists:dive_centers,id',
        ]);

        // Validate agent belongs to same dive center if provided
        if (isset($validated['agent_id'])) {
            $agent = \App\Models\Agent::where('id', $validated['agent_id'])
                ->where('dive_center_id', $validated['dive_center_id'])
                ->first();
            
            if (!$agent) {
                return response()->json([
                    'message' => 'Agent does not belong to your dive center'
                ], 422);
            }
        }

        $customer = Customer::create($validated);
        return response()->json($customer, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Customer $customer)
    {
        // Verify customer belongs to user's dive center
        $this->authorizeDiveCenterAccess($customer, 'Unauthorized access to this customer');
        
        $customer->load(['emergencyContacts', 'agent:id,agent_name']);
        return $customer;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Customer $customer)
    {
        try {
            // Verify customer belongs to user's dive center
            $this->authorizeDiveCenterAccess($customer, 'Unauthorized access to this customer');
            
            // Convert empty string to null for departure_flight_time before validation
            if ($request->has('departure_flight_time')) {
                $flightTime = $request->input('departure_flight_time');
                if ($flightTime === '' || $flightTime === null) {
                    $request->merge(['departure_flight_time' => null]);
                }
            }
            
            $validated = $request->validate([
                'full_name' => 'sometimes|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:50',
                'address' => 'nullable|string',
                'city' => 'nullable|string|max:255',
                'zip_code' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:255',
                'passport_no' => 'nullable|string|max:50',
                'date_of_birth' => 'nullable|date',
                'gender' => 'nullable|string',
                'nationality' => 'nullable|string',
                'departure_date' => 'nullable|date',
                'departure_flight' => 'nullable|string|max:255',
                'departure_flight_time' => ['nullable', 'string', function ($attribute, $value, $fail) {
                    if ($value !== null && $value !== '' && !preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $value)) {
                        $fail('The ' . $attribute . ' must be in HH:MM format (24-hour).');
                    }
                }],
                'departure_to' => 'nullable|string|max:255',
                'agent_id' => 'nullable|exists:agents,id',
            ]);

            // Validate agent belongs to same dive center if provided
            if (isset($validated['agent_id'])) {
                $agent = \App\Models\Agent::where('id', $validated['agent_id'])
                    ->where('dive_center_id', $customer->dive_center_id)
                    ->first();
                
                if (!$agent) {
                    return response()->json([
                        'message' => 'Agent does not belong to your dive center'
                    ], 422);
                }
            }

            $customer->update($validated);
            return response()->json($customer);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating customer: ' . $e->getMessage(), [
                'customer_id' => $customer->id,
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'Failed to update customer',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while updating the customer'
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        // Verify customer belongs to user's dive center
        $this->authorizeDiveCenterAccess($customer, 'Unauthorized access to this customer');
        
        $customer->delete();
        return response()->noContent();
    }

    /**
     * Bulk assign agent to multiple customers.
     */
    public function bulkAssignAgent(Request $request)
    {
        try {
            $user = $request->user();
            $diveCenterId = $user->dive_center_id;

            if (!$diveCenterId) {
                return response()->json([
                    'message' => 'Dive center not found'
                ], 400);
            }

            $validated = $request->validate([
                'customer_ids' => 'required|array|min:1',
                'customer_ids.*' => 'required|exists:customers,id',
                'agent_id' => 'nullable|exists:agents,id',
            ]);

            $customerIds = $validated['customer_ids'];
            $agentId = $validated['agent_id'] ?? null;

            // Validate agent belongs to same dive center if provided
            if ($agentId !== null) {
                $agent = \App\Models\Agent::where('id', $agentId)
                    ->where('dive_center_id', $diveCenterId)
                    ->first();
                
                if (!$agent) {
                    return response()->json([
                        'message' => 'Agent does not belong to your dive center'
                    ], 422);
                }
            }

            // Fetch all customers and verify they belong to the dive center
            $customers = Customer::whereIn('id', $customerIds)
                ->where('dive_center_id', $diveCenterId)
                ->get();

            if ($customers->count() !== count($customerIds)) {
                return response()->json([
                    'message' => 'One or more customers do not belong to your dive center or do not exist'
                ], 422);
            }

            // Update all customers in a transaction
            DB::beginTransaction();
            
            $successCount = 0;
            $errors = [];

            foreach ($customers as $customer) {
                try {
                    $customer->update(['agent_id' => $agentId]);
                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'customer_id' => $customer->id,
                        'error' => $e->getMessage()
                    ];
                    Log::error('Error updating customer agent', [
                        'customer_id' => $customer->id,
                        'agent_id' => $agentId,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success_count' => $successCount,
                'failed_count' => count($errors),
                'errors' => $errors,
                'message' => "Successfully assigned agent to {$successCount} customer(s)"
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in bulk assign agent: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'Failed to assign agent',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while assigning agent'
            ], 500);
        }
    }
}
