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
        Schema::create('package_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_number', 50)->unique();
            $table->foreignId('package_id')->constrained('packages')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->integer('persons_count')->default(1);
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('total_price', 10, 2);
            $table->enum('status', ['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'COMPLETED'])->default('PENDING');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['package_id', 'status'], 'idx_package_booking_status');
            $table->index(['customer_id', 'status'], 'idx_customer_booking_status');
            $table->index(['dive_center_id', 'status'], 'idx_dive_center_booking_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_bookings');
    }
};
