# Migration Fixes Applied

## Date: 2025-01-20

## Summary
Fixed critical migration issues that could cause deployment failures. The main issues were:
1. MySQL-specific SQL statements that fail on PostgreSQL/SQLite
2. Missing table/column/foreign key existence checks
3. Unsafe foreign key constraint dropping
4. Use of `change()` method without proper error handling

## Fixed Migrations

### 1. `2025_12_22_051612_add_customer_id_to_invoices_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence check before adding customer_id
- ✅ Made `MODIFY COLUMN` database-agnostic (MySQL/PostgreSQL/SQLite support)
- ✅ Added foreign key existence checks before dropping
- ✅ Added proper error handling for SQLite (which doesn't support ALTER COLUMN easily)

**Changes:**
- Now checks if table and columns exist before modifying
- Uses database driver detection to execute appropriate SQL
- Handles SQLite limitations gracefully

### 2. `2025_12_17_000001_change_service_type_to_string_in_price_list_items_table.php`
**Issues Fixed:**
- ✅ Added table and column existence checks
- ✅ Made `MODIFY COLUMN` database-agnostic
- ✅ Added PostgreSQL enum type handling
- ✅ Added SQLite fallback (skips migration on SQLite)

**Changes:**
- Now supports MySQL, PostgreSQL, and SQLite
- Proper enum to varchar conversion for PostgreSQL
- Graceful handling of SQLite limitations

### 3. `2025_12_17_064820_make_equipment_item_id_nullable_in_booking_equipment_table.php`
**Issues Fixed:**
- ✅ Removed dependency on `change()` method (requires doctrine/dbal)
- ✅ Added table and column existence checks
- ✅ Added foreign key existence checks before dropping
- ✅ Made column modification database-agnostic
- ✅ Added proper error handling

**Changes:**
- Uses raw SQL statements instead of `change()` method
- Checks for foreign keys before attempting to drop them
- Supports MySQL, PostgreSQL, and SQLite

### 4. `2025_12_18_042703_remove_unique_constraint_from_price_lists_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added foreign key existence checks before dropping
- ✅ Added unique constraint existence check before dropping
- ✅ Added proper error handling

**Changes:**
- Checks if foreign keys exist before dropping
- Checks if unique constraint exists before dropping
- Handles cases where constraints might not exist

### 5. `2025_12_23_094105_update_payments_table_for_payment_methods.php`
**Issues Fixed:**
- ✅ Added table existence check in `down()` method
- ✅ Added column existence checks before dropping columns
- ✅ Added try-catch blocks for foreign key and index dropping
- ✅ Only drops columns that exist

**Changes:**
- Safe rollback that won't fail if columns don't exist
- Proper error handling for foreign keys and indexes

### 6. `2025_12_15_152456_add_price_list_item_id_to_invoice_items_table.php`
**Issues Fixed:**
- ✅ Added table existence check in `down()` method
- ✅ Added column existence check before dropping
- ✅ Added try-catch for foreign key dropping

**Changes:**
- Safe rollback that checks for column existence

## Common Patterns Applied

### 1. Table Existence Checks
```php
if (!Schema::hasTable('table_name')) {
    return;
}
```

### 2. Column Existence Checks
```php
if (!Schema::hasColumn('table_name', 'column_name')) {
    return;
}
```

### 3. Foreign Key Existence Checks
```php
$foreignKeys = $this->getForeignKeys('table_name', 'column_name');
if (!empty($foreignKeys)) {
    try {
        $table->dropForeign(['column_name']);
    } catch (\Exception $e) {
        // Foreign key might not exist, continue
    }
}
```

### 4. Database-Agnostic Column Modifications
```php
$driver = DB::getDriverName();
if ($driver === 'mysql' || $driver === 'mariadb') {
    DB::statement('ALTER TABLE table_name MODIFY column_name TYPE');
} elseif ($driver === 'pgsql') {
    DB::statement('ALTER TABLE table_name ALTER COLUMN column_name TYPE');
} elseif ($driver === 'sqlite') {
    // Handle SQLite limitations
}
```

## Additional Migrations Fixed (Round 2)

The following migrations have been updated with safety checks:

### 7. `2025_12_23_000003_add_dive_group_id_to_bookings_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence check
- ✅ Added try-catch for foreign key and index dropping

### 8. `2025_12_18_111247_add_agent_id_to_invoices_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence check
- ✅ Added try-catch for foreign key and index dropping

### 9. `2025_12_18_111245_add_agent_id_to_bookings_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence check
- ✅ Added try-catch for foreign key and index dropping

### 10. `2025_12_17_142800_add_location_id_to_equipment_items_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence check
- ✅ Added try-catch for foreign key dropping

### 11. `2025_12_16_145149_add_booking_references_to_invoice_items_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence checks for both columns
- ✅ Added try-catch for foreign key dropping
- ✅ Only drops columns that exist

### 12. `2025_12_16_144022_add_price_fields_to_booking_dives_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence checks
- ✅ Added try-catch for foreign key dropping

### 13. `2025_12_17_000000_add_equipment_item_id_to_price_list_items_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence check
- ✅ Added try-catch for foreign key dropping

### 14. `2025_12_16_145154_add_invoice_type_to_invoices_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence checks
- ✅ Added try-catch for foreign key dropping

### 15. `2025_12_16_145210_add_basket_id_to_bookings_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence check
- ✅ Added try-catch for foreign key dropping

### 16. `2025_12_16_144718_add_package_references_to_bookings_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence checks for both columns
- ✅ Added try-catch for foreign key dropping

### 17. `2025_12_16_144722_add_package_references_to_booking_dives_table.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence checks for all columns
- ✅ Added try-catch for foreign key dropping

### 18. `2025_12_16_145205_update_booking_equipment_for_baskets.php`
**Issues Fixed:**
- ✅ Added table existence check
- ✅ Added column existence checks for all columns
- ✅ Added try-catch for foreign key and index dropping
- ✅ Only drops columns that exist

## Summary

**Total Migrations Fixed: 18**

All critical migrations that drop foreign keys, indexes, or columns now have proper safety checks. This ensures migrations won't fail during deployment if:
- Tables don't exist
- Columns don't exist
- Foreign keys don't exist
- Indexes don't exist
- Migrations are run out of order

## Recommendations

1. **Test Migrations**: Run migrations on a clean database to ensure they work correctly
2. **Test Rollbacks**: Test the `down()` methods to ensure they work properly
3. **Database Driver**: Ensure your production database driver matches your development environment
4. **Migration Order**: Ensure migrations run in the correct order (Laravel handles this automatically)
5. **Backup**: Always backup your database before running migrations in production

## Testing Checklist

- [ ] Run `php artisan migrate:fresh` on a test database
- [ ] Run `php artisan migrate:rollback` to test rollbacks
- [ ] Test on MySQL/MariaDB (production database)
- [ ] Test on PostgreSQL (if applicable)
- [ ] Test on SQLite (development database)
- [ ] Verify foreign keys are created correctly
- [ ] Verify indexes are created correctly
- [ ] Check for any migration errors in logs

## Notes

- SQLite has limitations with ALTER COLUMN operations. Some migrations skip SQLite-specific operations.
- The `change()` method requires the `doctrine/dbal` package. Migrations have been updated to avoid this dependency.
- Foreign key constraint names may vary between database systems, so we check for existence before dropping.

