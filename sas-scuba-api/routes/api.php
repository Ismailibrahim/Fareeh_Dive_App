<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\AuthController;

Route::prefix('v1')->group(function () {
    // Auth Routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        // Dive Center Settings
    Route::get('/dive-center', [App\Http\Controllers\Api\V1\DiveCenterController::class, 'show']);
    Route::put('/dive-center', [App\Http\Controllers\Api\V1\DiveCenterController::class, 'update']);
    Route::get('/dive-center/currency-rates', [App\Http\Controllers\Api\V1\DiveCenterController::class, 'getCurrencyRates']);
    Route::put('/dive-center/currency-rates', [App\Http\Controllers\Api\V1\DiveCenterController::class, 'updateCurrencyRates']);
    Route::get('/dive-center/available-currencies', [App\Http\Controllers\Api\V1\DiveCenterController::class, 'getAvailableCurrencies']);

        Route::apiResource('customers', \App\Http\Controllers\Api\V1\CustomerController::class);
        Route::apiResource('customers.emergency-contacts', \App\Http\Controllers\Api\V1\EmergencyContactController::class)->except(['index']);
        Route::get('customers/{customer}/emergency-contacts', [\App\Http\Controllers\Api\V1\EmergencyContactController::class, 'index']);
        Route::get('emergency-contacts', [\App\Http\Controllers\Api\V1\EmergencyContactController::class, 'listAll']);
        Route::apiResource('customer-certifications', \App\Http\Controllers\Api\V1\CustomerCertificationController::class);
        Route::apiResource('customer-insurances', \App\Http\Controllers\Api\V1\CustomerInsuranceController::class);
        Route::apiResource('customer-accommodations', \App\Http\Controllers\Api\V1\CustomerAccommodationController::class);
        Route::post('upload', [\App\Http\Controllers\Api\V1\FileUploadController::class, 'upload']);
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
        Route::apiResource('equipment-items.service-history', \App\Http\Controllers\Api\V1\EquipmentServiceHistoryController::class)->except(['index']);
        Route::get('equipment-items/{equipmentItem}/service-history', [\App\Http\Controllers\Api\V1\EquipmentServiceHistoryController::class, 'index']);
        Route::post('equipment-items/bulk-service', [\App\Http\Controllers\Api\V1\EquipmentServiceHistoryController::class, 'bulkStore']);
        Route::apiResource('nationalities', \App\Http\Controllers\Api\V1\NationalityController::class);
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
        
        // Price list items routes
        Route::apiResource('price-list-items', \App\Http\Controllers\Api\V1\PriceListItemController::class);
        Route::post('/price-list-items/bulk', [\App\Http\Controllers\Api\V1\PriceListItemController::class, 'bulkUpdate']);
        Route::apiResource('dive-packages', \App\Http\Controllers\Api\V1\DivePackageController::class);
        Route::get('dive-packages/{divePackage}/status', [\App\Http\Controllers\Api\V1\DivePackageController::class, 'status']);
        Route::apiResource('invoices', \App\Http\Controllers\Api\V1\InvoiceController::class);
        Route::post('invoices/generate-from-booking', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'generateFromBooking']);
        Route::post('invoices/{invoice}/add-damage-charge', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'addDamageCharge']);
        Route::apiResource('payments', \App\Http\Controllers\Api\V1\PaymentController::class);
        Route::apiResource('equipment-baskets', \App\Http\Controllers\Api\V1\EquipmentBasketController::class);
        Route::put('equipment-baskets/{equipmentBasket}/return', [\App\Http\Controllers\Api\V1\EquipmentBasketController::class, 'returnBasket']);
    });
});
