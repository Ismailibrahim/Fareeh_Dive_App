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
        Schema::create('package_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained('packages')->onDelete('cascade');
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->foreignId('item_id')->nullable()->constrained('price_list_items')->onDelete('set null');
            $table->decimal('price', 10, 2);
            $table->string('unit', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('max_quantity')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['package_id', 'is_active'], 'idx_package_options');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_options');
    }
};
