# Digital Forms & Waivers - Complete Implementation Plan

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Integration Points](#integration-points)
6. [Security Considerations](#security-considerations)
7. [Testing Strategy](#testing-strategy)
8. [Implementation Timeline](#implementation-timeline)

---

## Overview

### Current State Analysis
- ✅ Basic file upload system exists (`FileUploadController`, `TenantFile` model)
- ✅ `customer_medical_forms` table exists (basic structure)
- ❌ No digital form builder
- ❌ No e-signature support
- ❌ No waiver management system
- ❌ No form expiration tracking
- ❌ No QR code check-in

### Goals
1. Create digital form builder for waiver templates
2. Implement e-signature capture and storage
3. Track form expiration and send automated reminders
4. Support multi-language forms
5. Generate QR codes for quick customer check-in
6. Integrate with existing customer and booking systems

---

## Database Schema

### Migration 1: Create Waivers Table
**File:** `sas-scuba-api/database/migrations/2025_XX_XX_create_waivers_table.php`

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('name'); // e.g., "Liability Release", "PADI Medical Questionnaire"
            $table->string('slug')->unique(); // URL-friendly identifier
            $table->enum('type', ['liability', 'medical', 'checklist', 'custom'])->default('custom');
            $table->text('description')->nullable();
            
            // Form content - supports HTML/rich text
            $table->longText('content'); // Main form content/template
            $table->json('fields')->nullable(); // Dynamic form fields configuration
            $table->json('translations')->nullable(); // Multi-language content
            
            // Configuration
            $table->boolean('requires_signature')->default(true);
            $table->integer('expiry_days')->nullable(); // Days until signature expires
            $table->boolean('require_witness')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            
            // QR Code settings
            $table->boolean('generate_qr_code')->default(false);
            $table->string('qr_code_url')->nullable();
            
            // Metadata
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['dive_center_id', 'is_active']);
            $table->index(['dive_center_id', 'type']);
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waivers');
    }
};
```

### Migration 2: Create Waiver Signatures Table
**File:** `sas-scuba-api/database/migrations/2025_XX_XX_create_waiver_signatures_table.php`

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waiver_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waiver_id')->constrained('waivers')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->onDelete('set null');
            
            // Signature data
            $table->text('signature_data'); // Base64 encoded signature image
            $table->string('signature_format')->default('png'); // png, svg, etc.
            $table->json('form_data')->nullable(); // Store form field responses
            
            // Signing context
            $table->foreignId('signed_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('witness_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('signed_at');
            
            // Expiration
            $table->date('expires_at')->nullable();
            $table->boolean('is_valid')->default(true);
            $table->timestamp('invalidated_at')->nullable();
            $table->text('invalidation_reason')->nullable();
            
            // Verification
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            $table->text('verification_notes')->nullable();
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['customer_id', 'waiver_id', 'is_valid']);
            $table->index(['customer_id', 'is_valid', 'expires_at']);
            $table->index(['booking_id']);
            $table->index(['waiver_id', 'is_valid']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waiver_signatures');
    }
};
```

### Migration 3: Create Waiver Reminders Table
**File:** `sas-scuba-api/database/migrations/2025_XX_XX_create_waiver_reminders_table.php`

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waiver_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waiver_signature_id')->constrained('waiver_signatures')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->enum('reminder_type', ['expiring_soon', 'expired', 'missing'])->default('expiring_soon');
            $table->enum('channel', ['email', 'sms', 'push'])->default('email');
            $table->timestamp('sent_at')->nullable();
            $table->boolean('is_sent')->default(false);
            $table->text('message')->nullable();
            $table->timestamps();
            
            $table->index(['customer_id', 'is_sent']);
            $table->index(['waiver_signature_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waiver_reminders');
    }
};
```

### Migration 4: Update Customer Medical Forms Table
**File:** `sas-scuba-api/database/migrations/2025_XX_XX_update_customer_medical_forms_table.php`

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_medical_forms', function (Blueprint $table) {
            $table->foreignId('waiver_signature_id')->nullable()->constrained('waiver_signatures')->onDelete('set null');
            $table->enum('status', ['draft', 'signed', 'expired', 'invalid'])->default('draft');
            $table->date('expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('customer_medical_forms', function (Blueprint $table) {
            $table->dropForeign(['waiver_signature_id']);
            $table->dropColumn(['waiver_signature_id', 'status', 'expires_at']);
        });
    }
};
```

---

## Backend Implementation

### Step 1: Create Models

#### Model: Waiver
**File:** `sas-scuba-api/app/Models/Waiver.php`

```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Waiver extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'dive_center_id',
        'name',
        'slug',
        'type',
        'description',
        'content',
        'fields',
        'translations',
        'requires_signature',
        'expiry_days',
        'require_witness',
        'is_active',
        'display_order',
        'generate_qr_code',
        'qr_code_url',
        'created_by',
    ];

    protected $casts = [
        'fields' => 'array',
        'translations' => 'array',
        'requires_signature' => 'boolean',
        'require_witness' => 'boolean',
        'is_active' => 'boolean',
        'generate_qr_code' => 'boolean',
        'expiry_days' => 'integer',
        'display_order' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($waiver) {
            if (empty($waiver->slug)) {
                $waiver->slug = Str::slug($waiver->name);
            }
        });
    }

    // Relationships
    public function diveCenter(): BelongsTo
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function signatures(): HasMany
    {
        return $this->hasMany(WaiverSignature::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForDiveCenter($query, int $diveCenterId)
    {
        return $query->where('dive_center_id', $diveCenterId);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // Helper methods
    public function getTranslation(string $locale, string $key, ?string $default = null): ?string
    {
        $translations = $this->translations ?? [];
        return $translations[$locale][$key] ?? $default ?? $this->{$key};
    }

    public function hasExpiry(): bool
    {
        return $this->expiry_days !== null && $this->expiry_days > 0;
    }
}
```

#### Model: WaiverSignature
**File:** `sas-scuba-api/app/Models/WaiverSignature.php`

```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class WaiverSignature extends Model
{
    protected $fillable = [
        'waiver_id',
        'customer_id',
        'booking_id',
        'signature_data',
        'signature_format',
        'form_data',
        'signed_by_user_id',
        'witness_user_id',
        'ip_address',
        'user_agent',
        'signed_at',
        'expires_at',
        'is_valid',
        'invalidated_at',
        'invalidation_reason',
        'verification_status',
        'verified_by',
        'verified_at',
        'verification_notes',
    ];

    protected $casts = [
        'form_data' => 'array',
        'signed_at' => 'datetime',
        'expires_at' => 'date',
        'is_valid' => 'boolean',
        'invalidated_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    // Relationships
    public function waiver(): BelongsTo
    {
        return $this->belongsTo(Waiver::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function signedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by_user_id');
    }

    public function witness(): BelongsTo
    {
        return $this->belongsTo(User::class, 'witness_user_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(WaiverReminder::class);
    }

    // Helper methods
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isValid(): bool
    {
        return $this->is_valid && !$this->isExpired();
    }

    public function daysUntilExpiry(): ?int
    {
        if (!$this->expires_at) {
            return null;
        }
        return max(0, now()->diffInDays($this->expires_at, false));
    }

    public function invalidate(string $reason): void
    {
        $this->update([
            'is_valid' => false,
            'invalidated_at' => now(),
            'invalidation_reason' => $reason,
        ]);
    }

    public function verify(int $userId, ?string $notes = null): void
    {
        $this->update([
            'verification_status' => 'verified',
            'verified_by' => $userId,
            'verified_at' => now(),
            'verification_notes' => $notes,
        ]);
    }
}
```

#### Model: WaiverReminder
**File:** `sas-scuba-api/app/Models/WaiverReminder.php`

```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaiverReminder extends Model
{
    protected $fillable = [
        'waiver_signature_id',
        'customer_id',
        'reminder_type',
        'channel',
        'sent_at',
        'is_sent',
        'message',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'is_sent' => 'boolean',
    ];

    public function signature(): BelongsTo
    {
        return $this->belongsTo(WaiverSignature::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function markAsSent(): void
    {
        $this->update([
            'is_sent' => true,
            'sent_at' => now(),
        ]);
    }
}
```

### Step 2: Create Form Request Classes

#### StoreWaiverRequest
**File:** `sas-scuba-api/app/Http/Requests/StoreWaiverRequest.php`

```php
<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWaiverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled in controller
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:waivers,slug'],
            'type' => ['required', 'in:liability,medical,checklist,custom'],
            'description' => ['nullable', 'string', 'max:1000'],
            'content' => ['required', 'string'],
            'fields' => ['nullable', 'array'],
            'translations' => ['nullable', 'array'],
            'requires_signature' => ['boolean'],
            'expiry_days' => ['nullable', 'integer', 'min:1', 'max:3650'], // Max 10 years
            'require_witness' => ['boolean'],
            'is_active' => ['boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'generate_qr_code' => ['boolean'],
        ];
    }
}
```

#### StoreWaiverSignatureRequest
**File:** `sas-scuba-api/app/Http/Requests/StoreWaiverSignatureRequest.php`

```php
<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWaiverSignatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'waiver_id' => ['required', 'exists:waivers,id'],
            'customer_id' => ['required', 'exists:customers,id'],
            'booking_id' => ['nullable', 'exists:bookings,id'],
            'signature_data' => ['required', 'string'], // Base64 encoded
            'signature_format' => ['nullable', 'in:png,svg,jpg'],
            'form_data' => ['nullable', 'array'],
            'witness_user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
```

### Step 3: Create Service Classes

#### WaiverService
**File:** `sas-scuba-api/app/Services/WaiverService.php`

```php
<?php
namespace App\Services;

use App\Models\Waiver;
use App\Models\WaiverSignature;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WaiverService
{
    public function createWaiver(array $data, int $diveCenterId, ?int $userId = null): Waiver
    {
        return DB::transaction(function () use ($data, $diveCenterId, $userId) {
            $waiver = Waiver::create([
                'dive_center_id' => $diveCenterId,
                'name' => $data['name'],
                'slug' => $data['slug'] ?? Str::slug($data['name']),
                'type' => $data['type'],
                'description' => $data['description'] ?? null,
                'content' => $data['content'],
                'fields' => $data['fields'] ?? null,
                'translations' => $data['translations'] ?? null,
                'requires_signature' => $data['requires_signature'] ?? true,
                'expiry_days' => $data['expiry_days'] ?? null,
                'require_witness' => $data['require_witness'] ?? false,
                'is_active' => $data['is_active'] ?? true,
                'display_order' => $data['display_order'] ?? 0,
                'generate_qr_code' => $data['generate_qr_code'] ?? false,
                'created_by' => $userId,
            ]);

            // Generate QR code if requested
            if ($waiver->generate_qr_code) {
                $this->generateQrCode($waiver);
            }

            return $waiver;
        });
    }

    public function createSignature(
        int $waiverId,
        int $customerId,
        string $signatureData,
        ?int $userId = null,
        ?int $bookingId = null,
        ?array $formData = null,
        ?int $witnessUserId = null
    ): WaiverSignature {
        $waiver = Waiver::findOrFail($waiverId);
        
        // Calculate expiry date
        $expiresAt = $waiver->expiry_days 
            ? now()->addDays($waiver->expiry_days)
            : null;

        return WaiverSignature::create([
            'waiver_id' => $waiverId,
            'customer_id' => $customerId,
            'booking_id' => $bookingId,
            'signature_data' => $signatureData,
            'signature_format' => 'png', // Default
            'form_data' => $formData,
            'signed_by_user_id' => $userId,
            'witness_user_id' => $witnessUserId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'signed_at' => now(),
            'expires_at' => $expiresAt,
            'is_valid' => true,
            'verification_status' => 'pending',
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
            return [
                'status' => 'missing',
                'message' => 'Waiver not signed',
                'signature' => null,
            ];
        }

        if ($signature->isExpired()) {
            return [
                'status' => 'expired',
                'message' => 'Waiver expired',
                'expired_at' => $signature->expires_at,
                'signature' => $signature,
            ];
        }

        $daysUntilExpiry = $signature->daysUntilExpiry();

        return [
            'status' => 'valid',
            'message' => 'Waiver is valid',
            'signed_at' => $signature->signed_at,
            'expires_at' => $signature->expires_at,
            'days_until_expiry' => $daysUntilExpiry,
            'signature' => $signature,
        ];
    }

    public function getRequiredWaiversForCustomer(int $customerId, int $diveCenterId): array
    {
        $waivers = Waiver::forDiveCenter($diveCenterId)
            ->active()
            ->orderBy('display_order')
            ->get();

        $requiredWaivers = [];
        
        foreach ($waivers as $waiver) {
            $status = $this->checkCustomerWaiverStatus($customerId, $waiver->id);
            $requiredWaivers[] = [
                'waiver' => $waiver,
                'status' => $status['status'],
                'signature' => $status['signature'],
            ];
        }

        return $requiredWaivers;
    }

    private function generateQrCode(Waiver $waiver): void
    {
        // Implementation using SimpleSoftwareIO/simple-qrcode
        $url = route('waivers.public.show', ['slug' => $waiver->slug]);
        // Generate QR code and store URL
        // This will be implemented with QR code library
    }
}
```

#### WaiverReminderService
**File:** `sas-scuba-api/app/Services/WaiverReminderService.php`

```php
<?php
namespace App\Services;

use App\Models\WaiverSignature;
use App\Models\WaiverReminder;
use App\Services\NotificationService;
use Carbon\Carbon;

class WaiverReminderService
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function checkAndSendExpiringReminders(int $daysBeforeExpiry = 30): void
    {
        $expiryDate = now()->addDays($daysBeforeExpiry);
        
        $signatures = WaiverSignature::where('is_valid', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $expiryDate)
            ->where('expires_at', '>', now())
            ->with(['customer', 'waiver'])
            ->get();

        foreach ($signatures as $signature) {
            $this->sendExpiringReminder($signature);
        }
    }

    public function checkAndSendExpiredReminders(): void
    {
        $signatures = WaiverSignature::where('is_valid', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->with(['customer', 'waiver'])
            ->get();

        foreach ($signatures as $signature) {
            $this->sendExpiredReminder($signature);
            // Optionally invalidate expired signatures
            $signature->invalidate('Automatically expired');
        }
    }

    private function sendExpiringReminder(WaiverSignature $signature): void
    {
        // Check if reminder already sent
        $existingReminder = WaiverReminder::where('waiver_signature_id', $signature->id)
            ->where('reminder_type', 'expiring_soon')
            ->where('is_sent', true)
            ->exists();

        if ($existingReminder) {
            return;
        }

        $reminder = WaiverReminder::create([
            'waiver_signature_id' => $signature->id,
            'customer_id' => $signature->customer_id,
            'reminder_type' => 'expiring_soon',
            'channel' => 'email',
        ]);

        // Send notification
        $this->notificationService->sendWaiverExpiringReminder(
            $signature->customer,
            $signature->waiver,
            $signature->expires_at
        );

        $reminder->markAsSent();
    }

    private function sendExpiredReminder(WaiverSignature $signature): void
    {
        $reminder = WaiverReminder::create([
            'waiver_signature_id' => $signature->id,
            'customer_id' => $signature->customer_id,
            'reminder_type' => 'expired',
            'channel' => 'email',
        ]);

        $this->notificationService->sendWaiverExpiredReminder(
            $signature->customer,
            $signature->waiver
        );

        $reminder->markAsSent();
    }
}
```

### Step 4: Create Controllers

#### WaiverController
**File:** `sas-scuba-api/app/Http/Controllers/Api/V1/WaiverController.php`

```php
<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Http\Requests\StoreWaiverRequest;
use App\Models\Waiver;
use App\Services\WaiverService;
use Illuminate\Http\Request;

class WaiverController extends Controller
{
    use AuthorizesDiveCenterAccess;

    public function __construct(
        private WaiverService $waiverService
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $waivers = Waiver::forDiveCenter($user->dive_center_id)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $waivers,
        ]);
    }

    public function store(StoreWaiverRequest $request)
    {
        $user = $request->user();
        $waiver = $this->waiverService->createWaiver(
            $request->validated(),
            $user->dive_center_id,
            $user->id
        );

        return response()->json([
            'success' => true,
            'data' => $waiver,
        ], 201);
    }

    public function show(Request $request, Waiver $waiver)
    {
        $this->authorizeDiveCenterAccess($waiver);
        
        return response()->json([
            'success' => true,
            'data' => $waiver->load(['diveCenter', 'creator']),
        ]);
    }

    public function update(StoreWaiverRequest $request, Waiver $waiver)
    {
        $this->authorizeDiveCenterAccess($waiver);
        
        $waiver->update($request->validated());

        return response()->json([
            'success' => true,
            'data' => $waiver,
        ]);
    }

    public function destroy(Request $request, Waiver $waiver)
    {
        $this->authorizeDiveCenterAccess($waiver);
        
        // Check if waiver has signatures
        if ($waiver->signatures()->exists()) {
            // Soft delete instead
            $waiver->delete();
            return response()->json([
                'success' => true,
                'message' => 'Waiver archived (has existing signatures)',
            ]);
        }

        $waiver->forceDelete();
        return response()->json([
            'success' => true,
            'message' => 'Waiver deleted',
        ]);
    }
}
```

#### WaiverSignatureController
**File:** `sas-scuba-api/app/Http/Controllers/Api/V1/WaiverSignatureController.php`

```php
<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Http\Requests\StoreWaiverSignatureRequest;
use App\Models\WaiverSignature;
use App\Services\WaiverService;
use Illuminate\Http\Request;

class WaiverSignatureController extends Controller
{
    use AuthorizesDiveCenterAccess;

    public function __construct(
        private WaiverService $waiverService
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $query = WaiverSignature::whereHas('waiver', function ($q) use ($user) {
            $q->where('dive_center_id', $user->dive_center_id);
        })
        ->with(['waiver', 'customer', 'signedBy']);

        // Filters
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->has('waiver_id')) {
            $query->where('waiver_id', $request->waiver_id);
        }
        if ($request->has('is_valid')) {
            $query->where('is_valid', $request->boolean('is_valid'));
        }
        if ($request->has('expired')) {
            if ($request->boolean('expired')) {
                $query->whereNotNull('expires_at')
                    ->where('expires_at', '<', now());
            } else {
                $query->where(function ($q) {
                    $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>=', now());
                });
            }
        }

        $signatures = $query->latest('signed_at')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $signatures,
        ]);
    }

    public function store(StoreWaiverSignatureRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        // Verify waiver belongs to dive center
        $waiver = \App\Models\Waiver::findOrFail($validated['waiver_id']);
        $this->authorizeDiveCenterAccess($waiver);

        // Verify customer belongs to dive center
        $customer = \App\Models\Customer::findOrFail($validated['customer_id']);
        $this->authorizeDiveCenterAccess($customer);

        $signature = $this->waiverService->createSignature(
            $validated['waiver_id'],
            $validated['customer_id'],
            $validated['signature_data'],
            $user->id,
            $validated['booking_id'] ?? null,
            $validated['form_data'] ?? null,
            $validated['witness_user_id'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => $signature->load(['waiver', 'customer']),
        ], 201);
    }

    public function show(Request $request, WaiverSignature $signature)
    {
        $this->authorizeDiveCenterAccess($signature->waiver);
        
        return response()->json([
            'success' => true,
            'data' => $signature->load(['waiver', 'customer', 'signedBy', 'witness']),
        ]);
    }

    public function verify(Request $request, WaiverSignature $signature)
    {
        $this->authorizeDiveCenterAccess($signature->waiver);
        
        $request->validate([
            'status' => 'required|in:verified,rejected',
            'notes' => 'nullable|string',
        ]);

        if ($request->status === 'verified') {
            $signature->verify($request->user()->id, $request->notes);
        } else {
            $signature->update([
                'verification_status' => 'rejected',
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
                'verification_notes' => $request->notes,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $signature,
        ]);
    }

    public function invalidate(Request $request, WaiverSignature $signature)
    {
        $this->authorizeDiveCenterAccess($signature->waiver);
        
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $signature->invalidate($request->reason);

        return response()->json([
            'success' => true,
            'message' => 'Signature invalidated',
        ]);
    }
}
```

### Step 5: Create Scheduled Jobs

#### SendWaiverRemindersJob
**File:** `sas-scuba-api/app/Jobs/SendWaiverRemindersJob.php`

```php
<?php
namespace App\Jobs;

use App\Services\WaiverReminderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWaiverRemindersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(WaiverReminderService $reminderService): void
    {
        // Check for expiring waivers (30 days before expiry)
        $reminderService->checkAndSendExpiringReminders(30);
        
        // Check for expired waivers
        $reminderService->checkAndSendExpiredReminders();
    }
}
```

### Step 6: Add Routes

**File:** `sas-scuba-api/routes/api.php`

```php
// Add to existing routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Waivers
    Route::apiResource('waivers', WaiverController::class);
    
    // Waiver Signatures
    Route::apiResource('waiver-signatures', WaiverSignatureController::class);
    Route::post('waiver-signatures/{signature}/verify', [WaiverSignatureController::class, 'verify']);
    Route::post('waiver-signatures/{signature}/invalidate', [WaiverSignatureController::class, 'invalidate']);
    
    // Customer waiver status
    Route::get('customers/{customer}/waivers/status', [WaiverSignatureController::class, 'getCustomerWaiverStatus']);
    Route::get('customers/{customer}/waivers/required', [WaiverSignatureController::class, 'getRequiredWaivers']);
});
```

### Step 7: Schedule Jobs

**File:** `sas-scuba-api/app/Console/Kernel.php`

```php
protected function schedule(Schedule $schedule)
{
    // Send waiver reminders daily at 9 AM
    $schedule->job(new SendWaiverRemindersJob)->dailyAt('09:00');
}
```

---

## Frontend Implementation

### Step 1: Create TypeScript Interfaces

**File:** `sas-scuba-web/src/lib/api/services/waiver.service.ts`

```typescript
import api from '../axios';

export interface Waiver {
    id: number;
    dive_center_id: number;
    name: string;
    slug: string;
    type: 'liability' | 'medical' | 'checklist' | 'custom';
    description?: string;
    content: string;
    fields?: FormField[];
    translations?: Record<string, Record<string, string>>;
    requires_signature: boolean;
    expiry_days?: number;
    require_witness: boolean;
    is_active: boolean;
    display_order: number;
    generate_qr_code: boolean;
    qr_code_url?: string;
    created_by?: number;
    created_at: string;
    updated_at: string;
}

export interface FormField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number';
    label: string;
    name: string;
    required?: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}

export interface WaiverSignature {
    id: number;
    waiver_id: number;
    customer_id: number;
    booking_id?: number;
    signature_data: string;
    signature_format: string;
    form_data?: Record<string, any>;
    signed_by_user_id?: number;
    witness_user_id?: number;
    ip_address?: string;
    user_agent?: string;
    signed_at: string;
    expires_at?: string;
    is_valid: boolean;
    invalidated_at?: string;
    invalidation_reason?: string;
    verification_status: 'pending' | 'verified' | 'rejected';
    verified_by?: number;
    verified_at?: string;
    verification_notes?: string;
    waiver?: Waiver;
    customer?: Customer;
}

export interface WaiverStatus {
    status: 'missing' | 'expired' | 'valid';
    message: string;
    signed_at?: string;
    expires_at?: string;
    days_until_expiry?: number;
    signature?: WaiverSignature;
}

export const waiverService = {
    getAll: () => api.get<{ success: boolean; data: Waiver[] }>('/waivers'),
    
    getById: (id: number) => 
        api.get<{ success: boolean; data: Waiver }>(`/waivers/${id}`),
    
    create: (data: Partial<Waiver>) => 
        api.post<{ success: boolean; data: Waiver }>('/waivers', data),
    
    update: (id: number, data: Partial<Waiver>) => 
        api.put<{ success: boolean; data: Waiver }>(`/waivers/${id}`, data),
    
    delete: (id: number) => 
        api.delete<{ success: boolean; message: string }>(`/waivers/${id}`),
    
    // Signatures
    getSignatures: (params?: {
        customer_id?: number;
        waiver_id?: number;
        is_valid?: boolean;
        expired?: boolean;
    }) => api.get<{ success: boolean; data: { data: WaiverSignature[] } }>(
        '/waiver-signatures',
        { params }
    ),
    
    createSignature: (data: {
        waiver_id: number;
        customer_id: number;
        signature_data: string;
        booking_id?: number;
        form_data?: Record<string, any>;
        witness_user_id?: number;
    }) => api.post<{ success: boolean; data: WaiverSignature }>(
        '/waiver-signatures',
        data
    ),
    
    verifySignature: (signatureId: number, status: 'verified' | 'rejected', notes?: string) =>
        api.post<{ success: boolean; data: WaiverSignature }>(
            `/waiver-signatures/${signatureId}/verify`,
            { status, notes }
        ),
    
    invalidateSignature: (signatureId: number, reason: string) =>
        api.post<{ success: boolean; message: string }>(
            `/waiver-signatures/${signatureId}/invalidate`,
            { reason }
        ),
    
    getCustomerWaiverStatus: (customerId: number, waiverId: number) =>
        api.get<{ success: boolean; data: WaiverStatus }>(
            `/customers/${customerId}/waivers/status?waiver_id=${waiverId}`
        ),
    
    getRequiredWaivers: (customerId: number) =>
        api.get<{ success: boolean; data: Array<{ waiver: Waiver; status: WaiverStatus; signature?: WaiverSignature }> }>(
            `/customers/${customerId}/waivers/required`
        ),
};
```

### Step 2: Create Components

#### WaiverForm Component
**File:** `sas-scuba-web/src/components/waivers/WaiverForm.tsx`

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { waiverService, Waiver } from "@/lib/api/services/waiver.service";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Lazy load rich text editor
const RichTextEditor = dynamic(() => import("@/components/ui/rich-text-editor"), {
    ssr: false,
});

const waiverSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().optional(),
    type: z.enum(["liability", "medical", "checklist", "custom"]),
    description: z.string().optional(),
    content: z.string().min(1, "Content is required"),
    fields: z.array(z.any()).optional(),
    requires_signature: z.boolean().default(true),
    expiry_days: z.number().min(1).max(3650).optional(),
    require_witness: z.boolean().default(false),
    is_active: z.boolean().default(true),
    display_order: z.number().default(0),
    generate_qr_code: z.boolean().default(false),
});

type WaiverFormData = z.infer<typeof waiverSchema>;

interface WaiverFormProps {
    initialData?: Waiver;
    waiverId?: number;
}

export function WaiverForm({ initialData, waiverId }: WaiverFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<WaiverFormData>({
        resolver: zodResolver(waiverSchema),
        defaultValues: initialData || {
            type: "custom",
            requires_signature: true,
            require_witness: false,
            is_active: true,
            display_order: 0,
            generate_qr_code: false,
        },
    });

    const onSubmit = async (data: WaiverFormData) => {
        setIsSubmitting(true);
        try {
            if (waiverId) {
                await waiverService.update(waiverId, data);
                toast.success("Waiver updated successfully");
            } else {
                await waiverService.create(data);
                toast.success("Waiver created successfully");
            }
            router.push("/dashboard/waivers");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save waiver");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Form fields implementation */}
            <div className="grid gap-4">
                <div>
                    <Label htmlFor="name">Waiver Name *</Label>
                    <Input
                        id="name"
                        {...register("name")}
                        error={errors.name?.message}
                    />
                </div>

                <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select
                        value={watch("type")}
                        onValueChange={(value) => setValue("type", value as any)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="liability">Liability Release</SelectItem>
                            <SelectItem value="medical">Medical Questionnaire</SelectItem>
                            <SelectItem value="checklist">Pre-Dive Checklist</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="content">Content *</Label>
                    <RichTextEditor
                        value={watch("content")}
                        onChange={(value) => setValue("content", value)}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="requires_signature"
                        checked={watch("requires_signature")}
                        onCheckedChange={(checked) => setValue("requires_signature", checked)}
                    />
                    <Label htmlFor="requires_signature">Requires Signature</Label>
                </div>

                {watch("requires_signature") && (
                    <div>
                        <Label htmlFor="expiry_days">Expiry Days (optional)</Label>
                        <Input
                            id="expiry_days"
                            type="number"
                            {...register("expiry_days", { valueAsNumber: true })}
                            placeholder="e.g., 365 for 1 year"
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : waiverId ? "Update" : "Create"} Waiver
                </Button>
            </div>
        </form>
    );
}
```

#### DigitalSignature Component
**File:** `sas-scuba-web/src/components/waivers/DigitalSignature.tsx`

```typescript
"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DigitalSignatureProps {
    onSignatureChange?: (signatureData: string | null) => void;
    initialSignature?: string;
    width?: number;
    height?: number;
}

export function DigitalSignature({
    onSignatureChange,
    initialSignature,
    width = 600,
    height = 200,
}: DigitalSignatureProps) {
    const sigPadRef = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const handleEnd = () => {
        if (sigPadRef.current) {
            const dataURL = sigPadRef.current.toDataURL("image/png");
            setIsEmpty(sigPadRef.current.isEmpty());
            onSignatureChange?.(dataURL);
        }
    };

    const handleClear = () => {
        if (sigPadRef.current) {
            sigPadRef.current.clear();
            setIsEmpty(true);
            onSignatureChange?.(null);
        }
    };

    return (
        <Card className="p-4">
            <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                    Please sign in the box below
                </p>
            </div>
            <div className="border-2 border-dashed rounded-lg overflow-hidden">
                <SignatureCanvas
                    ref={sigPadRef}
                    canvasProps={{
                        width,
                        height,
                        className: "signature-canvas",
                    }}
                    onEnd={handleEnd}
                />
            </div>
            {initialSignature && (
                <div className="mt-4">
                    <img
                        src={initialSignature}
                        alt="Signature"
                        className="border rounded"
                    />
                </div>
            )}
            <div className="mt-4 flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    disabled={isEmpty}
                >
                    Clear
                </Button>
            </div>
        </Card>
    );
}
```

#### WaiverSigningForm Component
**File:** `sas-scuba-web/src/components/waivers/WaiverSigningForm.tsx`

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { waiverService, Waiver, Customer } from "@/lib/api/services/waiver.service";
import { DigitalSignature } from "./DigitalSignature";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface WaiverSigningFormProps {
    waiver: Waiver;
    customerId?: number;
    bookingId?: number;
    onSuccess?: () => void;
}

export function WaiverSigningForm({
    waiver,
    customerId,
    bookingId,
    onSuccess,
}: WaiverSigningFormProps) {
    const router = useRouter();
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(customerId);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!signatureData) {
            toast.error("Please provide a signature");
            return;
        }

        if (!selectedCustomerId) {
            toast.error("Please select a customer");
            return;
        }

        setIsSubmitting(true);
        try {
            await waiverService.createSignature({
                waiver_id: waiver.id,
                customer_id: selectedCustomerId,
                signature_data: signatureData,
                booking_id: bookingId,
            });
            toast.success("Waiver signed successfully");
            onSuccess?.();
            router.push(`/dashboard/customers/${selectedCustomerId}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to sign waiver");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">{waiver.name}</h2>
                {waiver.description && (
                    <p className="text-muted-foreground mt-2">{waiver.description}</p>
                )}
            </div>

            <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: waiver.content }}
            />

            {waiver.requires_signature && (
                <>
                    <DigitalSignature
                        onSignatureChange={setSignatureData}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={!signatureData || isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? "Signing..." : "Sign Waiver"}
                    </Button>
                </>
            )}
        </div>
    );
}
```

### Step 3: Create Pages

#### Waivers List Page
**File:** `sas-scuba-web/src/app/dashboard/waivers/page.tsx`

```typescript
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { WaiversList } from "@/components/waivers/WaiversList";
import { PageLoader } from "@/components/ui/page-loader";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function WaiversPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header
                title="Waivers"
                actions={
                    <Link href="/dashboard/waivers/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Waiver
                        </Button>
                    </Link>
                }
            />
            <div className="p-8">
                <Suspense fallback={<PageLoader />}>
                    <WaiversList />
                </Suspense>
            </div>
        </div>
    );
}
```

#### Create/Edit Waiver Page
**File:** `sas-scuba-web/src/app/dashboard/waivers/[id]/edit/page.tsx`

```typescript
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { WaiverForm } from "@/components/waivers/WaiverForm";
import { PageLoader } from "@/components/ui/page-loader";
import { waiverService } from "@/lib/api/services/waiver.service";

export default async function EditWaiverPage({
    params,
}: {
    params: { id: string };
}) {
    const waiver = await waiverService.getById(Number(params.id));

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Edit Waiver" />
            <div className="p-8">
                <Suspense fallback={<PageLoader />}>
                    <WaiverForm initialData={waiver.data} waiverId={waiver.data.id} />
                </Suspense>
            </div>
        </div>
    );
}
```

---

## Integration Points

### 1. Customer Management Integration
- Add waiver status badge to customer detail page
- Show required waivers in customer profile
- Link to sign waivers from customer page

### 2. Booking Integration
- Check waiver status before allowing booking completion
- Require waivers to be signed before dive
- Show waiver status in booking details

### 3. File Upload Integration
- Use existing `FileUploadController` for waiver attachments
- Store signature images using `TenantFile` model
- Add 'waiver-signature' to file categories

---

## Security Considerations

1. **Signature Validation**: Verify signature data format before storage
2. **Access Control**: Ensure users can only access waivers from their dive center
3. **IP Tracking**: Store IP address for audit trail
4. **Expiration**: Automatically invalidate expired signatures
5. **Witness Requirement**: Enforce witness requirement when configured
6. **Data Encryption**: Consider encrypting signature data at rest

---

## Testing Strategy

### Backend Tests
- Unit tests for `WaiverService`
- Unit tests for `WaiverReminderService`
- Feature tests for controllers
- Test authorization checks
- Test expiration logic

### Frontend Tests
- Component tests for `WaiverForm`
- Component tests for `DigitalSignature`
- Integration tests for signing flow
- E2E tests for complete waiver workflow

---

## Implementation Timeline

### Week 1: Database & Backend Foundation
- Day 1-2: Create migrations and models
- Day 3-4: Implement services
- Day 5: Create controllers and routes

### Week 2: Frontend Core Components
- Day 1-2: Create TypeScript interfaces and service
- Day 3-4: Build waiver form components
- Day 5: Build signature component

### Week 3: Integration & Features
- Day 1-2: Integrate with customer management
- Day 3: Add QR code functionality
- Day 4: Implement reminder system
- Day 5: Testing and bug fixes

### Week 4: Polish & Documentation
- Day 1-2: UI/UX improvements
- Day 3: Write documentation
- Day 4-5: Final testing and deployment

---

## Dependencies

### Backend
```bash
composer require simplesoftwareio/simple-qrcode
```

### Frontend
```bash
npm install react-signature-canvas
npm install @types/react-signature-canvas
npm install qrcode.react
```

---

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Create feature branch: `feature/digital-forms-waivers`
4. Begin implementation following the timeline
5. Regular code reviews and testing
6. Deploy to staging for testing
7. Deploy to production
