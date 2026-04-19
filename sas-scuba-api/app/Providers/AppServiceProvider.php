<?php

namespace App\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use App\Events\InvoiceCreated;
use App\Events\InvoicePaid;
use App\Listeners\CalculateCommissionOnInvoiceCreated;
use App\Listeners\CalculateCommissionOnInvoicePaid;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register event listeners for automatic commission calculation
        Event::listen(
            InvoiceCreated::class,
            CalculateCommissionOnInvoiceCreated::class
        );

        Event::listen(
            InvoicePaid::class,
            CalculateCommissionOnInvoicePaid::class
        );
    }
}
