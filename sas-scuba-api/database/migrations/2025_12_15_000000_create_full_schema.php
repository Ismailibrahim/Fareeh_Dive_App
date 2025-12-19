<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Core Tables (No Dependencies)
        Schema::create('dive_centers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('legal_name')->nullable();
            $table->string('country')->nullable();
            $table->enum('status', ['Active', 'Suspended'])->default('Active');
            $table->timestamps();
        });

        // 2. Users (Depends on Dive Centers)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('password')->nullable(); // Added for Laravel Auth
            $table->string('phone')->nullable();
            $table->enum('role', ['Admin', 'Instructor', 'DiveMaster', 'Agent']);
            $table->boolean('active')->default(true);
            $table->rememberToken(); // Laravel Auth
            $table->timestamp('email_verified_at')->nullable(); // Laravel Auth
            $table->timestamps();
        });

        // Password Reset Tokens (Laravel Standard)
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Sessions (Laravel Standard)
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
        
        // Cache (Laravel Standard)
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        // Personal Access Tokens (Sanctum)
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // 3. Customers (Depends on Dive Centers)
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('full_name');
            $table->string('passport_no')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('nationality')->nullable();
            $table->timestamps();
        });

        // 4. Assets & Logistics (Depends on Dive Centers)
        Schema::create('boats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('name');
            $table->integer('capacity')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('dive_sites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('name');
            $table->integer('max_depth')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('name')->nullable();
            $table->string('category')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('equipment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained('equipment')->onDelete('cascade');
            $table->string('size')->nullable();
            $table->string('serial_no')->nullable();
            $table->enum('status', ['Available', 'Rented', 'Maintenance'])->default('Available');
            $table->timestamps();
        });

        // 5. Operations (Bookings, Dives)
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->date('booking_date')->nullable();
            $table->enum('status', ['Pending', 'Confirmed', 'Completed', 'Cancelled'])->default('Pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('booking_dives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignId('dive_site_id')->constrained('dive_sites')->onDelete('cascade');
            $table->foreignId('boat_id')->nullable()->constrained('boats')->onDelete('set null');
            $table->date('dive_date')->nullable();
            $table->time('dive_time')->nullable();
            $table->timestamps();
        });

        Schema::create('booking_instructors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_dive_id')->constrained('booking_dives')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('role')->nullable();
        });

        Schema::create('booking_equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignId('equipment_item_id')->constrained('equipment_items')->onDelete('cascade');
            $table->decimal('price', 10, 2)->default(0);
        });

        // 6. Finance (Invoices, Payments, Commissions)
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->string('invoice_no')->unique()->nullable();
            $table->date('invoice_date')->nullable();
            $table->decimal('subtotal', 10, 2)->nullable();
            $table->decimal('tax', 10, 2)->nullable();
            $table->decimal('total', 10, 2)->nullable();
            $table->string('currency')->nullable();
            $table->enum('status', ['Draft', 'Paid', 'Partially Paid', 'Refunded'])->default('Draft');
            $table->timestamps();
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->string('description')->nullable();
            $table->integer('quantity')->nullable();
            $table->decimal('unit_price', 10, 2)->nullable();
            $table->decimal('total', 10, 2)->nullable();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->date('payment_date')->nullable();
            $table->decimal('amount', 10, 2)->nullable();
            $table->enum('payment_type', ['Advance', 'Final', 'Refund'])->nullable();
            $table->enum('method', ['Cash', 'Card', 'Bank'])->nullable();
            $table->string('reference')->nullable();
            $table->timestamps();
        });

        Schema::create('commission_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->enum('applies_to', ['Booking', 'Dive'])->nullable();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->date('active_from')->nullable();
            $table->date('active_to')->nullable();
            $table->timestamps();
        });

        Schema::create('commission_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('commission_percentage', 5, 2)->nullable();
            $table->decimal('commission_amount', 10, 2)->nullable();
        });

        // 7. Documents & Forms
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('entity_type')->nullable(); // e.g., 'App\Models\Customer'
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('document_type')->nullable();
            $table->string('file_path')->nullable();
            $table->date('expiry_date')->nullable();
            $table->timestamps();
        });

        Schema::create('customer_certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->string('certification_name')->nullable();
            $table->string('certification_no')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamps();
        });

        Schema::create('customer_medical_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->string('form_type')->nullable();
            $table->string('file_path')->nullable();
            $table->date('signed_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_medical_forms');
        Schema::dropIfExists('customer_certifications');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('commission_entries');
        Schema::dropIfExists('commission_rules');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('booking_equipment');
        Schema::dropIfExists('booking_instructors');
        Schema::dropIfExists('booking_dives');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('equipment_items');
        Schema::dropIfExists('equipment');
        Schema::dropIfExists('dive_sites');
        Schema::dropIfExists('boats');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('dive_centers');
    }
};
