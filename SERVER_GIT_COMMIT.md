# Git Commit on Server - Correct Commands

## Step 1: Configure Git Identity (One-time setup)

```bash
# Set your git identity (use your actual name and email)
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# Or if you only want to set it for this repository:
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

## Step 2: Check Your Current Directory

```bash
# You should be in: /var/www/sas-scuba/sas-scuba-api
pwd
# Should show: /var/www/sas-scuba/sas-scuba-api
```

## Step 3: Stage Migration Files (Correct Paths)

Since you're already IN the `sas-scuba-api` directory, use these paths:

```bash
# Stage the migration files (no sas-scuba-api/ prefix needed)
git add database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php
git add database/migrations/2025_01_17_000001_reorder_timestamps_in_equipment_items_table.php
git add database/migrations/2025_01_17_000002_add_service_fields_to_equipment_items.php
git add database/migrations/2025_01_17_000003_create_equipment_service_history_table.php

# Check what's staged
git status
```

## Step 4: Commit

```bash
git commit -m "Fix migration order issue - add table existence checks

- Fixed 2025_01_17 migrations to check if equipment_items table exists
- Migrations now work regardless of execution order
- Makes migrations idempotent and safe to re-run
- Fixes: SQLSTATE[42S02]: Base table or view not found: 1146 Table 'equipment_items' doesn't exist"
```

## Step 5: Push to GitHub

```bash
# Check which branch you're on
git branch

# Push (adjust branch name if needed)
git push origin master
# or
git push origin main
```

## Alternative: If Files Are Already Fixed Locally

If the migration files are already fixed in your local repository and you just need to pull them:

```bash
# Pull latest changes from GitHub
git pull origin master

# Verify the fix
grep -n "hasTable" database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php

# Run migrations
php artisan migrate:fresh --force
```

## Quick One-Liner to Check If Files Are Modified

```bash
git status database/migrations/2025_01_17_*.php
```

