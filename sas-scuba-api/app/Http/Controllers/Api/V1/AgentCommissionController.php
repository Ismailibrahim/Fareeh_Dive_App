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
        ]);
        
        if (isset($validated['status']) && $validated['status'] === 'Paid' && !$commission->paid_at) {
            $validated['paid_at'] = now();
        }
        
        $commission->update($validated);
        
        return response()->json($commission->load(['agent', 'invoice']));
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
