<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\AuthController;

Route::prefix('v1')->group(function () {
    // Auth Routes with strict rate limiting (5 requests per minute)
    Route::middleware(['throttle:5,1'])->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
    });

    // Authenticated routes with standard rate limiting (60 requests per minute)
    // IMPORTANT: Authenticated routes must come BEFORE public catch-all routes
    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        // Dive Center Settings
    Route::get('/dive-center', [App\Http\Controllers\Api\V1\DiveCenterController::class, 'show']);
    Route::put('/dive-center', [App\Http\Controllers\Api\V1\DiveCenterController::class, 'update']);
    Route::get('/dive-center/currency-rates', [App\Http\Controllers\Api\V1\DiveCenterController::class, 'getCurrencyRates']);
    Route::put('/dive-center/currency-rates', [App\Http\Controllers\Api\V1\DiveCenterController::class, 'updateCurrencyRates']);
    Route::get('/dive-center/available-currencies', [App\Http\Controllers\Api\V1\DiveCenterController::class, 'getAvailableCurrencies']);

        // Pre-registration management routes (staff only) - MUST come before public routes to avoid route conflicts
        Route::post('/pre-registration/links', [\App\Http\Controllers\Api\V1\CustomerPreRegistrationController::class, 'generateLink']);
        Route::get('/pre-registration/submissions', [\App\Http\Controllers\Api\V1\CustomerPreRegistrationController::class, 'index']);
        Route::get('/pre-registration/submissions/{id}', [\App\Http\Controllers\Api\V1\CustomerPreRegistrationController::class, 'show']);
        Route::post('/pre-registration/submissions/{id}/approve', [\App\Http\Controllers\Api\V1\CustomerPreRegistrationController::class, 'approve']);
        Route::post('/pre-registration/submissions/{id}/reject', [\App\Http\Controllers\Api\V1\CustomerPreRegistrationController::class, 'reject']);

        Route::apiResource('customers', \App\Http\Controllers\Api\V1\CustomerController::class);
        Route::apiResource('customers.emergency-contacts', \App\Http\Controllers\Api\V1\EmergencyContactController::class)->except(['index']);
        Route::get('customers/{customer}/emergency-contacts', [\App\Http\Controllers\Api\V1\EmergencyContactController::class, 'index']);
        Route::get('emergency-contacts', [\App\Http\Controllers\Api\V1\EmergencyContactController::class, 'listAll']);
        Route::apiResource('customer-certifications', \App\Http\Controllers\Api\V1\CustomerCertificationController::class);
        Route::apiResource('customer-insurances', \App\Http\Controllers\Api\V1\CustomerInsuranceController::class);
        Route::apiResource('customer-accommodations', \App\Http\Controllers\Api\V1\CustomerAccommodationController::class);
        
        // File management routes
        Route::prefix('files')->group(function () {
            Route::post('/upload', [\App\Http\Controllers\Api\V1\FileUploadController::class, 'upload']);
            Route::get('/{entityType}/{entityId}', [\App\Http\Controllers\Api\V1\FileUploadController::class, 'index']);
            Route::get('/{fileId}', [\App\Http\Controllers\Api\V1\FileUploadController::class, 'show']);
            Route::delete('/{fileId}', [\App\Http\Controllers\Api\V1\FileUploadController::class, 'destroy']);
        });
        
        // Storage routes
        Route::prefix('storage')->group(function () {
            Route::get('/usage', [\App\Http\Controllers\Api\V1\FileStorageController::class, 'usage']);
            Route::get('/files/{fileId}/download', [\App\Http\Controllers\Api\V1\FileStorageController::class, 'download']);
        });
        Route::apiResource('bookings', \App\Http\Controllers\Api\V1\BookingController::class);
        Route::apiResource('booking-dives', \App\Http\Controllers\Api\V1\BookingDiveController::class);
        Route::post('booking-dives/{bookingDive}/complete', [\App\Http\Controllers\Api\V1\BookingDiveController::class, 'complete']);
        Route::get('booking-dives/{bookingDive}/log', [\App\Http\Controllers\Api\V1\BookingDiveController::class, 'log']);
        Route::apiResource('booking-equipment', \App\Http\Controllers\Api\V1\BookingEquipmentController::class);
        Route::post('booking-equipment/check-availability', [\App\Http\Controllers\Api\V1\BookingEquipmentController::class, 'checkAvailability']);
        Route::put('booking-equipment/{bookingEquipment}/return', [\App\Http\Controllers\Api\V1\BookingEquipmentController::class, 'returnEquipment']);
        Route::post('booking-equipment/bulk-return', [\App\Http\Controllers\Api\V1\BookingEquipmentController::class, 'bulkReturn']);
        Route::apiResource('booking-instructors', \App\Http\Controllers\Api\V1\BookingInstructorController::class);
        // Equipment specific routes must come BEFORE apiResource to avoid route conflicts
        Route::post('equipment/bulk', [\App\Http\Controllers\Api\V1\EquipmentController::class, 'bulkStore']);
        Route::get('equipment/import-template', [\App\Http\Controllers\Api\V1\EquipmentController::class, 'downloadTemplate']);
        Route::post('equipment/import-preview', [\App\Http\Controllers\Api\V1\EquipmentController::class, 'importPreview']);
        Route::post('equipment/import', [\App\Http\Controllers\Api\V1\EquipmentController::class, 'import']);
        Route::apiResource('equipment', \App\Http\Controllers\Api\V1\EquipmentController::class);
        Route::apiResource('equipment-items', \App\Http\Controllers\Api\V1\EquipmentItemController::class);
        Route::apiResource('boats', \App\Http\Controllers\Api\V1\BoatController::class);
        Route::apiResource('dive-sites', \App\Http\Controllers\Api\V1\DiveSiteController::class);
        Route::apiResource('dive-logs', \App\Http\Controllers\Api\V1\DiveLogController::class);
        Route::get('customers/{customer}/dive-logs', [\App\Http\Controllers\Api\V1\DiveLogController::class, 'indexByCustomer']);
        Route::apiResource('equipment-items.service-history', \App\Http\Controllers\Api\V1\EquipmentServiceHistoryController::class)->except(['index']);
        Route::get('equipment-items/{equipmentItem}/service-history', [\App\Http\Controllers\Api\V1\EquipmentServiceHistoryController::class, 'index']);
        Route::post('equipment-items/bulk-service', [\App\Http\Controllers\Api\V1\EquipmentServiceHistoryController::class, 'bulkStore']);
        Route::apiResource('nationalities', \App\Http\Controllers\Api\V1\NationalityController::class);
        Route::apiResource('units', \App\Http\Controllers\Api\V1\UnitController::class);
        Route::apiResource('islands', \App\Http\Controllers\Api\V1\IslandController::class);
        Route::apiResource('countries', \App\Http\Controllers\Api\V1\CountryController::class);
        Route::apiResource('relationships', \App\Http\Controllers\Api\V1\RelationshipController::class);
        Route::apiResource('agencies', \App\Http\Controllers\Api\V1\AgencyController::class);
        Route::apiResource('service-providers', \App\Http\Controllers\Api\V1\ServiceProviderController::class);
        Route::apiResource('categories', \App\Http\Controllers\Api\V1\CategoryController::class);
        Route::apiResource('locations', \App\Http\Controllers\Api\V1\LocationController::class);
        Route::apiResource('service-types', \App\Http\Controllers\Api\V1\ServiceTypeController::class);
        Route::apiResource('taxes', \App\Http\Controllers\Api\V1\TaxController::class);
        Route::apiResource('instructors', \App\Http\Controllers\Api\V1\InstructorController::class);
        Route::apiResource('users', \App\Http\Controllers\Api\V1\UserController::class);
        
        // Agent routes
        Route::apiResource('agents', \App\Http\Controllers\Api\V1\AgentController::class);
        Route::get('agents/{id}/performance', [\App\Http\Controllers\Api\V1\AgentReportController::class, 'performance']);
        Route::get('agents/{id}/commissions', [\App\Http\Controllers\Api\V1\AgentCommissionController::class, 'index']);
        Route::post('agents/{id}/commissions/calculate', [\App\Http\Controllers\Api\V1\AgentCommissionController::class, 'calculate']);
        Route::put('commissions/{id}', [\App\Http\Controllers\Api\V1\AgentCommissionController::class, 'update']);
        Route::delete('commissions/{id}', [\App\Http\Controllers\Api\V1\AgentCommissionController::class, 'destroy']);
        Route::get('reports/agents/top-performers', [\App\Http\Controllers\Api\V1\AgentReportController::class, 'topPerformers']);
        Route::get('reports/agents/commission-payable', [\App\Http\Controllers\Api\V1\AgentReportController::class, 'commissionPayable']);
        Route::get('reports/agents/dormant', [\App\Http\Controllers\Api\V1\AgentReportController::class, 'dormantAgents']);
        Route::get('agents/{agentId}/reports/monthly', [\App\Http\Controllers\Api\V1\AgentReportController::class, 'monthlyPerformance']);
        Route::apiResource('tags', \App\Http\Controllers\Api\V1\TagController::class);
        Route::post('agents/{agentId}/tags/{tagId}', [\App\Http\Controllers\Api\V1\TagController::class, 'attachToAgent']);
        Route::delete('agents/{agentId}/tags/{tagId}', [\App\Http\Controllers\Api\V1\TagController::class, 'detachFromAgent']);
        
        // Price list routes (multiple price lists per dive center)
        Route::get('/price-lists', [\App\Http\Controllers\Api\V1\PriceListController::class, 'index']);
        Route::post('/price-lists', [\App\Http\Controllers\Api\V1\PriceListController::class, 'store']);
        Route::get('/price-lists/{id}', [\App\Http\Controllers\Api\V1\PriceListController::class, 'show']);
        Route::put('/price-lists/{id}', [\App\Http\Controllers\Api\V1\PriceListController::class, 'update']);
        Route::patch('/price-lists/{id}', [\App\Http\Controllers\Api\V1\PriceListController::class, 'update']);
        Route::delete('/price-lists/{id}', [\App\Http\Controllers\Api\V1\PriceListController::class, 'destroy']);
        Route::post('/price-lists/{id}/duplicate', [\App\Http\Controllers\Api\V1\PriceListController::class, 'duplicate']);
        
        // Price list items routes
        Route::apiResource('price-list-items', \App\Http\Controllers\Api\V1\PriceListItemController::class);
        Route::post('/price-list-items/bulk', [\App\Http\Controllers\Api\V1\PriceListItemController::class, 'bulkUpdate']);
        Route::post('/price-lists/{priceListId}/items/bulk-adjust-prices', [\App\Http\Controllers\Api\V1\PriceListItemController::class, 'bulkAdjustPrices']);
        Route::post('/price-lists/{priceListId}/items/bulk-update-tax-service', [\App\Http\Controllers\Api\V1\PriceListItemController::class, 'bulkUpdateTaxService']);
        Route::apiResource('dive-packages', \App\Http\Controllers\Api\V1\DivePackageController::class);
        Route::get('dive-packages/{divePackage}/status', [\App\Http\Controllers\Api\V1\DivePackageController::class, 'status']);
        Route::apiResource('invoices', \App\Http\Controllers\Api\V1\InvoiceController::class);
        Route::post('invoices/generate-from-booking', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'generateFromBooking']);
        Route::post('invoices/{invoice}/add-damage-charge', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'addDamageCharge']);
        Route::post('invoices/{invoice}/add-item', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'addItem']);
        Route::delete('invoices/{invoice}/items/{invoiceItem}', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'deleteItem']);
        Route::apiResource('payments', \App\Http\Controllers\Api\V1\PaymentController::class);
        Route::apiResource('equipment-baskets', \App\Http\Controllers\Api\V1\EquipmentBasketController::class);
        Route::put('equipment-baskets/{equipmentBasket}/return', [\App\Http\Controllers\Api\V1\EquipmentBasketController::class, 'returnBasket']);
    });

    // Public pre-registration routes (no authentication required)
    // Note: These catch-all routes come AFTER authenticated routes to avoid conflicts
    Route::prefix('pre-registration')->group(function () {
        Route::get('/{token}', [\App\Http\Controllers\Api\V1\CustomerPreRegistrationController::class, 'getByToken'])->where('token', '[a-zA-Z0-9\-]+');
        Route::post('/{token}/submit', [\App\Http\Controllers\Api\V1\CustomerPreRegistrationController::class, 'submit'])->where('token', '[a-zA-Z0-9\-]+');
    });
});
