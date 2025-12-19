# SAS Scuba - Development Environment Setup

This document contains information about setting up and using the development environment for the SAS Scuba application.

## Prerequisites

- **Laragon** (Windows local development server)
  - Location: `C:\laragon\`
  - Includes: PHP 8.3.26, MySQL, Apache/Nginx
- **Composer** (PHP dependency manager)
  - Location: `C:\composer\composer.bat`
- **Node.js** (JavaScript runtime)
  - Location: `C:\Program Files\nodejs\node.exe`
- **PowerShell** 5.1+

## Project Structure

```
D:\Sandbox\Fareeh_DiveApplicaiton\
├── sas-scuba-api\          # Laravel API backend
├── sas-scuba-web\          # Next.js frontend
├── paths.ps1               # Path configuration
├── dev-start.ps1           # Start development servers
├── dev-stop.ps1            # Stop development servers
└── dev-setup.ps1           # Initial setup script
```

## Quick Start

### 1. Initial Setup

Run the setup script to install dependencies:

```powershell
.\dev-setup.ps1
```

### 2. Configure Database

Update the `.env` file in `sas-scuba-api\`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=SAS_Scuba
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Run Migrations

```powershell
cd sas-scuba-api
php artisan migrate
```

### 4. Start Development Servers

```powershell
.\dev-start.ps1
```

This will start:
- **Laravel API**: http://localhost:8000
- **Next.js Frontend**: http://localhost:3000

### 5. Stop Development Servers

```powershell
.\dev-stop.ps1
```

## PowerShell Scripts

### paths.ps1
Configuration file containing all development paths. Source this file to set up environment variables:

```powershell
. .\paths.ps1
```

### dev-start.ps1
Starts both Laravel API and Next.js frontend servers in separate PowerShell windows.

### dev-stop.ps1
Stops all running development servers.

### dev-setup.ps1
Initial project setup script that:
- Checks prerequisites
- Installs PHP dependencies (Composer)
- Installs Node.js dependencies (npm)
- Creates .env file
- Generates application key

## Manual Commands

### Backend (Laravel API)

```powershell
# Navigate to API directory
cd sas-scuba-api

# Start server
php artisan serve

# Run migrations
php artisan migrate

# Run seeders
php artisan db:seed

# Clear cache
php artisan config:clear
php artisan cache:clear
```

### Frontend (Next.js)

```powershell
# Navigate to web directory
cd sas-scuba-web

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Database Access

- **phpMyAdmin**: http://localhost/phpmyadmin (via Laragon)
- **Database Name**: `SAS_Scuba`
- **Host**: `127.0.0.1`
- **Port**: `3306`
- **Username**: `root`
- **Password**: (empty by default)

## Troubleshooting

### PHP Not Found
- Ensure Laragon is installed at `C:\laragon\`
- Check PHP path in `paths.ps1`
- Add PHP to system PATH if needed

### Port Already in Use
- Stop existing servers: `.\dev-stop.ps1`
- Or change ports in `paths.ps1` and `.env` files

### Database Connection Failed
- Ensure MySQL is running in Laragon
- Check database credentials in `.env`
- Verify database `SAS_Scuba` exists

### Node Modules Issues
- Delete `node_modules` folder
- Run `npm install` again

## Environment Variables

Key environment variables are set in `paths.ps1`:
- `$PROJECT_ROOT` - Project root directory
- `$PROJECT_API` - API directory
- `$PROJECT_WEB` - Web directory
- `$PHP_EXE` - PHP executable path
- `$DB_NAME` - Database name

## Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Laragon Documentation](https://laragon.org/docs/)

