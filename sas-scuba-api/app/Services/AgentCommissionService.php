<?php

namespace App\Services;

use App\Models\Agent;
use App\Models\Invoice;
use App\Models\AgentCommission;
use App\Models\AgentCommercialTerm;
use App\Models\AgentContract;
use Carbon\Carbon;

class AgentCommissionService
{
    /**
     * Calculate commission for a specific invoice
     */
    public function calculateCommissionForInvoice(int $agentId, int $invoiceId): ?AgentCommission
    {
        $agent = Agent::findOrFail($agentId);
        $invoice = Invoice::findOrFail($invoiceId);
        
        // Check if agent matches invoice agent
        if ($invoice->agent_id !== $agentId) {
            throw new \Exception('Invoice does not belong to this agent');
        }
        
        // Check if commission already exists
        $existingCommission = AgentCommission::where('agent_id', $agentId)
            ->where('invoice_id', $invoiceId)
            ->first();
        
        if ($existingCommission && $existingCommission->status !== 'Cancelled') {
            throw new \Exception('Commission already calculated for this invoice');
        }
        
        // Get commercial terms
        $commercialTerms = $agent->commercialTerms;
        if (!$commercialTerms) {
            throw new \Exception('Agent has no commercial terms defined');
        }
        
        // Check contract validity
        $contract = $agent->contract;
        if ($contract) {
            $invoiceDate = Carbon::parse($invoice->invoice_date);
            
            if ($contract->commission_valid_from && $invoiceDate->lt(Carbon::parse($contract->commission_valid_from))) {
                throw new \Exception('Invoice date is before commission valid from date');
            }
            
            if ($contract->commission_valid_until && $invoiceDate->gt(Carbon::parse($contract->commission_valid_until))) {
                throw new \Exception('Invoice date is after commission valid until date');
            }
        }
        
        // Calculate commissionable amount based on configuration
        $commissionableAmount = $this->calculateCommissionableAmount($invoice, $commercialTerms);
        
        // Calculate commission amount
        $commissionAmount = $this->calculateCommissionAmount(
            $commercialTerms,
            $commissionableAmount
        );
        
        // Create or update commission entry
        if ($existingCommission) {
            $existingCommission->update([
                'commission_amount' => $commissionAmount,
                'status' => 'Pending',
                'calculated_at' => now(),
                'paid_at' => null,
            ]);
            return $existingCommission->fresh();
        }
        
        return AgentCommission::create([
            'agent_id' => $agentId,
            'invoice_id' => $invoiceId,
            'commission_amount' => $commissionAmount,
            'status' => 'Pending',
            'calculated_at' => now(),
        ]);
    }

    /**
     * Calculate commissions for multiple invoices or all invoices for an agent
     */
    public function calculateCommissionForAgent(int $agentId, ?array $invoiceIds = null): array
    {
        $agent = Agent::findOrFail($agentId);
        
        // Get invoices to process
        if ($invoiceIds) {
            $invoices = Invoice::where('agent_id', $agentId)
                ->whereIn('id', $invoiceIds)
                ->get();
        } else {
            // Get all invoices without commissions
            $invoicesWithCommissions = AgentCommission::where('agent_id', $agentId)
                ->where('status', '!=', 'Cancelled')
                ->pluck('invoice_id');
            
            $invoices = Invoice::where('agent_id', $agentId)
                ->whereNotIn('id', $invoicesWithCommissions)
                ->get();
        }
        
        $commissions = [];
        foreach ($invoices as $invoice) {
            try {
                $commission = $this->calculateCommissionForInvoice($agentId, $invoice->id);
                $commissions[] = $commission;
            } catch (\Exception $e) {
                // Log error but continue with other invoices
                \Log::warning("Failed to calculate commission for invoice {$invoice->id}: " . $e->getMessage());
            }
        }
        
        return $commissions;
    }

    /**
     * Calculate commissionable amount from invoice items based on commercial terms configuration
     * Returns net amount (subtotal - discount) for eligible items
     */
    protected function calculateCommissionableAmount(Invoice $invoice, AgentCommercialTerm $commercialTerms): float
    {
        // Get all invoice items
        $invoiceItems = $invoice->invoiceItems;
        
        if ($invoiceItems->isEmpty()) {
            return 0;
        }
        
        // Filter items based on configuration
        $eligibleItems = $invoiceItems->filter(function ($item) use ($commercialTerms) {
            // If exclude_equipment_from_commission is true, exclude items with booking_equipment_id
            if ($commercialTerms->exclude_equipment_from_commission && $item->booking_equipment_id) {
                return false;
            }
            
            // If include_manual_items_in_commission is false, exclude items without any booking reference
            if (!$commercialTerms->include_manual_items_in_commission) {
                // Item is manual if it has no booking references
                $isManualItem = !$item->booking_dive_id && 
                               !$item->booking_equipment_id && 
                               !$item->booking_excursion_id;
                if ($isManualItem) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Calculate subtotal from eligible items
        $filteredSubtotal = $eligibleItems->sum('total');
        
        // Apply discount proportionally if invoice has discount
        $discount = $invoice->discount ?? 0;
        if ($discount > 0 && $invoice->subtotal > 0) {
            // Calculate discount proportion for filtered items
            $discountProportion = $filteredSubtotal / $invoice->subtotal;
            $filteredDiscount = $discount * $discountProportion;
        } else {
            $filteredDiscount = 0;
        }
        
        // Return net amount (subtotal - discount)
        $netAmount = max(0, $filteredSubtotal - $filteredDiscount);
        
        return round($netAmount, 2);
    }

    /**
     * Calculate commission amount based on commercial terms
     */
    protected function calculateCommissionAmount(AgentCommercialTerm $commercialTerms, float $commissionableAmount): float
    {
        if ($commercialTerms->commission_type === 'Percentage') {
            $commissionAmount = ($commissionableAmount * $commercialTerms->commission_rate) / 100;
        } else {
            // Fixed Amount
            $commissionAmount = $commercialTerms->commission_rate;
        }
        
        // Apply VAT/GST if applicable
        if ($commercialTerms->vat_applicable) {
            // Assuming VAT rate is 5% - this could be configurable
            $vatRate = 0.05;
            $commissionAmount = $commissionAmount * (1 + $vatRate);
        }
        
        return round($commissionAmount, 2);
    }
}

