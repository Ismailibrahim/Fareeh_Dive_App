<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AgentCommission;
use App\Models\Invoice;
use App\Services\AgentCommissionService;
use Illuminate\Http\Request;

class AgentCommissionController extends Controller
{
    protected $commissionService;

    public function __construct(AgentCommissionService $commissionService)
    {
        $this->commissionService = $commissionService;
    }

    /**
     * List all commissions (across all agents)
     */
    public function listAll(Request $request)
    {
        $user = $request->user();
        
        $query = AgentCommission::whereHas('agent', function($q) use ($user) {
            $q->where('dive_center_id', $user->dive_center_id);
        })
        ->with(['agent', 'invoice.booking.customer', 'invoice.customer', 'paymentMethod']);
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }
        
        // Filter by agent
        if ($request->has('agent_id')) {
            $query->where('agent_id', $request->get('agent_id'));
        }
        
        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('calculated_at', '>=', $request->get('date_from'));
        }
        if ($request->has('date_to')) {
            $query->whereDate('calculated_at', '<=', $request->get('date_to'));
        }
        
        // Search by invoice number or customer name
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->whereHas('invoice', function($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($q2) use ($search) {
                      $q2->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('booking.customer', function($q2) use ($search) {
                      $q2->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }
        
        $perPage = $request->get('per_page', 20);
        $perPage = min(max($perPage, 1), 100);
        
        return $query->orderBy('calculated_at', 'desc')->paginate($perPage);
    }

    /**
     * Get a single commission
     */
    public function show($id, Request $request)
    {
        $user = $request->user();
        $commission = AgentCommission::whereHas('agent', function($q) use ($user) {
            $q->where('dive_center_id', $user->dive_center_id);
        })
        ->with(['agent', 'invoice.booking.customer', 'invoice.customer', 'invoice.invoiceItems', 'paymentMethod'])
        ->findOrFail($id);
        
        return response()->json($commission);
    }

    /**
     * List commissions for an agent
     */
    public function index($agentId, Request $request)
    {
        $user = $request->user();
        $agent = Agent::where('dive_center_id', $user->dive_center_id)->findOrFail($agentId);
        
        $query = AgentCommission::where('agent_id', $agentId)
            ->with(['invoice.booking.customer']);
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }
        
        $perPage = $request->get('per_page', 20);
        $perPage = min(max($perPage, 1), 100);
        
        return $query->orderBy('calculated_at', 'desc')->paginate($perPage);
    }

    /**
     * Manually calculate commissions for invoices
     */
    public function calculate($agentId, Request $request)
    {
        $user = $request->user();
        $agent = Agent::where('dive_center_id', $user->dive_center_id)->findOrFail($agentId);
        
        $validated = $request->validate([
            'invoice_ids' => 'nullable|array',
            'invoice_ids.*' => 'exists:invoices,id',
        ]);
        
        $invoiceIds = $validated['invoice_ids'] ?? null;
        
        try {
            $commissions = $this->commissionService->calculateCommissionForAgent($agentId, $invoiceIds);
            
            return response()->json([
                'message' => 'Commissions calculated successfully',
                'commissions' => $commissions,
                'count' => count($commissions),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to calculate commissions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update commission status
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $commission = AgentCommission::whereHas('agent', function($q) use ($user) {
            $q->where('dive_center_id', $user->dive_center_id);
        })->findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'sometimes|in:Pending,Paid,Cancelled',
            'notes' => 'nullable|string',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'payment_reference' => 'nullable|string|max:255',
            'payment_notes' => 'nullable|string',
            'paid_at' => 'nullable|date',
        ]);
        
        if (isset($validated['status']) && $validated['status'] === 'Paid' && !$commission->paid_at) {
            $validated['paid_at'] = $validated['paid_at'] ?? now();
        }
        
        $commission->update($validated);
        
        return response()->json($commission->load(['agent', 'invoice', 'paymentMethod']));
    }

    /**
     * Cancel commission
     */
    public function destroy($id)
    {
        $user = request()->user();
        $commission = AgentCommission::whereHas('agent', function($q) use ($user) {
            $q->where('dive_center_id', $user->dive_center_id);
        })->findOrFail($id);
        
        $commission->update(['status' => 'Cancelled']);
        
        return response()->noContent();
    }
}
