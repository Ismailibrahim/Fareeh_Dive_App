<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EmergencyContact;
use App\Models\Customer;
use Illuminate\Http\Request;

class EmergencyContactController extends Controller
{
    /**
     * Display a listing of all emergency contacts.
     */
    public function listAll(Request $request)
    {
        $query = EmergencyContact::query();

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        return $query->with('customer')->latest()->get();
    }

    /**
     * Display a listing of emergency contacts for a customer.
     */
    public function index(Request $request, Customer $customer)
    {
        return $customer->emergencyContacts()->get();
    }

    /**
     * Store a newly created emergency contact.
     */
    public function store(Request $request, Customer $customer)
    {
        // If this is marked as primary, unset other primary contacts
        if ($request->input('is_primary', false)) {
            $customer->emergencyContacts()->update(['is_primary' => false]);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone_1' => 'nullable|string|max:50',
            'phone_2' => 'nullable|string|max:50',
            'phone_3' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'relationship' => 'nullable|string|max:100',
            'is_primary' => 'nullable|boolean',
        ]);

        $validated['customer_id'] = $customer->id;
        $emergencyContact = EmergencyContact::create($validated);

        return response()->json($emergencyContact, 201);
    }

    /**
     * Display the specified emergency contact.
     */
    public function show(Customer $customer, EmergencyContact $emergencyContact)
    {
        // Ensure the emergency contact belongs to the customer
        if ($emergencyContact->customer_id !== $customer->id) {
            return response()->json(['message' => 'Emergency contact not found'], 404);
        }

        return $emergencyContact;
    }

    /**
     * Update the specified emergency contact.
     */
    public function update(Request $request, Customer $customer, EmergencyContact $emergencyContact)
    {
        // Ensure the emergency contact belongs to the customer
        if ($emergencyContact->customer_id !== $customer->id) {
            return response()->json(['message' => 'Emergency contact not found'], 404);
        }

        // If this is marked as primary, unset other primary contacts
        if ($request->input('is_primary', false)) {
            $customer->emergencyContacts()
                ->where('id', '!=', $emergencyContact->id)
                ->update(['is_primary' => false]);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone_1' => 'nullable|string|max:50',
            'phone_2' => 'nullable|string|max:50',
            'phone_3' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'relationship' => 'nullable|string|max:100',
            'is_primary' => 'nullable|boolean',
        ]);

        $emergencyContact->update($validated);
        return response()->json($emergencyContact);
    }

    /**
     * Remove the specified emergency contact.
     */
    public function destroy(Customer $customer, EmergencyContact $emergencyContact)
    {
        // Ensure the emergency contact belongs to the customer
        if ($emergencyContact->customer_id !== $customer->id) {
            return response()->json(['message' => 'Emergency contact not found'], 404);
        }

        $emergencyContact->delete();
        return response()->noContent();
    }
}

