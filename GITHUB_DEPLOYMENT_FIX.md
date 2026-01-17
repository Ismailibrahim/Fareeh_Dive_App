# Deploy Migration Fixes via GitHub

## Step 1: Commit the Fixed Migrations Locally

The migration files have been fixed in your local codebase. Now commit and push them:

```bash
# Navigate to project root
cd /path/to/Fareeh_DiveApplicaiton

# Check what files were changed
git status

# Add the fixed migration files
git add sas-scuba-api/database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php
git add sas-scuba-api/database/migrations/2025_01_17_000001_reorder_timestamps_in_equipment_items_table.php
git add sas-scuba-api/database/migrations/2025_01_17_000002_add_service_fields_to_equipment_items.php
git add sas-scuba-api/database/migrations/2025_01_17_000003_create_equipment_service_history_table.php

# Also add the documentation files
git add MIGRATION_FIX.md
git add QUICK_FIX_SERVER.md
git add GITHUB_DEPLOYMENT_FIX.md

# Commit the changes
git commit -m "Fix migration order issue - add table existence checks

- Fixed 2025_01_17 migrations to check if equipment_items table exists
- Migrations now work regardless of execution order
- Makes migrations idempotent and safe to re-run"

# Push to GitHub
git push origin main
# or
git push origin master
# or your branch name
```

## Step 2: Pull Changes on Server

SSH into your server and pull the latest changes:

```bash
# SSH into your server
ssh deployer@your-server-ip

# Navigate to the project directory
cd /var/www/sas-scuba/sas-scuba-api

# Pull the latest changes from GitHub
git pull origin main
# or
git pull origin master
# or your branch name

# Verify the migration files were updated
cat database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php | grep "hasTable"
# Should show: if (Schema::hasTable('equipment_items')) {
```

## Step 3: Run Migrations on Server

After pulling the updated migrations:

```bash
# Make sure you're in the API directory
cd /var/www/sas-scuba/sas-scuba-api

# Clear any cached migration data
php artisan migrate:reset --force

# Run migrations fresh (drops all tables and re-runs)
php artisan migrate:fresh --force

# Or if you want to preserve data, rollback and re-run
php artisan migrate:rollback --step=10
php artisan migrate --force
```

## Step 4: Verify Migrations Completed

```bash
# Check migration status
php artisan migrate:status

# Verify tables exist
php artisan tinker
>>> Schema::hasTable('equipment_items')
=> true
>>> Schema::hasColumn('equipment_items', 'inventory_code')
=> true
>>> exit
```

## What Was Fixed

The following migration files were updated to check if tables exist before altering them:

1. `2025_01_17_000000_add_fields_to_equipment_items_table.php`
   - Now checks if `equipment_items` table exists
   - Checks if columns exist before adding them

2. `2025_01_17_000001_reorder_timestamps_in_equipment_items_table.php`
   - Now checks if `equipment_items` table exists
   - Checks if `color` column exists before reordering

3. `2025_01_17_000002_add_service_fields_to_equipment_items.php`
   - Now checks if `equipment_items` table exists
   - Checks if columns exist before adding them

4. `2025_01_17_000003_create_equipment_service_history_table.php`
   - Now checks if `equipment_items` table exists before creating foreign key

## Troubleshooting

### If git pull fails:

```bash
# Check current branch
git branch

# If you're on a different branch, switch to main/master
git checkout main
# or
git checkout master

# Pull again
git pull origin main
```

### If migrations still fail:

```bash
# Check if migration files were actually updated
grep -n "hasTable" database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php

# If not found, the file wasn't updated - check git status
git status
git log --oneline -5
```

### If you need to force pull:

```bash
# WARNING: This will discard local changes
git fetch origin
git reset --hard origin/main
```

## Summary

1. ✅ Commit fixed migrations locally
2. ✅ Push to GitHub
3. ✅ Pull on server
4. ✅ Run migrations
5. ✅ Verify success

The migrations are now idempotent and will work regardless of execution order!

