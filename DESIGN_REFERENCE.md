# SAS Scuba - Design & Layout Reference Guide

This document serves as the **single source of truth** for all design patterns, layout structures, and UI conventions used in the SAS Scuba application. Use this as a reference when creating new pages or components.

---

## Quick Reference Command

**To use this reference in conversations, simply say:**
- "Follow the design reference"
- "Use the design patterns from DESIGN_REFERENCE.md"
- "Match the layout in DESIGN_REFERENCE.md"
- "Follow the same design as [feature] in DESIGN_REFERENCE.md"

---

## 1. Page Layout Structure

### 1.1 Standard Page Wrapper

**Pattern:** All dashboard pages use this consistent wrapper structure.

```tsx
<div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
    <Header title="Page Title" />
    <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Page content */}
    </div>
</div>
```

**Key Elements:**
- `flex flex-col min-h-screen` - Full height flex container
- `bg-slate-50/50 dark:bg-slate-900/50` - Background with dark mode support
- `Header` component - Consistent page header
- `flex-1 space-y-6 p-8 pt-6` - Content area with spacing

---

## 2. Create/Edit Page Layout

### 2.1 Standard Create Page Structure

**Pattern:** All "Add New" pages follow this exact structure.

```tsx
"use client";

import { Header } from "@/components/layout/Header";
import { FeatureForm } from "@/components/[feature]/FeatureForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateFeaturePage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="New Feature" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/[feature]">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Add New Feature</h2>
                        <p className="text-muted-foreground">Fill in the details below to [action description].</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <FeatureForm />
                </div>
            </div>
        </div>
    );
}
```

**Key Elements:**
- Back button: `rounded-full`, `h-5 w-5` icon size
- Title: `text-3xl font-bold tracking-tight`
- Description: `text-muted-foreground`
- Form wrapper: `mx-auto max-w-3xl` (centered, max width)

---

## 3. Form Component Structure

### 3.1 Standard Form Layout

**Pattern:** All forms use this structure with Card sections.

```tsx
<Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Section 1 */}
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <IconName className="h-5 w-5 text-primary" />
                    Section Title
                </CardTitle>
                <CardDescription>
                    Brief description of this section.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                {/* Form fields */}
            </CardContent>
        </Card>

        {/* Section 2 */}
        <Card>
            {/* Same structure */}
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                Cancel
            </Button>
            <Button type="submit" size="lg" disabled={loading}>
                {loading ? "Saving..." : (id ? "Update Feature" : "Create Feature")}
            </Button>
        </div>
    </form>
</Form>
```

**Key Elements:**
- Form spacing: `space-y-8` (not `space-y-6`)
- Card sections: Each logical group in its own Card
- CardHeader: Always includes CardTitle with icon + CardDescription
- CardTitle: `text-xl flex items-center gap-2`
- Icon: `h-5 w-5 text-primary`
- CardContent: `grid gap-6` for field spacing
- Buttons: `size="lg"`, Cancel uses `variant="outline"`

---

## 4. Input Field Patterns

### 4.1 Input with Icon

**Pattern:** All inputs have icons on the left side.

```tsx
<FormField
    control={form.control}
    name="field_name"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Field Label</FormLabel>
            <FormControl>
                <div className="relative">
                    <IconName className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Placeholder text" className="pl-9" {...field} />
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
/>
```

**Key Elements:**
- Icon wrapper: `relative` div
- Icon: `absolute left-3 top-3 h-4 w-4 text-muted-foreground`
- Input: `pl-9` (padding-left for icon space)

### 4.2 Select with Icon

**Pattern:** Select dropdowns also include icons.

```tsx
<FormField
    control={form.control}
    name="field_name"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Field Label</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <div className="relative">
                        <IconName className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                        <SelectTrigger className="pl-9">
                            <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                    </div>
                </FormControl>
                <SelectContent>
                    {/* Options */}
                </SelectContent>
            </Select>
            <FormMessage />
        </FormItem>
    )}
/>
```

**Key Elements:**
- Icon: `z-10` to ensure it's above the select trigger
- SelectTrigger: `pl-9` for icon spacing

### 4.3 Date Picker Pattern

**Pattern:** Date fields use Calendar component with Popover.

```tsx
<FormField
    control={form.control}
    name="date_field"
    render={({ field }) => (
        <FormItem className="flex flex-col">
            <FormLabel>Date Label</FormLabel>
            <Popover>
                <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-9 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            <FormMessage />
        </FormItem>
    )}
/>
```

---

## 5. List Page Patterns

### 5.1 Standard List Page Structure

**Pattern:** All list/index pages follow this structure.

```tsx
<div className="flex flex-col min-h-screen">
    <Header title="Feature Name" />
    <div className="flex-1 space-y-4 p-8 pt-6">
        {/* Page Header */}
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Feature Name</h2>
            <div className="flex items-center space-x-2">
                <Link href="/dashboard/[feature]/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Feature
                    </Button>
                </Link>
            </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* Desktop Table View */}
        <div className="rounded-md border hidden md:block">
            <Table>
                {/* Table content */}
            </Table>
        </div>

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {/* Card content */}
        </div>
    </div>
</div>
```

**Key Elements:**
- Dual view: Table for desktop (`hidden md:block`), Cards for mobile (`md:hidden`)
- Search: Always in a `relative flex-1 max-w-sm` container
- Add button: Uses `Plus` icon with `mr-2 h-4 w-4`

---

## 6. Card Section Patterns

### 6.1 Form Card Sections

**Pattern:** Group related fields in Card sections.

**Section Types:**
1. **Primary Information** - Main data (e.g., Personal Information)
2. **Contact/Details** - Secondary data (e.g., Contact Details)
3. **Additional Information** - Optional/supplementary data

**Example Structure:**
```tsx
{/* Primary Section */}
<Card>
    <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
            <PrimaryIcon className="h-5 w-5 text-primary" />
            Primary Section Name
        </CardTitle>
        <CardDescription>
            Description of what this section contains.
        </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-6">
        {/* Full-width field */}
        <FormField ... />
        
        {/* Two-column fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField ... />
            <FormField ... />
        </div>
    </CardContent>
</Card>
```

---

## 7. Icon Usage

### 7.1 Standard Icons

**Common Icons Used:**
- `User` - Personal information, users
- `Mail` - Email addresses
- `Phone` - Phone numbers
- `Calendar` / `CalendarIcon` - Dates
- `Award` - Certifications, achievements
- `Building` - Companies, agencies
- `FileText` - Documents, files
- `CreditCard` - Payment, identification
- `Flag` - Nationality, location
- `Plus` - Add actions
- `Search` - Search functionality
- `ArrowLeft` - Back navigation

**Icon Sizes:**
- Section headers: `h-5 w-5`
- Input fields: `h-4 w-4`
- Buttons: `h-4 w-4` or `h-5 w-5` (match button size)

---

## 8. Color & Styling

### 8.1 Color Scheme

**Primary Colors:**
- Primary: `text-primary`, `bg-primary`
- Muted: `text-muted-foreground`
- Background: `bg-slate-50/50 dark:bg-slate-900/50`

**Card Colors:**
- Background: `bg-card`
- Text: `text-card-foreground`
- Border: `border` (subtle)

### 8.2 Typography

**Headings:**
- Page title: `text-3xl font-bold tracking-tight`
- Section title: `text-xl` (in CardTitle)
- Form labels: Default FormLabel styling

**Text:**
- Description: `text-muted-foreground`
- Body: Default text color

---

## 9. Spacing & Layout

### 9.1 Standard Spacing

**Page Level:**
- Content padding: `p-8 pt-6`
- Section spacing: `space-y-6` (page), `space-y-8` (form)

**Component Level:**
- Card content: `grid gap-6`
- Form fields: `gap-6` in grid
- Button groups: `gap-4`

**Max Widths:**
- Form container: `max-w-3xl`
- Search bar: `max-w-sm`

---

## 10. Responsive Design

### 10.1 Breakpoints

**Mobile First Approach:**
- Mobile: Default (no prefix)
- Desktop: `md:` prefix (768px+)

**Common Patterns:**
- Hide on mobile: `hidden md:block`
- Hide on desktop: `md:hidden`
- Grid columns: `grid-cols-1 md:grid-cols-2`

---

## 11. Button Patterns

### 11.1 Standard Buttons

**Primary Action:**
```tsx
<Button type="submit" size="lg" disabled={loading}>
    {loading ? "Saving..." : (id ? "Update" : "Create")}
</Button>
```

**Secondary Action:**
```tsx
<Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
    Cancel
</Button>
```

**Icon Button:**
```tsx
<Button variant="ghost" size="icon" className="rounded-full">
    <IconName className="h-5 w-5" />
    <span className="sr-only">Action description</span>
</Button>
```

**Add Button:**
```tsx
<Button>
    <Plus className="mr-2 h-4 w-4" /> Add Feature
</Button>
```

---

## 12. Form Validation Patterns

### 12.1 Zod Schema Pattern

```tsx
const featureSchema = z.object({
    required_field: z.string().min(2, "Error message"),
    optional_field: z.string().optional(),
    email_field: z.string().email().or(z.literal("")),
    date_field: z.date({ required_error: "Date is required" }),
});
```

### 12.2 Form Setup

```tsx
const form = useForm<FormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
        field: initialData?.field || "",
    },
});
```

---

## 13. Navigation Patterns

### 13.1 Back Navigation

**Pattern:** Always use Link with ArrowLeft icon button.

```tsx
<Link href="/dashboard/[feature]">
    <Button variant="ghost" size="icon" className="rounded-full">
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Back</span>
    </Button>
</Link>
```

### 13.2 Action Navigation

**Pattern:** Use router.push() after form submission.

```tsx
router.push("/dashboard/[feature]");
router.refresh();
```

---

## 14. Loading States

### 14.1 Form Loading

```tsx
const [loading, setLoading] = useState(false);

// In submit handler
setLoading(true);
try {
    // API call
} finally {
    setLoading(false);
}

// In button
disabled={loading}
{loading ? "Saving..." : "Create"}
```

### 14.2 Page Loading

```tsx
const [loading, setLoading] = useState(true);

if (loading) {
    return <div>Loading...</div>;
}
```

---

## 15. Error Handling

### 15.1 Form Errors

**Pattern:** Errors are automatically handled by FormMessage component.

```tsx
<FormMessage /> // Automatically shows validation errors
```

### 15.2 API Errors

```tsx
try {
    await service.create(data);
} catch (error) {
    console.error("Failed to save", error);
    // Optional: Show toast notification
}
```

---

## 16. Component File Structure

### 16.1 File Organization

```
src/
├── app/
│   └── dashboard/
│       └── [feature]/
│           ├── page.tsx              # List page
│           ├── create/
│           │   └── page.tsx          # Create page
│           └── [id]/
│               └── edit/
│                   └── page.tsx     # Edit page
└── components/
    └── [feature]/
        └── FeatureForm.tsx          # Reusable form component
```

---

## 17. Complete Example: Create Page

### 17.1 Full Page Template

```tsx
"use client";

import { Header } from "@/components/layout/Header";
import { FeatureForm } from "@/components/[feature]/FeatureForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateFeaturePage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="New Feature" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/[feature]">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Add New Feature</h2>
                        <p className="text-muted-foreground">Fill in the details below to [action].</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <FeatureForm />
                </div>
            </div>
        </div>
    );
}
```

---

## 18. Complete Example: Form Component

### 18.1 Full Form Template

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconName } from "lucide-react";

const schema = z.object({
    field_name: z.string().min(2, "Error message"),
});

export function FeatureForm({ initialData, featureId }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            field_name: initialData?.field_name || "",
        },
    });

    async function onSubmit(data: any) {
        setLoading(true);
        try {
            if (featureId) {
                await service.update(featureId, data);
            } else {
                await service.create(data);
            }
            router.push("/dashboard/[feature]");
            router.refresh();
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <IconName className="h-5 w-5 text-primary" />
                            Section Title
                        </CardTitle>
                        <CardDescription>
                            Section description.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="field_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Field Label</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <IconName className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Placeholder" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (featureId ? "Update Feature" : "Create Feature")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
```

---

## 19. Checklist for New Features

When creating a new feature, ensure:

- [ ] Page uses standard wrapper structure
- [ ] Header component included
- [ ] Back button uses `rounded-full` with `ArrowLeft` icon
- [ ] Title is `text-3xl font-bold tracking-tight`
- [ ] Description text included
- [ ] Form wrapped in `mx-auto max-w-3xl`
- [ ] Form uses `space-y-8` spacing
- [ ] Card sections have CardHeader with icon + description
- [ ] Input fields have icons with `pl-9` padding
- [ ] Buttons use `size="lg"`
- [ ] Loading states implemented
- [ ] Error handling in place
- [ ] Responsive design (mobile + desktop views for lists)

---

## 20. Quick Reference Summary

| Element | Pattern |
|---------|---------|
| Page wrapper | `flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50` |
| Content area | `flex-1 space-y-6 p-8 pt-6` |
| Form spacing | `space-y-8` |
| Form container | `mx-auto max-w-3xl` |
| Card title | `text-xl flex items-center gap-2` |
| Card icon | `h-5 w-5 text-primary` |
| Input icon | `h-4 w-4 text-muted-foreground` |
| Input padding | `pl-9` |
| Button size | `size="lg"` |
| Page title | `text-3xl font-bold tracking-tight` |
| Description | `text-muted-foreground` |

---

## How to Use This Reference

**In conversations, simply say:**
- "Follow DESIGN_REFERENCE.md"
- "Use the design patterns from the reference"
- "Match the layout in DESIGN_REFERENCE.md"
- "Create [feature] following DESIGN_REFERENCE.md patterns"

**I will automatically:**
- Use the exact same structure
- Apply consistent spacing and styling
- Follow the icon and color patterns
- Match the form and page layouts
- Ensure responsive design

---

**Last Updated:** December 2025  
**Version:** 1.0

