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
        Schema::create('booking_excursions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignId('excursion_id')->constrained('excursions')->onDelete('cascade');
            $table->date('excursion_date')->nullable();
            $table->time('excursion_time')->nullable();
            $table->foreignId('price_list_item_id')->nullable()->constrained('price_list_items')->onDelete('set null');
            $table->decimal('price', 10, 2)->nullable();
            $table->enum('status', ['Scheduled', 'In Progress', 'Completed', 'Cancelled'])
                  ->default('Scheduled');
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->integer('number_of_participants')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_excursions');
    }
};
