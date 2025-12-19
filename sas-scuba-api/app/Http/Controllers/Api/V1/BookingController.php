<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Booking::with(['customer', 'diveCenter']);

        // Add dive center scoping
        if ($user->dive_center_id) {
            $query->where('dive_center_id', $user->dive_center_id);
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'dive_center_id' => 'required|exists:dive_centers,id',
            'customer_id' => 'required|exists:customers,id',
            'start_date' => 'required|date',
            'number_of_divers' => 'nullable|integer|min:1',
            'dive_site_id' => 'nullable|exists:dive_sites,id',
            'status' => 'sometimes|string|in:Pending,Confirmed,Completed,Cancelled',
            'notes' => 'nullable|string',
        ]);

        // Map start_date to booking_date for database
        $bookingData = [
            'dive_center_id' => $validated['dive_center_id'],
            'customer_id' => $validated['customer_id'],
            'booking_date' => $validated['start_date'],
            'number_of_divers' => $validated['number_of_divers'] ?? null,
            'status' => $validated['status'] ?? 'Pending',
            'notes' => $validated['notes'] ?? null,
        ];

        $booking = Booking::create($bookingData);
        return response()->json($booking, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Booking $booking)
    {
        return $booking->load(['customer', 'diveCenter']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'status' => 'sometimes|string|in:Pending,Confirmed,Completed,Cancelled',
            'notes' => 'nullable|string',
            'start_date' => 'sometimes|date',
            'number_of_divers' => 'nullable|integer|min:1',
        ]);

        // Map start_date to booking_date if provided
        $updateData = [];
        if (isset($validated['start_date'])) {
            $updateData['booking_date'] = $validated['start_date'];
        }
        if (isset($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }
        if (isset($validated['notes'])) {
            $updateData['notes'] = $validated['notes'];
        }
        // Handle number_of_divers - allow null to clear the field
        if (array_key_exists('number_of_divers', $validated)) {
            $updateData['number_of_divers'] = $validated['number_of_divers'];
        }

        $booking->update($updateData);
        return response()->json($booking);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Booking $booking)
    {
        $booking->delete();
        return response()->noContent();
    }
}
