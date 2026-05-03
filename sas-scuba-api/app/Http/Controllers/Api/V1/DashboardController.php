<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\BookingDive;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get dashboard summary statistics.
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        if (!$diveCenterId) {
            return response()->json(['message' => 'Dive center not found'], 404);
        }

        // 1. Total Revenue (sum of paid invoices)
        $totalRevenue = Invoice::where('dive_center_id', $diveCenterId)
            ->where('status', 'Paid')
            ->sum('total');

        // Revenue growth (this month vs last month)
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();

        $thisMonthRevenue = Invoice::where('dive_center_id', $diveCenterId)
            ->where('status', 'Paid')
            ->whereBetween('created_at', [$startOfMonth, Carbon::now()])
            ->sum('total');

        $lastMonthRevenue = Invoice::where('dive_center_id', $diveCenterId)
            ->where('status', 'Paid')
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('total');

        $revenueGrowth = $lastMonthRevenue > 0 
            ? round((($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : ($thisMonthRevenue > 0 ? 100 : 0);

        // 2. Active Bookings (Confirmed/Scheduled)
        $activeBookingsCount = Booking::where('dive_center_id', $diveCenterId)
            ->whereIn('status', ['Confirmed', 'Partially Paid'])
            ->count();

        // Bookings since last hour
        $lastHour = Carbon::now()->subHour();
        $newBookingsLastHour = Booking::where('dive_center_id', $diveCenterId)
            ->where('created_at', '>=', $lastHour)
            ->count();

        // 3. Active Customers (total customers for this dive center)
        $totalCustomers = Customer::where('dive_center_id', $diveCenterId)->count();
        $newCustomersThisMonth = Customer::where('dive_center_id', $diveCenterId)
            ->where('created_at', '>=', $startOfMonth)
            ->count();

        // 4. Dives Today
        $today = Carbon::today();
        $divesToday = BookingDive::whereHas('booking', function($q) use ($diveCenterId) {
                $q->where('dive_center_id', $diveCenterId);
            })
            ->whereDate('dive_date', $today)
            ->count();

        $divesSinceLastHour = BookingDive::whereHas('booking', function($q) use ($diveCenterId) {
                $q->where('dive_center_id', $diveCenterId);
            })
            ->whereDate('dive_date', $today)
            ->where('created_at', '>=', $lastHour)
            ->count();

        return response()->json([
            'revenue' => [
                'total' => (float) $totalRevenue,
                'this_month' => (float) $thisMonthRevenue,
                'growth' => $revenueGrowth,
            ],
            'bookings' => [
                'active' => $activeBookingsCount,
                'new_last_hour' => $newBookingsLastHour,
            ],
            'customers' => [
                'total' => $totalCustomers,
                'new_this_month' => $newCustomersThisMonth,
            ],
            'dives' => [
                'today' => $divesToday,
                'new_last_hour' => $divesSinceLastHour,
            ]
        ]);
    }
}
