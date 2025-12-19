<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate existing emergency contact data from customers table to emergency_contacts table
        if (Schema::hasColumn('customers', 'emergency_contact_name')) {
            $customers = DB::table('customers')
                ->whereNotNull('emergency_contact_name')
                ->orWhereNotNull('emergency_contact_email')
                ->orWhereNotNull('emergency_contact_phone_1')
                ->get();

            foreach ($customers as $customer) {
                if ($customer->emergency_contact_name || 
                    $customer->emergency_contact_email || 
                    $customer->emergency_contact_phone_1) {
                    DB::table('emergency_contacts')->insert([
                        'customer_id' => $customer->id,
                        'name' => $customer->emergency_contact_name,
                        'email' => $customer->emergency_contact_email,
                        'phone_1' => $customer->emergency_contact_phone_1,
                        'phone_2' => $customer->emergency_contact_phone_2,
                        'phone_3' => $customer->emergency_contact_phone_3,
                        'address' => $customer->emergency_contact_address,
                        'relationship' => $customer->emergency_contact_relationship,
                        'is_primary' => true, // Mark migrated contacts as primary
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // Remove emergency contact columns from customers table
        Schema::table('customers', function (Blueprint $table) {
            if (Schema::hasColumn('customers', 'emergency_contact_name')) {
                $table->dropColumn([
                    'emergency_contact_name',
                    'emergency_contact_email',
                    'emergency_contact_phone_1',
                    'emergency_contact_phone_2',
                    'emergency_contact_phone_3',
                    'emergency_contact_address',
                    'emergency_contact_relationship',
                ]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add columns back to customers table
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'emergency_contact_name')) {
                $table->string('emergency_contact_name')->nullable()->after('nationality');
                $table->string('emergency_contact_email')->nullable()->after('emergency_contact_name');
                $table->string('emergency_contact_phone_1')->nullable()->after('emergency_contact_email');
                $table->string('emergency_contact_phone_2')->nullable()->after('emergency_contact_phone_1');
                $table->string('emergency_contact_phone_3')->nullable()->after('emergency_contact_phone_2');
                $table->text('emergency_contact_address')->nullable()->after('emergency_contact_phone_3');
                $table->string('emergency_contact_relationship')->nullable()->after('emergency_contact_address');
            }
        });

        // Migrate data back (only primary contacts)
        $emergencyContacts = DB::table('emergency_contacts')
            ->where('is_primary', true)
            ->get();

        foreach ($emergencyContacts as $contact) {
            DB::table('customers')
                ->where('id', $contact->customer_id)
                ->update([
                    'emergency_contact_name' => $contact->name,
                    'emergency_contact_email' => $contact->email,
                    'emergency_contact_phone_1' => $contact->phone_1,
                    'emergency_contact_phone_2' => $contact->phone_2,
                    'emergency_contact_phone_3' => $contact->phone_3,
                    'emergency_contact_address' => $contact->address,
                    'emergency_contact_relationship' => $contact->relationship,
                ]);
        }
    }
};

