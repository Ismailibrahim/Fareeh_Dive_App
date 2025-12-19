# Custom Equipment Type Field - User Guide

## Where to Find It

The custom equipment type field appears in the **Booking Equipment Form** when adding equipment to a basket.

### Steps to See the Field:

1. **Navigate to**: `/dashboard/baskets/[id]` (any basket detail page)
2. **Click**: "Add Equipment" button
3. **Select**: "Customer Own Equipment" radio button (under "Equipment Source" section)
4. **You should see**: Two fields side-by-side:
   - **Left**: "Equipment Type (Select from List)" - dropdown with common types
   - **Right**: "Custom Equipment Type" - text input for custom names

## Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│ Equipment Source                                        │
│ ○ Center Equipment (Rental)                            │
│ ● Customer Own Equipment  ← SELECT THIS                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Customer Equipment Details                              │
│                                                          │
│ ┌──────────────────────┐  ┌──────────────────────┐    │
│ │ Equipment Type       │  │ Custom Equipment Type│    │
│ │ (Select from List)   │  │                      │    │
│ │ [Dropdown ▼]        │  │ [Text Input]         │    │
│ └──────────────────────┘  └──────────────────────┘    │
│                                                          │
│ Brand *: [________________]                             │
│ Model:   [________________]                             │
│ ...                                                      │
└─────────────────────────────────────────────────────────┘
```

## Troubleshooting

### If you don't see the custom field:

1. **Make sure you selected "Customer Own Equipment"**
   - The field only appears when this option is selected
   - If "Center Equipment" is selected, you'll see different fields

2. **Check browser console for errors**
   - Press F12 to open developer tools
   - Look for any red error messages

3. **Try hard refresh**
   - Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

4. **Restart dev server**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

5. **Clear browser cache**
   - Clear cached images and files in browser settings

## How to Use

### Option 1: Select from Dropdown
- Click the dropdown on the left
- Select a type (e.g., "BCD", "Regulator", "Wetsuit")
- The custom field will be empty

### Option 2: Type Custom Name
- Type directly in the "Custom Equipment Type" field on the right
- Examples: "Reel", "SMB", "Dive Light", "Knife", etc.
- When you type, the dropdown will be disabled

### Option 3: Select "Other" then Type
- Select "Other (use custom field)" from dropdown
- This clears the dropdown selection
- Then type your custom type in the right field

## Field Behavior

- **Custom field takes priority**: If you type in the custom field, that value is saved
- **Dropdown disabled when custom**: If custom field has a value, dropdown is disabled
- **Both optional**: You can leave both empty if you don't need to specify type

## Still Not Working?

If you still don't see the field after trying the above:

1. Check the browser console for JavaScript errors
2. Verify you're on the correct page: `/dashboard/booking-equipment/create?basket_id=[id]`
3. Make sure the form loads completely (no loading spinner)
4. Try in an incognito/private window to rule out extensions

