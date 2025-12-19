# Equipment Assignment System - Complete Guide

This document explains how the **Equipment Assignment (Optional)** step works in detail, including the basket system, equipment assignment, availability checking, and return process.

---

## Overview

The equipment assignment system uses a **"Basket"** concept:
- Each customer gets a **unique basket number** (e.g., `BASK-2025-001`)
- Equipment items are assigned to the basket
- Basket tracks checkout and return dates
- Supports both **center equipment** (rental) and **customer's own equipment** (tracking only)

---

## Step-by-Step: Equipment Assignment Process

### Step 1: Create Equipment Basket

**Location**: `/dashboard/baskets/create`  
**API**: `POST /api/v1/equipment-baskets`

#### 1.1 Staff Actions

1. Navigate to "Create Equipment Basket" page
2. Fill in form:
   - **Customer**: Select customer (required)
   - **Booking**: Select booking (optional - can link later)
   - **Expected Return Date**: When equipment should be returned (optional)
   - **Notes**: Any additional notes (optional)

3. Click "Create Basket"

#### 1.2 What Happens Behind the Scenes

**Backend Processing**:

```php
// 1. Validate customer belongs to dive center
$customer = Customer::where('id', $customer_id)
    ->where('dive_center_id', $diveCenterId)
    ->firstOrFail();

// 2. Generate unique basket number
$basketNo = EquipmentBasket::generateBasketNumber($diveCenterId);
// Format: BASK-YYYY-### (e.g., BASK-2025-001)

// 3. Create basket record
$basket = EquipmentBasket::create([
    'dive_center_id' => $diveCenterId,
    'customer_id' => $customer_id,
    'booking_id' => $booking_id ?? null,
    'basket_no' => $basketNo,  // Auto-generated
    'checkout_date' => now()->toDateString(),  // Auto-set to today
    'expected_return_date' => $expected_return_date ?? null,
    'status' => 'Active',
    'notes' => $notes ?? null,
]);
```

**Code Reference**:
```39:76:sas-scuba-api/app/Http/Controllers/Api/V1/EquipmentBasketController.php
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'booking_id' => 'nullable|exists:bookings,id',
            'expected_return_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        // Validate customer belongs to dive center
        $customer = \App\Models\Customer::where('id', $validated['customer_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        // Validate booking belongs to dive center if provided
        if (isset($validated['booking_id'])) {
            $booking = \App\Models\Booking::where('id', $validated['booking_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }

        $basket = EquipmentBasket::create([
            'dive_center_id' => $diveCenterId,
            'customer_id' => $validated['customer_id'],
            'booking_id' => $validated['booking_id'] ?? null,
            'basket_no' => EquipmentBasket::generateBasketNumber($diveCenterId),
            'checkout_date' => now()->toDateString(),
            'expected_return_date' => $validated['expected_return_date'] ?? null,
            'status' => 'Active',
            'notes' => $validated['notes'] ?? null,
        ]);

        $basket->load(['customer', 'booking']);
        return response()->json($basket, 201);
    }
```

**Basket Number Generation**:
```49:56:sas-scuba-api/app/Models/EquipmentBasket.php
    public static function generateBasketNumber($diveCenterId): string
    {
        $year = date('Y');
        $count = self::where('dive_center_id', $diveCenterId)
                     ->whereYear('created_at', $year)
                     ->count() + 1;
        return sprintf('BASK-%s-%03d', $year, $count);
    }
```

**Result**:
- ✅ Basket created with unique number: `BASK-2025-001`
- ✅ Status: "Active"
- ✅ Checkout date: Today's date
- ✅ Linked to customer and optionally to booking

---

### Step 2: Add Equipment to Basket

**Location**: Basket detail page or booking equipment page  
**API**: `POST /api/v1/booking-equipment`

#### 2.1 Two Types of Equipment

**A. Center Equipment** (Rental):
- Equipment owned by the dive center
- Has rental price
- Tracked in inventory
- Status changes: Available → Rented → Available

**B. Customer Own Equipment** (Tracking Only):
- Customer brings their own equipment
- No rental price (or $0)
- Tracked for safety/insurance purposes
- Records brand, model, serial number

#### 2.2 Adding Center Equipment

**Staff Actions**:

1. Navigate to basket detail page: `/dashboard/baskets/{id}`
2. Click "Add Equipment" (or navigate to booking equipment page)
3. Fill in equipment form:
   - **Basket**: Select basket (or auto-filled if from basket page)
   - **Equipment Source**: Select "Center"
   - **Equipment Item**: Select from available equipment items (e.g., "Wetsuit - Medium")
   - **Checkout Date**: When equipment is checked out (default: today)
   - **Return Date**: When equipment should be returned
   - **Price**: Rental price (e.g., $25.00)
   - **Assignment Status**: "Pending" (default)

4. **Optional**: Check availability before adding
   - Click "Check Availability"
   - System shows if equipment is available for date range
   - Shows conflicts if not available

5. Click "Create Booking Equipment"

**Availability Check** (Optional):
```php
// API: POST /api/v1/booking-equipment/check-availability
{
  "equipment_item_id": 5,
  "checkout_date": "2025-12-17",
  "return_date": "2025-12-17"
}

// Response:
{
  "available": true,
  "conflicting_assignments": []
}

// OR if not available:
{
  "available": false,
  "conflicting_assignments": [
    {
      "id": 10,
      "customer_name": "John Doe",
      "checkout_date": "2025-12-17",
      "return_date": "2025-12-17"
    }
  ]
}
```

**Availability Logic**:
```12:28:sas-scuba-api/app/Services/EquipmentAvailabilityService.php
    public function isAvailable($equipmentItemId, $checkoutDate, $returnDate): bool
    {
        $conflicts = BookingEquipment::where('equipment_item_id', $equipmentItemId)
            ->where('equipment_source', 'Center')
            ->where('assignment_status', '!=', 'Returned')
            ->where(function($query) use ($checkoutDate, $returnDate) {
                $query->whereBetween('checkout_date', [$checkoutDate, $returnDate])
                      ->orWhereBetween('return_date', [$checkoutDate, $returnDate])
                      ->orWhere(function($q) use ($checkoutDate, $returnDate) {
                          $q->where('checkout_date', '<=', $checkoutDate)
                            ->where('return_date', '>=', $returnDate);
                      });
            })
            ->exists();
            
        return !$conflicts;
    }
```

**What Happens**:
- System checks for overlapping date ranges
- Only checks equipment that hasn't been returned
- Allows same equipment to multiple customers if dates don't overlap

#### 2.3 Adding Customer Own Equipment

**Staff Actions**:

1. Same form, but select:
   - **Equipment Source**: "Customer Own"
   - **Equipment Item**: Leave empty (not required)
   - **Customer Equipment Brand**: e.g., "Scubapro"
   - **Customer Equipment Model**: e.g., "BCD-500"
   - **Customer Equipment Serial**: e.g., "SP123456"
   - **Customer Equipment Notes**: Any additional info
   - **Price**: $0 (or leave empty)

2. Click "Create Booking Equipment"

**Backend Processing**:
```php
// If equipment_source is 'Customer Own', equipment_item_id is set to null
if ($data['equipment_source'] === 'Customer Own') {
    $data['equipment_item_id'] = null;
}

$bookingEquipment = BookingEquipment::create([
    'basket_id' => $basket_id,
    'booking_id' => $booking_id,  // Auto-linked from basket if available
    'equipment_item_id' => null,  // No center equipment
    'equipment_source' => 'Customer Own',
    'customer_equipment_brand' => 'Scubapro',
    'customer_equipment_model' => 'BCD-500',
    'customer_equipment_serial' => 'SP123456',
    'price' => 0,
    'checkout_date' => '2025-12-17',
    'return_date' => '2025-12-17',
    'assignment_status' => 'Pending',
]);
```

**Code Reference**:
```111:114:sas-scuba-api/app/Http/Controllers/Api/V1/BookingEquipmentController.php
        // If equipment_source is 'Customer Own', equipment_item_id should be null
        if ($data['equipment_source'] === 'Customer Own') {
            $data['equipment_item_id'] = null;
        }
```

---

### Step 3: Check Out Equipment

**When**: Before customer takes equipment

**Staff Actions**:

1. Navigate to basket detail page
2. For each equipment item with status "Pending":
   - Click "Check Out" (or update status)
   - System updates:
     - `assignment_status`: "Checked Out"
     - Equipment item status (if center equipment): "Rented"

**What Happens**:
- Equipment is marked as checked out
- If center equipment, the equipment item's status changes to "Rented"
- Equipment is now in customer's possession

---

### Step 4: Return Equipment

**When**: Customer returns equipment

**Two Methods**:

#### Method A: Return Individual Equipment

**Location**: Equipment detail page or basket page  
**API**: `PUT /api/v1/booking-equipment/{id}/return`

**Staff Actions**:
1. Navigate to equipment item
2. Click "Return Equipment"
3. System updates:
   - `assignment_status`: "Returned"
   - `actual_return_date`: Today's date
   - Equipment item status (if center equipment): "Available"

**Code Reference**:
```122:142:sas-scuba-api/app/Http/Controllers/Api/V1/BookingEquipmentController.php
    public function returnEquipment(Request $request, BookingEquipment $bookingEquipment)
    {
        $user = $request->user();
        
        // Verify equipment belongs to user's dive center
        $bookingEquipment->load('booking');
        if ($user->dive_center_id && $bookingEquipment->booking->dive_center_id !== $user->dive_center_id) {
            return response()->json(['message' => 'Equipment not found'], 404);
        }

        $bookingEquipment->update([
            'assignment_status' => 'Returned',
            'actual_return_date' => now()->toDateString(),
        ]);

        $bookingEquipment->load(['booking.customer', 'equipmentItem.equipment', 'basket']);
        return response()->json($bookingEquipment);
    }
```

#### Method B: Return Entire Basket

**Location**: Basket detail page  
**API**: `POST /api/v1/equipment-baskets/{id}/return`

**Staff Actions**:
1. Navigate to basket detail page
2. Click "Return Basket" button
3. System updates:
   - All equipment in basket: `assignment_status` → "Returned"
   - All equipment: `actual_return_date` → Today
   - Basket: `status` → "Returned"
   - Basket: `actual_return_date` → Today
   - All center equipment items: Status → "Available"

**Code Reference**:
```120:156:sas-scuba-api/app/Http/Controllers/Api/V1/EquipmentBasketController.php
    public function returnBasket(Request $request, EquipmentBasket $equipmentBasket)
    {
        $user = $request->user();
        
        // Verify basket belongs to user's dive center
        if ($user->dive_center_id && $equipmentBasket->dive_center_id !== $user->dive_center_id) {
            return response()->json(['message' => 'Basket not found'], 404);
        }

        DB::beginTransaction();
        try {
            // Update all equipment items
            foreach ($equipmentBasket->bookingEquipment as $equipment) {
                $equipment->update([
                    'assignment_status' => 'Returned',
                    'actual_return_date' => now()->toDateString(),
                ]);
            }

            // Update basket
            $equipmentBasket->update([
                'status' => 'Returned',
                'actual_return_date' => now()->toDateString(),
            ]);

            DB::commit();

            $equipmentBasket->load(['customer', 'booking', 'bookingEquipment']);
            return response()->json($equipmentBasket);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to return basket',
                'error' => $e->getMessage()
            ], 500);
        }
    }
```

---

## Database Structure

### Equipment Baskets Table

```sql
equipment_baskets
├── id
├── dive_center_id (FK)
├── customer_id (FK)
├── booking_id (FK, nullable)
├── basket_no (unique, e.g., "BASK-2025-001")
├── checkout_date
├── expected_return_date
├── actual_return_date
├── status (Active, Returned)
└── notes
```

### Booking Equipment Table

```sql
booking_equipment
├── id
├── booking_id (FK, nullable)
├── basket_id (FK, nullable)
├── equipment_item_id (FK, nullable - only for center equipment)
├── price
├── checkout_date
├── return_date
├── actual_return_date
├── equipment_source (Center, Customer Own)
├── customer_equipment_brand (nullable)
├── customer_equipment_model (nullable)
├── customer_equipment_serial (nullable)
├── customer_equipment_notes (nullable)
└── assignment_status (Pending, Checked Out, Returned, Lost)
```

### Equipment Items Table

```sql
equipment_items
├── id
├── equipment_id (FK)
├── size
├── serial_no
├── status (Available, Rented, Maintenance)
└── ...
```

---

## Key Features

### 1. **Unique Basket Numbers**
- Format: `BASK-YYYY-###`
- Sequential per dive center per year
- Example: `BASK-2025-001`, `BASK-2025-002`, etc.

### 2. **Equipment Source Tracking**
- **Center**: Equipment owned by dive center (rental)
- **Customer Own**: Customer's personal equipment (tracking only)

### 3. **Date Range Tracking**
- `checkout_date`: When equipment is checked out
- `return_date`: Expected return date
- `actual_return_date`: When equipment was actually returned

### 4. **Assignment Status Workflow**
```
Pending → Checked Out → Returned
         ↓
       Lost (if equipment is lost)
```

### 5. **Availability Checking**
- Checks for overlapping date ranges
- Only considers non-returned equipment
- Allows same equipment to multiple customers if dates don't overlap
- Shows conflicts if equipment not available

### 6. **Automatic Status Updates**
- When equipment is checked out: Equipment item status → "Rented"
- When equipment is returned: Equipment item status → "Available"

---

## Example Scenario

**Customer**: Sarah Johnson  
**Date**: December 17, 2025

### Step 1: Create Basket
```
Basket Created:
- Basket No: BASK-2025-001
- Customer: Sarah Johnson
- Booking: Booking #456 (linked)
- Checkout Date: 2025-12-17
- Status: Active
```

### Step 2: Add Equipment

**Equipment 1: Wetsuit (Center Equipment)**
```
Booking Equipment Created:
- Basket: BASK-2025-001
- Equipment Item: Wetsuit - Medium (ID: 10)
- Equipment Source: Center
- Price: $25.00
- Checkout Date: 2025-12-17
- Return Date: 2025-12-17
- Assignment Status: Pending
```

**Equipment 2: BCD (Center Equipment)**
```
Booking Equipment Created:
- Basket: BASK-2025-001
- Equipment Item: BCD - Medium (ID: 15)
- Equipment Source: Center
- Price: $30.00
- Checkout Date: 2025-12-17
- Return Date: 2025-12-17
- Assignment Status: Pending
```

**Equipment 3: Fins (Customer Own)**
```
Booking Equipment Created:
- Basket: BASK-2025-001
- Equipment Item: null (customer's own)
- Equipment Source: Customer Own
- Brand: Scubapro
- Model: Jet Fin
- Serial: SP789012
- Price: $0.00
- Assignment Status: Pending
```

### Step 3: Check Out
```
All equipment status updated:
- Assignment Status: Checked Out
- Equipment Items (Wetsuit, BCD): Status → "Rented"
```

### Step 4: Return
```
All equipment status updated:
- Assignment Status: Returned
- Actual Return Date: 2025-12-17
- Equipment Items (Wetsuit, BCD): Status → "Available"
- Basket Status: Returned
```

---

## Integration with Invoicing

When generating invoice from booking:

1. System includes all equipment from baskets linked to the booking
2. Only includes equipment that hasn't been invoiced yet
3. Creates invoice items for each equipment:
   - Description: Equipment name and size
   - Price: Rental price (or $0 for customer own)
   - Links back to `booking_equipment_id`

**Code Reference**:
```170:189:sas-scuba-api/app/Http/Controllers/Api/V1/InvoiceController.php
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
```

---

## Business Rules

### 1. **Basket is Optional**
- Equipment can be assigned directly to booking (without basket)
- Basket provides better organization for multi-day rentals

### 2. **Booking Link is Optional**
- Basket can exist without booking
- Booking can be linked later
- Useful for equipment-only rentals

### 3. **Same Equipment, Multiple Customers**
- ✅ Allowed if date ranges don't overlap
- Example: Customer A: Dec 17, Customer B: Dec 18 (same equipment item)

### 4. **Customer Own Equipment**
- No rental charge (price = $0)
- Still tracked for safety/insurance
- Can be included in invoice (shows $0.00)

### 5. **Return Process**
- Can return individual items or entire basket
- Returning basket returns all items at once
- Equipment becomes available immediately after return

---

## API Endpoints

### Baskets
- `GET /api/v1/equipment-baskets` - List baskets
- `POST /api/v1/equipment-baskets` - Create basket
- `GET /api/v1/equipment-baskets/{id}` - Get basket details
- `PUT /api/v1/equipment-baskets/{id}` - Update basket
- `POST /api/v1/equipment-baskets/{id}/return` - Return entire basket

### Booking Equipment
- `GET /api/v1/booking-equipment` - List equipment assignments
- `POST /api/v1/booking-equipment` - Add equipment to basket/booking
- `GET /api/v1/booking-equipment/{id}` - Get equipment details
- `PUT /api/v1/booking-equipment/{id}` - Update equipment
- `DELETE /api/v1/booking-equipment/{id}` - Remove equipment
- `POST /api/v1/booking-equipment/check-availability` - Check availability
- `PUT /api/v1/booking-equipment/{id}/return` - Return individual equipment

---

## Frontend Pages

1. **Baskets List**: `/dashboard/baskets`
   - View all baskets
   - Filter by status, customer
   - Quick actions

2. **Create Basket**: `/dashboard/baskets/create`
   - Form to create new basket
   - Select customer and booking

3. **Basket Detail**: `/dashboard/baskets/{id}`
   - View basket information
   - List all equipment in basket
   - Return basket button
   - Add equipment link

4. **Booking Equipment**: `/dashboard/booking-equipment`
   - List all equipment assignments
   - Can filter by basket, booking, customer

---

## Summary

The Equipment Assignment system provides:

✅ **Unique Basket Tracking**: Each customer gets unique basket number  
✅ **Flexible Equipment Types**: Center rental or customer own  
✅ **Date Range Management**: Track checkout and return dates  
✅ **Availability Checking**: Prevent double-booking of equipment  
✅ **Status Workflow**: Pending → Checked Out → Returned  
✅ **Bulk Operations**: Return entire basket at once  
✅ **Invoice Integration**: Equipment automatically included in invoices  
✅ **Complete Audit Trail**: Every equipment assignment tracked  

This system ensures accurate equipment tracking, prevents conflicts, and provides a smooth rental experience for both staff and customers.

