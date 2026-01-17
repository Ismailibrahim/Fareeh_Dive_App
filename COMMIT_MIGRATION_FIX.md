# Commit Migration Fixes to GitHub

## Quick Commands

Run these commands to commit and push the migration fixes:

```bash
# Navigate to the API directory (where migrations are)
cd sas-scuba-api

# Stage only the migration files
git add database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php
git add database/migrations/2025_01_17_000001_reorder_timestamps_in_equipment_items_table.php
git add database/migrations/2025_01_17_000002_add_service_fields_to_equipment_items.php
git add database/migrations/2025_01_17_000003_create_equipment_service_history_table.php

# Commit with a descriptive message
git commit -m "Fix migration order issue - add table existence checks

- Fixed 2025_01_17 migrations to check if equipment_items table exists
- Migrations now work regardless of execution order
- Makes migrations idempotent and safe to re-run
- Fixes: SQLSTATE[42S02]: Base table or view not found: 1146 Table 'equipment_items' doesn't exist"

# Push to GitHub
git push origin master
```

## On Your Server

After pushing, pull the changes on your server:

```bash
# SSH into server
ssh deployer@your-server-ip

# Navigate to project
cd /var/www/sas-scuba/sas-scuba-api

# Pull latest changes
git pull origin master

# Verify the fix is there
grep -n "hasTable" database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php
# Should show: if (Schema::hasTable('equipment_items')) {

# Run migrations
php artisan migrate:fresh --force
```

## What's Being Fixed

These 4 migration files are being updated:
1. `2025_01_17_000000_add_fields_to_equipment_items_table.php`
2. `2025_01_17_000001_reorder_timestamps_in_equipment_items_table.php`
3. `2025_01_17_000002_add_service_fields_to_equipment_items.php`
4. `2025_01_17_000003_create_equipment_service_history_table.php`

All now check if the `equipment_items` table exists before trying to alter it.

