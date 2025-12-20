<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    use AuthorizesDiveCenterAccess;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Select only needed columns for better performance
        $query = Customer::select('id', 'full_name', 'email', 'phone', 'passport_no', 'nationality', 'gender', 'date_of_birth', 'dive_center_id', 'created_at', 'updated_at')
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
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge(['dive_center_id' => $request->user()->dive_center_id]);

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'passport_no' => 'nullable|string|max:50',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string',
            'nationality' => 'nullable|string',
            'dive_center_id' => 'required|exists:dive_centers,id',
        ]);

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
        
        $customer->load('emergencyContacts');
        return $customer;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Customer $customer)
    {
        // Verify customer belongs to user's dive center
        $this->authorizeDiveCenterAccess($customer, 'Unauthorized access to this customer');
        
        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'passport_no' => 'nullable|string|max:50',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string',
            'nationality' => 'nullable|string',
        ]);

        $customer->update($validated);
        return response()->json($customer);
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
}
