# Equipment Item Code Tracking Guide

## How Item Tracking Works

**Good News:** The system already tracks which specific item is assigned to each customer!

### Database Structure:

- `booking_equipment.equipment_item_id` → Links to the specific equipment item
- `equipment_items.serial_no` → Serial number (e.g., "ABC123")
- `equipment_items.inventory_code` → Inventory code (e.g., "INV-001")
- `equipment_items.id` → Unique item identifier

**When you assign equipment to a customer:**
1. System records `equipment_item_id` (the specific item)
2. This links to the exact item with its serial_no and inventory_code
3. You can always query: "Which customer has item with serial ABC123?"

## How Templates Work with Item Tracking

**Templates work exactly like manual selection** - they track specific items automatically!

### Template Flow:

1. **User clicks template** (e.g., "Full Set")
2. **System finds available items** for each equipment type
3. **User selects specific item** from dropdown
4. **System records `equipment_item_id`** - This is the specific item code!
5. **When added to basket**, item codes are automatically tracked

### Example Template Flow:

```
User clicks "Full Set" template
→ System finds: 3 BCDs available
→ User sees dropdown with item codes:
   - "BCD - Size M (SN: ABC123, Code: INV-001)"
   - "BCD - Size L (SN: DEF456, Code: INV-002)"
   - "BCD - Size XL (SN: GHI789, Code: INV-003)"
→ User selects first one
→ System records: equipment_item_id = 45
→ Basket shows: "BCD - Size M (SN: ABC123, Code: INV-001)"
```

**The item code tracking is automatic** - no special handling needed for templates!

## Alternative Ways to Display Item Codes

### Option 1: On-Screen Display (Basket Detail Page)
**Best for:** Staff reference during checkout/return

- Show serial number and inventory code prominently
- Display format: "BCD - Size M (SN: ABC123, Code: INV-001)"
- Add copy-to-clipboard for item codes
- Quick visual reference

### Option 2: Print/PDF Receipt ⭐ RECOMMENDED
**Best for:** Customer handoff, physical record

**Features:**
- Printable receipt showing all equipment with item codes
- Customer-friendly format
- Includes: Item name, Serial No, Inventory Code, Checkout/Return dates
- Can be printed and given to customer
- PDF export option

**Benefits:**
- Customer has physical record
- Staff can reference printed receipt
- Professional appearance
- Works offline

**Example Receipt:**
```
EQUIPMENT RENTAL RECEIPT
Basket: BASK-2025-001
Customer: John Doe
Date: Dec 17, 2025

EQUIPMENT ASSIGNED:
1. BCD - Size M
   Serial: ABC123 | Code: INV-001
   Checkout: Dec 17, 2025
   Return: Dec 20, 2025

2. Regulator
   Serial: XYZ789 | Code: INV-002
   Checkout: Dec 17, 2025
   Return: Dec 20, 2025
```

### Option 3: Email Confirmation
**Best for:** Digital record, customer communication

**Features:**
- Send email to customer when basket is created/checked out
- Include all equipment with item codes
- Template: "You have been assigned: BCD (SN: ABC123, Code: INV-001)..."
- Customer has digital record

### Option 4: QR Code / Barcode
**Best for:** Quick access, mobile-friendly

**Features:**
- Generate QR code for basket
- When scanned, shows all equipment with item codes
- Can be printed and attached to physical basket
- Customer can scan to see their items
- Staff can scan to quickly view assignment

### Option 5: Equipment Assignment Dashboard
**Best for:** Management overview

**Features:**
- Widget on main dashboard showing current assignments
- Quick view: "5 items currently checked out"
- Click to see details with item codes
- Filter by customer or item code

### Option 6: Equipment Assignment Report
**Best for:** Management reports, audits

**Features:**
- Table showing all current equipment assignments
- Columns: Customer, Item Code, Serial No, Inventory Code, Checkout Date, Return Date, Status
- Filter by customer, equipment item, date range
- Export to CSV/PDF
- Search by serial number or inventory code

### Option 7: Equipment Item Detail Page
**Best for:** Finding who has a specific item

**Features:**
- Show assignment history for a specific equipment item
- List all customers who have rented this item
- Show dates and status of each assignment
- Shows: "Currently assigned to: John Doe (Basket BASK-2025-001)"
- Quick link to customer/basket details

### Option 8: Customer Equipment History
**Best for:** Customer service, history lookup

**Features:**
- Show all equipment this customer has rented
- Display item codes for each rental
- Show current active rentals prominently
- History of past rentals

### Option 9: Show Item Codes in Template Dialog ⭐ IMPORTANT
**Best for:** Making templates work better with item tracking

**File:** `sas-scuba-web/src/components/booking-equipment/EquipmentTemplates.tsx`

**Changes:**
- Display serial_no and inventory_code in the item selection dropdown
- Show item codes in the selected item preview
- Make it clear which specific item is being selected
- Format: "BCD - Size M (SN: ABC123, Code: INV-001)"

**Current State:** Template dropdown shows: "BCD - Size M (Brand)"
**Enhanced:** Template dropdown shows: "BCD - Size M (SN: ABC123, Code: INV-001)"

## Recommended Implementation

### Phase 1: Immediate Visibility (Start Here)
1. **Show item codes in template dialog** (Option 9) - So you see codes when selecting
2. **Display item codes in basket detail page** (Option 1) - So you see codes after assignment
3. **Ensure backend loads item codes** - Verify data is available

### Phase 2: Customer Handoff (Most Practical)
4. **Print/PDF receipt** (Option 2) - Give customer physical record with codes
5. **Equipment assignment report** (Option 6) - For management/audits

### Phase 3: Advanced Features
6. **Equipment item detail page** (Option 7) - Find who has specific item
7. **Email confirmation** (Option 3) - Digital record
8. **QR code** (Option 4) - Quick access

## Database Queries

### Find which customer has a specific item:
```sql
SELECT 
    c.full_name as customer_name,
    ei.serial_no,
    ei.inventory_code,
    eb.basket_no,
    be.checkout_date,
    be.return_date,
    be.assignment_status
FROM booking_equipment be
JOIN equipment_baskets eb ON be.basket_id = eb.id
JOIN customers c ON eb.customer_id = c.id
JOIN equipment_items ei ON be.equipment_item_id = ei.id
WHERE ei.serial_no = 'ABC123'
  AND be.assignment_status != 'Returned';
```

### Find all items assigned to a customer:
```sql
SELECT 
    ei.serial_no,
    ei.inventory_code,
    e.name as equipment_name,
    be.checkout_date,
    be.return_date,
    be.assignment_status
FROM booking_equipment be
JOIN equipment_baskets eb ON be.basket_id = eb.id
JOIN equipment_items ei ON be.equipment_item_id = ei.id
JOIN equipment e ON ei.equipment_id = e.id
WHERE eb.customer_id = 123
  AND be.assignment_status != 'Returned';
```

## Summary

**Templates already track item codes** - when you select an item in the template dialog, the system records the specific `equipment_item_id`, which links to the serial_no and inventory_code.

**What's needed:** Make the item codes more visible in the UI so you can easily see which specific item was assigned to which customer.

**Best approach:** Combine on-screen display + print receipt for maximum visibility and customer handoff.

