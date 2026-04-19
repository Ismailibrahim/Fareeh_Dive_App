<?php

namespace App\Listeners;

use App\Events\InvoiceCreated;
use App\Services\AgentCommissionService;
use Illuminate\Support\Facades\Log;

class CalculateCommissionOnInvoiceCreated
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
    public function handle(InvoiceCreated $event): void
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

        // Check if auto-calculate is enabled (default to false for backward compatibility)
        $autoCalculate = $commercialTerms->auto_calculate_on_invoice ?? false;
        $calculationTrigger = $commercialTerms->calculation_trigger ?? 'manual';

        // Only auto-calculate if enabled and trigger is 'invoice_created'
        if (!$autoCalculate || $calculationTrigger !== 'invoice_created') {
            return;
        }

        try {
            $this->commissionService->calculateCommissionForInvoice(
                $invoice->agent_id,
                $invoice->id
            );
            
            Log::info("Commission automatically calculated for invoice {$invoice->id}");
        } catch (\Exception $e) {
            // Log error but don't fail the invoice creation
            Log::warning("Failed to auto-calculate commission for invoice {$invoice->id}: " . $e->getMessage());
        }
    }
}
