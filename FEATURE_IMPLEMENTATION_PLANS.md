# Feature Implementation Plans - SAS Scuba

This document provides detailed step-by-step implementation plans for each missing feature identified in the gap analysis.

---

## Table of Contents

1. [Digital Forms & Waivers](#1-digital-forms--waivers)
2. [Online Booking Engine](#2-online-booking-engine)
3. [Advanced Dive Log Features](#3-advanced-dive-log-features)
4. [Point of Sale (POS) & Retail Management](#4-point-of-sale-pos--retail-management)
5. [Staff Scheduling & Payroll](#5-staff-scheduling--payroll)
6. [Marketing & Communication Automation](#6-marketing--communication-automation)
7. [Advanced Reporting & Analytics](#7-advanced-reporting--analytics)
8. [Mobile App / Mobile-Optimized Features](#8-mobile-app--mobile-optimized-features)
9. [Multi-Language Support](#9-multi-language-support)
10. [Integration Capabilities](#10-integration-capabilities)
11. [Safety & Compliance Features](#11-safety--compliance-features)
12. [Customer Portal / Self-Service](#12-customer-portal--self-service)

---

## 1. Digital Forms & Waivers

### Overview
Implement a comprehensive digital form system for liability waivers, medical questionnaires, and pre-dive checklists with e-signature support.

### Database Schema

**New Migration:** `2025_XX_XX_create_waivers_table.php`
```php
Schema::create('waivers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('dive_center_id')->constrained()->onDelete('cascade');
    $table->string('name'); // e.g., "Liability Release", "Medical Questionnaire"
    $table->enum('type', ['liability', 'medical', 'checklist', 'custom']);
    $table->text('content'); // HTML/rich text content
    $table->json('fields')->nullable(); // Dynamic form fields
    $table->boolean('requires_signature')->default(true);
    $table->boolean('is_active')->default(true);
    $table->integer('expiry_days')->nullable(); // Days until expiry
    $table->timestamps();
});

Schema::create('waiver_signatures', function (Blueprint $table) {
    $table->id();
    $table->foreignId('waiver_id')->constrained()->onDelete('cascade');
    $table->foreignId('customer_id')->constrained()->onDelete('cascade');
    $table->foreignId('signed_by_user_id')->nullable()->constrained('users')->onDelete('set null');
    $table->text('signature_data'); // Base64 encoded signature image
    $table->string('ip_address')->nullable();
    $table->timestamp('signed_at');
    $table->date('expires_at')->nullable();
    $table->boolean('is_valid')->default(true);
    $table->timestamps();
    
    $table->index(['customer_id', 'waiver_id', 'is_valid']);
});
```

### Backend Implementation

#### Step 1: Create Models
**File:** `sas-scuba-api/app/Models/Waiver.php`
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Waiver extends Model
{
    protected $fillable = [
        'dive_center_id',
        'name',
        'type',
        'content',
        'fields',
        'requires_signature',
        'is_active',
        'expiry_days',
    ];

    protected $casts = [
        'fields' => 'array',
        'requires_signature' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function diveCenter(): BelongsTo
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function signatures(): HasMany
    {
        return $this->hasMany(WaiverSignature::class);
    }
}
```

**File:** `sas-scuba-api/app/Models/WaiverSignature.php`
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaiverSignature extends Model
{
    protected $fillable = [
        'waiver_id',
        'customer_id',
        'signed_by_user_id',
        'signature_data',
        'ip_address',
        'signed_at',
        'expires_at',
        'is_valid',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
        'expires_at' => 'date',
        'is_valid' => 'boolean',
    ];

    public function waiver(): BelongsTo
    {
        return $this->belongsTo(Waiver::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function signedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by_user_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
```

#### Step 2: Create Controllers
**File:** `sas-scuba-api/app/Http/Controllers/Api/V1/WaiverController.php`
- `index()` - List all waivers for dive center
- `store()` - Create new waiver template
- `show()` - Get waiver details
- `update()` - Update waiver template
- `destroy()` - Delete waiver (soft delete if signatures exist)

**File:** `sas-scuba-api/app/Http/Controllers/Api/V1/WaiverSignatureController.php`
- `index()` - List signatures (filter by customer, waiver, validity)
- `store()` - Record new signature
- `show()` - Get signature details with image
- `verify()` - Verify signature validity
- `expire()` - Manually expire signature

#### Step 3: Create Services
**File:** `sas-scuba-api/app/Services/WaiverService.php`
```php
class WaiverService
{
    public function createSignature(int $waiverId, int $customerId, string $signatureData, ?int $userId = null): WaiverSignature
    {
        $waiver = Waiver::findOrFail($waiverId);
        
        // Calculate expiry date
        $expiresAt = $waiver->expiry_days 
            ? now()->addDays($waiver->expiry_days)
            : null;

        return WaiverSignature::create([
            'waiver_id' => $waiverId,
            'customer_id' => $customerId,
            'signed_by_user_id' => $userId,
            'signature_data' => $signatureData,
            'ip_address' => request()->ip(),
            'signed_at' => now(),
            'expires_at' => $expiresAt,
            'is_valid' => true,
        ]);
    }

    public function checkCustomerWaiverStatus(int $customerId, int $waiverId): array
    {
        $signature = WaiverSignature::where('customer_id', $customerId)
            ->where('waiver_id', $waiverId)
            ->where('is_valid', true)
            ->latest('signed_at')
            ->first();

        if (!$signature) {
            return ['status' => 'missing', 'message' => 'Waiver not signed'];
        }

        if ($signature->isExpired()) {
            return ['status' => 'expired', 'message' => 'Waiver expired', 'expired_at' => $signature->expires_at];
        }

        return ['status' => 'valid', 'signed_at' => $signature->signed_at, 'expires_at' => $signature->expires_at];
    }
}
```

#### Step 4: Add Routes
**File:** `sas-scuba-api/routes/api.php`
```php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('waivers', WaiverController::class);
    Route::apiResource('waiver-signatures', WaiverSignatureController::class);
    Route::post('waiver-signatures/{signature}/verify', [WaiverSignatureController::class, 'verify']);
});
```

### Frontend Implementation

#### Step 1: Create Service
**File:** `sas-scuba-web/src/lib/api/services/waiver.service.ts`
```typescript
export interface Waiver {
    id: number;
    dive_center_id: number;
    name: string;
    type: 'liability' | 'medical' | 'checklist' | 'custom';
    content: string;
    fields?: any[];
    requires_signature: boolean;
    is_active: boolean;
    expiry_days?: number;
}

export interface WaiverSignature {
    id: number;
    waiver_id: number;
    customer_id: number;
    signature_data: string;
    signed_at: string;
    expires_at?: string;
    is_valid: boolean;
}

export const waiverService = {
    getAll: () => api.get<Waiver[]>('/waivers'),
    getById: (id: number) => api.get<Waiver>(`/waivers/${id}`),
    create: (data: Partial<Waiver>) => api.post<Waiver>('/waivers', data),
    update: (id: number, data: Partial<Waiver>) => api.put<Waiver>(`/waivers/${id}`, data),
    delete: (id: number) => api.delete(`/waivers/${id}`),
    
    // Signatures
    getSignatures: (customerId?: number) => api.get<WaiverSignature[]>('/waiver-signatures', { params: { customer_id: customerId } }),
    createSignature: (data: { waiver_id: number; customer_id: number; signature_data: string }) => 
        api.post<WaiverSignature>('/waiver-signatures', data),
    verifySignature: (signatureId: number) => api.post(`/waiver-signatures/${signatureId}/verify`),
};
```

#### Step 2: Create Components
**File:** `sas-scuba-web/src/components/waivers/WaiverForm.tsx`
- Form to create/edit waiver templates
- Rich text editor for content
- Dynamic fields builder

**File:** `sas-scuba-web/src/components/waivers/DigitalSignature.tsx`
- Canvas-based signature component
- Uses `react-signature-canvas` library
- Export signature as base64 image

**File:** `sas-scuba-web/src/components/waivers/WaiverSigningForm.tsx`
- Display waiver content
- Signature pad
- Customer selection
- Submit signature

**File:** `sas-scuba-web/src/components/waivers/WaiverStatusBadge.tsx`
- Show waiver status (valid, expired, missing)
- Color-coded badges

#### Step 3: Create Pages
**File:** `sas-scuba-web/src/app/dashboard/waivers/page.tsx`
- List all waiver templates
- Create/edit/delete actions

**File:** `sas-scuba-web/src/app/dashboard/waivers/[id]/sign/page.tsx`
- Sign waiver for customer
- Signature pad interface

**File:** `sas-scuba-web/src/app/dashboard/waivers/signatures/page.tsx`
- View all signatures
- Filter by customer, waiver, validity
- View signature images

### Dependencies to Install

**Backend:**
```bash
# No additional packages needed (Laravel built-in)
```

**Frontend:**
```bash
npm install react-signature-canvas
npm install @types/react-signature-canvas
```

### Testing Checklist
- [ ] Create waiver template
- [ ] Sign waiver for customer
- [ ] Verify signature validity
- [ ] Check expiry dates
- [ ] View signature image
- [ ] Filter signatures by customer
- [ ] Expire old signatures automatically

---

## 2. Online Booking Engine

### Overview
Create a public-facing booking system where customers can book dives online, view availability, and make payments.

### Database Schema

**New Migration:** `2025_XX_XX_add_public_booking_fields.php`
```php
Schema::table('bookings', function (Blueprint $table) {
    $table->enum('source', ['walk_in', 'online', 'phone', 'email'])->default('walk_in');
    $table->string('booking_token')->unique()->nullable(); // For public booking links
    $table->enum('payment_status', ['pending', 'deposit_paid', 'paid', 'refunded'])->default('pending');
    $table->decimal('deposit_amount', 10, 2)->nullable();
    $table->timestamp('expires_at')->nullable(); // Booking expiration
});

Schema::create('booking_availability', function (Blueprint $table) {
    $table->id();
    $table->foreignId('dive_center_id')->constrained()->onDelete('cascade');
    $table->foreignId('dive_site_id')->nullable()->constrained()->onDelete('set null');
    $table->foreignId('boat_id')->nullable()->constrained()->onDelete('set null');
    $table->date('date');
    $table->time('time');
    $table->integer('max_capacity'); // Max divers
    $table->integer('current_bookings')->default(0);
    $table->boolean('is_available')->default(true);
    $table->timestamps();
    
    $table->unique(['dive_center_id', 'dive_site_id', 'boat_id', 'date', 'time']);
    $table->index(['date', 'is_available']);
});
```

### Backend Implementation

#### Step 1: Create Booking Availability Service
**File:** `sas-scuba-api/app/Services/BookingAvailabilityService.php`
```php
class BookingAvailabilityService
{
    public function checkAvailability(int $diveCenterId, int $diveSiteId, ?int $boatId, string $date, string $time): bool
    {
        $slot = BookingAvailability::where('dive_center_id', $diveCenterId)
            ->where('dive_site_id', $diveSiteId)
            ->where('boat_id', $boatId)
            ->where('date', $date)
            ->where('time', $time)
            ->where('is_available', true)
            ->first();

        if (!$slot) {
            return false;
        }

        return $slot->current_bookings < $slot->max_capacity;
    }

    public function getAvailableSlots(int $diveCenterId, string $startDate, string $endDate): Collection
    {
        return BookingAvailability::where('dive_center_id', $diveCenterId)
            ->whereBetween('date', [$startDate, $endDate])
            ->where('is_available', true)
            ->whereColumn('current_bookings', '<', 'max_capacity')
            ->with(['diveSite', 'boat'])
            ->get();
    }

    public function reserveSlot(int $slotId, int $bookingId): void
    {
        BookingAvailability::where('id', $slotId)->increment('current_bookings');
    }
}
```

#### Step 2: Create Public Booking Controller
**File:** `sas-scuba-api/app/Http/Controllers/Api/V1/Public/PublicBookingController.php`
```php
class PublicBookingController extends Controller
{
    public function getAvailability(Request $request)
    {
        $validated = $request->validate([
            'dive_center_id' => 'required|exists:dive_centers,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'dive_site_id' => 'nullable|exists:dive_sites,id',
        ]);

        $slots = app(BookingAvailabilityService::class)->getAvailableSlots(
            $validated['dive_center_id'],
            $validated['start_date'],
            $validated['end_date']
        );

        return response()->json(['data' => $slots]);
    }

    public function createBooking(Request $request)
    {
        // Validate customer data
        // Create booking
        // Generate booking token
        // Send confirmation email
        // Return booking details
    }

    public function getBookingByToken(string $token)
    {
        $booking = Booking::where('booking_token', $token)->firstOrFail();
        return response()->json(['data' => $booking->load(['customer', 'bookingDives'])]);
    }
}
```

#### Step 3: Create Payment Service
**File:** `sas-scuba-api/app/Services/PaymentService.php`
```php
class PaymentService
{
    public function processOnlinePayment(int $bookingId, array $paymentData): Payment
    {
        // Integrate with Stripe/PayPal
        // Create payment record
        // Update booking payment status
        // Send receipt email
    }
}
```

#### Step 4: Add Routes
**File:** `sas-scuba-api/routes/api.php`
```php
// Public routes (no auth required)
Route::prefix('public')->group(function () {
    Route::get('availability', [PublicBookingController::class, 'getAvailability']);
    Route::post('bookings', [PublicBookingController::class, 'createBooking']);
    Route::get('bookings/{token}', [PublicBookingController::class, 'getBookingByToken']);
    Route::post('bookings/{token}/payment', [PublicBookingController::class, 'processPayment']);
});
```

### Frontend Implementation

#### Step 1: Create Public Booking Pages
**File:** `sas-scuba-web/src/app/book/page.tsx`
- Public booking page (no auth required)
- Calendar view
- Availability display
- Booking form

**File:** `sas-scuba-web/src/app/book/[diveId]/page.tsx`
- Book specific dive
- Customer information form
- Payment processing

**File:** `sas-scuba-web/src/app/book/confirm/[token]/page.tsx`
- Booking confirmation page
- Show booking details
- Payment status

#### Step 2: Create Components
**File:** `sas-scuba-web/src/components/booking/PublicBookingCalendar.tsx`
- Calendar component showing availability
- Click to book slots
- Color-coded availability

**File:** `sas-scuba-web/src/components/booking/BookingForm.tsx`
- Customer information form
- Dive selection
- Equipment selection (optional)
- Payment form

**File:** `sas-scuba-web/src/components/booking/PaymentForm.tsx`
- Stripe/PayPal integration
- Payment processing
- Receipt generation

### Dependencies to Install

**Backend:**
```bash
composer require stripe/stripe-php
# or
composer require paypal/rest-api-sdk-php
```

**Frontend:**
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
# or
npm install react-paypal-button-v2
```

### Testing Checklist
- [ ] View available booking slots
- [ ] Create booking without login
- [ ] Process payment
- [ ] Receive confirmation email
- [ ] View booking by token
- [ ] Handle booking expiration
- [ ] Capacity limits enforced

---

## 3. Advanced Dive Log Features

### Overview
Enhance dive logs with photos, verification, PDF export, and statistics.

### Database Schema

**New Migration:** `2025_XX_XX_enhance_dive_logs.php`
```php
Schema::table('dive_logs', function (Blueprint $table) {
    $table->boolean('is_verified')->default(false);
    $table->foreignId('verified_by_user_id')->nullable()->constrained('users')->onDelete('set null');
    $table->timestamp('verified_at')->nullable();
    $table->json('marine_life')->nullable(); // Array of species seen
    $table->json('equipment_used')->nullable(); // Array of equipment IDs
    $table->json('buddies')->nullable(); // Array of customer IDs
    $table->text('notes')->nullable();
});

Schema::create('dive_log_photos', function (Blueprint $table) {
    $table->id();
    $table->foreignId('dive_log_id')->constrained()->onDelete('cascade');
    $table->foreignId('file_id')->constrained('tenant_files')->onDelete('cascade');
    $table->integer('order')->default(0);
    $table->string('caption')->nullable();
    $table->timestamps();
});
```

### Backend Implementation

#### Step 1: Enhance DiveLog Model
**File:** `sas-scuba-api/app/Models/DiveLog.php`
```php
public function photos(): HasMany
{
    return $this->hasMany(DiveLogPhoto::class);
}

public function verifiedBy(): BelongsTo
{
    return $this->belongsTo(User::class, 'verified_by_user_id');
}

public function verify(int $userId): void
{
    $this->update([
        'is_verified' => true,
        'verified_by_user_id' => $userId,
        'verified_at' => now(),
    ]);
}
```

#### Step 2: Create PDF Export Service
**File:** `sas-scuba-api/app/Services/DiveLogExportService.php`
```php
use Barryvdh\DomPDF\Facade\Pdf;

class DiveLogExportService
{
    public function exportToPdf(DiveLog $diveLog): string
    {
        $data = [
            'diveLog' => $diveLog->load(['customer', 'diveSite', 'boat', 'instructor', 'photos']),
            'diveCenter' => $diveLog->diveCenter,
        ];

        $pdf = Pdf::loadView('dive-logs.pdf', $data);
        return $pdf->output();
    }

    public function exportCustomerLogbook(int $customerId): string
    {
        $diveLogs = DiveLog::where('customer_id', $customerId)
            ->where('is_verified', true)
            ->with(['diveSite', 'boat', 'instructor'])
            ->orderBy('dive_date', 'desc')
            ->get();

        $pdf = Pdf::loadView('dive-logs.logbook', [
            'customer' => Customer::findOrFail($customerId),
            'diveLogs' => $diveLogs,
        ]);

        return $pdf->output();
    }
}
```

#### Step 3: Create Statistics Service
**File:** `sas-scuba-api/app/Services/DiveLogStatisticsService.php`
```php
class DiveLogStatisticsService
{
    public function getCustomerStatistics(int $customerId): array
    {
        $diveLogs = DiveLog::where('customer_id', $customerId)
            ->where('is_verified', true)
            ->get();

        return [
            'total_dives' => $diveLogs->count(),
            'deepest_dive' => $diveLogs->max('max_depth'),
            'longest_dive' => $diveLogs->max('total_dive_time'),
            'total_time_underwater' => $diveLogs->sum('total_dive_time'),
            'favorite_dive_site' => $this->getFavoriteDiveSite($diveLogs),
            'dives_by_type' => $diveLogs->groupBy('dive_type')->map->count(),
        ];
    }
}
```

#### Step 4: Add Controller Methods
**File:** `sas-scuba-api/app/Http/Controllers/Api/V1/DiveLogController.php`
```php
public function verify(Request $request, DiveLog $diveLog)
{
    $this->authorizeDiveCenterAccess($diveLog);
    $diveLog->verify($request->user()->id);
    return response()->json(['message' => 'Dive log verified']);
}

public function exportPdf(DiveLog $diveLog)
{
    $this->authorizeDiveCenterAccess($diveLog);
    $pdf = app(DiveLogExportService::class)->exportToPdf($diveLog);
    return response($pdf)
        ->header('Content-Type', 'application/pdf')
        ->header('Content-Disposition', 'attachment; filename="dive-log-'.$diveLog->id.'.pdf"');
}

public function getStatistics(int $customerId)
{
    $stats = app(DiveLogStatisticsService::class)->getCustomerStatistics($customerId);
    return response()->json(['data' => $stats]);
}
```

### Frontend Implementation

#### Step 1: Create Components
**File:** `sas-scuba-web/src/components/dive-logs/DiveLogPhotoGallery.tsx`
- Photo upload
- Photo gallery display
- Photo ordering
- Captions

**File:** `sas-scuba-web/src/components/dive-logs/DiveLogStatistics.tsx`
- Statistics dashboard
- Charts (total dives, depth, time)
- Favorite dive sites

**File:** `sas-scuba-web/src/components/dive-logs/DiveLogVerification.tsx`
- Verification button
- Verified badge
- Instructor verification workflow

**File:** `sas-scuba-web/src/components/dive-logs/DiveLogExport.tsx`
- Export to PDF button
- Download logbook

### Dependencies to Install

**Backend:**
```bash
composer require barryvdh/laravel-dompdf
```

**Frontend:**
```bash
npm install react-image-gallery
npm install recharts # For statistics charts
```

### Testing Checklist
- [ ] Upload photos to dive log
- [ ] Verify dive log as instructor
- [ ] Export dive log to PDF
- [ ] Export customer logbook
- [ ] View dive statistics
- [ ] Track marine life sightings
- [ ] Add dive buddies

---

## 4. Point of Sale (POS) & Retail Management

### Overview
Implement retail inventory management and POS interface for in-store sales.

### Database Schema

**New Migration:** `2025_XX_XX_create_retail_products_table.php`
```php
Schema::create('retail_products', function (Blueprint $table) {
    $table->id();
    $table->foreignId('dive_center_id')->constrained()->onDelete('cascade');
    $table->string('sku')->unique();
    $table->string('name');
    $table->text('description')->nullable();
    $table->decimal('cost_price', 10, 2);
    $table->decimal('selling_price', 10, 2);
    $table->integer('stock_quantity')->default(0);
    $table->integer('low_stock_threshold')->default(10);
    $table->string('barcode')->nullable()->unique();
    $table->foreignId('category_id')->nullable()->constrained('product_categories')->onDelete('set null');
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    
    $table->index(['dive_center_id', 'sku']);
    $table->index('barcode');
});

Schema::create('product_categories', function (Blueprint $table) {
    $table->id();
    $table->foreignId('dive_center_id')->constrained()->onDelete('cascade');
    $table->string('name');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->timestamps();
});

Schema::create('retail_sales', function (Blueprint $table) {
    $table->id();
    $table->foreignId('dive_center_id')->constrained()->onDelete('cascade');
    $table->string('sale_number')->unique();
    $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
    $table->foreignId('sold_by_user_id')->constrained('users')->onDelete('restrict');
    $table->decimal('subtotal', 10, 2);
    $table->decimal('tax_amount', 10, 2)->default(0);
    $table->decimal('discount_amount', 10, 2)->default(0);
    $table->decimal('total', 10, 2);
    $table->enum('payment_method', ['cash', 'card', 'online', 'other']);
    $table->timestamps();
    
    $table->index(['dive_center_id', 'sale_number']);
});

Schema::create('retail_sale_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('retail_sale_id')->constrained()->onDelete('cascade');
    $table->foreignId('retail_product_id')->constrained()->onDelete('restrict');
    $table->integer('quantity');
    $table->decimal('unit_price', 10, 2);
    $table->decimal('total', 10, 2);
    $table->timestamps();
});
```

### Backend Implementation

#### Step 1: Create Models
**Files:**
- `sas-scuba-api/app/Models/RetailProduct.php`
- `sas-scuba-api/app/Models/ProductCategory.php`
- `sas-scuba-api/app/Models/RetailSale.php`
- `sas-scuba-api/app/Models/RetailSaleItem.php`

#### Step 2: Create Controllers
**Files:**
- `sas-scuba-api/app/Http/Controllers/Api/V1/RetailProductController.php`
- `sas-scuba-api/app/Http/Controllers/Api/V1/RetailSaleController.php`
- `sas-scuba-api/app/Http/Controllers/Api/V1/ProductCategoryController.php`

#### Step 3: Create POS Service
**File:** `sas-scuba-api/app/Services/POSService.php`
```php
class POSService
{
    public function processSale(array $items, int $customerId, int $userId, string $paymentMethod): RetailSale
    {
        DB::beginTransaction();
        try {
            $saleNumber = $this->generateSaleNumber();
            $subtotal = 0;
            $saleItems = [];

            foreach ($items as $item) {
                $product = RetailProduct::findOrFail($item['product_id']);
                
                // Check stock
                if ($product->stock_quantity < $item['quantity']) {
                    throw new \Exception("Insufficient stock for {$product->name}");
                }

                $unitPrice = $product->selling_price;
                $total = $unitPrice * $item['quantity'];
                $subtotal += $total;

                // Update stock
                $product->decrement('stock_quantity', $item['quantity']);

                $saleItems[] = [
                    'retail_product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'total' => $total,
                ];
            }

            $taxAmount = $subtotal * 0.1; // 10% tax (configurable)
            $total = $subtotal + $taxAmount;

            $sale = RetailSale::create([
                'dive_center_id' => auth()->user()->dive_center_id,
                'sale_number' => $saleNumber,
                'customer_id' => $customerId,
                'sold_by_user_id' => $userId,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'payment_method' => $paymentMethod,
            ]);

            foreach ($saleItems as $item) {
                $sale->items()->create($item);
            }

            DB::commit();
            return $sale;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private function generateSaleNumber(): string
    {
        $year = now()->year;
        $lastSale = RetailSale::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        $number = $lastSale ? (int) substr($lastSale->sale_number, -6) + 1 : 1;
        return "SALE-{$year}-" . str_pad($number, 6, '0', STR_PAD_LEFT);
    }
}
```

### Frontend Implementation

#### Step 1: Create POS Interface
**File:** `sas-scuba-web/src/app/dashboard/pos/page.tsx`
- POS main interface
- Product search/barcode scan
- Cart management
- Payment processing
- Receipt printing

**File:** `sas-scuba-web/src/components/pos/POSInterface.tsx`
- Product grid
- Shopping cart
- Customer selection
- Payment methods
- Checkout button

**File:** `sas-scuba-web/src/components/pos/ProductSearch.tsx`
- Search products
- Barcode scanner integration
- Quick add to cart

**File:** `sas-scuba-web/src/components/pos/SalesReceipt.tsx`
- Print receipt
- Email receipt option

### Dependencies to Install

**Backend:**
```bash
# No additional packages needed
```

**Frontend:**
```bash
npm install html5-qrcode # For barcode scanning
npm install react-to-print # For receipt printing
```

### Testing Checklist
- [ ] Create retail products
- [ ] Scan barcode to add product
- [ ] Process sale
- [ ] Update inventory
- [ ] Generate receipt
- [ ] Low stock alerts
- [ ] Sales reports

---

## 5. Staff Scheduling & Payroll

### Overview
Implement staff scheduling system with commission calculation and payroll management.

### Database Schema

**New Migration:** `2025_XX_XX_create_staff_scheduling_tables.php`
```php
Schema::create('staff_schedules', function (Blueprint $table) {
    $table->id();
    $table->foreignId('dive_center_id')->constrained()->onDelete('cascade');
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
    $table->date('date');
    $table->time('start_time');
    $table->time('end_time');
    $table->enum('type', ['dive', 'course', 'admin', 'other']);
    $table->foreignId('booking_id')->nullable()->constrained()->onDelete('set null');
    $table->foreignId('booking_dive_id')->nullable()->constrained('booking_dives')->onDelete('set null');
    $table->text('notes')->nullable();
    $table->timestamps();
    
    $table->index(['user_id', 'date']);
});

Schema::create('staff_availability', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
    $table->enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
    $table->time('start_time');
    $table->time('end_time');
    $table->boolean('is_available')->default(true);
    $table->timestamps();
});

Schema::table('commission_entries', function (Blueprint $table) {
    $table->enum('status', ['pending', 'approved', 'paid'])->default('pending');
    $table->date('paid_at')->nullable();
});
```

### Backend Implementation

#### Step 1: Create Scheduling Service
**File:** `sas-scuba-api/app/Services/StaffSchedulingService.php`
```php
class StaffSchedulingService
{
    public function assignStaffToDive(int $bookingDiveId, int $userId, string $role): void
    {
        $bookingDive = BookingDive::findOrFail($bookingDiveId);
        
        StaffSchedule::create([
            'dive_center_id' => $bookingDive->booking->dive_center_id,
            'user_id' => $userId,
            'date' => $bookingDive->dive_date,
            'start_time' => $bookingDive->dive_time,
            'end_time' => Carbon::parse($bookingDive->dive_time)->addHours(3), // Estimate
            'type' => 'dive',
            'booking_dive_id' => $bookingDiveId,
        ]);
    }

    public function getStaffSchedule(int $userId, string $startDate, string $endDate): Collection
    {
        return StaffSchedule::where('user_id', $userId)
            ->whereBetween('date', [$startDate, $endDate])
            ->with(['booking', 'bookingDive'])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();
    }

    public function checkAvailability(int $userId, string $date, string $startTime, string $endTime): bool
    {
        $conflicts = StaffSchedule::where('user_id', $userId)
            ->where('date', $date)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<=', $startTime)
                          ->where('end_time', '>=', $endTime);
                    });
            })
            ->exists();

        return !$conflicts;
    }
}
```

#### Step 2: Create Commission Service
**File:** `sas-scuba-api/app/Services/CommissionService.php`
```php
class CommissionService
{
    public function calculateCommission(int $bookingId, int $userId): CommissionEntry
    {
        $booking = Booking::findOrFail($bookingId);
        $user = User::findOrFail($userId);
        
        // Get commission rules for user role
        $rules = CommissionRule::where('dive_center_id', $booking->dive_center_id)
            ->where('role', $user->role)
            ->get();

        $totalCommission = 0;

        foreach ($rules as $rule) {
            switch ($rule->type) {
                case 'percentage':
                    $totalCommission += $booking->total_amount * ($rule->value / 100);
                    break;
                case 'fixed_per_dive':
                    $diveCount = $booking->bookingDives()->count();
                    $totalCommission += $rule->value * $diveCount;
                    break;
                case 'fixed_per_course':
                    // Course-specific logic
                    break;
            }
        }

        return CommissionEntry::create([
            'dive_center_id' => $booking->dive_center_id,
            'user_id' => $userId,
            'booking_id' => $bookingId,
            'amount' => $totalCommission,
            'status' => 'pending',
        ]);
    }

    public function generatePayroll(int $userId, string $startDate, string $endDate): array
    {
        $commissions = CommissionEntry::where('user_id', $userId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'approved')
            ->get();

        $baseSalary = User::findOrFail($userId)->base_salary ?? 0;
        $totalCommissions = $commissions->sum('amount');

        return [
            'user_id' => $userId,
            'period_start' => $startDate,
            'period_end' => $endDate,
            'base_salary' => $baseSalary,
            'commissions' => $commissions->toArray(),
            'total_commissions' => $totalCommissions,
            'gross_pay' => $baseSalary + $totalCommissions,
            'tax' => ($baseSalary + $totalCommissions) * 0.2, // 20% tax
            'net_pay' => ($baseSalary + $totalCommissions) * 0.8,
        ];
    }
}
```

### Frontend Implementation

#### Step 1: Create Components
**File:** `sas-scuba-web/src/components/staff/StaffScheduleCalendar.tsx`
- Calendar view of staff schedules
- Drag-and-drop scheduling
- Availability display

**File:** `sas-scuba-web/src/components/staff/CommissionDashboard.tsx`
- View commissions
- Approve/reject commissions
- Commission history

**File:** `sas-scuba-web/src/components/staff/PayrollReport.tsx`
- Generate payroll
- View pay stubs
- Export payroll

### Testing Checklist
- [ ] Assign staff to dive
- [ ] Check availability conflicts
- [ ] Calculate commissions
- [ ] Generate payroll
- [ ] Approve commissions
- [ ] View schedule calendar

---

## 6. Marketing & Communication Automation

### Overview
Implement automated email/SMS notifications, reminders, and marketing campaigns.

### Database Schema

**New Migration:** `2025_XX_XX_create_notification_system.php`
```php
Schema::create('notification_templates', function (Blueprint $table) {
    $table->id();
    $table->foreignId('dive_center_id')->constrained()->onDelete('cascade');
    $table->string('name');
    $table->enum('type', ['email', 'sms', 'push']);
    $table->enum('trigger', ['booking_created', 'booking_reminder', 'payment_due', 'certification_expiring', 'custom']);
    $table->string('subject')->nullable();
    $table->text('body');
    $table->json('variables')->nullable(); // Available template variables
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('dive_center_id')->constrained()->onDelete('cascade');
    $table->foreignId('template_id')->nullable()->constrained('notification_templates')->onDelete('set null');
    $table->foreignId('customer_id')->nullable()->constrained()->onDelete('cascade');
    $table->foreignId('booking_id')->nullable()->constrained()->onDelete('cascade');
    $table->enum('type', ['email', 'sms', 'push']);
    $table->string('recipient');
    $table->string('subject')->nullable();
    $table->text('body');
    $table->enum('status', ['pending', 'sent', 'failed', 'delivered']);
    $table->timestamp('sent_at')->nullable();
    $table->text('error_message')->nullable();
    $table->timestamps();
    
    $table->index(['dive_center_id', 'status']);
    $table->index(['customer_id', 'type']);
});
```

### Backend Implementation

#### Step 1: Create Notification Service
**File:** `sas-scuba-api/app/Services/NotificationService.php`
```php
use Illuminate\Support\Facades\Mail;
use Twilio\Rest\Client as TwilioClient;

class NotificationService
{
    public function sendBookingConfirmation(Booking $booking): void
    {
        $template = NotificationTemplate::where('dive_center_id', $booking->dive_center_id)
            ->where('trigger', 'booking_created')
            ->where('type', 'email')
            ->where('is_active', true)
            ->first();

        if (!$template) {
            return;
        }

        $body = $this->replaceVariables($template->body, [
            'customer_name' => $booking->customer->name,
            'booking_number' => $booking->booking_number,
            'dive_date' => $booking->bookingDives->first()->dive_date,
            'dive_site' => $booking->bookingDives->first()->diveSite->name,
        ]);

        $this->sendEmail($booking->customer->email, $template->subject, $body);
    }

    public function sendBookingReminder(Booking $booking): void
    {
        // Send 24 hours before dive
    }

    public function sendCertificationExpiryReminder(CustomerCertification $certification): void
    {
        // Send reminder 30 days before expiry
    }

    private function replaceVariables(string $template, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $template = str_replace("{{{$key}}}", $value, $template);
        }
        return $template;
    }

    private function sendEmail(string $to, string $subject, string $body): void
    {
        Mail::raw($body, function ($message) use ($to, $subject) {
            $message->to($to)->subject($subject);
        });
    }

    private function sendSms(string $to, string $message): void
    {
        $twilio = new TwilioClient(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );

        $twilio->messages->create($to, [
            'from' => config('services.twilio.from'),
            'body' => $message,
        ]);
    }
}
```

#### Step 2: Create Jobs for Automation
**File:** `sas-scuba-api/app/Jobs/SendBookingReminders.php`
```php
class SendBookingReminders implements ShouldQueue
{
    public function handle(): void
    {
        $tomorrow = now()->addDay();
        
        $bookings = Booking::whereHas('bookingDives', function ($query) use ($tomorrow) {
            $query->whereDate('dive_date', $tomorrow);
        })
        ->whereDoesntHave('notifications', function ($query) {
            $query->where('type', 'email')
                  ->where('status', 'sent')
                  ->where('created_at', '>', now()->subDay());
        })
        ->get();

        foreach ($bookings as $booking) {
            app(NotificationService::class)->sendBookingReminder($booking);
        }
    }
}
```

#### Step 3: Schedule Jobs
**File:** `sas-scuba-api/app/Console/Kernel.php`
```php
protected function schedule(Schedule $schedule)
{
    $schedule->job(new SendBookingReminders)->dailyAt('09:00');
    $schedule->job(new SendCertificationExpiryReminders)->dailyAt('10:00');
}
```

### Frontend Implementation

#### Step 1: Create Components
**File:** `sas-scuba-web/src/components/notifications/NotificationTemplateForm.tsx`
- Create/edit notification templates
- Variable placeholders
- Preview template

**File:** `sas-scuba-web/src/components/notifications/NotificationHistory.tsx`
- View sent notifications
- Filter by type, status
- Resend failed notifications

### Dependencies to Install

**Backend:**
```bash
composer require twilio/sdk
composer require guzzlehttp/guzzle # For HTTP requests
```

**Frontend:**
```bash
# No additional packages needed
```

### Testing Checklist
- [ ] Create notification templates
- [ ] Send booking confirmation
- [ ] Send booking reminder
- [ ] Send certification expiry reminder
- [ ] View notification history
- [ ] Handle failed notifications

---

## 7. Advanced Reporting & Analytics

### Overview
Implement comprehensive reporting and analytics dashboard with charts and exports.

### Backend Implementation

#### Step 1: Create Report Service
**File:** `sas-scuba-api/app/Services/ReportService.php`
```php
class ReportService
{
    public function getRevenueReport(string $startDate, string $endDate, ?int $diveCenterId = null): array
    {
        $query = Invoice::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'paid');

        if ($diveCenterId) {
            $query->where('dive_center_id', $diveCenterId);
        }

        $invoices = $query->get();

        return [
            'total_revenue' => $invoices->sum('total_amount'),
            'total_invoices' => $invoices->count(),
            'average_invoice' => $invoices->avg('total_amount'),
            'daily_breakdown' => $invoices->groupBy(function ($invoice) {
                return $invoice->created_at->format('Y-m-d');
            })->map(function ($group) {
                return $group->sum('total_amount');
            }),
        ];
    }

    public function getEquipmentUtilizationReport(string $startDate, string $endDate): array
    {
        // Calculate equipment usage statistics
    }

    public function getStaffPerformanceReport(int $userId, string $startDate, string $endDate): array
    {
        // Calculate staff performance metrics
    }
}
```

#### Step 2: Create Report Controller
**File:** `sas-scuba-api/app/Http/Controllers/Api/V1/ReportController.php`
```php
class ReportController extends Controller
{
    public function revenue(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $report = app(ReportService::class)->getRevenueReport(
            $validated['start_date'],
            $validated['end_date'],
            $request->user()->dive_center_id
        );

        return response()->json(['data' => $report]);
    }

    public function export(Request $request, string $type)
    {
        // Export to Excel/PDF
    }
}
```

### Frontend Implementation

#### Step 1: Create Dashboard Components
**File:** `sas-scuba-web/src/components/reports/RevenueChart.tsx`
- Line chart showing revenue over time
- Use recharts library

**File:** `sas-scuba-web/src/components/reports/EquipmentUtilizationChart.tsx`
- Bar chart showing equipment usage
- Most popular equipment

**File:** `sas-scuba-web/src/components/reports/ReportFilters.tsx`
- Date range picker
- Filter options
- Export buttons

### Dependencies to Install

**Backend:**
```bash
composer require maatwebsite/excel
```

**Frontend:**
```bash
npm install recharts
npm install date-fns
```

### Testing Checklist
- [ ] Generate revenue report
- [ ] View equipment utilization
- [ ] Export to Excel
- [ ] Export to PDF
- [ ] Filter by date range
- [ ] View charts

---

## 8. Mobile App / Mobile-Optimized Features

### Overview
Ensure mobile responsiveness and add mobile-specific features like QR codes.

### Implementation Steps

#### Step 1: Enhance Mobile Responsiveness
- Review all existing pages for mobile optimization
- Test on various screen sizes
- Improve touch targets
- Optimize forms for mobile

#### Step 2: Add QR Code Features
**Backend:**
```php
// Generate QR code for booking
public function generateBookingQrCode(Booking $booking): string
{
    $data = [
        'booking_id' => $booking->id,
        'booking_token' => $booking->booking_token,
        'customer_name' => $booking->customer->name,
    ];

    return QrCode::size(300)->generate(json_encode($data));
}
```

**Frontend:**
```typescript
// QR code scanner component
import { Html5Qrcode } from 'html5-qrcode';

export function QRCodeScanner({ onScan }: { onScan: (data: string) => void }) {
    // Implement QR code scanning
}
```

### Dependencies to Install

**Backend:**
```bash
composer require simplesoftwareio/simple-qrcode
```

**Frontend:**
```bash
npm install html5-qrcode
```

---

## 9. Multi-Language Support

### Overview
Implement internationalization (i18n) for multi-language support.

### Implementation Steps

#### Step 1: Install i18n Library
```bash
npm install next-intl
```

#### Step 2: Configure i18n
**File:** `sas-scuba-web/next.config.js`
```javascript
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

module.exports = withNextIntl({
    // ... existing config
});
```

#### Step 3: Create Translation Files
**Files:**
- `sas-scuba-web/src/messages/en.json`
- `sas-scuba-web/src/messages/es.json`
- `sas-scuba-web/src/messages/fr.json`

#### Step 4: Update Components
Replace hardcoded strings with translation keys:
```typescript
import { useTranslations } from 'next-intl';

export function CustomerForm() {
    const t = useTranslations('customers');
    
    return (
        <div>
            <label>{t('name')}</label>
            <input />
        </div>
    );
}
```

### Testing Checklist
- [ ] Switch languages
- [ ] Translate all UI text
- [ ] Translate forms
- [ ] Translate error messages

---

## 10. Integration Capabilities

### Overview
Add API documentation and webhook support for integrations.

### Implementation Steps

#### Step 1: Generate API Documentation
**Install Swagger:**
```bash
composer require darkaonline/l5-swagger
```

**File:** `sas-scuba-api/app/Http/Controllers/Api/V1/BookingController.php`
```php
/**
 * @OA\Get(
 *     path="/api/v1/bookings",
 *     summary="Get all bookings",
 *     tags={"Bookings"},
 *     security={{"sanctum": {}}},
 *     @OA\Response(response=200, description="Success")
 * )
 */
public function index() { }
```

#### Step 2: Create Webhook System
**File:** `sas-scuba-api/app/Models/Webhook.php`
```php
Schema::create('webhooks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('dive_center_id')->constrained()->onDelete('cascade');
    $table->string('url');
    $table->enum('event', ['booking.created', 'payment.received', 'dive.completed']);
    $table->string('secret');
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

---

## 11. Safety & Compliance Features

### Overview
Implement incident reporting and compliance tracking.

### Database Schema

**New Migration:** `2025_XX_XX_create_incident_reports_table.php`
```php
Schema::create('incident_reports', function (Blueprint $table) {
    $table->id();
    $table->foreignId('dive_center_id')->constrained()->onDelete('cascade');
    $table->foreignId('reported_by_user_id')->constrained('users')->onDelete('restrict');
    $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
    $table->foreignId('booking_id')->nullable()->constrained()->onDelete('set null');
    $table->date('incident_date');
    $table->enum('severity', ['minor', 'moderate', 'serious', 'critical']);
    $table->enum('type', ['equipment_failure', 'diver_injury', 'boat_incident', 'other']);
    $table->text('description');
    $table->text('actions_taken');
    $table->json('witnesses')->nullable();
    $table->json('attachments')->nullable();
    $table->enum('status', ['draft', 'submitted', 'under_review', 'resolved'])->default('draft');
    $table->timestamps();
});
```

### Backend Implementation

#### Step 1: Create Incident Report Model & Controller
**Files:**
- `sas-scuba-api/app/Models/IncidentReport.php`
- `sas-scuba-api/app/Http/Controllers/Api/V1/IncidentReportController.php`

### Frontend Implementation

#### Step 1: Create Components
**File:** `sas-scuba-web/src/components/safety/IncidentReportForm.tsx`
- Form to report incidents
- Severity selection
- Witness information
- File attachments

---

## 12. Customer Portal / Self-Service

### Overview
Create customer-facing portal for viewing dive logs, bookings, and certifications.

### Implementation Steps

#### Step 1: Create Customer Authentication
**File:** `sas-scuba-api/app/Http/Controllers/Api/V1/CustomerAuthController.php`
- Customer login (separate from staff)
- Password reset
- Profile management

#### Step 2: Create Customer Portal Pages
**Files:**
- `sas-scuba-web/src/app/customer-portal/login/page.tsx`
- `sas-scuba-web/src/app/customer-portal/dashboard/page.tsx`
- `sas-scuba-web/src/app/customer-portal/my-dives/page.tsx`
- `sas-scuba-web/src/app/customer-portal/my-bookings/page.tsx`
- `sas-scuba-web/src/app/customer-portal/my-certifications/page.tsx`

#### Step 3: Create Components
**File:** `sas-scuba-web/src/components/customer-portal/CustomerDashboard.tsx`
- Overview of customer data
- Upcoming bookings
- Recent dives
- Certification status

---

## Implementation Priority Summary

### Phase 1 (High Priority - 2-3 months)
1. Digital Forms & Waivers
2. Online Booking Engine
3. Advanced Reporting & Analytics
4. Marketing & Communication Automation

### Phase 2 (Medium Priority - 3-4 months)
5. Point of Sale (POS)
6. Staff Scheduling & Payroll
7. Customer Portal
8. Multi-Language Support

### Phase 3 (Lower Priority - 4-6 months)
9. Advanced Dive Log Features
10. Mobile App Features
11. Integration Capabilities
12. Safety & Compliance Features

---

## General Implementation Guidelines

### Backend Patterns
- Use Service classes for business logic
- Implement authorization checks using `AuthorizesDiveCenterAccess` trait
- Use Form Requests for validation
- Create API Resources for consistent responses
- Use Queues for background jobs

### Frontend Patterns
- Use TypeScript for type safety
- Follow existing component structure
- Use React Hook Form + Zod for forms
- Implement loading states and error handling
- Follow responsive design patterns

### Testing
- Write unit tests for services
- Write feature tests for controllers
- Test authorization thoroughly
- Test multi-tenant isolation
