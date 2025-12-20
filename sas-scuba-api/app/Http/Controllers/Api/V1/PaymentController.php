<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    use AuthorizesDiveCenterAccess;
    /**
     * Display a listing of payments.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $query = Payment::with(['invoice.booking.customer']);

        if ($diveCenterId) {
            // Use join instead of whereHas for better performance
            $query->join('invoices', 'payments.invoice_id', '=', 'invoices.id')
                  ->where('invoices.dive_center_id', $diveCenterId)
                  ->select('payments.*');
        }

        // Filter by invoice_id
        if ($request->has('invoice_id')) {
            $query->where('invoice_id', $request->input('invoice_id'));
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    /**
     * Store a newly created payment.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_type' => 'nullable|in:Advance,Final,Refund',
            'payment_date' => 'nullable|date',
            'method' => 'nullable|in:Cash,Card,Bank',
            'reference' => 'nullable|string',
        ]);

        // Validate invoice belongs to dive center
        $invoice = Invoice::where('id', $validated['invoice_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        // Validate amount doesn't exceed remaining balance
        $remainingBalance = $invoice->remainingBalance();
        if ($validated['amount'] > $remainingBalance && $validated['payment_type'] !== 'Refund') {
            return response()->json([
                'message' => 'Payment amount exceeds remaining balance',
                'remaining_balance' => $remainingBalance
            ], 422);
        }

        DB::beginTransaction();
        try {
            $payment = Payment::create([
                'invoice_id' => $validated['invoice_id'],
                'amount' => $validated['amount'],
                'payment_type' => $validated['payment_type'] ?? 'Final',
                'payment_date' => $validated['payment_date'] ?? now()->toDateString(),
                'method' => $validated['method'] ?? 'Cash',
                'reference' => $validated['reference'] ?? null,
            ]);

            // Update invoice status based on payments
            $totalPaid = $invoice->totalPaid();
            if ($totalPaid >= $invoice->total) {
                $invoice->update(['status' => 'Paid']);
            } elseif ($totalPaid > 0) {
                $invoice->update(['status' => 'Partially Paid']);
            }

            DB::commit();

            $payment->load(['invoice.booking.customer']);
            return response()->json($payment, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified payment.
     */
    public function show(Request $request, Payment $payment)
    {
        // Verify payment belongs to invoice from user's dive center
        $payment->load('invoice');
        if (!$payment->invoice) {
            abort(404, 'Payment not found');
        }
        $this->authorizeDiveCenterAccess($payment->invoice, 'Unauthorized access to this payment');

        $payment->load(['invoice.booking.customer']);
        return response()->json($payment);
    }

    /**
     * Update the specified payment.
     */
    public function update(Request $request, Payment $payment)
    {
        // Verify payment belongs to invoice from user's dive center
        $payment->load('invoice');
        if (!$payment->invoice) {
            abort(404, 'Payment not found');
        }
        $this->authorizeDiveCenterAccess($payment->invoice, 'Unauthorized access to this payment');

        $validated = $request->validate([
            'amount' => 'sometimes|numeric|min:0.01',
            'payment_type' => 'nullable|in:Advance,Final,Refund',
            'payment_date' => 'nullable|date',
            'method' => 'nullable|in:Cash,Card,Bank',
            'reference' => 'nullable|string',
        ]);

        $payment->update($validated);

        // Recalculate invoice status
        $invoice = $payment->invoice;
        $totalPaid = $invoice->totalPaid();
        if ($totalPaid >= $invoice->total) {
            $invoice->update(['status' => 'Paid']);
        } elseif ($totalPaid > 0) {
            $invoice->update(['status' => 'Partially Paid']);
        } else {
            $invoice->update(['status' => 'Draft']);
        }

        $payment->load(['invoice.booking.customer']);
        return response()->json($payment);
    }

    /**
     * Remove the specified payment.
     */
    public function destroy(Request $request, Payment $payment)
    {
        // Verify payment belongs to invoice from user's dive center
        $payment->load('invoice');
        if (!$payment->invoice) {
            abort(404, 'Payment not found');
        }
        $this->authorizeDiveCenterAccess($payment->invoice, 'Unauthorized access to this payment');

        $invoice = $payment->invoice;
        $payment->delete();

        // Recalculate invoice status
        $totalPaid = $invoice->totalPaid();
        if ($totalPaid >= $invoice->total) {
            $invoice->update(['status' => 'Paid']);
        } elseif ($totalPaid > 0) {
            $invoice->update(['status' => 'Partially Paid']);
        } else {
            $invoice->update(['status' => 'Draft']);
        }

        return response()->noContent();
    }
}

