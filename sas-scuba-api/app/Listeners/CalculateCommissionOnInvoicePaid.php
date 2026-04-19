<?php

namespace App\Listeners;

use App\Events\InvoicePaid;
use App\Services\AgentCommissionService;
use Illuminate\Support\Facades\Log;

class CalculateCommissionOnInvoicePaid
{
    /**
     * Create the event listener.
     */
    public function __construct(
        private AgentCommissionService $commissionService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(InvoicePaid $event): void
    {
        $invoice = $event->invoice;

        // Only calculate if invoice has an agent
        if (!$invoice->agent_id) {
            return;
        }

        // Get commercial terms to check auto-calculate settings
        $agent = $invoice->agent;
        if (!$agent) {
            return;
        }

        $commercialTerms = $agent->commercialTerms;
        if (!$commercialTerms) {
            Log::info("Agent {$agent->id} has no commercial terms, skipping commission calculation");
            return;
        }

        // Check if auto-calculate on payment is enabled
        $autoCalculateOnPayment = $commercialTerms->auto_calculate_on_payment ?? false;
        $calculationTrigger = $commercialTerms->calculation_trigger ?? 'manual';

        // Check payment terms - some require payment before commission
        $paymentTerms = $commercialTerms->payment_terms ?? 'On Invoice';
        $requiresPayment = in_array($paymentTerms, ['On Invoice', 'Monthly', 'Weekly']);

        // Only auto-calculate if:
        // 1. Auto-calculate on payment is enabled OR
        // 2. Payment terms require payment AND trigger is 'invoice_paid'
        if (!$autoCalculateOnPayment && !($requiresPayment && $calculationTrigger === 'invoice_paid')) {
            return;
        }

        // Check if commission already exists
        $existingCommission = \App\Models\AgentCommission::where('agent_id', $invoice->agent_id)
            ->where('invoice_id', $invoice->id)
            ->where('status', '!=', 'Cancelled')
            ->first();

        if ($existingCommission) {
            Log::info("Commission already exists for invoice {$invoice->id}, skipping");
            return;
        }

        try {
            $this->commissionService->calculateCommissionForInvoice(
                $invoice->agent_id,
                $invoice->id
            );
            
            Log::info("Commission automatically calculated on payment for invoice {$invoice->id}");
        } catch (\Exception $e) {
            // Log error but don't fail the payment
            Log::warning("Failed to auto-calculate commission on payment for invoice {$invoice->id}: " . $e->getMessage());
        }
    }
}
