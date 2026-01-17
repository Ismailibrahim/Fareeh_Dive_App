# Git Commit Instructions for Migration Fix

## Step 1: Stage the Migration Files

The migration files are already fixed in your local codebase. Stage them for commit:

```bash
# From project root
git add sas-scuba-api/database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php
git add sas-scuba-api/database/migrations/2025_01_17_000001_reorder_timestamps_in_equipment_items_table.php
git add sas-scuba-api/database/migrations/2025_01_17_000002_add_service_fields_to_equipment_items.php
git add sas-scuba-api/database/migrations/2025_01_17_000003_create_equipment_service_history_table.php
```

## Step 2: Commit

```bash
git commit -m "Fix migration order issue - add table existence checks

- Fixed 2025_01_17 migrations to check if equipment_items table exists
- Migrations now work regardless of execution order
- Makes migrations idempotent and safe to re-run
- Fixes: SQLSTATE[42S02]: Base table or view not found: 1146 Table 'equipment_items' doesn't exist"
```

## Step 3: Push to GitHub

```bash
git push origin master
```

## Step 4: On Your Server - Pull and Run Migrations

```bash
# SSH into server
ssh deployer@your-server-ip

# Navigate to project
cd /var/www/sas-scuba/sas-scuba-api

# Pull latest changes
git pull origin master

# Verify the fix
grep -n "hasTable" database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php
# Should output: if (Schema::hasTable('equipment_items')) {

# Run migrations
php artisan migrate:fresh --force
```

## What's Fixed

All 4 migration files now:
- Check if `equipment_items` table exists before altering it
- Check if columns exist before adding them
- Are idempotent (safe to run multiple times)
- Work regardless of migration execution order

## Files Changed

1. `sas-scuba-api/database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php`
2. `sas-scuba-api/database/migrations/2025_01_17_000001_reorder_timestamps_in_equipment_items_table.php`
3. `sas-scuba-api/database/migrations/2025_01_17_000002_add_service_fields_to_equipment_items.php`
4. `sas-scuba-api/database/migrations/2025_01_17_000003_create_equipment_service_history_table.php`

