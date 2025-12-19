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
        Schema::table('customer_certifications', function (Blueprint $table) {
            if (Schema::hasColumn('customer_certifications', 'file_path')) {
                $table->dropColumn('file_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_certifications', function (Blueprint $table) {
            if (!Schema::hasColumn('customer_certifications', 'file_path')) {
                $table->string('file_path')->nullable()->after('file_url');
            }
        });
    }
};

