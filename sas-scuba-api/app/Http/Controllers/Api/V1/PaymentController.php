<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Payment;
use App\Models\PaymentMethod;
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

        $query = Payment::with(['invoice.booking.customer', 'paymentMethod']);

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
            'method' => 'nullable|in:Cash,Card,Bank', // Keep for backward compatibility
            'reference' => 'nullable|string', // Keep for backward compatibility
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'method_type' => 'nullable|in:Bank Transfer,Crypto,Credit Card,Wallet,Cash',
            'method_subtype' => 'nullable|string|max:255',
            // Bank Transfer fields
            'tt_reference' => 'nullable|string|max:255',
            'account_no' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            // Crypto fields
            'crypto_type' => 'nullable|string|max:255',
            'transaction_link' => 'nullable|string',
            // Credit Card fields
            'card_type' => 'nullable|string|max:255',
            'reference_number' => 'nullable|string|max:255',
            // Wallet fields
            'wallet_type' => 'nullable|string|max:255',
            // Cash fields
            'currency' => 'nullable|string|max:10',
        ]);

        // Validate invoice belongs to dive center
        $invoice = Invoice::where('id', $validated['invoice_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        // Validate payment method belongs to dive center if provided
        if (isset($validated['payment_method_id'])) {
            $paymentMethod = PaymentMethod::where('id', $validated['payment_method_id'])
                ->where('dive_center_id', $diveCenterId)
                ->where('is_active', true)
                ->firstOrFail();
            
            // Set method_type from payment method if not provided
            if (!isset($validated['method_type'])) {
                $validated['method_type'] = $paymentMethod->method_type;
            }
        }

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
            $paymentData = [
                'invoice_id' => $validated['invoice_id'],
                'amount' => $validated['amount'],
                'payment_type' => $validated['payment_type'] ?? 'Final',
                'payment_date' => $validated['payment_date'] ?? now()->toDateString(),
                'method' => $validated['method'] ?? 'Cash', // Backward compatibility
                'reference' => $validated['reference'] ?? null, // Backward compatibility
            ];

            // Add new payment method fields
            if (isset($validated['payment_method_id'])) {
                $paymentData['payment_method_id'] = $validated['payment_method_id'];
            }
            if (isset($validated['method_type'])) {
                $paymentData['method_type'] = $validated['method_type'];
            }
            if (isset($validated['method_subtype'])) {
                $paymentData['method_subtype'] = $validated['method_subtype'];
            }
            
            // Bank Transfer fields
            if (isset($validated['tt_reference'])) {
                $paymentData['tt_reference'] = $validated['tt_reference'];
            }
            if (isset($validated['account_no'])) {
                $paymentData['account_no'] = $validated['account_no'];
            }
            if (isset($validated['bank_name'])) {
                $paymentData['bank_name'] = $validated['bank_name'];
            }
            
            // Crypto fields
            if (isset($validated['crypto_type'])) {
                $paymentData['crypto_type'] = $validated['crypto_type'];
            }
            if (isset($validated['transaction_link'])) {
                $paymentData['transaction_link'] = $validated['transaction_link'];
            }
            
            // Credit Card fields
            if (isset($validated['card_type'])) {
                $paymentData['card_type'] = $validated['card_type'];
            }
            if (isset($validated['reference_number'])) {
                $paymentData['reference_number'] = $validated['reference_number'];
            }
            
            // Wallet fields
            if (isset($validated['wallet_type'])) {
                $paymentData['wallet_type'] = $validated['wallet_type'];
            }
            
            // Cash fields
            if (isset($validated['currency'])) {
                $paymentData['currency'] = $validated['currency'];
            }

            $payment = Payment::create($paymentData);

            // Update invoice status based on payments
            $totalPaid = $invoice->totalPaid();
            if ($totalPaid >= $invoice->total) {
                $invoice->update(['status' => 'Paid']);
            } elseif ($totalPaid > 0) {
                $invoice->update(['status' => 'Partially Paid']);
            }

            DB::commit();

            $payment->load(['invoice.booking.customer', 'paymentMethod']);
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

        $payment->load(['invoice.booking.customer', 'paymentMethod']);
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
            'method' => 'nullable|in:Cash,Card,Bank', // Keep for backward compatibility
            'reference' => 'nullable|string', // Keep for backward compatibility
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'method_type' => 'nullable|in:Bank Transfer,Crypto,Credit Card,Wallet,Cash',
            'method_subtype' => 'nullable|string|max:255',
            'tt_reference' => 'nullable|string|max:255',
            'account_no' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'crypto_type' => 'nullable|string|max:255',
            'transaction_link' => 'nullable|string',
            'card_type' => 'nullable|string|max:255',
            'reference_number' => 'nullable|string|max:255',
            'wallet_type' => 'nullable|string|max:255',
            'currency' => 'nullable|string|max:10',
        ]);

        // Validate payment method belongs to dive center if provided
        if (isset($validated['payment_method_id'])) {
            $user = $request->user();
            $diveCenterId = $user->dive_center_id;
            PaymentMethod::where('id', $validated['payment_method_id'])
                ->where('dive_center_id', $diveCenterId)
                ->where('is_active', true)
                ->firstOrFail();
        }

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

        $payment->load(['invoice.booking.customer', 'paymentMethod']);
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

