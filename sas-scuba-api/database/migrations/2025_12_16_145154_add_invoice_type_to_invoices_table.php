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
        Schema::table('invoices', function (Blueprint $table) {
            $table->enum('invoice_type', ['Advance', 'Final', 'Full'])->default('Full')->after('status');
            $table->foreignId('related_invoice_id')->nullable()->after('invoice_type')
                  ->constrained('invoices')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('invoices')) {
            return;
        }

        Schema::table('invoices', function (Blueprint $table) {
            $columnsToDrop = [];
            
            if (Schema::hasColumn('invoices', 'related_invoice_id')) {
                try {
                    $table->dropForeign(['related_invoice_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
                $columnsToDrop[] = 'related_invoice_id';
            }
            
            if (Schema::hasColumn('invoices', 'invoice_type')) {
                $columnsToDrop[] = 'invoice_type';
            }
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};

