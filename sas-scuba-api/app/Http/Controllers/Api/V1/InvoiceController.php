<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Booking;
use App\Models\BookingDive;
use App\Models\BookingEquipment;
use App\Models\PriceListItem;
use App\Models\Tax;
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

        $query = Invoice::with(['booking.customer', 'customer', 'invoiceItems', 'payments'])
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
            'booking_id' => 'nullable|exists:bookings,id',
            'customer_id' => 'nullable|exists:customers,id',
            'invoice_type' => 'nullable|in:Advance,Final,Full',
            'invoice_date' => 'nullable|date',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        // At least one of booking_id or customer_id must be provided
        $bookingId = $validated['booking_id'] ?? null;
        $customerId = $validated['customer_id'] ?? null;
        
        if (!$bookingId && !$customerId) {
            return response()->json([
                'message' => 'Either booking_id or customer_id must be provided'
            ], 422);
        }

        $booking = null;
        $customer = null;
        $currency = 'USD';

        // Validate booking belongs to dive center if provided
        $booking = null;
        if ($bookingId) {
            $booking = Booking::with('diveCenter')
                ->where('id', $bookingId)
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
            if ($booking->diveCenter) {
                $currency = $booking->diveCenter->currency ?? 'USD';
            }
        }

        // Validate customer belongs to dive center if provided
        if ($customerId) {
            $customer = \App\Models\Customer::where('id', $customerId)
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
            if (!$booking) {
                // Get currency from dive center if no booking
                $diveCenter = \App\Models\DiveCenter::findOrFail($diveCenterId);
                $currency = $diveCenter->currency ?? 'USD';
            }
        }

        $invoiceType = $validated['invoice_type'] ?? 'Full';

        DB::beginTransaction();
        try {
            $invoice = Invoice::create([
                'dive_center_id' => $diveCenterId,
                'booking_id' => $bookingId,
                'customer_id' => $customerId,
                'invoice_no' => null, // Will be generated
                'invoice_date' => $validated['invoice_date'] ?? now()->toDateString(),
                'invoice_type' => $invoiceType,
                'status' => 'Draft',
                'currency' => $currency,
            ]);

            // Generate invoice number
            $invoice->invoice_no = $invoice->generateInvoiceNumber();
            $invoice->save();

            // Calculate totals will be done when items are added
            $invoice->load(['booking.customer', 'customer', 'invoiceItems', 'payments']);
            
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

            $subtotal = round($subtotal, 2);
            
            // Get tax calculation mode from dive center settings
            $diveCenter = $booking->diveCenter;
            $taxCalculationMode = 'exclusive'; // Default
            if ($diveCenter && $diveCenter->settings) {
                $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                if (isset($settings['tax_calculation_mode'])) {
                    $taxCalculationMode = $settings['tax_calculation_mode'];
                }
            }
            
            // Step 1: Apply discount (no discount when generating from booking)
            $discount = 0;
            $amountAfterDiscount = round($subtotal - $discount, 2);
            $amountAfterDiscount = max(0, $amountAfterDiscount);
            
            // Get percentages
            $serviceChargePercentage = 0;
            if ($diveCenter && $diveCenter->settings) {
                $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                if (isset($settings['service_charge_percentage'])) {
                    $serviceChargePercentage = (float) $settings['service_charge_percentage'];
                }
            }
            if ($serviceChargePercentage <= 0) {
                $serviceChargeTax = Tax::where('name', 'Service Charge')
                    ->orWhere('name', 'service charge')
                    ->orWhere('name', 'SERVICE CHARGE')
                    ->first();
                if ($serviceChargeTax) {
                    $serviceChargePercentage = (float) $serviceChargeTax->percentage;
                }
            }
            
            if ($taxPercentage <= 0) {
                $tgstTax = Tax::where('name', 'T-GST')
                    ->orWhere('name', 't-gst')
                    ->orWhere('name', 'TGST')
                    ->first();
                if ($tgstTax) {
                    $taxPercentage = (float) $tgstTax->percentage;
                }
            }
            
            // Step 2 & 3: Calculate based on mode
            if ($taxCalculationMode === 'inclusive') {
                /**
                 * T-GST INCLUSIVE CALCULATION
                 * The amountAfterDiscount IS the inclusive total
                 * Reverse calculate base amount from it
                 */
                $scDecimal = $serviceChargePercentage > 0 ? ($serviceChargePercentage / 100) : 0;
                $tgstDecimal = $taxPercentage > 0 ? ($taxPercentage / 100) : 0;
                
                $serviceCharge = 0;
                $tax = 0;
                $total = $amountAfterDiscount; // This is the inclusive total
                
                if ($amountAfterDiscount > 0 && ($scDecimal > 0 || $tgstDecimal > 0)) {
                    $denominator = (1 + $scDecimal) * (1 + $tgstDecimal);
                    if ($denominator > 0 && $denominator != 1) {
                        $baseAmount = round($amountAfterDiscount / $denominator, 2);
                        $serviceCharge = round($baseAmount * $scDecimal, 2);
                        $tax = round(($baseAmount + $serviceCharge) * $tgstDecimal, 2);
                        $total = round($baseAmount + $serviceCharge + $tax, 2);
                        
                        // Adjust for rounding
                        $roundingDiff = $amountAfterDiscount - $total;
                        if (abs($roundingDiff) > 0.01) {
                            $tax = round($tax + $roundingDiff, 2);
                            $total = round($baseAmount + $serviceCharge + $tax, 2);
                        }
                    } else {
                        $serviceCharge = 0;
                        $tax = 0;
                        $total = $amountAfterDiscount;
                    }
                } else {
                    $serviceCharge = 0;
                    $tax = 0;
                    $total = $amountAfterDiscount;
                }
            } else {
                // T-GST EXCLUSIVE calculation
                $serviceCharge = 0;
                if ($serviceChargePercentage > 0) {
                    $serviceCharge = round($amountAfterDiscount * ($serviceChargePercentage / 100), 2);
                }
                $serviceCharge = max(0, $serviceCharge);
                
                $tax = 0;
                if ($taxPercentage > 0) {
                    $tax = round(($amountAfterDiscount + $serviceCharge) * ($taxPercentage / 100), 2);
                }
                $tax = max(0, $tax);
                
                $total = round($amountAfterDiscount + $serviceCharge + $tax, 2);
            }
            
            $total = max(0, $total);
            $serviceCharge = max(0, $serviceCharge);
            $tax = max(0, $tax);

            $invoice->update([
                'subtotal' => $subtotal,
                'tax' => $tax,
                'service_charge' => $serviceCharge,
                'discount' => $discount,
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

        // Load relationships safely
        $invoice->load([
            'customer',
            'invoiceItems.priceListItem',
            'payments'
        ]);
        
        // Conditionally load booking-related relationships
        if ($invoice->booking_id) {
            $invoice->load(['booking.customer']);
        }
        
        // Load dive and equipment relationships for items that have them
        $invoice->load([
            'invoiceItems' => function ($query) {
                $query->with([
                    'bookingDive.diveSite',
                    'bookingEquipment.equipmentItem.equipment'
                ]);
            }
        ]);
        
        // Load related invoice if exists
        if ($invoice->related_invoice_id) {
            $invoice->load('relatedInvoice');
        }

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

        // Prevent discount changes if invoice is paid
        if ($request->has('discount') && $invoice->status === 'Paid') {
            return response()->json([
                'message' => 'Cannot change discount for paid invoices'
            ], 422);
        }

        $validated = $request->validate([
            'invoice_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'tax' => 'nullable|numeric|min:0',
            'service_charge' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'recalculate' => 'nullable|boolean',
        ]);

        // If tax, service_charge, or discount is being updated, recalculate total
        // Also recalculate if recalculation_mode is explicitly requested (for mode changes)
        $forceRecalculation = $request->has('recalculate') && $request->input('recalculate') === true;
        if ($request->has('tax') || $request->has('service_charge') || $request->has('discount') || $forceRecalculation) {
            $subtotal = round((float) ($invoice->invoiceItems()->sum('total') ?? 0), 2);
            
            // Get tax calculation mode from dive center settings
            // Refresh dive center to get latest settings
            $diveCenter = $invoice->diveCenter;
            if ($diveCenter) {
                $diveCenter->refresh();
            }
            $taxCalculationMode = 'exclusive'; // Default
            if ($diveCenter && $diveCenter->settings) {
                $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                if (isset($settings['tax_calculation_mode'])) {
                    $taxCalculationMode = $settings['tax_calculation_mode'];
                }
            }
            
            // Debug logging
            \Log::info('Invoice update - Tax calculation mode', [
                'invoice_id' => $invoice->id,
                'mode' => $taxCalculationMode,
                'dive_center_id' => $diveCenter->id ?? null,
                'settings' => $diveCenter->settings ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount ?? 0,
            ]);
            
            // Step 1: Apply discount (validate discount doesn't exceed subtotal)
            $discount = $request->has('discount') ? (float) ($request->input('discount', 0)) : ($invoice->discount ?? 0);
            $discount = max(0, min($discount, $subtotal)); // Cap discount at subtotal, ensure non-negative
            $amountAfterDiscount = round($subtotal - $discount, 2);
            $amountAfterDiscount = max(0, $amountAfterDiscount); // Ensure non-negative
            
            // Get percentages
            $serviceChargePercentage = 0;
            $taxPercentage = 0;
            
            if ($diveCenter && $diveCenter->settings) {
                $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                if (isset($settings['service_charge_percentage'])) {
                    $serviceChargePercentage = (float) $settings['service_charge_percentage'];
                }
            }
            if ($serviceChargePercentage <= 0) {
                $serviceChargeTax = Tax::where('name', 'Service Charge')
                    ->orWhere('name', 'service charge')
                    ->orWhere('name', 'SERVICE CHARGE')
                    ->first();
                if ($serviceChargeTax) {
                    $serviceChargePercentage = (float) $serviceChargeTax->percentage;
                }
            }
            
            $tgstTax = Tax::where('name', 'T-GST')
                ->orWhere('name', 't-gst')
                ->orWhere('name', 'TGST')
                ->first();
            if ($tgstTax) {
                $taxPercentage = (float) $tgstTax->percentage;
            }
            
            // Determine if we should apply service charge and tax
            // Check if invoice has items that require service charge or tax
            $shouldApplyServiceCharge = false;
            $shouldApplyTax = false;
            
            // Check invoice items for service charge and tax requirements
            $invoiceItems = $invoice->invoiceItems()->with('priceListItem')->get();
            foreach ($invoiceItems as $item) {
                if ($item->priceListItem) {
                    if ($item->priceListItem->service_charge_inclusive) {
                        $shouldApplyServiceCharge = true;
                    }
                    if ($item->priceListItem->tax_inclusive || ($item->priceListItem->tax_percentage && $item->priceListItem->tax_percentage > 0)) {
                        $shouldApplyTax = true;
                    }
                }
            }
            
            // Also apply if invoice already has these values (meaning they were previously applied)
            if ($invoice->service_charge !== null && $invoice->service_charge > 0) {
                $shouldApplyServiceCharge = true;
            }
            if ($invoice->tax !== null && $invoice->tax > 0) {
                $shouldApplyTax = true;
            }
            
            // If we have percentages configured, we should apply them (for global tax/SC settings)
            // This ensures T-GST and Service Charge are applied even if items don't have the flags set
            if ($serviceChargePercentage > 0 && $amountAfterDiscount > 0) {
                $shouldApplyServiceCharge = true;
            }
            if ($taxPercentage > 0 && $amountAfterDiscount > 0) {
                $shouldApplyTax = true;
            }
            
            // Step 2 & 3: Calculate based on mode
            if ($taxCalculationMode === 'inclusive') {
                /**
                 * T-GST INCLUSIVE CALCULATION
                 * Start with the final total (inclusive of SC + T-GST) and reverse calculate base amount
                 * 
                 * Formula: base_amount = total / ((1 + sc_percentage) * (1 + tgst_percentage))
                 * Then: service_charge = base_amount * sc_percentage
                 * Then: tgst = (base_amount + service_charge) * tgst_percentage
                 * 
                 * The "total" here is the amount_after_discount (which represents the inclusive total)
                 */
                $scDecimal = $serviceChargePercentage > 0 ? ($serviceChargePercentage / 100) : 0;
                $tgstDecimal = $taxPercentage > 0 ? ($taxPercentage / 100) : 0;
                
                // Initialize
                $serviceCharge = 0;
                $tax = 0;
                $total = $amountAfterDiscount; // This is the inclusive total
                
                // Always calculate if we have percentages and amount > 0
                if ($amountAfterDiscount > 0 && ($scDecimal > 0 || $tgstDecimal > 0)) {
                    // Calculate denominator: (1 + SC%) * (1 + T-GST%)
                    $denominator = (1 + $scDecimal) * (1 + $tgstDecimal);
                    
                    \Log::info('T-GST INCLUSIVE - Reverse calculation', [
                        'invoice_id' => $invoice->id,
                        'inclusive_total' => $amountAfterDiscount,
                        'sc_percentage' => $serviceChargePercentage,
                        'tgst_percentage' => $taxPercentage,
                        'sc_decimal' => $scDecimal,
                        'tgst_decimal' => $tgstDecimal,
                        'denominator' => $denominator,
                    ]);
                    
                    if ($denominator > 0 && $denominator != 1) {
                        // Reverse calculate base amount from inclusive total
                        $baseAmount = round($amountAfterDiscount / $denominator, 2);
                        
                        // Calculate service charge portion (always if percentage exists)
                        if ($scDecimal > 0) {
                            $serviceCharge = round($baseAmount * $scDecimal, 2);
                        }
                        
                        // Calculate T-GST portion (always if percentage exists)
                        if ($tgstDecimal > 0) {
                            $tax = round(($baseAmount + $serviceCharge) * $tgstDecimal, 2);
                        }
                        
                        // Total should equal the inclusive total (amountAfterDiscount)
                        $total = round($baseAmount + $serviceCharge + $tax, 2);
                        
                        // Adjust for rounding differences
                        $roundingDiff = $amountAfterDiscount - $total;
                        if (abs($roundingDiff) > 0.01) {
                            // Adjust tax to account for rounding
                            $tax = round($tax + $roundingDiff, 2);
                            $total = round($baseAmount + $serviceCharge + $tax, 2);
                        }
                        
                        \Log::info('T-GST INCLUSIVE - Final values', [
                            'invoice_id' => $invoice->id,
                            'base_amount' => $baseAmount,
                            'service_charge' => $serviceCharge,
                            'tax' => $tax,
                            'total' => $total,
                            'inclusive_total' => $amountAfterDiscount,
                        ]);
                    } else {
                        // Fallback: no percentages or invalid denominator
                        \Log::warning('T-GST INCLUSIVE - Invalid denominator, using zero values', [
                            'invoice_id' => $invoice->id,
                            'denominator' => $denominator,
                        ]);
                        $serviceCharge = 0;
                        $tax = 0;
                        $total = $amountAfterDiscount;
                    }
                } else {
                    // No percentages or zero amount
                    $serviceCharge = 0;
                    $tax = 0;
                    $total = $amountAfterDiscount;
                }
            } else {
                /**
                 * T-GST EXCLUSIVE (Forward) Calculation
                 * Order of Operations: Subtotal -> Discount -> Service Charge -> T-GST
                 */
                
                // Calculate service charge
                $serviceCharge = 0;
                if ($request->has('service_charge') && !$forceRecalculation) {
                    // Use provided value unless force recalculation
                    $serviceCharge = round((float) ($request->input('service_charge', 0)), 2);
                } elseif ($forceRecalculation || !$request->has('service_charge')) {
                    // Recalculate from percentages
                    if ($shouldApplyServiceCharge && $serviceChargePercentage > 0 && $amountAfterDiscount > 0) {
                        $serviceCharge = round($amountAfterDiscount * ($serviceChargePercentage / 100), 2);
                    } elseif ($invoice->service_charge !== null && $invoice->service_charge > 0) {
                        // Fallback: Recalculate based on existing percentage
                        $originalSubtotal = $invoice->subtotal ?? $subtotal;
                        if ($originalSubtotal > 0 && $serviceChargePercentage <= 0) {
                            $serviceChargePercentage = ($invoice->service_charge / $originalSubtotal) * 100;
                        }
                        if ($serviceChargePercentage > 0 && $amountAfterDiscount > 0) {
                            $serviceCharge = round($amountAfterDiscount * ($serviceChargePercentage / 100), 2);
                        } else {
                            $serviceCharge = round((float) $invoice->service_charge, 2);
                        }
                    }
                }
                $serviceCharge = max(0, $serviceCharge);
                
                // Calculate T-GST
                $tax = 0;
                if ($request->has('tax') && !$forceRecalculation) {
                    // Use provided value unless force recalculation
                    $tax = round((float) ($request->input('tax', 0)), 2);
                } elseif ($forceRecalculation || !$request->has('tax')) {
                    // Recalculate from percentages
                    if ($shouldApplyTax && $taxPercentage > 0) {
                        // Formula: tgst = (subtotal_after_discount + service_charge_amount) * tgst_percentage
                        $tax = round(($amountAfterDiscount + $serviceCharge) * ($taxPercentage / 100), 2);
                    } elseif ($invoice->tax !== null && $invoice->tax > 0 && $taxPercentage <= 0) {
                        // Fallback: Recalculate tax based on percentage from existing values
                        $originalSubtotal = $invoice->subtotal ?? $subtotal;
                        $originalServiceCharge = $invoice->service_charge ?? 0;
                        if ($originalSubtotal > 0) {
                            $originalBase = $originalSubtotal + $originalServiceCharge;
                            if ($originalBase > 0) {
                                $taxPercentage = ($invoice->tax / $originalBase) * 100;
                                $tax = round(($amountAfterDiscount + $serviceCharge) * ($taxPercentage / 100), 2);
                            } else {
                                $tax = round((float) $invoice->tax, 2);
                            }
                        } else {
                            $tax = round((float) $invoice->tax, 2);
                        }
                    }
                }
                $tax = max(0, $tax);
                
                $total = round($amountAfterDiscount + $serviceCharge + $tax, 2);
            }
            
            $total = max(0, $total);
            $serviceCharge = max(0, $serviceCharge);
            $tax = max(0, $tax);
            
            $validated['subtotal'] = $subtotal;
            $validated['tax'] = $tax;
            $validated['service_charge'] = $serviceCharge;
            $validated['discount'] = $discount;
            $validated['total'] = $total;
        }

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

            /**
             * Recalculate invoice totals after adding damage charge
             */
            $subtotal = round((float) ($invoice->invoiceItems()->sum('total') ?? 0), 2);
            
            // Get tax calculation mode from dive center settings
            $diveCenter = $invoice->diveCenter;
            $taxCalculationMode = 'exclusive'; // Default
            if ($diveCenter && $diveCenter->settings) {
                $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                if (isset($settings['tax_calculation_mode'])) {
                    $taxCalculationMode = $settings['tax_calculation_mode'];
                }
            }
            
            // Step 1: Apply discount (validate discount doesn't exceed subtotal)
            $discount = $invoice->discount ?? 0;
            $discount = max(0, min($discount, $subtotal)); // Cap discount at subtotal
            $amountAfterDiscount = round($subtotal - $discount, 2);
            $amountAfterDiscount = max(0, $amountAfterDiscount);
            
            // Get percentages
            $serviceChargePercentage = 0;
            $taxPercentage = 0;
            
            if ($diveCenter && $diveCenter->settings) {
                $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                if (isset($settings['service_charge_percentage'])) {
                    $serviceChargePercentage = (float) $settings['service_charge_percentage'];
                }
            }
            if ($serviceChargePercentage <= 0) {
                $serviceChargeTax = Tax::where('name', 'Service Charge')
                    ->orWhere('name', 'service charge')
                    ->orWhere('name', 'SERVICE CHARGE')
                    ->first();
                if ($serviceChargeTax) {
                    $serviceChargePercentage = (float) $serviceChargeTax->percentage;
                }
            }
            
            $tgstTax = Tax::where('name', 'T-GST')
                ->orWhere('name', 't-gst')
                ->orWhere('name', 'TGST')
                ->first();
            if ($tgstTax) {
                $taxPercentage = (float) $tgstTax->percentage;
            } elseif ($invoice->tax && $invoice->subtotal && $invoice->subtotal > 0) {
                $originalServiceCharge = $invoice->service_charge ?? 0;
                $originalBase = $invoice->subtotal + $originalServiceCharge;
                if ($originalBase > 0) {
                    $taxPercentage = ($invoice->tax / $originalBase) * 100;
                }
            }
            
            // Step 2 & 3: Calculate based on mode
            if ($taxCalculationMode === 'inclusive') {
                /**
                 * T-GST INCLUSIVE CALCULATION
                 * The amountAfterDiscount IS the inclusive total
                 * Reverse calculate base amount from it
                 */
                $scDecimal = $serviceChargePercentage > 0 ? ($serviceChargePercentage / 100) : 0;
                $tgstDecimal = $taxPercentage > 0 ? ($taxPercentage / 100) : 0;
                
                $serviceCharge = 0;
                $tax = 0;
                $total = $amountAfterDiscount; // This is the inclusive total
                
                if ($amountAfterDiscount > 0 && ($scDecimal > 0 || $tgstDecimal > 0) && 
                    (($invoice->service_charge !== null && $invoice->service_charge > 0) || 
                     ($invoice->tax !== null && $invoice->tax > 0))) {
                    $denominator = (1 + $scDecimal) * (1 + $tgstDecimal);
                    if ($denominator > 0 && $denominator != 1) {
                        $baseAmount = round($amountAfterDiscount / $denominator, 2);
                        if ($invoice->service_charge !== null && $invoice->service_charge > 0) {
                            $serviceCharge = round($baseAmount * $scDecimal, 2);
                        }
                        if ($invoice->tax !== null && $invoice->tax > 0) {
                            $tax = round(($baseAmount + $serviceCharge) * $tgstDecimal, 2);
                        }
                        $total = round($baseAmount + $serviceCharge + $tax, 2);
                        
                        // Adjust for rounding
                        $roundingDiff = $amountAfterDiscount - $total;
                        if (abs($roundingDiff) > 0.01) {
                            $tax = round($tax + $roundingDiff, 2);
                            $total = round($baseAmount + $serviceCharge + $tax, 2);
                        }
                    } else {
                        $serviceCharge = $invoice->service_charge ?? 0;
                        $tax = $invoice->tax ?? 0;
                        $total = round($amountAfterDiscount + $serviceCharge + $tax, 2);
                    }
                } else {
                    $serviceCharge = $invoice->service_charge ?? 0;
                    $tax = $invoice->tax ?? 0;
                    $total = round($amountAfterDiscount + $serviceCharge + $tax, 2);
                }
            } else {
                // T-GST EXCLUSIVE calculation
                $serviceCharge = 0;
                if ($serviceChargePercentage > 0) {
                    $serviceCharge = round($amountAfterDiscount * ($serviceChargePercentage / 100), 2);
                } elseif ($invoice->service_charge && $invoice->subtotal && $invoice->subtotal > 0) {
                    $serviceChargePercentage = ($invoice->service_charge / $invoice->subtotal) * 100;
                    $serviceCharge = round($amountAfterDiscount * ($serviceChargePercentage / 100), 2);
                }
                $serviceCharge = max(0, $serviceCharge);
                
                $tax = 0;
                if ($taxPercentage > 0) {
                    $tax = round(($amountAfterDiscount + $serviceCharge) * ($taxPercentage / 100), 2);
                }
                $tax = max(0, $tax);
                
                $total = round($amountAfterDiscount + $serviceCharge + $tax, 2);
            }
            
            $total = max(0, $total);
            $serviceCharge = max(0, $serviceCharge);
            $tax = max(0, $tax);

            $invoice->update([
                'subtotal' => $subtotal,
                'tax' => $tax,
                'service_charge' => $serviceCharge,
                'discount' => $discount,
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

    /**
     * Add item to invoice
     */
    public function addItem(Request $request, Invoice $invoice)
    {
        // Verify invoice belongs to user's dive center
        $this->authorizeDiveCenterAccess($invoice, 'Unauthorized access to this invoice');

        // Prevent editing if fully paid
        if ($invoice->isFullyPaid() && $invoice->status === 'Paid') {
            return response()->json([
                'message' => 'Cannot add items to fully paid invoice'
            ], 422);
        }

        $validated = $request->validate([
            'description' => 'required|string|max:500',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'price_list_item_id' => 'nullable|exists:price_list_items,id',
            'booking_dive_id' => 'nullable|exists:booking_dives,id',
            'booking_equipment_id' => 'nullable|exists:booking_equipment,id',
        ]);

        DB::beginTransaction();
        try {
            $itemSubtotal = $validated['quantity'] * $validated['unit_price'];
            $itemDiscount = (float) ($validated['discount'] ?? 0);
            $total = max(0, $itemSubtotal - $itemDiscount); // Ensure total doesn't go negative

            $invoiceItem = InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'description' => $validated['description'],
                'quantity' => $validated['quantity'],
                'unit_price' => $validated['unit_price'],
                'discount' => $itemDiscount,
                'total' => $total,
                'price_list_item_id' => $validated['price_list_item_id'] ?? null,
                'booking_dive_id' => $validated['booking_dive_id'] ?? null,
                'booking_equipment_id' => $validated['booking_equipment_id'] ?? null,
            ]);

            // Recalculate invoice totals
            $subtotal = round((float) ($invoice->invoiceItems()->sum('total') ?? 0), 2);
            
            // Ensure dive center relationship is loaded
            if (!$invoice->relationLoaded('diveCenter')) {
                $invoice->load('diveCenter');
            }
            
            // Get dive center reference early
            $diveCenter = $invoice->diveCenter;
            
            // Check if price list item has tax/service charge configured
            $priceListItem = null;
            if ($validated['price_list_item_id']) {
                $priceListItem = PriceListItem::find($validated['price_list_item_id']);
            }
            
            // Determine tax percentage and whether to apply tax
            $taxPercentage = 0;
            $serviceChargePercentage = 0; // Initialize early to avoid undefined variable errors
            $shouldApplyTax = false;
            $shouldApplyServiceCharge = false;
            
            if ($priceListItem) {
                // Check if price list item has tax configured
                if ($priceListItem->tax_inclusive || ($priceListItem->tax_percentage && $priceListItem->tax_percentage > 0)) {
                    $shouldApplyTax = true;
                    // Use price list item's tax percentage if available, otherwise calculate from existing invoice
                    if ($priceListItem->tax_percentage && $priceListItem->tax_percentage > 0) {
                        $taxPercentage = (float) $priceListItem->tax_percentage;
                    } else {
                        // Calculate from existing invoice tax percentage
                        if ($invoice->tax !== null && $invoice->subtotal !== null && $invoice->subtotal > 0) {
                            $taxPercentage = ($invoice->tax / $invoice->subtotal) * 100;
                        } else {
                            // Try to get T-GST from taxes table
                            $tgstTax = Tax::where('name', 'T-GST')
                                ->orWhere('name', 't-gst')
                                ->orWhere('name', 'TGST')
                                ->first();
                            if ($tgstTax) {
                                $taxPercentage = (float) $tgstTax->percentage;
                            } else {
                                // Fallback: Try to get from dive center settings
                                if ($diveCenter && $diveCenter->settings) {
                                    $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                                    if (isset($settings['tax_percentage'])) {
                                        $taxPercentage = (float) $settings['tax_percentage'];
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Check if price list item has service charge configured
                if ($priceListItem->service_charge_inclusive) {
                    $shouldApplyServiceCharge = true;
                }
            }
            
            // If tax percentage is still not set, try to get it from T-GST tax table or settings
            if ($taxPercentage <= 0) {
                $tgstTax = Tax::where('name', 'T-GST')
                    ->orWhere('name', 't-gst')
                    ->orWhere('name', 'TGST')
                    ->first();
                if ($tgstTax) {
                    $taxPercentage = (float) $tgstTax->percentage;
                } else {
                    // Fallback: Try to get from dive center settings
                    if ($diveCenter && $diveCenter->settings) {
                        $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                        if (isset($settings['tax_percentage'])) {
                            $taxPercentage = (float) $settings['tax_percentage'];
                        }
                    }
                }
            }
            
            /**
             * T-GST EXCLUSIVE (Forward) Calculation
             * Order of Operations: Subtotal -> Discount -> Service Charge -> T-GST
             * 
             * Formulas:
             * 1. subtotal_after_discount = item_total - discount_amount
             * 2. service_charge_amount = subtotal_after_discount * service_charge_percentage
             * 3. tgst_amount = (subtotal_after_discount + service_charge_amount) * tgst_percentage
             * 4. grand_total = subtotal_after_discount + service_charge_amount + tgst_amount
             */
            
            // Step 1: Apply discount (validate discount doesn't exceed subtotal)
            $discount = $invoice->discount ?? 0;
            $discount = max(0, min($discount, $subtotal)); // Cap discount at subtotal, ensure non-negative
            $amountAfterDiscount = round($subtotal - $discount, 2);
            $amountAfterDiscount = max(0, $amountAfterDiscount); // Ensure non-negative
            
            // Get tax calculation mode from dive center settings
            $taxCalculationMode = 'exclusive'; // Default
            if ($diveCenter && $diveCenter->settings) {
                $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                if (isset($settings['tax_calculation_mode'])) {
                    $taxCalculationMode = $settings['tax_calculation_mode'];
                }
            }
            
            // Step 2: Calculate Service Charge (on amount after discount)
            $serviceCharge = 0;
            $serviceChargePercentage = 0;
            
            // Try to get service charge percentage from dive center settings first
            if ($diveCenter) {
                $settings = $diveCenter->settings;
                // Handle both array and JSON string formats
                if (is_string($settings)) {
                    $settings = json_decode($settings, true);
                }
                if (is_array($settings) && isset($settings['service_charge_percentage'])) {
                    $serviceChargePercentage = (float) $settings['service_charge_percentage'];
                }
            }
            
            // If not found in settings, try to get from Tax table
            if ($serviceChargePercentage <= 0) {
                $serviceChargeTax = Tax::where('name', 'Service Charge')
                    ->orWhere('name', 'service charge')
                    ->orWhere('name', 'SERVICE CHARGE')
                    ->first();
                if ($serviceChargeTax) {
                    $serviceChargePercentage = (float) $serviceChargeTax->percentage;
                }
            }
            
            // Step 3: Calculate T-GST percentage
            // If tax percentage is not set yet, try to get it from T-GST tax table or settings
            if ($taxPercentage <= 0) {
                $tgstTax = Tax::where('name', 'T-GST')
                    ->orWhere('name', 't-gst')
                    ->orWhere('name', 'TGST')
                    ->first();
                if ($tgstTax) {
                    $taxPercentage = (float) $tgstTax->percentage;
                } else {
                    // Fallback: Try to get from dive center settings
                    if ($diveCenter && $diveCenter->settings) {
                        $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                        if (isset($settings['tax_percentage'])) {
                            $taxPercentage = (float) $settings['tax_percentage'];
                        }
                    }
                }
            }
            
            // If we have percentages configured, we should apply them (for global tax/SC settings)
            // This ensures T-GST and Service Charge are applied even if items don't have the flags set
            if ($serviceChargePercentage > 0 && $amountAfterDiscount > 0) {
                $shouldApplyServiceCharge = true;
            }
            if ($taxPercentage > 0 && $amountAfterDiscount > 0) {
                $shouldApplyTax = true;
            }
            
            // Apply calculation based on mode
            if ($taxCalculationMode === 'inclusive') {
                /**
                 * T-GST INCLUSIVE CALCULATION
                 * The amountAfterDiscount IS the inclusive total (Total inclusive of SC + T-GST)
                 * Reverse calculate base amount from it
                 * 
                 * Formula: base_amount = inclusive_total / ((1 + sc_percentage) * (1 + tgst_percentage))
                 * Then: service_charge = base_amount * sc_percentage
                 * Then: tgst = (base_amount + service_charge) * tgst_percentage
                 */
                $scDecimal = $serviceChargePercentage > 0 ? ($serviceChargePercentage / 100) : 0;
                $tgstDecimal = $taxPercentage > 0 ? ($taxPercentage / 100) : 0;
                
                // Initialize
                $serviceCharge = 0;
                $tax = 0;
                $total = $amountAfterDiscount; // This is the inclusive total
                
                // Always calculate if we have percentages and amount > 0
                if ($amountAfterDiscount > 0 && ($scDecimal > 0 || $tgstDecimal > 0)) {
                    // Calculate denominator: (1 + SC%) * (1 + T-GST%)
                    $denominator = (1 + $scDecimal) * (1 + $tgstDecimal);
                    
                    if ($denominator > 0 && $denominator != 1) {
                        // Reverse calculate base amount from inclusive total
                        $baseAmount = round($amountAfterDiscount / $denominator, 2);
                        
                        // Calculate service charge portion (always if percentage exists)
                        if ($scDecimal > 0) {
                            $serviceCharge = round($baseAmount * $scDecimal, 2);
                        }
                        
                        // Calculate T-GST portion (always if percentage exists)
                        if ($tgstDecimal > 0) {
                            $tax = round(($baseAmount + $serviceCharge) * $tgstDecimal, 2);
                        }
                        
                        // Total should equal the inclusive total (amountAfterDiscount)
                        $total = round($baseAmount + $serviceCharge + $tax, 2);
                        
                        // Adjust for rounding differences
                        $roundingDiff = $amountAfterDiscount - $total;
                        if (abs($roundingDiff) > 0.01) {
                            // Adjust tax to account for rounding
                            $tax = round($tax + $roundingDiff, 2);
                            $total = round($baseAmount + $serviceCharge + $tax, 2);
                        }
                    } else {
                        // Fallback: no percentages or invalid denominator
                        $serviceCharge = 0;
                        $tax = 0;
                        $total = $amountAfterDiscount;
                    }
                } else {
                    // No percentages or zero amount
                    $serviceCharge = 0;
                    $tax = 0;
                    $total = $amountAfterDiscount;
                }
            } else {
                /**
                 * T-GST EXCLUSIVE (Forward) Calculation
                 * Order of Operations: Subtotal -> Discount -> Service Charge -> T-GST
                 */
                
                // Apply service charge if:
                // 1. Price list item has service_charge_inclusive = true, OR
                // 2. Invoice already has service charge applied
                if ($shouldApplyServiceCharge || ($invoice->service_charge !== null && $invoice->service_charge > 0)) {
                    if ($serviceChargePercentage > 0) {
                        // Formula: service_charge = subtotal_after_discount * service_charge_percentage
                        // Note: serviceChargePercentage is stored as whole number (e.g., 10 for 10%), so divide by 100
                        $serviceCharge = round($amountAfterDiscount * ($serviceChargePercentage / 100), 2);
                    } elseif ($invoice->service_charge !== null && $invoice->service_charge > 0) {
                        // Fallback: Recalculate service charge based on percentage from existing values
                        $originalSubtotal = $invoice->subtotal ?? $subtotal;
                        if ($originalSubtotal > 0) {
                            $serviceChargePercentage = ($invoice->service_charge / $originalSubtotal) * 100;
                            $serviceCharge = round($amountAfterDiscount * ($serviceChargePercentage / 100), 2);
                        } else {
                            $serviceCharge = round((float) $invoice->service_charge, 2);
                        }
                    } elseif ($shouldApplyServiceCharge && $serviceChargePercentage <= 0) {
                        // If price list item requires service charge but percentage not found, log warning
                        \Log::warning('Service charge inclusive item added but service charge percentage not configured', [
                            'invoice_id' => $invoice->id,
                            'price_list_item_id' => $validated['price_list_item_id'] ?? null,
                            'dive_center_id' => $diveCenter->id ?? null,
                            'dive_center_settings' => $diveCenter->settings ?? null,
                        ]);
                    }
                }
                $serviceCharge = max(0, $serviceCharge); // Ensure non-negative
                
                // Calculate T-GST
                if (($shouldApplyTax || ($invoice->tax !== null && $invoice->tax > 0)) && $taxPercentage > 0) {
                    // Formula: tgst = (subtotal_after_discount + service_charge_amount) * tgst_percentage
                    // Note: taxPercentage is stored as whole number (e.g., 17 for 17%), so divide by 100
                    $tax = round(($amountAfterDiscount + $serviceCharge) * ($taxPercentage / 100), 2);
                } elseif ($invoice->tax !== null && $invoice->tax > 0 && $taxPercentage <= 0) {
                    // Fallback: Recalculate tax based on percentage from existing values
                    $originalSubtotal = $invoice->subtotal ?? $subtotal;
                    $originalServiceCharge = $invoice->service_charge ?? 0;
                    if ($originalSubtotal > 0) {
                        // Calculate tax percentage from original (subtotal + service charge)
                        $originalBase = $originalSubtotal + $originalServiceCharge;
                        if ($originalBase > 0) {
                            $taxPercentage = ($invoice->tax / $originalBase) * 100;
                            $tax = round(($amountAfterDiscount + $serviceCharge) * ($taxPercentage / 100), 2);
                        } else {
                            $tax = round((float) $invoice->tax, 2);
                        }
                    } else {
                        $tax = round((float) $invoice->tax, 2);
                    }
                }
                $tax = max(0, $tax); // Ensure non-negative
                
                // Step 4: Calculate Grand Total
                // Formula: grand_total = subtotal_after_discount + service_charge_amount + tgst_amount
                $total = round($amountAfterDiscount + $serviceCharge + $tax, 2);
            }
            
            $total = max(0, $total); // Ensure non-negative
            $serviceCharge = max(0, $serviceCharge); // Ensure non-negative
            $tax = max(0, $tax); // Ensure non-negative

            $invoice->update([
                'subtotal' => $subtotal,
                'tax' => $tax,
                'service_charge' => $serviceCharge,
                'discount' => $discount,
                'total' => $total,
            ]);

            DB::commit();

            // Refresh invoice to get latest data
            $invoice->refresh();
            
            // Load relationships safely
            $invoice->load([
                'customer',
                'invoiceItems.priceListItem',
                'payments'
            ]);
            
            // Conditionally load booking-related relationships
            if ($invoice->booking_id) {
                $invoice->load(['booking.customer']);
            }
            
            // Load dive and equipment relationships for items that have them
            $invoice->load([
                'invoiceItems' => function ($query) {
                    $query->with([
                        'bookingDive.diveSite',
                        'bookingEquipment.equipmentItem.equipment'
                    ]);
                }
            ]);
            
            return response()->json($invoice, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to add item to invoice', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $validated
            ]);
            return response()->json([
                'message' => 'Failed to add item to invoice',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Remove an item from an invoice.
     */
    public function deleteItem(Request $request, Invoice $invoice, InvoiceItem $invoiceItem)
    {
        // Verify invoice belongs to user's dive center
        $this->authorizeDiveCenterAccess($invoice, 'Unauthorized access to this invoice');

        // Verify invoice item belongs to this invoice
        if ($invoiceItem->invoice_id !== $invoice->id) {
            return response()->json([
                'message' => 'Invoice item does not belong to this invoice'
            ], 422);
        }

        // Prevent editing if fully paid
        if ($invoice->isFullyPaid() && $invoice->status === 'Paid') {
            return response()->json([
                'message' => 'Cannot remove items from fully paid invoice'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Delete the invoice item
            $invoiceItem->delete();

            /**
             * Recalculate invoice totals after deleting item
             */
            $subtotal = round((float) ($invoice->invoiceItems()->sum('total') ?? 0), 2);
            
            // Get tax calculation mode from dive center settings
            $diveCenter = $invoice->diveCenter;
            $taxCalculationMode = 'exclusive'; // Default
            if ($diveCenter && $diveCenter->settings) {
                $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                if (isset($settings['tax_calculation_mode'])) {
                    $taxCalculationMode = $settings['tax_calculation_mode'];
                }
            }
            
            // Step 1: Apply discount (validate discount doesn't exceed subtotal)
            $discount = $invoice->discount ?? 0;
            $discount = max(0, min($discount, $subtotal)); // Cap discount at subtotal
            $amountAfterDiscount = round($subtotal - $discount, 2);
            $amountAfterDiscount = max(0, $amountAfterDiscount);
            
            // Get percentages
            $serviceChargePercentage = 0;
            $taxPercentage = 0;
            
            if ($diveCenter && $diveCenter->settings) {
                $settings = is_array($diveCenter->settings) ? $diveCenter->settings : json_decode($diveCenter->settings, true);
                if (isset($settings['service_charge_percentage'])) {
                    $serviceChargePercentage = (float) $settings['service_charge_percentage'];
                }
            }
            if ($serviceChargePercentage <= 0) {
                $serviceChargeTax = Tax::where('name', 'Service Charge')
                    ->orWhere('name', 'service charge')
                    ->orWhere('name', 'SERVICE CHARGE')
                    ->first();
                if ($serviceChargeTax) {
                    $serviceChargePercentage = (float) $serviceChargeTax->percentage;
                }
            }
            
            $tgstTax = Tax::where('name', 'T-GST')
                ->orWhere('name', 't-gst')
                ->orWhere('name', 'TGST')
                ->first();
            if ($tgstTax) {
                $taxPercentage = (float) $tgstTax->percentage;
            } elseif ($invoice->tax !== null && $invoice->tax > 0) {
                $originalSubtotal = $invoice->subtotal ?? $subtotal;
                $originalServiceCharge = $invoice->service_charge ?? 0;
                if ($originalSubtotal > 0 && $subtotal > 0) {
                    $originalBase = $originalSubtotal + $originalServiceCharge;
                    if ($originalBase > 0) {
                        $taxPercentage = ($invoice->tax / $originalBase) * 100;
                    }
                }
            }
            
            // Step 2 & 3: Calculate based on mode
            if ($taxCalculationMode === 'inclusive') {
                /**
                 * T-GST INCLUSIVE CALCULATION
                 * The amountAfterDiscount IS the inclusive total
                 * Reverse calculate base amount from it
                 */
                $scDecimal = $serviceChargePercentage > 0 ? ($serviceChargePercentage / 100) : 0;
                $tgstDecimal = $taxPercentage > 0 ? ($taxPercentage / 100) : 0;
                
                $serviceCharge = 0;
                $tax = 0;
                $total = $amountAfterDiscount; // This is the inclusive total
                
                if ($amountAfterDiscount > 0 && ($scDecimal > 0 || $tgstDecimal > 0) && 
                    (($invoice->service_charge !== null && $invoice->service_charge > 0) || 
                     ($invoice->tax !== null && $invoice->tax > 0))) {
                    $denominator = (1 + $scDecimal) * (1 + $tgstDecimal);
                    if ($denominator > 0 && $denominator != 1) {
                        $baseAmount = round($amountAfterDiscount / $denominator, 2);
                        if ($invoice->service_charge !== null && $invoice->service_charge > 0) {
                            $serviceCharge = round($baseAmount * $scDecimal, 2);
                        }
                        if ($invoice->tax !== null && $invoice->tax > 0) {
                            $tax = round(($baseAmount + $serviceCharge) * $tgstDecimal, 2);
                        }
                        $total = round($baseAmount + $serviceCharge + $tax, 2);
                        
                        // Adjust for rounding
                        $roundingDiff = $amountAfterDiscount - $total;
                        if (abs($roundingDiff) > 0.01) {
                            $tax = round($tax + $roundingDiff, 2);
                            $total = round($baseAmount + $serviceCharge + $tax, 2);
                        }
                    } else {
                        $serviceCharge = $invoice->service_charge ?? 0;
                        $tax = $invoice->tax ?? 0;
                        $total = round($amountAfterDiscount + $serviceCharge + $tax, 2);
                    }
                } else {
                    $serviceCharge = $invoice->service_charge ?? 0;
                    $tax = $invoice->tax ?? 0;
                    $total = round($amountAfterDiscount + $serviceCharge + $tax, 2);
                }
            } else {
                // T-GST EXCLUSIVE calculation
                $serviceCharge = 0;
                if ($serviceChargePercentage > 0) {
                    $serviceCharge = round($amountAfterDiscount * ($serviceChargePercentage / 100), 2);
                } elseif ($invoice->service_charge !== null && $invoice->service_charge > 0) {
                    $originalSubtotal = $invoice->subtotal ?? $subtotal;
                    if ($originalSubtotal > 0 && $subtotal > 0) {
                        $serviceChargePercentage = ($invoice->service_charge / $originalSubtotal) * 100;
                        $serviceCharge = round($amountAfterDiscount * ($serviceChargePercentage / 100), 2);
                    } else {
                        $serviceCharge = 0;
                    }
                }
                $serviceCharge = max(0, $serviceCharge);
                
                $tax = 0;
                if ($taxPercentage > 0) {
                    $tax = round(($amountAfterDiscount + $serviceCharge) * ($taxPercentage / 100), 2);
                }
                $tax = max(0, $tax);
                
                $total = round($amountAfterDiscount + $serviceCharge + $tax, 2);
            }
            
            $total = max(0, $total);
            $serviceCharge = max(0, $serviceCharge);
            $tax = max(0, $tax);

            $invoice->update([
                'subtotal' => $subtotal,
                'tax' => $tax,
                'service_charge' => $serviceCharge,
                'discount' => $discount,
                'total' => $total,
            ]);

            DB::commit();

            // Refresh invoice to get latest data
            $invoice->refresh();
            
            // Load relationships safely
            $invoice->load([
                'customer',
                'invoiceItems.priceListItem',
                'payments'
            ]);
            
            // Conditionally load booking-related relationships
            if ($invoice->booking_id) {
                $invoice->load(['booking.customer']);
            }
            
            // Load dive and equipment relationships for items that have them
            $invoice->load([
                'invoiceItems' => function ($query) {
                    $query->with([
                        'bookingDive.diveSite',
                        'bookingEquipment.equipmentItem.equipment'
                    ]);
                }
            ]);
            
            return response()->json($invoice, 200);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to delete item from invoice', [
                'invoice_id' => $invoice->id,
                'invoice_item_id' => $invoiceItem->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to delete item from invoice',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }
}


