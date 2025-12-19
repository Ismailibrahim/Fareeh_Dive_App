# SAS Scuba - Development Paths Configuration
# This file contains all development environment paths for the project
# Source this file in PowerShell: . .\paths.ps1

# Project Root Paths
$PROJECT_ROOT = "D:\Sandbox\Fareeh_DiveApplicaiton"
$PROJECT_API = "$PROJECT_ROOT\sas-scuba-api"
$PROJECT_WEB = "$PROJECT_ROOT\sas-scuba-web"

# Laragon Paths
$LARAGON_ROOT = "C:\laragon"
$LARAGON_PHP = "C:\laragon\bin\php\php-8.3.26-Win32-vs16-x64"
$LARAGON_MYSQL = "C:\laragon\bin\mysql"
$LARAGON_PHPMYADMIN = "C:\laragon\bin\phpmyadmin"

# PHP Configuration
$PHP_EXE = "$LARAGON_PHP\php.exe"
$PHP_VERSION = "8.3.26"

# Database Configuration
$DB_NAME = "SAS_Scuba"
$DB_HOST = "127.0.0.1"
$DB_PORT = "3306"
$DB_USER = "root"
$DB_PASSWORD = ""

# Development Tool Paths
$COMPOSER_PATH = "C:\composer\composer.bat"
$NODE_PATH = "C:\Program Files\nodejs\node.exe"
$NPM_PATH = "C:\Program Files\nodejs\npm.cmd"

# PowerShell Configuration
$POWERSHELL_PATH = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$POWERSHELL_VERSION = "5.1.26100.7462"

# Development Server Ports
$API_PORT = "8000"
$WEB_PORT = "3000"

# Export paths to environment (for current session)
$env:PROJECT_ROOT = $PROJECT_ROOT
$env:PROJECT_API = $PROJECT_API
$env:PROJECT_WEB = $PROJECT_WEB
$env:LARAGON_ROOT = $LARAGON_ROOT
$env:PHP_EXE = $PHP_EXE

# Add PHP to PATH if not already there
if ($env:PATH -notlike "*$LARAGON_PHP*") {
    $env:PATH = "$LARAGON_PHP;$env:PATH"
}

Write-Host "✅ Paths configured successfully!" -ForegroundColor Green
Write-Host "Project Root: $PROJECT_ROOT" -ForegroundColor Cyan
Write-Host "PHP: $PHP_EXE" -ForegroundColor Cyan
Write-Host "Database: $DB_NAME" -ForegroundColor Cyan

