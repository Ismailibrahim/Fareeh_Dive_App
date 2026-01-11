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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('restrict');
            $table->foreignId('expense_category_id')->constrained('expense_categories')->onDelete('restrict');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('expense_no')->nullable()->unique();
            $table->date('expense_date');
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->boolean('is_recurring')->default(false);
            $table->enum('recurring_period', ['Weekly', 'Monthly', 'Quarterly', 'Yearly'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('dive_center_id');
            $table->index('supplier_id');
            $table->index('expense_category_id');
            $table->index('expense_date');
            $table->index('expense_no');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
