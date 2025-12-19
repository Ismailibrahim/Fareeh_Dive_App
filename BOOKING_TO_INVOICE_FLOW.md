# Booking to Invoice Flow - Step-by-Step Guide

This document explains the complete process of how bookings are converted to invoices in the SAS Scuba application.

## Overview

The system supports generating invoices from bookings, which can include:
- **Completed dives** (only dives with status "Completed")
- **Equipment rentals** (all equipment assigned to the booking)
- **Multiple invoice types**: Advance, Final, or Full invoices
- **Tax calculation** (configurable percentage)

---

## Step-by-Step Process

### Step 1: Create a Booking

**Location**: `/dashboard/bookings/create` or via API

**What happens:**
1. Staff creates a booking for a customer
2. Booking is stored with:
   - `customer_id` - Links to customer
   - `dive_center_id` - Multi-tenancy scoping
   - `booking_date` - Date of booking
   - `status` - Pending, Confirmed, Completed, or Cancelled

**Database Table**: `bookings`

**Code Reference**:
```12:54:sas-scuba-api/app/Http/Controllers/Api/V1/BookingController.php
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Booking::with(['customer', 'diveCenter']);

        // Add dive center scoping
        if ($user->dive_center_id) {
            $query->where('dive_center_id', $user->dive_center_id);
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'dive_center_id' => 'required|exists:dive_centers,id',
            'customer_id' => 'required|exists:customers,id',
            'start_date' => 'required|date',
            'number_of_divers' => 'nullable|integer|min:1',
            'dive_site_id' => 'nullable|exists:dive_sites,id',
            'status' => 'sometimes|string|in:Pending,Confirmed,Completed,Cancelled',
            'notes' => 'nullable|string',
        ]);

        // Map start_date to booking_date for database
        $bookingData = [
            'dive_center_id' => $validated['dive_center_id'],
            'customer_id' => $validated['customer_id'],
            'booking_date' => $validated['start_date'],
            'number_of_divers' => $validated['number_of_divers'] ?? null,
            'status' => $validated['status'] ?? 'Pending',
            'notes' => $validated['notes'] ?? null,
        ];

        $booking = Booking::create($bookingData);
        return response()->json($booking, 201);
    }
```

---

### Step 2: Add Dives to Booking

**Location**: `/dashboard/booking-dives/create` or via API

**What happens:**
1. Staff adds individual dives to the booking
2. Each dive includes:
   - `dive_site_id` - Where the dive takes place
   - `dive_date` and `dive_time` - When the dive happens
   - `price_list_item_id` - Links to price list for pricing
   - `price` - Snapshot of price at time of booking
   - `status` - Scheduled, In Progress, Completed, or Cancelled

**Important**: Only dives with `status = 'Completed'` will be included in invoices.

**Database Table**: `booking_dives`

**Code Reference**:
```143:151:sas-scuba-api/database/migrations/2025_12_15_000000_create_full_schema.php
        Schema::create('booking_dives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignId('dive_site_id')->constrained('dive_sites')->onDelete('cascade');
            $table->foreignId('boat_id')->nullable()->constrained('boats')->onDelete('set null');
            $table->date('dive_date')->nullable();
            $table->time('dive_time')->nullable();
            $table->timestamps();
        });
```

---

### Step 3: Add Equipment to Booking (Optional)

**Location**: `/dashboard/booking-equipment/create` or via API

**What happens:**
1. Staff assigns equipment items to the booking
2. Equipment can be:
   - **Center equipment** - Equipment owned by the dive center
   - **Customer equipment** - Customer's own equipment (for tracking)
3. Each equipment assignment includes:
   - `equipment_item_id` - Links to equipment item (if center equipment)
   - `price` - Rental price
   - `checkout_date` and `return_date` - Date range
   - `equipment_source` - 'Center' or 'Customer Own'

**Database Table**: `booking_equipment`

**Note**: All equipment rentals (not just returned ones) are included in invoices.

---

### Step 4: Complete Dives

**Location**: After dive is completed, staff updates dive status

**What happens:**
1. Staff marks dive as "Completed" via API endpoint: `POST /api/v1/booking-dives/{id}/complete`
2. Dive status changes from "Scheduled" or "In Progress" to "Completed"
3. Optional: Staff can add dive log information (duration, depth, notes)

**Important**: Only completed dives can be invoiced.

**Code Reference**:
```148:153:sas-scuba-api/app/Http/Controllers/Api/V1/InvoiceController.php
            // Add completed dives
            if ($includeDives) {
                $completedDives = $booking->bookingDives()
                    ->where('status', 'Completed')
                    ->whereDoesntHave('invoiceItems')
                    ->with(['diveSite', 'priceListItem'])
                    ->get();
```

---

### Step 5: Generate Invoice from Booking

**Location**: Booking detail page → "Generate Invoice" button
**Frontend**: `/dashboard/bookings/[id]/page.tsx`
**Backend API**: `POST /api/v1/invoices/generate-from-booking`

#### 5.1 Frontend Process

**User Actions:**
1. Navigate to booking detail page: `/dashboard/bookings/{id}`
2. Click "Generate Invoice" button
3. Dialog opens with options:
   - **Invoice Type**: Full, Advance, or Final
   - **Include Completed Dives**: Checkbox (default: checked)
   - **Include Equipment Rentals**: Checkbox (default: checked)
   - **Tax Percentage**: Number input (optional, uses dive center default if not provided)

**Code Reference**:
```49:74:sas-scuba-web/src/components/invoices/InvoiceGenerationDialog.tsx
    const handleGenerate = async () => {
        setLoading(true);
        try {
            const request: GenerateInvoiceRequest = {
                booking_id: bookingId,
                invoice_type: invoiceType,
                include_dives: includeDives,
                include_equipment: includeEquipment,
                tax_percentage: taxPercentage || undefined,
            };

            const invoice = await invoiceService.generateFromBooking(request);
            
            if (onSuccess) {
                onSuccess();
            }
            
            onOpenChange(false);
            router.push(`/dashboard/invoices/${invoice.id}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to generate invoice", error);
        } finally {
            setLoading(false);
        }
    };
```

#### 5.2 Backend Process

**API Endpoint**: `POST /api/v1/invoices/generate-from-booking`

**Request Body:**
```json
{
  "booking_id": 1,
  "invoice_type": "Full",  // or "Advance" or "Final"
  "include_dives": true,
  "include_equipment": true,
  "tax_percentage": 10.0  // optional
}
```

**Backend Steps:**

1. **Validate Request**
   - Verify booking exists and belongs to user's dive center
   - Validate invoice type (Advance, Final, or Full)
   - Validate tax percentage (0-100)

2. **Create Invoice Record**
   ```php
   $invoice = Invoice::create([
       'dive_center_id' => $diveCenterId,
       'booking_id' => $validated['booking_id'],
       'invoice_no' => null,  // Will be auto-generated
       'invoice_date' => now()->toDateString(),
       'invoice_type' => $invoiceType,
       'status' => 'Draft',
       'currency' => $booking->diveCenter->currency ?? 'USD',
   ]);
   ```

3. **Generate Invoice Number**
   - Format: `INV-YYYY-###` (e.g., `INV-2025-001`)
   - Based on year and sequential count per dive center

4. **Add Completed Dives as Invoice Items**
   - Query: Get all completed dives that haven't been invoiced yet
   - For each dive:
     - Create `InvoiceItem` record
     - Link to `booking_dive_id`
     - Use dive's stored `price`
     - Description: "Dive - {Dive Site Name} - {Date}"
     - Add to subtotal

5. **Add Equipment Rentals as Invoice Items**
   - Query: Get all equipment that hasn't been invoiced yet
   - For each equipment:
     - Create `InvoiceItem` record
     - Link to `booking_equipment_id`
     - Use equipment's `price`
     - Description: "{Equipment Name} - {Size}"
     - Add to subtotal

6. **Calculate Totals**
   ```php
   $tax = $subtotal * ($taxPercentage / 100);
   $total = $subtotal + $tax;
   
   $invoice->update([
       'subtotal' => $subtotal,
       'tax' => $tax,
       'total' => $total,
   ]);
   ```

7. **Return Invoice**
   - Load all relationships (booking, customer, items, payments)
   - Return JSON response

**Code Reference**:
```102:212:sas-scuba-api/app/Http/Controllers/Api/V1/InvoiceController.php
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
```

---

### Step 6: View and Manage Invoice

**Location**: `/dashboard/invoices/{id}`

**What you can see:**
- Invoice number and date
- Customer information
- List of invoice items (dives and equipment)
- Subtotal, tax, and total
- Payment history
- Remaining balance

**What you can do:**
- Add payments to the invoice
- View invoice details
- Print/export invoice (if implemented)

---

## Key Business Rules

### 1. **Only Completed Dives Are Invoiced**
   - Dives must have `status = 'Completed'` to be included
   - Prevents invoicing for dives that haven't happened yet

### 2. **Items Can Only Be Invoiced Once**
   - Uses `whereDoesntHave('invoiceItems')` to check
   - Prevents double-billing of the same dive or equipment

### 3. **Invoice Types**
   - **Full**: Complete invoice for all items
   - **Advance**: Partial payment before services (can create final invoice later)
   - **Final**: Final invoice after advance payment

### 4. **Tax Calculation**
   - Tax percentage can be set per invoice or use dive center default
   - Tax is calculated on subtotal: `tax = subtotal * (taxPercentage / 100)`
   - Total = Subtotal + Tax

### 5. **Price Snapshot**
   - Dives store `price` at time of booking (from price list)
   - Equipment stores `price` at time of assignment
   - Invoice uses these stored prices, not current price list prices

---

## Database Relationships

```
bookings
  ├── booking_dives (hasMany)
  │     └── invoice_items (hasMany) [via booking_dive_id]
  │
  ├── booking_equipment (hasMany)
  │     └── invoice_items (hasMany) [via booking_equipment_id]
  │
  └── invoices (hasMany)
        ├── invoice_items (hasMany)
        └── payments (hasMany)
```

---

## API Endpoints

### Generate Invoice from Booking
```
POST /api/v1/invoices/generate-from-booking
```

**Request:**
```json
{
  "booking_id": 1,
  "invoice_type": "Full",
  "include_dives": true,
  "include_equipment": true,
  "tax_percentage": 10.0
}
```

**Response:**
```json
{
  "id": 1,
  "invoice_no": "INV-2025-001",
  "booking_id": 1,
  "subtotal": 500.00,
  "tax": 50.00,
  "total": 550.00,
  "status": "Draft",
  "invoice_items": [...],
  "payments": []
}
```

---

## Frontend Components

1. **Booking Detail Page**: `/dashboard/bookings/[id]/page.tsx`
   - Shows booking information
   - Displays existing invoices
   - "Generate Invoice" button

2. **Invoice Generation Dialog**: `components/invoices/InvoiceGenerationDialog.tsx`
   - Form for selecting invoice options
   - Invoice type selection
   - Include/exclude items checkboxes
   - Tax percentage input

3. **Invoice Detail Page**: `/dashboard/invoices/[id]/page.tsx`
   - View invoice details
   - Add payments
   - View payment history

---

## Summary

The booking-to-invoice flow is:

1. **Create Booking** → Customer and booking date
2. **Add Dives** → Individual dives with pricing
3. **Add Equipment** → Equipment rentals (optional)
4. **Complete Dives** → Mark dives as completed
5. **Generate Invoice** → Automatically create invoice with completed dives and equipment
6. **Add Payments** → Record payments against invoice

The system ensures:
- ✅ Only completed dives are invoiced
- ✅ Items are only invoiced once
- ✅ Prices are snapshotted at booking time
- ✅ Tax is calculated automatically
- ✅ Multiple invoice types supported (Advance/Final/Full)
- ✅ Full audit trail via invoice items linking back to booking dives/equipment

