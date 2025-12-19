<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BookingInstructor;
use Illuminate\Http\Request;

class BookingInstructorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = BookingInstructor::with(['bookingDive.booking.customer', 'bookingDive.diveSite', 'user']);

        if ($user->dive_center_id) {
            $query->whereHas('bookingDive.booking', function ($q) use ($user) {
                $q->where('dive_center_id', $user->dive_center_id);
            });
        }

        return $query->paginate(20);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_dive_id' => 'required|exists:booking_dives,id',
            'user_id' => 'required|exists:users,id',
            'role' => 'nullable|string|max:255',
        ]);

        $bookingInstructor = BookingInstructor::create($validated);
        $bookingInstructor->load(['bookingDive.booking.customer', 'bookingDive.diveSite', 'user']);
        
        return response()->json($bookingInstructor, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(BookingInstructor $bookingInstructor)
    {
        $bookingInstructor->load(['bookingDive.booking.customer', 'bookingDive.diveSite', 'user']);
        return $bookingInstructor;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BookingInstructor $bookingInstructor)
    {
        $validated = $request->validate([
            'booking_dive_id' => 'sometimes|exists:booking_dives,id',
            'user_id' => 'sometimes|exists:users,id',
            'role' => 'nullable|string|max:255',
        ]);

        $bookingInstructor->update($validated);
        $bookingInstructor->load(['bookingDive.booking.customer', 'bookingDive.diveSite', 'user']);
        
        return response()->json($bookingInstructor);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BookingInstructor $bookingInstructor)
    {
        $bookingInstructor->delete();
        return response()->noContent();
    }
}

