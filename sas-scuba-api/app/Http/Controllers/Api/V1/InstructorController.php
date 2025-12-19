<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Instructor;
use App\Models\User;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Instructor::with('user');
        
        // Filter by dive center through user relationship
        if ($user->dive_center_id) {
            $query->whereHas('user', function($q) use ($user) {
                $q->where('dive_center_id', $user->dive_center_id);
            });
        }
        
        // Filter by instructor_status if provided
        if ($request->has('instructor_status')) {
            $query->where('instructor_status', $request->instructor_status);
        }
        
        // Filter by availability_status if provided
        if ($request->has('availability_status')) {
            $query->where('availability_status', $request->availability_status);
        }
        
        return $query->latest()->paginate(20);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate user data if creating new user
        $userData = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'full_name' => 'required_without:user_id|string|max:255',
            'email' => 'required_without:user_id|email|max:255|unique:users,email',
            'password' => 'required_without:user_id|string|min:8',
            'phone' => 'nullable|string|max:50',
        ]);
        
        // Validate instructor data
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'instructor_number' => 'nullable|string|max:255',
            'certification_agency' => 'nullable|string|max:255',
            'certification_level' => 'nullable|string|max:255',
            'certification_date' => 'nullable|date',
            'certification_expiry' => 'nullable|date',
            'instructor_status' => 'nullable|in:Active,Suspended,Expired',
            'specializations' => 'nullable|array',
            'languages_spoken' => 'nullable|array',
            'max_depth_authorized' => 'nullable|integer|min:0',
            'max_students_per_class' => 'nullable|integer|min:1',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'emergency_contact_relationship' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'nationality' => 'nullable|string|max:255',
            'passport_number' => 'nullable|string|max:255',
            'availability_status' => 'nullable|in:Available,Unavailable,On Leave',
            'preferred_dive_times' => 'nullable|array',
            'max_dives_per_day' => 'nullable|integer|min:1',
            'medical_certificate_expiry' => 'nullable|date',
            'insurance_provider' => 'nullable|string|max:255',
            'insurance_provider_contact_no' => 'nullable|string|max:50',
            'insurance_type' => 'nullable|string|max:255',
            'insurance_policy_number' => 'nullable|string|max:255',
            'insurance_expiry' => 'nullable|date',
            'years_of_experience' => 'nullable|integer|min:0',
            'total_dives_logged' => 'nullable|integer|min:0',
            'total_students_certified' => 'nullable|integer|min:0',
            'bio' => 'nullable|string',
            'profile_photo_url' => 'nullable|string|max:255',
            'certificate_file_url' => 'nullable|string|max:255',
            'insurance_file_url' => 'nullable|string|max:255',
            'contract_file_url' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'hired_date' => 'nullable|date',
            'last_evaluation_date' => 'nullable|date',
            'performance_rating' => 'nullable|numeric|min:0|max:5',
        ]);
        
        // Create user if user_id not provided
        if (!$request->has('user_id') || !$request->user_id) {
            $currentUser = $request->user();
            $newUser = User::create([
                'dive_center_id' => $currentUser->dive_center_id,
                'full_name' => $userData['full_name'],
                'email' => $userData['email'],
                'password' => bcrypt($userData['password']),
                'phone' => $userData['phone'] ?? null,
                'role' => 'Instructor',
                'active' => true,
            ]);
            $validated['user_id'] = $newUser->id;
        } else {
            // Ensure the user has Instructor role
            $existingUser = User::findOrFail($validated['user_id']);
            if ($existingUser->role !== 'Instructor') {
                $existingUser->update(['role' => 'Instructor']);
            }
        }
        
        // Remove user creation fields from instructor data
        unset($validated['full_name'], $validated['email'], $validated['password'], $validated['phone']);
        
        $instructor = Instructor::create($validated);
        return response()->json($instructor->load('user'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Instructor $instructor)
    {
        return $instructor->load('user');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Instructor $instructor)
    {
        $validated = $request->validate([
            'instructor_number' => 'nullable|string|max:255',
            'certification_agency' => 'nullable|string|max:255',
            'certification_level' => 'nullable|string|max:255',
            'certification_date' => 'nullable|date',
            'certification_expiry' => 'nullable|date',
            'instructor_status' => 'nullable|in:Active,Suspended,Expired',
            'specializations' => 'nullable|array',
            'languages_spoken' => 'nullable|array',
            'max_depth_authorized' => 'nullable|integer|min:0',
            'max_students_per_class' => 'nullable|integer|min:1',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'emergency_contact_relationship' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'nationality' => 'nullable|string|max:255',
            'passport_number' => 'nullable|string|max:255',
            'availability_status' => 'nullable|in:Available,Unavailable,On Leave',
            'preferred_dive_times' => 'nullable|array',
            'max_dives_per_day' => 'nullable|integer|min:1',
            'medical_certificate_expiry' => 'nullable|date',
            'insurance_provider' => 'nullable|string|max:255',
            'insurance_provider_contact_no' => 'nullable|string|max:50',
            'insurance_type' => 'nullable|string|max:255',
            'insurance_policy_number' => 'nullable|string|max:255',
            'insurance_expiry' => 'nullable|date',
            'years_of_experience' => 'nullable|integer|min:0',
            'total_dives_logged' => 'nullable|integer|min:0',
            'total_students_certified' => 'nullable|integer|min:0',
            'bio' => 'nullable|string',
            'profile_photo_url' => 'nullable|string|max:255',
            'certificate_file_url' => 'nullable|string|max:255',
            'insurance_file_url' => 'nullable|string|max:255',
            'contract_file_url' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'hired_date' => 'nullable|date',
            'last_evaluation_date' => 'nullable|date',
            'performance_rating' => 'nullable|numeric|min:0|max:5',
        ]);

        $instructor->update($validated);
        return response()->json($instructor->load('user'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Instructor $instructor)
    {
        $instructor->delete();
        return response()->noContent();
    }
}
