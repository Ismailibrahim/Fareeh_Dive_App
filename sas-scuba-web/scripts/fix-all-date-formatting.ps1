# Script to fix all unsafe date formatting
# This replaces format(new Date(...)) with safeFormatDate(...)

$files = @(
    "src/app/dashboard/dive-logs/page.tsx",
    "src/app/dashboard/dive-logs/[id]/page.tsx",
    "src/components/dive-logs/DiveLogForm.tsx",
    "src/app/dashboard/bookings/page.tsx",
    "src/app/dashboard/dives/[id]/page.tsx",
    "src/app/dashboard/dives/page.tsx",
    "src/app/dashboard/invoices/page.tsx",
    "src/app/dashboard/invoices/[id]/page.tsx",
    "src/app/dashboard/baskets/page.tsx",
    "src/app/dashboard/baskets/[id]/page.tsx",
    "src/app/dashboard/baskets/create/page.tsx",
    "src/app/dashboard/booking-equipment/page.tsx",
    "src/app/dashboard/bookings/[id]/page.tsx",
    "src/app/dashboard/dive-packages/page.tsx",
    "src/app/dashboard/dive-packages/[id]/page.tsx",
    "src/app/dashboard/customer-certifications/create/page.tsx",
    "src/app/dashboard/customer-insurances/create/page.tsx",
    "src/app/dashboard/customer-insurances/page.tsx",
    "src/app/dashboard/booking-dives/page.tsx",
    "src/components/services/BulkServiceForm.tsx",
    "src/components/customers/CustomerCertificationsSection.tsx",
    "src/components/customers/CustomerInsuranceSection.tsx",
    "src/components/booking-dives/BookingDiveForm.tsx",
    "src/components/equipment-items/ServiceHistorySection.tsx"
)

Write-Host "Files to process: $($files.Count)"

