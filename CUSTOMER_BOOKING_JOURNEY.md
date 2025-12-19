# Customer Booking Journey - Complete Walkthrough

This document walks through the **complete process** from when a customer arrives at the dive center to book a dive, all the way through to invoicing and payment.

---

## Scenario: Customer Walks Into Dive Center

**Customer**: Sarah Johnson  
**Date**: December 17, 2025  
**Time**: 9:00 AM  
**Request**: "I'd like to book a dive for today at 2:00 PM"

---

## Step 1: Customer Registration/Verification (If New Customer)

**Staff Action**: Check if customer exists in system

### Option A: Existing Customer
1. Staff searches for customer by name, email, or passport number
2. Customer found → Proceed to Step 2

**Location**: `/dashboard/customers`  
**Action**: Search existing customers

### Option B: New Customer
1. Staff clicks "Add Customer" button
2. Fills in customer form:
   - Full Name: Sarah Johnson
   - Email: sarah@example.com
   - Phone: +1-555-0123
   - Passport Number: AB123456
   - Date of Birth: 1990-05-15
   - Gender: Female
   - Nationality: American
3. Clicks "Create Customer"
4. System creates customer record in `customers` table

**Location**: `/dashboard/customers/create`  
**API**: `POST /api/v1/customers`

**Code Reference**:
```82:93:sas-scuba-api/database/migrations/2025_12_15_000000_create_full_schema.php
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('full_name');
            $table->string('passport_no')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('nationality')->nullable();
            $table->timestamps();
        });
```

---

## Step 2: Quick Booking (Walk-In Mode)

**Staff Action**: Create dive booking using "Quick Booking Mode"

### 2.1 Navigate to Create Dive
**Location**: `/dashboard/booking-dives/create`

### 2.2 Enable Quick Booking Mode
1. Staff sees "Booking Mode" card
2. Toggles switch to "Quick Booking Mode (Walk-in)"
3. Form changes to show customer selection instead of booking selection

**Frontend Code**:
```234:257:sas-scuba-web/src/components/booking-dives/BookingDiveForm.tsx
                {!initialData && !bookingDiveId && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Booking Mode
                            </CardTitle>
                            <CardDescription>
                                Choose how to create this dive booking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={createMode === 'quick'}
                                    onCheckedChange={(checked) => setCreateMode(checked ? 'quick' : 'existing')}
                                />
                                <label className="text-sm font-medium">
                                    {createMode === 'quick' ? 'Quick Booking Mode (Walk-in)' : 'Select Existing Booking'}
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                )}
```

### 2.3 Fill in Dive Details
Staff fills in the form:

**Customer Information** (Quick Booking Mode):
- **Customer**: Select "Sarah Johnson" from dropdown
- **Booking Date**: December 17, 2025 (defaults to today)
- **Number of Divers**: 1

**Dive Details**:
- **Dive Site**: Select "Coral Reef" (required)
- **Boat**: Select "Dive Boat 1" (optional)
- **Dive Date**: December 17, 2025
- **Dive Time**: 14:00 (2:00 PM)
- **Price List Item**: Select "Single Dive - Morning" ($75.00)
  - Price auto-populates: $75.00
- **Status**: Scheduled (default)

### 2.4 Submit Booking
1. Staff clicks "Create Booking Dive"
2. Frontend sends request to API

**Frontend Payload**:
```json
{
  "customer_id": 123,
  "booking_date": "2025-12-17",
  "number_of_divers": 1,
  "dive_site_id": 5,
  "boat_id": 2,
  "dive_date": "2025-12-17",
  "dive_time": "14:00",
  "price_list_item_id": 10,
  "price": 75.00,
  "status": "Scheduled"
}
```

### 2.5 Backend Processing (Automatic)

**What Happens Behind the Scenes**:

1. **API Receives Request**: `POST /api/v1/booking-dives`
2. **Validates Data**: Checks all required fields
3. **Auto-Creates Booking** (because `booking_id` not provided):
   ```php
   // System automatically creates booking
   $booking = Booking::create([
       'dive_center_id' => $diveCenterId,
       'customer_id' => 123,  // Sarah Johnson
       'booking_date' => '2025-12-17',
       'number_of_divers' => 1,
       'status' => 'Pending',
   ]);
   ```
4. **Creates Dive Record**:
   ```php
   $bookingDive = BookingDive::create([
       'booking_id' => $booking->id,  // Auto-created booking
       'dive_site_id' => 5,
       'boat_id' => 2,
       'dive_date' => '2025-12-17',
       'dive_time' => '14:00',
       'price_list_item_id' => 10,
       'price' => 75.00,  // Snapshot of price
       'status' => 'Scheduled',
   ]);
   ```

**Backend Code**:
```57:89:sas-scuba-api/app/Http/Controllers/Api/V1/BookingDiveController.php
        // Walk-in support: Auto-create booking if booking_id not provided
        $bookingId = $validated['booking_id'] ?? null;
        
        if (!$bookingId && isset($validated['customer_id'])) {
            // Validate customer belongs to dive center
            $customer = \App\Models\Customer::where('id', $validated['customer_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();

            // Create booking in transaction
            DB::beginTransaction();
            try {
                $booking = Booking::create([
                    'dive_center_id' => $diveCenterId,
                    'customer_id' => $validated['customer_id'],
                    'booking_date' => $validated['booking_date'] ?? $validated['dive_date'] ?? now()->toDateString(),
                    'number_of_divers' => $validated['number_of_divers'] ?? null,
                    'status' => 'Pending',
                ]);
                $bookingId = $booking->id;
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Failed to create booking',
                    'error' => $e->getMessage()
                ], 500);
            }
        } elseif (!$bookingId) {
            return response()->json([
                'message' => 'Either booking_id or customer_id must be provided'
            ], 422);
        }
```

**Result**:
- ✅ Booking created automatically (Booking #456)
- ✅ Dive created and linked to booking (Dive #789)
- ✅ Price snapshot stored ($75.00)
- ✅ Status: "Scheduled"

---

## Step 3: Equipment Assignment (Optional)

**Customer**: "I need to rent a wetsuit and BCD"

**Staff Action**: Create equipment basket and assign equipment

### 3.1 Create Equipment Basket
**Location**: `/dashboard/baskets/create`

1. Staff clicks "Create Basket"
2. Fills in form:
   - **Customer**: Sarah Johnson
   - **Booking**: Booking #456 (auto-linked)
   - **Checkout Date**: December 17, 2025
   - **Expected Return Date**: December 17, 2025 (same day)
   - **Notes**: "Single day rental"
3. System generates unique **Basket Number**: `BKT-2025-001`

**What Happens**:
- Basket record created in `equipment_baskets` table
- Unique basket number generated
- Basket linked to booking

### 3.2 Add Equipment to Basket
**Location**: Basket detail page or booking equipment page

1. Staff clicks "Add Equipment" to basket
2. For each equipment item:

   **Wetsuit (Size M)**:
   - Select equipment item: "Wetsuit - Medium"
   - Equipment Source: "Center"
   - Checkout Date: December 17, 2025
   - Return Date: December 17, 2025
   - Price: $25.00
   - Assignment Status: "Pending"

   **BCD (Size M)**:
   - Select equipment item: "BCD - Medium"
   - Equipment Source: "Center"
   - Checkout Date: December 17, 2025
   - Return Date: December 17, 2025
   - Price: $30.00
   - Assignment Status: "Pending"

3. System checks equipment availability
4. Equipment assigned to basket

**Result**:
- ✅ Basket created: `BKT-2025-001`
- ✅ 2 equipment items assigned
- ✅ Total equipment rental: $55.00
- ✅ Equipment status: "Rented" (in equipment_items table)

---

## Step 4: Pre-Dive Preparation

**Time**: 1:30 PM (30 minutes before dive)

### 4.1 Assign Instructors (Optional)
**Location**: Booking dive detail page

1. Staff navigates to dive detail: `/dashboard/booking-dives/789`
2. Clicks "Assign Instructor"
3. Selects instructor: "John Smith (Divemaster)"
4. System links instructor to dive

### 4.2 Check Equipment
1. Staff checks out equipment to customer
2. Updates equipment assignment status to "Checked Out"
3. Customer receives equipment basket

---

## Step 5: Dive Execution

**Time**: 2:00 PM - 3:30 PM

1. Customer goes on dive
2. Dive happens as scheduled
3. Customer returns to dive center

---

## Step 6: Post-Dive - Complete Dive & Log

**Time**: 3:45 PM (after dive)

**Staff Action**: Mark dive as completed and log details

### 6.1 Navigate to Dive Detail
**Location**: `/dashboard/booking-dives/789`

### 6.2 Update Dive Status
1. Staff changes status from "Scheduled" to "In Progress" (before dive) or directly to "Completed" (after dive)
2. If completing, staff fills in dive log:
   - **Dive Duration**: 90 minutes
   - **Max Depth**: 18.5 meters
   - **Dive Site**: Coral Reef (already set)
   - **Instructor**: John Smith (already assigned)
   - **Date**: December 17, 2025 (already set)
   - **Notes**: "Great visibility, saw turtles"

### 6.3 Complete Dive
1. Staff clicks "Complete Dive" button
2. System updates:
   - Status: "Completed"
   - `completed_at`: Current timestamp
   - Dive log fields saved

**API Call**: `POST /api/v1/booking-dives/789/complete`

**Backend Code**:
```278:320:sas-scuba-api/app/Http/Controllers/Api/V1/BookingDiveController.php
    public function complete(Request $request, BookingDive $bookingDive)
    {
        $user = $request->user();
        
        // Verify dive belongs to user's dive center
        if ($user->dive_center_id) {
            $bookingDive->load('booking');
            if (!$bookingDive->booking || $bookingDive->booking->dive_center_id !== $user->dive_center_id) {
                return response()->json(['message' => 'Dive not found'], 404);
            }
        }

        // Prevent completing dive twice
        if ($bookingDive->status === 'Completed') {
            return response()->json([
                'message' => 'Dive is already completed'
            ], 422);
        }

        $validated = $request->validate([
            'dive_duration' => 'nullable|integer|min:1|max:600',
            'max_depth' => 'nullable|numeric|min:0|max:200',
            'dive_log_notes' => 'nullable|string',
        ]);

        $bookingDive->update([
            'status' => 'Completed',
            'completed_at' => now(),
            'dive_duration' => $validated['dive_duration'] ?? null,
            'max_depth' => $validated['max_depth'] ?? null,
            'dive_log_notes' => $validated['dive_log_notes'] ?? null,
        ]);

        $bookingDive->load(['booking.customer', 'diveSite', 'boat', 'priceListItem', 'bookingInstructors.user']);
        return response()->json($bookingDive);
    }
```

**Result**:
- ✅ Dive status: "Completed"
- ✅ Dive log saved
- ✅ Dive is now ready to be invoiced

---

## Step 7: Return Equipment

**Time**: 4:00 PM

**Staff Action**: Mark equipment as returned

1. Customer returns equipment
2. Staff navigates to basket: `/dashboard/baskets/BKT-2025-001`
3. For each equipment item, clicks "Return Equipment"
4. System updates:
   - Assignment Status: "Returned"
   - Actual Return Date: December 17, 2025
   - Equipment status: "Available" (in equipment_items table)

**Result**:
- ✅ Equipment returned
- ✅ Equipment available for next customer
- ✅ Equipment ready to be invoiced

---

## Step 8: Generate Invoice

**Time**: 4:15 PM

**Staff Action**: Create invoice from booking

### 8.1 Navigate to Booking Detail
**Location**: `/dashboard/bookings/456`

### 8.2 Generate Invoice
1. Staff clicks "Generate Invoice" button
2. Invoice Generation Dialog opens

### 8.3 Configure Invoice Options
Staff selects:
- **Invoice Type**: "Full" (default)
- **Include Completed Dives**: ✅ Checked (default)
- **Include Equipment Rentals**: ✅ Checked (default)
- **Tax Percentage**: 10% (or uses dive center default)

### 8.4 Preview & Generate
1. Staff reviews what will be included:
   - ✅ 1 Completed Dive: "Dive - Coral Reef - Dec 17, 2025" - $75.00
   - ✅ 1 Equipment: "Wetsuit - Medium" - $25.00
   - ✅ 1 Equipment: "BCD - Medium" - $30.00
2. Staff clicks "Generate Invoice"

### 8.5 Backend Processing

**What Happens**:

1. **Create Invoice Record**:
   ```php
   $invoice = Invoice::create([
       'dive_center_id' => $diveCenterId,
       'booking_id' => 456,
       'invoice_no' => null,  // Will be auto-generated
       'invoice_date' => '2025-12-17',
       'invoice_type' => 'Full',
       'status' => 'Draft',
       'currency' => 'USD',
   ]);
   ```

2. **Generate Invoice Number**: `INV-2025-001`

3. **Add Completed Dive as Invoice Item**:
   ```php
   InvoiceItem::create([
       'invoice_id' => $invoice->id,
       'booking_dive_id' => 789,
       'price_list_item_id' => 10,
       'description' => 'Dive - Coral Reef - Dec 17, 2025',
       'quantity' => 1,
       'unit_price' => 75.00,
       'total' => 75.00,
   ]);
   ```

4. **Add Equipment as Invoice Items**:
   ```php
   // Wetsuit
   InvoiceItem::create([
       'invoice_id' => $invoice->id,
       'booking_equipment_id' => 101,
       'description' => 'Wetsuit - Medium',
       'quantity' => 1,
       'unit_price' => 25.00,
       'total' => 25.00,
   ]);
   
   // BCD
   InvoiceItem::create([
       'invoice_id' => $invoice->id,
       'booking_equipment_id' => 102,
       'description' => 'BCD - Medium',
       'quantity' => 1,
       'unit_price' => 30.00,
       'total' => 30.00,
   ]);
   ```

5. **Calculate Totals**:
   ```php
   $subtotal = 75.00 + 25.00 + 30.00 = 130.00
   $tax = 130.00 * 0.10 = 13.00
   $total = 130.00 + 13.00 = 143.00
   
   $invoice->update([
       'subtotal' => 130.00,
       'tax' => 13.00,
       'total' => 143.00,
   ]);
   ```

**Result**:
- ✅ Invoice created: `INV-2025-001`
- ✅ 3 invoice items added
- ✅ Subtotal: $130.00
- ✅ Tax (10%): $13.00
- ✅ Total: $143.00
- ✅ Status: "Draft"

### 8.6 View Invoice
System redirects to: `/dashboard/invoices/1`

Staff can see:
- Invoice number and date
- Customer information
- Itemized list:
  - Dive: $75.00
  - Wetsuit: $25.00
  - BCD: $30.00
- Subtotal: $130.00
- Tax: $13.00
- **Total: $143.00**

---

## Step 9: Payment Processing

**Customer**: "I'll pay now"

**Staff Action**: Record payment

### 9.1 Add Payment
**Location**: `/dashboard/invoices/1`

1. Staff clicks "Add Payment" button
2. Payment Form opens:
   - **Amount**: $143.00
   - **Payment Date**: December 17, 2025
   - **Payment Method**: Cash
   - **Payment Type**: Full Payment
   - **Notes**: "Paid in full"

3. Staff clicks "Record Payment"

### 9.2 Backend Processing
```php
Payment::create([
    'invoice_id' => 1,
    'amount' => 143.00,
    'payment_date' => '2025-12-17',
    'payment_method' => 'Cash',
    'payment_type' => 'Full Payment',
    'notes' => 'Paid in full',
]);
```

### 9.3 Update Invoice Status
System automatically:
- Calculates total paid: $143.00
- Calculates remaining balance: $0.00
- Updates invoice status: "Paid"

**Result**:
- ✅ Payment recorded
- ✅ Invoice status: "Paid"
- ✅ Remaining balance: $0.00
- ✅ Transaction complete

---

## Summary: Complete Data Flow

```
Customer Arrives
    ↓
[Step 1] Customer Registration (if new)
    ↓
[Step 2] Quick Booking (Walk-in Mode)
    ├─→ Auto-creates Booking
    └─→ Creates Dive (Scheduled)
    ↓
[Step 3] Equipment Assignment (optional)
    ├─→ Creates Equipment Basket
    └─→ Assigns Equipment Items
    ↓
[Step 4] Pre-Dive Prep
    └─→ Assign Instructors (optional)
    ↓
[Step 5] Dive Execution
    ↓
[Step 6] Complete Dive & Log
    └─→ Status: Completed
    ↓
[Step 7] Return Equipment
    └─→ Equipment Status: Returned
    ↓
[Step 8] Generate Invoice
    ├─→ Creates Invoice
    ├─→ Adds Completed Dives as Items
    ├─→ Adds Equipment as Items
    └─→ Calculates Totals
    ↓
[Step 9] Payment
    ├─→ Records Payment
    └─→ Updates Invoice Status: Paid
    ↓
Transaction Complete ✅
```

---

## Key Features Used

### 1. **Walk-In Booking Support**
- ✅ No need to create booking first
- ✅ System auto-creates booking when dive is created
- ✅ Faster for walk-in customers

### 2. **Price Snapshot**
- ✅ Price stored at booking time
- ✅ Invoice uses original price, not current price list
- ✅ Prevents price changes affecting existing bookings

### 3. **Equipment Basket System**
- ✅ Unique basket number for tracking
- ✅ Equipment linked to basket
- ✅ Supports center and customer equipment
- ✅ Date range tracking

### 4. **Dive Log**
- ✅ Records actual dive details
- ✅ Duration, depth, notes
- ✅ Only completed dives are invoiced

### 5. **Automatic Invoice Generation**
- ✅ Only includes completed dives
- ✅ Only includes equipment that hasn't been invoiced
- ✅ Prevents double-billing
- ✅ Automatic tax calculation

### 6. **Payment Tracking**
- ✅ Multiple payments per invoice
- ✅ Automatic status updates
- ✅ Balance tracking

---

## Database Records Created

After complete journey:

1. **customers** table: 1 record (Sarah Johnson)
2. **bookings** table: 1 record (Booking #456)
3. **booking_dives** table: 1 record (Dive #789, Status: Completed)
4. **equipment_baskets** table: 1 record (BKT-2025-001)
5. **booking_equipment** table: 2 records (Wetsuit, BCD)
6. **invoices** table: 1 record (INV-2025-001)
7. **invoice_items** table: 3 records (1 dive + 2 equipment)
8. **payments** table: 1 record ($143.00)

---

## Alternative Scenarios

### Scenario A: Advance Payment
- Customer pays before dive
- Staff creates "Advance" invoice
- After dive, creates "Final" invoice for remaining amount

### Scenario B: Package Booking
- Customer books dive package (e.g., 5 days, 10 dives)
- System tracks package usage
- Invoice generated per dive or for entire package

### Scenario C: Customer Own Equipment
- Customer brings own equipment
- Staff records equipment details in basket
- No rental charge, but tracked for safety/insurance

---

## System Benefits

✅ **Fast Walk-In Processing**: No need to create booking first  
✅ **Automatic Booking Creation**: System handles it behind the scenes  
✅ **Price Protection**: Prices locked at booking time  
✅ **Complete Audit Trail**: Every item linked back to source  
✅ **Flexible Invoicing**: Advance, Final, or Full invoices  
✅ **Equipment Tracking**: Know exactly what equipment is where  
✅ **Payment Management**: Track partial and full payments  

This complete journey ensures accurate record-keeping, prevents errors, and provides a smooth experience for both staff and customers.

