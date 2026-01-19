<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user || !$user->dive_center_id) {
                return response()->json(['error' => 'User dive center not found'], 400);
            }
            
            $query = Agent::where('dive_center_id', $user->dive_center_id);
            
            // Search
            if ($request->has('search') && !empty($request->get('search'))) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('agent_name', 'like', "%{$search}%")
                      ->orWhere('brand_name', 'like', "%{$search}%")
                      ->orWhere('country', 'like', "%{$search}%")
                      ->orWhere('city', 'like', "%{$search}%");
                });
            }
            
            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->get('status'));
            }
            
            // Filter by type
            if ($request->has('agent_type')) {
                $query->where('agent_type', $request->get('agent_type'));
            }
            
            // Filter by country
            if ($request->has('country')) {
                $query->where('country', $request->get('country'));
            }
            
            $perPage = $request->get('per_page', 20);
            $perPage = min(max($perPage, 1), 100);
            
            $agents = $query->with(['contacts', 'commercialTerms', 'billingInfo', 'contract', 'tags'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);
            
            // Manually add performance metrics to avoid accessor issues
            $agents->getCollection()->transform(function ($agent) {
                try {
                    $agent->total_clients_referred = $agent->bookings()->distinct('customer_id')->count('customer_id');
                    $agent->total_revenue_generated = (float) $agent->invoices()->sum('total');
                } catch (\Exception $e) {
                    $agent->total_clients_referred = 0;
                    $agent->total_revenue_generated = 0;
                }
                return $agent;
            });
            
            return $agents;
        } catch (\Exception $e) {
            \Log::error('Agent index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to fetch agents: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'agent_name' => 'required|string|max:255',
            'agent_type' => 'required|in:Travel Agent,Resort / Guest House,Tour Operator,Freelancer',
            'country' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'status' => 'sometimes|in:Active,Suspended',
            'brand_name' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'notes' => 'nullable|string',
            
            // Contact data
            'contact' => 'sometimes|array',
            'contact.contact_person_name' => 'required_with:contact|string|max:255',
            'contact.email' => 'required_with:contact|email|max:255',
            'contact.job_title' => 'nullable|string|max:255',
            'contact.phone' => 'nullable|string|max:50',
            'contact.secondary_contact' => 'nullable|string|max:255',
            'contact.preferred_communication_method' => 'nullable|in:Email,Phone,WhatsApp,Other',
            
            // Commercial terms
            'commercial_terms' => 'sometimes|array',
            'commercial_terms.commission_type' => 'required_with:commercial_terms|in:Percentage,Fixed Amount',
            'commercial_terms.commission_rate' => 'required_with:commercial_terms|numeric|min:0',
            'commercial_terms.currency' => 'required_with:commercial_terms|string|max:10',
            'commercial_terms.vat_applicable' => 'nullable|boolean',
            'commercial_terms.tax_registration_no' => 'nullable|string|max:255',
            'commercial_terms.payment_terms' => 'required_with:commercial_terms|in:Prepaid,Weekly,Monthly,On Invoice',
            'commercial_terms.credit_limit' => 'nullable|numeric|min:0',
            'commercial_terms.exclude_equipment_from_commission' => 'nullable|boolean',
            'commercial_terms.include_manual_items_in_commission' => 'nullable|boolean',
            
            // Billing info
            'billing_info' => 'sometimes|array',
            'billing_info.company_legal_name' => 'nullable|string|max:255',
            'billing_info.billing_address' => 'nullable|string',
            'billing_info.invoice_email' => 'nullable|email|max:255',
            'billing_info.bank_name' => 'nullable|string|max:255',
            'billing_info.account_name' => 'nullable|string|max:255',
            'billing_info.account_number' => 'nullable|string|max:255',
            'billing_info.swift_iban' => 'nullable|string|max:255',
            'billing_info.payment_method' => 'nullable|in:Bank Transfer,Cash,Online',
            
            // Contract
            'contract' => 'sometimes|array',
            'contract.contract_start_date' => 'nullable|date',
            'contract.contract_end_date' => 'nullable|date|after_or_equal:contract.contract_start_date',
            'contract.commission_valid_from' => 'nullable|date',
            'contract.commission_valid_until' => 'nullable|date|after_or_equal:contract.commission_valid_from',
            'contract.signed_agreement_url' => 'nullable|string|max:500',
            'contract.special_conditions' => 'nullable|string',
            
            // Tags
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
        ]);
        
        try {
            DB::beginTransaction();
            
            // Create agent
            $agent = Agent::create([
                'dive_center_id' => $user->dive_center_id,
                'agent_name' => $validated['agent_name'],
                'agent_type' => $validated['agent_type'],
                'country' => $validated['country'],
                'city' => $validated['city'],
                'status' => $validated['status'] ?? 'Active',
                'brand_name' => $validated['brand_name'] ?? null,
                'website' => $validated['website'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);
            
            // Create contact
            if (isset($validated['contact'])) {
                $agent->contacts()->create($validated['contact']);
            }
            
            // Create commercial terms
            if (isset($validated['commercial_terms'])) {
                $agent->commercialTerms()->create($validated['commercial_terms']);
            }
            
            // Create billing info
            if (isset($validated['billing_info'])) {
                $agent->billingInfo()->create($validated['billing_info']);
            }
            
            // Create contract
            if (isset($validated['contract'])) {
                $agent->contract()->create($validated['contract']);
            }
            
            // Attach tags
            if (isset($validated['tag_ids'])) {
                $agent->tags()->sync($validated['tag_ids']);
            }
            
            DB::commit();
            
            return response()->json($agent->load(['contacts', 'commercialTerms', 'billingInfo', 'contract', 'tags']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create agent: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Agent $agent)
    {
        $agent->load(['contacts', 'commercialTerms', 'billingInfo', 'contract', 'tags', 'diveCenter']);
        
        // Add performance metrics
        $agent->total_clients_referred = $agent->total_clients_referred;
        $agent->total_dives_booked = $agent->total_dives_booked;
        $agent->total_revenue_generated = $agent->total_revenue_generated;
        $agent->total_commission_earned = $agent->total_commission_earned;
        $agent->average_revenue_per_client = $agent->average_revenue_per_client;
        $agent->last_booking_date = $agent->last_booking_date;
        $agent->active_clients_last_30_days = $agent->active_clients_last_30_days;
        $agent->active_clients_last_90_days = $agent->active_clients_last_90_days;
        
        return $agent;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Agent $agent)
    {
        $validated = $request->validate([
            'agent_name' => 'sometimes|string|max:255',
            'agent_type' => 'sometimes|in:Travel Agent,Resort / Guest House,Tour Operator,Freelancer',
            'country' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:Active,Suspended',
            'brand_name' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'notes' => 'nullable|string',
            
            // Contact data
            'contact' => 'sometimes|array',
            'contact.contact_person_name' => 'required_with:contact|string|max:255',
            'contact.email' => 'required_with:contact|email|max:255',
            'contact.job_title' => 'nullable|string|max:255',
            'contact.phone' => 'nullable|string|max:50',
            'contact.secondary_contact' => 'nullable|string|max:255',
            'contact.preferred_communication_method' => 'nullable|in:Email,Phone,WhatsApp,Other',
            
            // Commercial terms
            'commercial_terms' => 'sometimes|array',
            'commercial_terms.commission_type' => 'required_with:commercial_terms|in:Percentage,Fixed Amount',
            'commercial_terms.commission_rate' => 'required_with:commercial_terms|numeric|min:0',
            'commercial_terms.currency' => 'required_with:commercial_terms|string|max:10',
            'commercial_terms.vat_applicable' => 'nullable|boolean',
            'commercial_terms.tax_registration_no' => 'nullable|string|max:255',
            'commercial_terms.payment_terms' => 'required_with:commercial_terms|in:Prepaid,Weekly,Monthly,On Invoice',
            'commercial_terms.credit_limit' => 'nullable|numeric|min:0',
            'commercial_terms.exclude_equipment_from_commission' => 'nullable|boolean',
            'commercial_terms.include_manual_items_in_commission' => 'nullable|boolean',
            
            // Billing info
            'billing_info' => 'sometimes|array',
            'billing_info.company_legal_name' => 'nullable|string|max:255',
            'billing_info.billing_address' => 'nullable|string',
            'billing_info.invoice_email' => 'nullable|email|max:255',
            'billing_info.bank_name' => 'nullable|string|max:255',
            'billing_info.account_name' => 'nullable|string|max:255',
            'billing_info.account_number' => 'nullable|string|max:255',
            'billing_info.swift_iban' => 'nullable|string|max:255',
            'billing_info.payment_method' => 'nullable|in:Bank Transfer,Cash,Online',
            
            // Contract
            'contract' => 'sometimes|array',
            'contract.contract_start_date' => 'nullable|date',
            'contract.contract_end_date' => 'nullable|date|after_or_equal:contract.contract_start_date',
            'contract.commission_valid_from' => 'nullable|date',
            'contract.commission_valid_until' => 'nullable|date|after_or_equal:contract.commission_valid_from',
            'contract.signed_agreement_url' => 'nullable|string|max:500',
            'contract.special_conditions' => 'nullable|string',
            
            // Tags
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
        ]);
        
        try {
            DB::beginTransaction();
            
            // Update agent
            $agent->update(array_filter([
                'agent_name' => $validated['agent_name'] ?? null,
                'agent_type' => $validated['agent_type'] ?? null,
                'country' => $validated['country'] ?? null,
                'city' => $validated['city'] ?? null,
                'status' => $validated['status'] ?? null,
                'brand_name' => $validated['brand_name'] ?? null,
                'website' => $validated['website'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ], fn($value) => $value !== null));
            
            // Update or create contact
            if (isset($validated['contact'])) {
                if ($agent->contacts()->exists()) {
                    $agent->contacts()->first()->update($validated['contact']);
                } else {
                    $agent->contacts()->create($validated['contact']);
                }
            }
            
            // Update or create commercial terms
            if (isset($validated['commercial_terms'])) {
                if ($agent->commercialTerms) {
                    $agent->commercialTerms()->update($validated['commercial_terms']);
                } else {
                    $agent->commercialTerms()->create($validated['commercial_terms']);
                }
            }
            
            // Update or create billing info
            if (isset($validated['billing_info'])) {
                if ($agent->billingInfo) {
                    $agent->billingInfo()->update($validated['billing_info']);
                } else {
                    $agent->billingInfo()->create($validated['billing_info']);
                }
            }
            
            // Update or create contract
            if (isset($validated['contract'])) {
                if ($agent->contract) {
                    $agent->contract()->update($validated['contract']);
                } else {
                    $agent->contract()->create($validated['contract']);
                }
            }
            
            // Sync tags
            if (isset($validated['tag_ids'])) {
                $agent->tags()->sync($validated['tag_ids']);
            }
            
            DB::commit();
            
            return response()->json($agent->load(['contacts', 'commercialTerms', 'billingInfo', 'contract', 'tags']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update agent: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Agent $agent)
    {
        // Check if agent has bookings or invoices
        if ($agent->bookings()->exists() || $agent->invoices()->exists()) {
            return response()->json([
                'error' => 'Cannot delete agent with existing bookings or invoices'
            ], 422);
        }
        
        $agent->delete();
        return response()->noContent();
    }
}
