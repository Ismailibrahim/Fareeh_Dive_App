<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Booking;
use App\Models\BookingDive;
use App\Models\BookingEquipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    use AuthorizesDiveCenterAccess;
    /**
     * Display a listing of invoices.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $query = Invoice::with(['booking.customer', 'invoiceItems', 'payments'])
            ->where('dive_center_id', $diveCenterId);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by customer
        if ($request->has('customer_id')) {
            $query->whereHas('booking', function ($q) use ($request) {
                $q->where('customer_id', $request->input('customer_id'));
            });
        }

        // Filter by invoice type
        if ($request->has('invoice_type')) {
            $query->where('invoice_type', $request->input('invoice_type'));
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    /**
     * Store a newly created invoice.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'invoice_type' => 'nullable|in:Advance,Final,Full',
            'invoice_date' => 'nullable|date',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        // Validate booking belongs to dive center
        $booking = Booking::where('id', $validated['booking_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        $invoiceType = $validated['invoice_type'] ?? 'Full';

        DB::beginTransaction();
        try {
            $invoice = Invoice::create([
                'dive_center_id' => $diveCenterId,
                'booking_id' => $validated['booking_id'],
                'invoice_no' => null, // Will be generated
                'invoice_date' => $validated['invoice_date'] ?? now()->toDateString(),
                'invoice_type' => $invoiceType,
                'status' => 'Draft',
                'currency' => $booking->diveCenter->currency ?? 'USD',
            ]);

            // Generate invoice number
            $invoice->invoice_no = $invoice->generateInvoiceNumber();
            $invoice->save();

            // Calculate totals will be done when items are added
            $invoice->load(['booking.customer', 'invoiceItems', 'payments']);
            
            DB::commit();
            return response()->json($invoice, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate invoice from booking.
     */
    public function generateFromBooking(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'invoice_type' => 'nullable|in:Advance,Final,Full',
            'include_dives' => 'nullable|boolean',
            'include_equipment' => 'nullable|boolean',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        // Validate booking belongs to dive center
        $booking = Booking::where('id', $validated['booking_id'])
            ->where('dive_center_id', $diveCenterId)
            ->with(['diveCenter', 'bookingDives', 'bookingEquipment'])
            ->firstOrFail();

        $includeDives = $validated['include_dives'] ?? true;
        $includeEquipment = $validated['include_equipment'] ?? true;
        $invoiceType = $validated['invoice_type'] ?? 'Full';
        
        // Get tax percentage from dive center settings or use provided value
        $diveCenterSettings = $booking->diveCenter->settings ?? [];
        $defaultTaxPercentage = $diveCenterSettings['tax_percentage'] ?? 0;
        $taxPercentage = $validated['tax_percentage'] ?? $defaultTaxPercentage;

        DB::beginTransaction();
        try {
            $invoice = Invoice::create([
                'dive_center_id' => $diveCenterId,
                'booking_id' => $validated['booking_id'],
                'invoice_no' => null,
                'invoice_date' => now()->toDateString(),
                'invoice_type' => $invoiceType,
                'status' => 'Draft',
                'currency' => $booking->diveCenter->currency ?? 'USD',
            ]);

            $invoice->invoice_no = $invoice->generateInvoiceNumber();
            $invoice->save();

            $subtotal = 0;

            // Add completed dives
            if ($includeDives) {
                $completedDives = $booking->bookingDives()
                    ->where('status', 'Completed')
                    ->whereDoesntHave('invoiceItems')
                    ->with(['diveSite', 'priceListItem'])
                    ->get();

                foreach ($completedDives as $dive) {
                    $price = $dive->price ?? 0;
                    $item = InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'booking_dive_id' => $dive->id,
                        'price_list_item_id' => $dive->price_list_item_id,
                        'description' => 'Dive - ' . ($dive->diveSite->name ?? 'Unknown') . ' - ' . ($dive->dive_date ? date('M d, Y', strtotime($dive->dive_date)) : ''),
                        'quantity' => 1,
                        'unit_price' => $price,
                        'total' => $price,
                    ]);
                    $subtotal += $price;
                }
            }

            // Add equipment rentals
            if ($includeEquipment) {
                $equipment = $booking->bookingEquipment()
                    ->whereDoesntHave('invoiceItems')
                    ->with(['equipmentItem.equipment'])
                    ->get();

                foreach ($equipment as $eq) {
                    $price = $eq->price ?? 0;
                    $item = InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'booking_equipment_id' => $eq->id,
                        'description' => ($eq->equipmentItem->equipment->name ?? 'Equipment') . ($eq->equipmentItem->size ? ' - ' . $eq->equipmentItem->size : ''),
                        'quantity' => 1,
                        'unit_price' => $price,
                        'total' => $price,
                    ]);
                    $subtotal += $price;
                }
            }

            // Calculate tax and total
            $tax = $subtotal * ($taxPercentage / 100);
            $total = $subtotal + $tax;

            $invoice->update([
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
            ]);

            DB::commit();

            $invoice->load(['booking.customer', 'invoiceItems.bookingDive', 'invoiceItems.bookingEquipment', 'payments']);
            return response()->json($invoice, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to generate invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified invoice.
     */
    public function show(Request $request, Invoice $invoice)
    {
        // Verify invoice belongs to user's dive center
        $this->authorizeDiveCenterAccess($invoice, 'Unauthorized access to this invoice');

        $invoice->load([
            'booking.customer',
            'invoiceItems.bookingDive.diveSite',
            'invoiceItems.bookingEquipment.equipmentItem.equipment',
            'invoiceItems.priceListItem',
            'payments',
            'relatedInvoice'
        ]);

        return response()->json($invoice);
    }

    /**
     * Update the specified invoice.
     */
    public function update(Request $request, Invoice $invoice)
    {
        // Verify invoice belongs to user's dive center
        $this->authorizeDiveCenterAccess($invoice, 'Unauthorized access to this invoice');

        // Prevent editing if fully paid
        if ($invoice->isFullyPaid() && $invoice->status === 'Paid') {
            return response()->json([
                'message' => 'Cannot edit fully paid invoice'
            ], 422);
        }

        $validated = $request->validate([
            'invoice_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $invoice->update($validated);
        $invoice->load(['booking.customer', 'invoiceItems', 'payments']);

        return response()->json($invoice);
    }

    /**
     * Remove the specified invoice.
     */
    public function destroy(Request $request, Invoice $invoice)
    {
        // Verify invoice belongs to user's dive center
        $this->authorizeDiveCenterAccess($invoice, 'Unauthorized access to this invoice');

        // Prevent deletion if payments exist
        if ($invoice->payments()->exists()) {
            return response()->json([
                'message' => 'Cannot delete invoice with payments'
            ], 422);
        }

        $invoice->delete();
        return response()->noContent();
    }

    /**
     * Add damage charge to invoice
     */
    public function addDamageCharge(Request $request, Invoice $invoice)
    {
        // Verify invoice belongs to user's dive center
        $this->authorizeDiveCenterAccess($invoice, 'Unauthorized access to this invoice');

        $validated = $request->validate([
            'booking_equipment_id' => 'required|exists:booking_equipment,id',
            'description' => 'nullable|string',
            'charge_amount' => 'required|numeric|min:0',
        ]);

        // Verify booking equipment belongs to the same booking as invoice
        $bookingEquipment = BookingEquipment::find($validated['booking_equipment_id']);
        if (!$bookingEquipment) {
            return response()->json(['message' => 'Booking equipment not found'], 404);
        }

        // Check if booking equipment is linked to invoice's booking or basket
        $belongsToInvoice = false;
        if ($bookingEquipment->booking_id && $bookingEquipment->booking_id === $invoice->booking_id) {
            $belongsToInvoice = true;
        } elseif ($bookingEquipment->basket_id) {
            $basket = $bookingEquipment->basket;
            if ($basket && $basket->booking_id === $invoice->booking_id) {
                $belongsToInvoice = true;
            }
        }

        if (!$belongsToInvoice) {
            return response()->json([
                'message' => 'Booking equipment does not belong to this invoice\'s booking'
            ], 422);
        }

        // Verify damage was reported and charge_customer is true
        if (!$bookingEquipment->damage_reported || !$bookingEquipment->charge_customer) {
            return response()->json([
                'message' => 'Damage must be reported and charge_customer must be true'
            ], 422);
        }

        // Check if damage charge already added to an invoice
        if ($bookingEquipment->invoiceItems()->exists()) {
            return response()->json([
                'message' => 'Damage charge already added to an invoice'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Load equipment details for description
            $bookingEquipment->load(['equipmentItem.equipment']);
            
            $equipmentName = 'Equipment';
            if ($bookingEquipment->equipmentItem && $bookingEquipment->equipmentItem->equipment) {
                $equipmentName = $bookingEquipment->equipmentItem->equipment->name;
                if ($bookingEquipment->equipmentItem->size) {
                    $equipmentName .= ' - ' . $bookingEquipment->equipmentItem->size;
                }
            } elseif ($bookingEquipment->customer_equipment_type) {
                $equipmentName = $bookingEquipment->customer_equipment_type;
                if ($bookingEquipment->customer_equipment_brand) {
                    $equipmentName .= ' - ' . $bookingEquipment->customer_equipment_brand;
                }
            }

            $description = $validated['description'] ?? 
                ('Damage Charge - ' . $equipmentName . 
                 ($bookingEquipment->damage_description ? ': ' . $bookingEquipment->damage_description : ''));

            $chargeAmount = $validated['charge_amount'] ?? $bookingEquipment->damage_charge_amount ?? 0;

            $invoiceItem = InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'booking_equipment_id' => $bookingEquipment->id,
                'description' => $description,
                'quantity' => 1,
                'unit_price' => $chargeAmount,
                'total' => $chargeAmount,
            ]);

            // Recalculate invoice totals
            $subtotal = $invoice->invoiceItems()->sum('total');
            $taxPercentage = 0;
            if ($invoice->tax && $invoice->subtotal && $invoice->subtotal > 0) {
                $taxPercentage = ($invoice->tax / $invoice->subtotal) * 100;
            }
            $tax = $subtotal * ($taxPercentage / 100);
            $total = $subtotal + $tax;

            $invoice->update([
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
            ]);

            DB::commit();

            $invoice->load(['booking.customer', 'invoiceItems.bookingEquipment', 'payments']);
            return response()->json($invoice);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to add damage charge',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

