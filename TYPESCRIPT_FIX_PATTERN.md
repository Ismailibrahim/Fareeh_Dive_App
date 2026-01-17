# TypeScript Fix Pattern for All Forms

## Standard Fix Pattern

### Step 1: Create Form Values Type
```typescript
// After schema definition
type FormValues = z.infer<typeof schema>;
```

### Step 2: Update useForm
```typescript
// Change from:
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  // ...
});

// To:
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  // ...
});
```

### Step 3: Fix onSubmit
```typescript
// Change from:
async function onSubmit(data: FormData) {
  await service.create(data);
}

// To:
async function onSubmit(data: FormValues) {
  // Transform form data to API format
  const payload: FormData = {
    // Handle empty strings
    field: data.field && data.field !== "" ? data.field : undefined,
    // Handle number conversions
    numberField: data.numberField ? parseInt(data.numberField) : undefined,
    // Handle dates
    dateField: data.dateField ? format(data.dateField, "yyyy-MM-dd") : undefined,
  };
  await service.create(payload);
}
```

### Step 4: Fix ID Conversions
```typescript
// Change from:
if (id) {
  await service.update(id, data);
}

// To:
if (id) {
  await service.update(Number(id), data);
}
```

## Common Issues and Fixes

### Issue 1: Email Field with Empty String
```typescript
// Schema:
email: z.string().email().or(z.literal(""))

// Fix:
email: z.string().email().or(z.literal("")).optional()
```

### Issue 2: Boolean with Default
```typescript
// Schema:
active: z.boolean().default(true)

// Fix:
active: z.boolean()
// Then in defaultValues:
active: initialData?.active ?? true
```

### Issue 3: Enum with Default
```typescript
// Schema:
status: z.enum([...]).default("Pending")

// Fix:
status: z.enum([...])
// Then in defaultValues:
status: (initialData?.status || "Pending") as "Pending" | ...
```

### Issue 4: Date Fields
```typescript
// Schema:
date: z.date().optional()

// Fix: Keep as is, handle in transformation
```

## Files to Fix (Priority Order)

### High Priority (Most Errors)
1. ✅ CustomerForm.tsx - Fixed
2. ✅ CustomerDialog.tsx - Fixed
3. ✅ CustomerAccommodationForm.tsx - Fixed
4. PackageForm.tsx - 20 errors
5. DiveGroupForm.tsx
6. EquipmentItemForm.tsx
7. BulkEquipmentItemForm.tsx
8. BookingForm.tsx
9. BookingDiveForm.tsx
10. BookingEquipmentForm.tsx

### Medium Priority
- All other form components
- Components with function argument errors

## Automated Fix Checklist

For each form file:
- [ ] Create `FormValues` type from schema
- [ ] Update `useForm<FormValues>`
- [ ] Fix `onSubmit` to transform data
- [ ] Fix ID conversions (`Number(id)`)
- [ ] Fix email fields (add `.optional()`)
- [ ] Fix boolean defaults (remove `.default()`)
- [ ] Fix enum defaults (remove `.default()`)
- [ ] Test form still works

---

**Status:** Pattern Established  
**Next:** Apply to all form files systematically
