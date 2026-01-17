# Equipment Templates Usage Guide

## Overview
The Equipment Templates feature allows you to quickly add common equipment sets (like "Full Set", "BCD + Regulator", etc.) to a basket with automatic availability checking.

## Where to Find Templates

**Location:** Basket Detail Page (`/dashboard/baskets/[id]`)

Templates appear at the top of the Equipment Items section when viewing an active basket. They are only visible for baskets with status "Active".

## How to Use Templates

### Step 1: Navigate to a Basket
1. Go to **Dashboard → Baskets**
2. Click on an **Active** basket to view its details

### Step 2: Use a Template
1. In the Equipment Items section, you'll see **Quick Templates** buttons:
   - **Full Set** - Complete diving equipment (BCD, Regulator, Wetsuit, Mask, Fins, Snorkel)
   - **BCD + Regulator** - BCD and Regulator combo
   - **Wetsuit Only** - Just a wetsuit

2. Click on any template button (e.g., "Full Set")

3. The system will:
   - Check availability for all equipment types in the template
   - Show a dialog with availability status for each item
   - Auto-select the first available item for each type

### Step 3: Review and Select Items
In the dialog, you'll see:
- ✅ **Green checkmark** = Available items
- ❌ **Red X** = No items available
- **Badge** showing "X of Y available"

For each available equipment type:
1. **Select Item** dropdown - Choose from available items (auto-selected if only one)
2. **Price** field - Set the rental price (defaults to 0)

### Step 4: Add Items
1. Review all selected items
2. Adjust prices if needed
3. Click **"Add X Items"** button
4. Items will be added to the basket using the bulk API

## How Templates Work

1. **Availability Check**: When you click a template, the system:
   - Finds all equipment items for each equipment type in the template
   - Checks availability for the basket's checkout/return dates
   - Shows only available items

2. **Smart Selection**: 
   - If only 1 item available → Auto-selected
   - If multiple items available → You choose from dropdown
   - If no items available → Shows warning, you can skip

3. **Bulk Addition**: All selected items are added in one API call (fast!)

## Configuring Template Equipment IDs

**Important:** The templates use hardcoded equipment IDs that must match your database.

### Current Template Configuration
Located in: `sas-scuba-web/src/components/booking-equipment/EquipmentTemplates.tsx`

```typescript
const TEMPLATES: TemplateDefinition[] = [
    {
        id: "full-set",
        name: "Full Set",
        equipmentTypes: [
            { equipment_id: 1, equipment_name: "BCD" },
            { equipment_id: 2, equipment_name: "Regulator" },
            { equipment_id: 3, equipment_name: "Wetsuit" },
            { equipment_id: 4, equipment_name: "Mask" },
            { equipment_id: 5, equipment_name: "Fins" },
            { equipment_id: 6, equipment_name: "Snorkel" },
        ],
    },
    // ... more templates
];
```

### How to Find Your Equipment IDs

**Option 1: Database Query**
```sql
SELECT id, name FROM equipment WHERE dive_center_id = YOUR_CENTER_ID ORDER BY name;
```

**Option 2: API Call**
```bash
GET /api/v1/equipment
```

**Option 3: UI**
1. Go to **Dashboard → Equipment**
2. View equipment list - IDs are in the URL or can be found in browser dev tools

### How to Update Template IDs

1. Open: `sas-scuba-web/src/components/booking-equipment/EquipmentTemplates.tsx`
2. Find the `TEMPLATES` array (around line 41)
3. Update the `equipment_id` values to match your database
4. Update `equipment_name` to match your equipment names (for display only)

**Example:**
```typescript
{
    id: "full-set",
    name: "Full Set",
    equipmentTypes: [
        { equipment_id: 10, equipment_name: "BCD" },        // Changed from 1 to 10
        { equipment_id: 15, equipment_name: "Regulator" },  // Changed from 2 to 15
        // ... etc
    ],
}
```

### Adding New Templates

To add a new template, add to the `TEMPLATES` array:

```typescript
{
    id: "mask-fins-snorkel",
    name: "Mask + Fins + Snorkel",
    description: "Basic snorkeling set",
    equipmentTypes: [
        { equipment_id: 4, equipment_name: "Mask" },
        { equipment_id: 5, equipment_name: "Fins" },
        { equipment_id: 6, equipment_name: "Snorkel" },
    ],
}
```

## Troubleshooting

### Templates Not Showing
- ✅ Check that basket status is "Active"
- ✅ Verify you're on the basket detail page (not create page)
- ✅ Check browser console for errors

### "No items available" for all equipment
- ✅ Check that equipment items exist in your database
- ✅ Verify equipment items have status "Available"
- ✅ Check that checkout/return dates are valid
- ✅ Verify equipment IDs in templates match your database

### Template button doesn't work
- ✅ Check browser console for errors
- ✅ Verify API endpoint `/api/v1/equipment-items/find-available-by-type` is accessible
- ✅ Check that equipment types exist in database

## Best Practices

1. **Keep Templates Simple**: Don't create templates with too many items (max 6-8)
2. **Use Common Sets**: Create templates for frequently rented combinations
3. **Update Regularly**: Review and update templates as your equipment inventory changes
4. **Test First**: Test templates with a test basket before using in production

## Technical Details

- **Backend API**: `POST /api/v1/equipment-items/find-available-by-type`
- **Bulk Add API**: `POST /api/v1/booking-equipment/bulk`
- **Component**: `EquipmentTemplates.tsx`
- **Location**: Basket detail page (`/dashboard/baskets/[id]`)

## Next Steps

1. **Find your equipment IDs** using one of the methods above
2. **Update the template IDs** in `EquipmentTemplates.tsx`
3. **Test the templates** on a basket
4. **Add more templates** as needed for your common equipment sets

