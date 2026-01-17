# Quick Fix for Migration Error on Server

## Problem
The migration `2025_01_17_000000_add_fields_to_equipment_items_table` is trying to alter a table that doesn't exist yet because it runs before the base schema migration.

## Solution

You have two options:

### Option 1: Use the Fix Script (Easiest)

1. Copy the fix script to your server:
   ```bash
   # On your local machine, upload the script
   scp fix-migrations-on-server.sh deployer@your-server:/tmp/
   ```

2. On your server, run:
   ```bash
   chmod +x /tmp/fix-migrations-on-server.sh
   bash /tmp/fix-migrations-on-server.sh
   ```

3. Then run migrations:
   ```bash
   cd /var/www/sas-scuba/sas-scuba-api
   php artisan migrate:fresh --force
   ```

### Option 2: Manual Fix (If you can't upload files)

Edit the migration file directly on the server:

```bash
cd /var/www/sas-scuba/sas-scuba-api
nano database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php
```

Replace the `up()` method with:

```php
public function up(): void
{
    // Check if table exists before trying to alter it
    if (Schema::hasTable('equipment_items')) {
        Schema::table('equipment_items', function (Blueprint $table) {
            // Check if columns don't already exist
            if (!Schema::hasColumn('equipment_items', 'inventory_code')) {
                $table->string('inventory_code')->nullable();
            }
            if (!Schema::hasColumn('equipment_items', 'brand')) {
                $table->string('brand')->nullable();
            }
            if (!Schema::hasColumn('equipment_items', 'color')) {
                $table->string('color')->nullable();
            }
        });
    }
}
```

Also update the `down()` method:

```php
public function down(): void
{
    if (Schema::hasTable('equipment_items')) {
        Schema::table('equipment_items', function (Blueprint $table) {
            if (Schema::hasColumn('equipment_items', 'inventory_code')) {
                $table->dropColumn('inventory_code');
            }
            if (Schema::hasColumn('equipment_items', 'brand')) {
                $table->dropColumn('brand');
            }
            if (Schema::hasColumn('equipment_items', 'color')) {
                $table->dropColumn('color');
            }
        });
    }
}
```

### Option 3: Quick One-Liner Fix

Run this on your server to fix all affected migrations:

```bash
cd /var/www/sas-scuba/sas-scuba-api/database/migrations

# Fix the first migration
sed -i 's/Schema::table(\x27equipment_items\x27, function (Blueprint \$table) {/if (Schema::hasTable(\x27equipment_items\x27)) {\n            Schema::table(\x27equipment_items\x27, function (Blueprint \$table) {/' 2025_01_17_000000_add_fields_to_equipment_items_table.php

# Add closing brace
echo "        }" >> 2025_01_17_000000_add_fields_to_equipment_items_table.php
```

**Note:** Option 3 is complex. Use Option 1 or 2 instead.

## After Fixing

Run migrations again:

```bash
cd /var/www/sas-scuba/sas-scuba-api
php artisan migrate:fresh --force
```

## Verify

Check that migrations completed:

```bash
php artisan migrate:status
```

You should see all migrations as "Ran".

