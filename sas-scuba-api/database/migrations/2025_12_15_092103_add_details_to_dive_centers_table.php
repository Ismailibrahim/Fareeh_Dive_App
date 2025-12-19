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
        Schema::table('dive_centers', function (Blueprint $table) {
            $table->string('email')->nullable()->after('legal_name');
            $table->string('phone')->nullable()->after('email');
            $table->string('website')->nullable()->after('phone');
            $table->text('address')->nullable()->after('website');
            $table->string('city')->nullable()->after('address');
            $table->string('state')->nullable()->after('city');
            $table->string('zip')->nullable()->after('state');
            $table->string('timezone')->nullable()->after('country');
            $table->string('currency')->nullable()->after('timezone');
            $table->string('logo')->nullable()->after('currency');
            $table->json('settings')->nullable()->after('logo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dive_centers', function (Blueprint $table) {
            $table->dropColumn([
                'email', 'phone', 'website', 'address', 'city', 
                'state', 'zip', 'timezone', 'currency', 'logo', 'settings'
            ]);
        });
    }
};
