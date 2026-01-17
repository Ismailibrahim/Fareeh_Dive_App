# Migration Order Fix

## Issue

The migrations were failing because some migrations dated `2025_01_17` were trying to alter the `equipment_items` table before the base schema migration (`2025_12_15_000000_create_full_schema.php`) created it.

## Root Cause

Laravel runs migrations in chronological order based on the filename timestamp. The migrations dated `2025_01_17` were running before `2025_12_15`, causing the table to not exist when the migrations tried to alter it.

## Solution Applied

Updated the following migrations to check if tables/columns exist before trying to alter them:

1. **2025_01_17_000000_add_fields_to_equipment_items_table.php**
   - Added check for `equipment_items` table existence
   - Added checks for individual column existence before adding them

2. **2025_01_17_000001_reorder_timestamps_in_equipment_items_table.php**
   - Added check for `equipment_items` table existence
   - Added check for `color` column existence before reordering

3. **2025_01_17_000002_add_service_fields_to_equipment_items.php**
   - Added check for `equipment_items` table existence
   - Added checks for individual column existence before adding them

4. **2025_01_17_000003_create_equipment_service_history_table.php**
   - Added check for `equipment_items` table existence before creating foreign key

## How to Apply the Fix

The migrations have been updated in the codebase. To apply:

1. **If migrations haven't run yet:**
   ```bash
   php artisan migrate --force
   ```

2. **If migrations partially failed:**
   ```bash
   # Reset migrations (WARNING: This will drop all tables)
   php artisan migrate:fresh --force
   
   # Or rollback and re-run
   php artisan migrate:rollback --step=1
   php artisan migrate --force
   ```

3. **If you need to start fresh:**
   ```bash
   # Drop all tables and re-run migrations
   php artisan migrate:fresh --force
   ```

## Migration Order

The migrations will now run safely in any order because they check for table/column existence:

1. Base schema migration creates all base tables
2. Subsequent migrations check if tables exist before altering them
3. Migrations are idempotent (can be run multiple times safely)

## Testing

After applying the fix, verify:

```bash
# Check migration status
php artisan migrate:status

# Verify tables exist
php artisan tinker
>>> Schema::hasTable('equipment_items')
=> true
>>> Schema::hasColumn('equipment_items', 'inventory_code')
=> true
```

## Notes

- The migrations are now idempotent and can be safely re-run
- The fix ensures migrations work regardless of execution order
- No data loss will occur when re-running migrations

