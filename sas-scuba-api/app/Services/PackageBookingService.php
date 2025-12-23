<?php

namespace App\Services;

use App\Models\Package;
use App\Models\PackageBooking;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PackageBookingService
{
    /**
     * Create a package booking with validation
     */
    public function createBooking(array $data): PackageBooking
    {
        DB::beginTransaction();
        try {
            $package = Package::findOrFail($data['package_id']);
            
            // Calculate end date if not provided
            if (!isset($data['end_date'])) {
                $data['end_date'] = $this->calculateEndDate($package->id, $data['start_date']);
            }

            // Calculate total price
            $optionIds = $data['option_ids'] ?? [];
            $data['total_price'] = $package->calculatePrice($data['persons_count'], $optionIds);

            // Generate booking number
            if (!isset($data['booking_number'])) {
                $data['booking_number'] = PackageBooking::createBookingNumber();
            }

            $booking = PackageBooking::create($data);

            DB::commit();
            return $booking->load(['package', 'customer', 'diveCenter']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Calculate end date based on package days
     */
    public function calculateEndDate(int $packageId, string $startDate): string
    {
        $package = Package::findOrFail($packageId);
        $start = Carbon::parse($startDate);
        
        // End date is start_date + days - 1 (e.g., 8 days means 7 nights)
        $endDate = $start->copy()->addDays($package->days - 1);
        
        return $endDate->toDateString();
    }

    /**
     * Generate unique booking number
     */
    public function generateBookingNumber(): string
    {
        return PackageBooking::createBookingNumber();
    }

    /**
     * Convert package booking to regular bookings
     * Creates one booking per day or a single booking based on preference
     */
    public function createBookingsFromPackageBooking(int $packageBookingId, bool $createPerDay = true): array
    {
        $packageBooking = PackageBooking::with('package')->findOrFail($packageBookingId);
        $package = $packageBooking->package;
        
        DB::beginTransaction();
        try {
            $bookings = [];
            
            if ($createPerDay) {
                // Create one booking per day
                $startDate = Carbon::parse($packageBooking->start_date);
                $endDate = Carbon::parse($packageBooking->end_date);
                
                $currentDate = $startDate->copy();
                $dayNumber = 1;
                
                while ($currentDate->lte($endDate)) {
                    $booking = Booking::create([
                        'dive_center_id' => $packageBooking->dive_center_id,
                        'customer_id' => $packageBooking->customer_id,
                        'booking_date' => $currentDate->toDateString(),
                        'status' => 'Pending',
                        'number_of_divers' => $packageBooking->persons_count,
                        'notes' => "Package Booking: {$packageBooking->booking_number} - Day {$dayNumber}",
                    ]);
                    
                    $bookings[] = $booking;
                    $currentDate->addDay();
                    $dayNumber++;
                }
            } else {
                // Create single booking for entire package
                $booking = Booking::create([
                    'dive_center_id' => $packageBooking->dive_center_id,
                    'customer_id' => $packageBooking->customer_id,
                    'booking_date' => $packageBooking->start_date,
                    'status' => 'Pending',
                    'number_of_divers' => $packageBooking->persons_count,
                    'notes' => "Package Booking: {$packageBooking->booking_number}",
                ]);
                
                $bookings[] = $booking;
            }

            DB::commit();
            return $bookings;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}

