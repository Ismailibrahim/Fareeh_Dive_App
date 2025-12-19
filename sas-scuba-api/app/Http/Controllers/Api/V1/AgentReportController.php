<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AgentCommission;
use App\Services\AgentPerformanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgentReportController extends Controller
{
    protected $performanceService;

    public function __construct(AgentPerformanceService $performanceService)
    {
        $this->performanceService = $performanceService;
    }

    /**
     * Get detailed performance metrics for an agent
     */
    public function performance($agentId, Request $request)
    {
        $user = $request->user();
        $agent = Agent::where('dive_center_id', $user->dive_center_id)->findOrFail($agentId);
        
        $metrics = [
            'total_clients_referred' => $this->performanceService->calculateTotalClientsReferred($agentId),
            'total_dives_booked' => $this->performanceService->calculateTotalDivesBooked($agentId),
            'total_revenue_generated' => $this->performanceService->calculateTotalRevenueGenerated($agentId),
            'total_commission_earned' => $this->performanceService->calculateTotalCommissionEarned($agentId),
            'average_revenue_per_client' => $this->performanceService->calculateAverageRevenuePerClient($agentId),
            'last_booking_date' => $this->performanceService->getLastBookingDate($agentId),
            'active_clients_last_30_days' => $this->performanceService->getActiveClients($agentId, 30),
            'active_clients_last_90_days' => $this->performanceService->getActiveClients($agentId, 90),
        ];
        
        return response()->json([
            'agent' => $agent->load(['contacts', 'commercialTerms', 'billingInfo', 'contract', 'tags']),
            'metrics' => $metrics,
        ]);
    }

    /**
     * Get top performing agents
     */
    public function topPerformers(Request $request)
    {
        $user = $request->user();
        $sortBy = $request->get('sort_by', 'revenue'); // revenue, clients, commission
        
        $query = Agent::where('dive_center_id', $user->dive_center_id)
            ->with(['contacts', 'commercialTerms']);
        
        $agents = $query->get()->map(function($agent) {
            return [
                'id' => $agent->id,
                'agent_name' => $agent->agent_name,
                'agent_type' => $agent->agent_type,
                'status' => $agent->status,
                'total_clients_referred' => $this->performanceService->calculateTotalClientsReferred($agent->id),
                'total_revenue_generated' => $this->performanceService->calculateTotalRevenueGenerated($agent->id),
                'total_commission_earned' => $this->performanceService->calculateTotalCommissionEarned($agent->id),
            ];
        });
        
        // Sort
        if ($sortBy === 'revenue') {
            $agents = $agents->sortByDesc('total_revenue_generated');
        } elseif ($sortBy === 'clients') {
            $agents = $agents->sortByDesc('total_clients_referred');
        } elseif ($sortBy === 'commission') {
            $agents = $agents->sortByDesc('total_commission_earned');
        }
        
        $limit = $request->get('limit', 10);
        return response()->json($agents->take($limit)->values());
    }

    /**
     * Get all pending commissions
     */
    public function commissionPayable(Request $request)
    {
        $user = $request->user();
        
        $commissions = AgentCommission::whereHas('agent', function($q) use ($user) {
            $q->where('dive_center_id', $user->dive_center_id);
        })
        ->where('status', 'Pending')
        ->with(['agent', 'invoice.booking.customer'])
        ->orderBy('calculated_at', 'desc')
        ->get();
        
        $total = $commissions->sum('commission_amount');
        
        return response()->json([
            'commissions' => $commissions,
            'total_amount' => $total,
            'count' => $commissions->count(),
        ]);
    }

    /**
     * Get monthly performance breakdown
     */
    public function monthlyPerformance($agentId, Request $request)
    {
        $user = $request->user();
        $agent = Agent::where('dive_center_id', $user->dive_center_id)->findOrFail($agentId);
        
        $year = $request->get('year', date('Y'));
        $month = $request->get('month', date('m'));
        
        $startDate = "{$year}-{$month}-01";
        $endDate = date('Y-m-t', strtotime($startDate));
        
        $bookings = $agent->bookings()
            ->whereBetween('booking_date', [$startDate, $endDate])
            ->with('customer')
            ->get();
        
        $invoices = $agent->invoices()
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->get();
        
        $commissions = $agent->commissions()
            ->whereBetween('calculated_at', [$startDate, $endDate])
            ->get();
        
        return response()->json([
            'period' => [
                'year' => $year,
                'month' => $month,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'bookings_count' => $bookings->count(),
            'clients_count' => $bookings->pluck('customer_id')->unique()->count(),
            'revenue' => $invoices->sum('total'),
            'commissions' => $commissions->sum('commission_amount'),
            'bookings' => $bookings,
        ]);
    }

    /**
     * Get dormant agents (no bookings in last X days)
     */
    public function dormantAgents(Request $request)
    {
        $user = $request->user();
        $days = $request->get('days', 90);
        
        $cutoffDate = now()->subDays($days)->format('Y-m-d');
        
        $agents = Agent::where('dive_center_id', $user->dive_center_id)
            ->where('status', 'Active')
            ->with(['contacts'])
            ->get()
            ->filter(function($agent) use ($cutoffDate) {
                $lastBooking = $agent->bookings()->orderBy('booking_date', 'desc')->first();
                if (!$lastBooking) {
                    return true; // No bookings at all
                }
                return $lastBooking->booking_date < $cutoffDate;
            })
            ->map(function($agent) {
                return [
                    'id' => $agent->id,
                    'agent_name' => $agent->agent_name,
                    'agent_type' => $agent->agent_type,
                    'last_booking_date' => $agent->bookings()->max('booking_date'),
                    'total_clients_referred' => $this->performanceService->calculateTotalClientsReferred($agent->id),
                ];
            });
        
        return response()->json($agents->values());
    }
}
