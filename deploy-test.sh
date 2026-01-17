#!/bin/bash

# SAS Scuba - Testing Environment Deployment Script
# ⚠️ WARNING: This script is for TESTING purposes only
# Review and customize before running

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$PROJECT_ROOT/sas-scuba-api"
WEB_DIR="$PROJECT_ROOT/sas-scuba-web"

echo -e "${GREEN}=== SAS Scuba Deployment Script (Testing) ===${NC}\n"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

command -v php >/dev/null 2>&1 || { echo -e "${RED}PHP is required but not installed.${NC}" >&2; exit 1; }
command -v composer >/dev/null 2>&1 || { echo -e "${RED}Composer is required but not installed.${NC}" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed.${NC}" >&2; exit 1; }

PHP_VERSION=$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')
if [ "$(printf '%s\n' "8.2" "$PHP_VERSION" | sort -V | head -n1)" != "8.2" ]; then
    echo -e "${RED}PHP 8.2+ is required. Current version: $PHP_VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites met${NC}\n"

# Backend Deployment
echo -e "${YELLOW}=== Deploying Backend (Laravel API) ===${NC}"

cd "$API_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Please create it from .env.example${NC}"
    echo -e "${YELLOW}Continuing with existing configuration...${NC}"
else
    echo -e "${GREEN}✓ .env file found${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing PHP dependencies...${NC}"
composer install --no-dev --optimize-autoloader

# Generate app key if not set
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    echo -e "${YELLOW}Generating application key...${NC}"
    php artisan key:generate --force
fi

# Create storage link
echo -e "${YELLOW}Creating storage link...${NC}"
php artisan storage:link || echo -e "${YELLOW}Storage link may already exist${NC}"

# Set permissions
echo -e "${YELLOW}Setting permissions...${NC}"
chmod -R 775 storage bootstrap/cache 2>/dev/null || echo -e "${YELLOW}Permission setting skipped (may require sudo)${NC}"

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
read -p "Do you want to run migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    php artisan migrate --force
else
    echo -e "${YELLOW}Skipping migrations${NC}"
fi

# Cache configuration
echo -e "${YELLOW}Caching configuration...${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Build assets
echo -e "${YELLOW}Building assets...${NC}"
if [ -f package.json ]; then
    npm install
    npm run build
fi

echo -e "${GREEN}✓ Backend deployment complete${NC}\n"

# Frontend Deployment
echo -e "${YELLOW}=== Deploying Frontend (Next.js) ===${NC}"

cd "$WEB_DIR"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠ .env.local file not found. Please create it${NC}"
    echo -e "${YELLOW}Continuing with existing configuration...${NC}"
else
    echo -e "${GREEN}✓ .env.local file found${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
npm install

# Build application
echo -e "${YELLOW}Building Next.js application...${NC}"
npm run build

echo -e "${GREEN}✓ Frontend deployment complete${NC}\n"

# Summary
echo -e "${GREEN}=== Deployment Summary ===${NC}"
echo -e "${GREEN}Backend: ${API_DIR}${NC}"
echo -e "${GREEN}Frontend: ${WEB_DIR}${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. Configure web server (Apache/Nginx)"
echo -e "2. Set up reverse proxy for frontend"
echo -e "3. Configure SSL certificates (recommended)"
echo -e "4. Test the application"
echo -e "5. Review DEPLOYMENT_GUIDE.md for detailed instructions"
echo -e "\n${RED}⚠️  REMEMBER: This is for TESTING only. Not production ready!${NC}\n"

