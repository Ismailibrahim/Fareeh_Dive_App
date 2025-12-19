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
        Schema::table('instructors', function (Blueprint $table) {
            // Add insurance_provider_contact_no if it doesn't exist
            if (!Schema::hasColumn('instructors', 'insurance_provider_contact_no')) {
                $table->string('insurance_provider_contact_no')->nullable()->after('insurance_provider');
            }
            
            // Add insurance_type if it doesn't exist
            if (!Schema::hasColumn('instructors', 'insurance_type')) {
                $table->string('insurance_type')->nullable()->after('insurance_provider_contact_no');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('instructors', function (Blueprint $table) {
            if (Schema::hasColumn('instructors', 'insurance_provider_contact_no')) {
                $table->dropColumn('insurance_provider_contact_no');
            }
            if (Schema::hasColumn('instructors', 'insurance_type')) {
                $table->dropColumn('insurance_type');
            }
        });
    }
};

