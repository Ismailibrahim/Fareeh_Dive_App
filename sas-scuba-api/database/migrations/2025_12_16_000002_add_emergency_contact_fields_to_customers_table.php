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
        Schema::table('customers', function (Blueprint $table) {
            $table->string('emergency_contact_name')->nullable()->after('nationality');
            $table->string('emergency_contact_email')->nullable()->after('emergency_contact_name');
            $table->string('emergency_contact_phone_1')->nullable()->after('emergency_contact_email');
            $table->string('emergency_contact_phone_2')->nullable()->after('emergency_contact_phone_1');
            $table->string('emergency_contact_phone_3')->nullable()->after('emergency_contact_phone_2');
            $table->text('emergency_contact_address')->nullable()->after('emergency_contact_phone_3');
            $table->string('emergency_contact_relationship')->nullable()->after('emergency_contact_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'emergency_contact_name',
                'emergency_contact_email',
                'emergency_contact_phone_1',
                'emergency_contact_phone_2',
                'emergency_contact_phone_3',
                'emergency_contact_address',
                'emergency_contact_relationship',
            ]);
        });
    }
};

