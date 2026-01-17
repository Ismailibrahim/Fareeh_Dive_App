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
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('payment_method_id')->nullable()->after('invoice_id')->constrained('payment_methods')->onDelete('set null');
            $table->enum('method_type', ['Bank Transfer', 'Crypto', 'Credit Card', 'Wallet', 'Cash'])->nullable()->after('payment_method_id');
            $table->string('method_subtype')->nullable()->after('method_type');
            
            // Bank Transfer fields
            $table->string('tt_reference')->nullable()->after('method_subtype');
            $table->string('account_no')->nullable()->after('tt_reference');
            $table->string('bank_name')->nullable()->after('account_no');
            
            // Crypto fields
            $table->string('crypto_type')->nullable()->after('bank_name');
            $table->text('transaction_link')->nullable()->after('crypto_type');
            
            // Credit Card fields
            $table->string('card_type')->nullable()->after('transaction_link');
            $table->string('reference_number')->nullable()->after('card_type');
            
            // Wallet fields
            $table->string('wallet_type')->nullable()->after('reference_number');
            
            // Cash fields
            $table->string('currency')->nullable()->after('wallet_type');
            
            // Indexes
            $table->index('payment_method_id');
            $table->index('method_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('payments')) {
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            // Drop foreign key if it exists
            if (Schema::hasColumn('payments', 'payment_method_id')) {
                try {
                    $table->dropForeign(['payment_method_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
            }
            
            // Drop indexes if they exist
            try {
                $table->dropIndex(['payment_method_id']);
            } catch (\Exception $e) {
                // Index might not exist, continue
            }
            
            try {
                $table->dropIndex(['method_type']);
            } catch (\Exception $e) {
                // Index might not exist, continue
            }
            
            // Drop columns if they exist
            $columnsToDrop = [];
            $columns = [
                'payment_method_id',
                'method_type',
                'method_subtype',
                'tt_reference',
                'account_no',
                'bank_name',
                'crypto_type',
                'transaction_link',
                'card_type',
                'reference_number',
                'wallet_type',
                'currency',
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('payments', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
