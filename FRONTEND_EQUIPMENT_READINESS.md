# Frontend Equipment Assignment Readiness Check

## Current Status: ⚠️ **PARTIALLY READY**

The frontend has basic basket and booking equipment pages, but **missing critical features** for the full equipment assignment workflow.

---

## ✅ What EXISTS (Working)

### 1. Basket Management Pages
- ✅ **Baskets List**: `/dashboard/baskets`
  - View all baskets
  - Filter by status
  - Shows basket number, customer, dates
  - Links to basket detail

- ✅ **Create Basket**: `/dashboard/baskets/create`
  - Form to create new basket
  - Select customer
  - Select booking (optional)
  - Set expected return date
  - Add notes

- ✅ **Basket Detail**: `/dashboard/baskets/[id]`
  - View basket information
  - Shows basket number, customer, dates
  - Lists equipment in basket
  - "Return Basket" button (returns all equipment)

### 2. Booking Equipment Pages
- ✅ **Booking Equipment List**: `/dashboard/booking-equipment`
  - View all equipment assignments
  - Shows booking, equipment, price

- ✅ **Create Booking Equipment**: `/dashboard/booking-equipment/create`
  - Form exists but **incomplete** (see issues below)

### 3. Backend Services
- ✅ `equipmentBasketService` - Full implementation
- ✅ `bookingEquipmentService` - Full implementation with basket support

---

## ❌ What's MISSING (Critical Gaps)

### 1. BookingEquipmentForm - Missing Basket Support

**Current Form** (`BookingEquipmentForm.tsx`):
- ❌ Only supports `booking_id` (required)
- ❌ **NO `basket_id` field**
- ❌ **NO equipment source selection** (Center vs Customer Own)
- ❌ **NO customer equipment fields** (brand, model, serial, notes)
- ❌ **NO checkout/return date fields**
- ❌ **NO availability checking UI**

**What it SHOULD have**:
```typescript
// Missing fields:
- basket_id (optional, alternative to booking_id)
- equipment_source ('Center' | 'Customer Own')
- checkout_date
- return_date
- customer_equipment_brand (if Customer Own)
- customer_equipment_model (if Customer Own)
- customer_equipment_serial (if Customer Own)
- customer_equipment_notes (if Customer Own)
- Availability check button/indicator
```

### 2. Basket Detail Page - Missing "Add Equipment" Button

**Current**: `/dashboard/baskets/[id]/page.tsx`
- ✅ Shows equipment list
- ❌ **NO "Add Equipment" button**
- ❌ **NO way to add equipment directly to basket**

**What's needed**:
- "Add Equipment" button that opens form with `basket_id` pre-filled
- Link to create booking equipment with basket context

### 3. Equipment Source Selection - Not Implemented

**Missing**:
- Radio buttons or select for "Center" vs "Customer Own"
- Conditional fields that show/hide based on selection
- Customer equipment fields (only shown when "Customer Own" selected)

### 4. Availability Checking - No UI

**Missing**:
- Button to check availability before adding equipment
- Visual indicator if equipment is available
- Display of conflicts if not available
- Date range picker for checkout/return dates

### 5. Return Equipment - Limited Functionality

**Current**:
- ✅ "Return Basket" button (returns all equipment)
- ❌ **NO "Return Individual Equipment" button** on equipment items

**What's needed**:
- "Return" button on each equipment item in basket
- Individual return functionality

---

## Required Frontend Updates

### Priority 1: Update BookingEquipmentForm

**File**: `sas-scuba-web/src/components/booking-equipment/BookingEquipmentForm.tsx`

**Changes Needed**:

1. **Add Basket Support**:
   ```typescript
   // Schema should allow either booking_id OR basket_id
   booking_id: z.string().optional(),
   basket_id: z.string().optional(),
   // Validation: at least one must be provided
   ```

2. **Add Equipment Source Selection**:
   ```typescript
   equipment_source: z.enum(['Center', 'Customer Own']),
   ```

3. **Add Date Fields**:
   ```typescript
   checkout_date: z.string().optional(),
   return_date: z.string().optional(),
   ```

4. **Add Customer Equipment Fields** (conditional):
   ```typescript
   customer_equipment_brand: z.string().optional(),
   customer_equipment_model: z.string().optional(),
   customer_equipment_serial: z.string().optional(),
   customer_equipment_notes: z.string().optional(),
   ```

5. **Add Availability Check**:
   - Button to check availability
   - Display availability status
   - Show conflicts if not available

### Priority 2: Add "Add Equipment" to Basket Detail Page

**File**: `sas-scuba-web/src/app/dashboard/baskets/[id]/page.tsx`

**Changes Needed**:
- Add "Add Equipment" button in equipment list section
- Link to booking equipment create page with `basket_id` query param
- Or open a dialog/modal with equipment form

### Priority 3: Add Return Equipment Button

**File**: `sas-scuba-web/src/app/dashboard/baskets/[id]/page.tsx`

**Changes Needed**:
- Add "Return" button for each equipment item
- Call `bookingEquipmentService.returnEquipment(id)`
- Update UI after return

---

## Current Workflow Limitations

### What Staff CAN Do Now:
1. ✅ Create basket
2. ✅ View basket details
3. ✅ Return entire basket
4. ✅ Create booking equipment (but only via booking, not basket)
5. ✅ View equipment list

### What Staff CANNOT Do Now:
1. ❌ Add equipment directly to basket
2. ❌ Select equipment source (Center vs Customer Own)
3. ❌ Enter customer equipment details
4. ❌ Set checkout/return dates when adding equipment
5. ❌ Check equipment availability before adding
6. ❌ Return individual equipment items
7. ❌ Add equipment without a booking (basket-only)

---

## Recommended Implementation Order

### Phase 1: Basic Basket Equipment Assignment
1. Update `BookingEquipmentForm` to support `basket_id`
2. Add "Add Equipment" button to basket detail page
3. Add date fields (checkout_date, return_date)

### Phase 2: Equipment Source Support
4. Add equipment source selection (Center/Customer Own)
5. Add conditional customer equipment fields
6. Update form validation

### Phase 3: Advanced Features
7. Add availability checking UI
8. Add individual equipment return buttons
9. Add equipment status indicators

---

## Code Changes Required

### 1. Update BookingEquipmentForm Schema

**Current**:
```typescript
const bookingEquipmentSchema = z.object({
    booking_id: z.string().min(1, "Booking is required"),
    equipment_item_id: z.string().min(1, "Equipment item is required"),
    price: z.string().min(1, "Price is required"),
});
```

**Should be**:
```typescript
const bookingEquipmentSchema = z.object({
    booking_id: z.string().optional(),
    basket_id: z.string().optional(),
    equipment_source: z.enum(['Center', 'Customer Own']),
    equipment_item_id: z.string().optional(), // Required if Center
    checkout_date: z.string().optional(),
    return_date: z.string().optional(),
    price: z.string().optional(),
    customer_equipment_brand: z.string().optional(),
    customer_equipment_model: z.string().optional(),
    customer_equipment_serial: z.string().optional(),
    customer_equipment_notes: z.string().optional(),
}).refine((data) => {
    // Either booking_id or basket_id must be provided
    return data.booking_id || data.basket_id;
}, {
    message: "Either booking or basket must be provided",
    path: ["booking_id"],
}).refine((data) => {
    // If Center, equipment_item_id required
    if (data.equipment_source === 'Center') {
        return !!data.equipment_item_id;
    }
    // If Customer Own, brand required
    if (data.equipment_source === 'Customer Own') {
        return !!data.customer_equipment_brand;
    }
    return true;
});
```

### 2. Add Basket Selection to Form

**Add to form**:
```tsx
{/* Basket Selection (if basket_id not provided via props) */}
{!basketId && (
    <FormField
        control={form.control}
        name="basket_id"
        render={({ field }) => (
            <FormItem>
                <FormLabel>Basket (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select basket (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        {baskets.map((basket) => (
                            <SelectItem key={basket.id} value={String(basket.id)}>
                                {basket.basket_no} - {basket.customer?.full_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormItem>
        )}
    />
)}
```

### 3. Add Equipment Source Selection

```tsx
<FormField
    control={form.control}
    name="equipment_source"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Equipment Source</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Center">Center Equipment (Rental)</SelectItem>
                    <SelectItem value="Customer Own">Customer Own Equipment</SelectItem>
                </SelectContent>
            </Select>
        </FormItem>
    )}
/>

{/* Show Center Equipment fields if Center selected */}
{form.watch('equipment_source') === 'Center' && (
    <>
        <FormField name="equipment_item_id" ... />
        <FormField name="price" ... />
    </>
)}

{/* Show Customer Equipment fields if Customer Own selected */}
{form.watch('equipment_source') === 'Customer Own' && (
    <>
        <FormField name="customer_equipment_brand" ... />
        <FormField name="customer_equipment_model" ... />
        <FormField name="customer_equipment_serial" ... />
        <FormField name="customer_equipment_notes" ... />
    </>
)}
```

### 4. Add Date Fields

```tsx
<FormField
    control={form.control}
    name="checkout_date"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Checkout Date</FormLabel>
            <DatePicker
                selected={parseDate(field.value)}
                onChange={(date) => field.onChange(formatDateToString(date))}
                dateFormat="PPP"
            />
        </FormItem>
    )}
/>

<FormField
    control={form.control}
    name="return_date"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Return Date</FormLabel>
            <DatePicker
                selected={parseDate(field.value)}
                onChange={(date) => field.onChange(formatDateToString(date))}
                dateFormat="PPP"
                minDate={parseDate(form.watch('checkout_date'))}
            />
        </FormItem>
    )}
/>
```

### 5. Add Availability Check Button

```tsx
{form.watch('equipment_source') === 'Center' && form.watch('equipment_item_id') && (
    <Button
        type="button"
        variant="outline"
        onClick={async () => {
            const equipmentItemId = form.getValues('equipment_item_id');
            const checkoutDate = form.getValues('checkout_date');
            const returnDate = form.getValues('return_date');
            
            if (equipmentItemId && checkoutDate && returnDate) {
                const result = await bookingEquipmentService.checkAvailability({
                    equipment_item_id: parseInt(equipmentItemId),
                    checkout_date: checkoutDate,
                    return_date: returnDate,
                });
                
                if (result.available) {
                    alert('Equipment is available!');
                } else {
                    alert(`Equipment not available. Conflicts: ${result.conflicting_assignments?.length || 0}`);
                }
            }
        }}
    >
        Check Availability
    </Button>
)}
```

### 6. Add "Add Equipment" to Basket Detail Page

**File**: `sas-scuba-web/src/app/dashboard/baskets/[id]/page.tsx`

**Add after line 163** (in Equipment List Card):
```tsx
<CardHeader>
    <div className="flex items-center justify-between">
        <div>
            <CardTitle>Equipment Items</CardTitle>
            <CardDescription>Equipment assigned to this basket</CardDescription>
        </div>
        <Link href={`/dashboard/booking-equipment/create?basket_id=${basket.id}`}>
            <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
            </Button>
        </Link>
    </div>
</CardHeader>
```

### 7. Add Return Button for Individual Equipment

**In basket detail page, for each equipment item**:
```tsx
{equipment.assignment_status !== 'Returned' && (
    <Button
        variant="outline"
        size="sm"
        onClick={async () => {
            if (confirm('Return this equipment?')) {
                await bookingEquipmentService.returnEquipment(equipment.id);
                loadBasket(); // Refresh
            }
        }}
    >
        Return
    </Button>
)}
```

---

## Summary

### ✅ Ready:
- Basket CRUD operations
- Basket listing and detail view
- Return entire basket
- Basic booking equipment form (booking-based only)

### ❌ Not Ready:
- Adding equipment to basket (no UI)
- Equipment source selection
- Customer equipment fields
- Date range selection
- Availability checking
- Individual equipment return

### Estimated Work:
- **Priority 1 Updates**: 2-3 hours
- **Priority 2 Updates**: 1 hour
- **Priority 3 Updates**: 1 hour
- **Total**: ~4-5 hours of frontend development

---

## Recommendation

The frontend is **~60% ready**. The core basket system works, but the equipment assignment form needs significant updates to support:
1. Basket-based equipment assignment
2. Equipment source selection
3. Customer equipment tracking
4. Date range management
5. Availability checking

Would you like me to implement these missing features?

