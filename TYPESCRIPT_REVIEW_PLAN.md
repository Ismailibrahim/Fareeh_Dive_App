# TypeScript Code Review Plan

## Current Status

**Total Errors:** 190 TypeScript errors

### Error Distribution

1. **TS2322 (Type Assignment Errors):** 139 errors
   - Form type mismatches between schema and form data types
   - Most common: `useForm<FormData>` vs schema inferred types

2. **TS2345 (Argument Type Errors):** 24 errors
   - Function parameter type mismatches
   - onSubmit handlers with wrong types

3. **TS2719 (Property Errors):** 14 errors
   - Missing properties in types
   - Optional vs required property mismatches

4. **TS2339 (Property Does Not Exist):** 4 errors
   - Accessing properties that don't exist on types

5. **TS2353 (Object Literal Errors):** 4 errors
   - defaultValues with properties not in schema

6. **Other Errors:** 5 errors
   - Various type issues

## Fix Strategy

### Phase 1: Form Type Mismatches (Priority: High)
- Create separate form values types for all forms
- Match schema types with form types
- Transform form data to API format in onSubmit

### Phase 2: Function Argument Errors (Priority: High)
- Fix onSubmit function signatures
- Fix event handler types
- Fix callback function types

### Phase 3: Property Errors (Priority: Medium)
- Fix optional/required property mismatches
- Add missing properties to types
- Fix property access errors

### Phase 4: Other Errors (Priority: Low)
- Fix remaining type issues
- Clean up any type assertions

## Files to Fix

### High Priority
1. `src/components/customers/CustomerDialog.tsx` - Form type mismatch
2. `src/components/customers/CustomerAccommodationForm.tsx` - Fixed
3. All form components with type mismatches

### Medium Priority
- Components with function argument errors
- Components with property errors

## Progress Tracking

- [x] CustomerAccommodationForm - Fixed
- [ ] CustomerDialog - In progress
- [ ] All other form components
- [ ] Function argument errors
- [ ] Property errors

---

**Status:** In Progress  
**Errors Fixed:** 1/190  
**Next:** Fix all form type mismatches systematically
