<?php

namespace App\Services;

use App\Models\Agent;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\AgentCommission;
use Carbon\Carbon;

class AgentPerformanceService
{
    /**
     * Calculate total unique clients referred by agent
     */
    public function calculateTotalClientsReferred(int $agentId): int
    {
        return Booking::where('agent_id', $agentId)
            ->distinct('customer_id')
            ->count('customer_id');
    }

    /**
     * Calculate total dives booked through agent
     */
    public function calculateTotalDivesBooked(int $agentId): int
    {
        return Booking::where('agent_id', $agentId)
            ->withCount('bookingDives')
            ->get()
            ->sum('booking_dives_count');
    }

    /**
     * Calculate total revenue generated from agent's invoices
     */
    public function calculateTotalRevenueGenerated(int $agentId): float
    {
        return (float) Invoice::where('agent_id', $agentId)->sum('total');
    }

    /**
     * Calculate total commission earned by agent
     */
    public function calculateTotalCommissionEarned(int $agentId): float
    {
        return (float) AgentCommission::where('agent_id', $agentId)
            ->where('status', '!=', 'Cancelled')
            ->sum('commission_amount');
    }

    /**
     * Calculate average revenue per client
     */
    public function calculateAverageRevenuePerClient(int $agentId): float
    {
        $clientsCount = $this->calculateTotalClientsReferred($agentId);
        if ($clientsCount === 0) {
            return 0;
        }
        
        $revenue = $this->calculateTotalRevenueGenerated($agentId);
        return round($revenue / $clientsCount, 2);
    }

    /**
     * Get last booking date for agent
     */
    public function getLastBookingDate(int $agentId): ?string
    {
        $lastBooking = Booking::where('agent_id', $agentId)
            ->orderBy('booking_date', 'desc')
            ->first();
        
        return $lastBooking ? $lastBooking->booking_date->format('Y-m-d') : null;
    }

    /**
     * Get active clients count in last X days
     */
    public function getActiveClients(int $agentId, int $days): int
    {
        $date = Carbon::now()->subDays($days)->format('Y-m-d');
        
        return Booking::where('agent_id', $agentId)
            ->where('booking_date', '>=', $date)
            ->distinct('customer_id')
            ->count('customer_id');
    }
}

