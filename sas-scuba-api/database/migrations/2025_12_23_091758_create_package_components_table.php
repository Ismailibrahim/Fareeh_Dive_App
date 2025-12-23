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
        Schema::create('package_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained('packages')->onDelete('cascade');
            $table->enum('component_type', ['TRANSFER', 'ACCOMMODATION', 'DIVE', 'EXCURSION', 'MEAL', 'EQUIPMENT', 'OTHER'])->default('OTHER');
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->foreignId('item_id')->nullable()->constrained('price_list_items')->onDelete('set null')->comment('Links to price_list_items table');
            $table->decimal('unit_price', 10, 2);
            $table->integer('quantity')->default(1);
            $table->string('unit', 50)->default('unit');
            $table->decimal('total_price', 10, 2)->comment('unit_price * quantity');
            $table->boolean('is_inclusive')->default(true)->comment('Included in package price');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['package_id', 'component_type', 'sort_order'], 'idx_package_components');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_components');
    }
};
