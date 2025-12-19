<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $currentUser = $request->user();
        if ($currentUser->dive_center_id) {
            return User::where('dive_center_id', $currentUser->dive_center_id)
                ->select('id', 'dive_center_id', 'full_name', 'email', 'phone', 'role', 'active', 'created_at', 'updated_at')
                ->paginate(20);
        }
        return User::select('id', 'dive_center_id', 'full_name', 'email', 'phone', 'role', 'active', 'created_at', 'updated_at')
            ->paginate(20);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge(['dive_center_id' => $request->user()->dive_center_id]);

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:50',
            'role' => 'required|in:Admin,Instructor,DiveMaster,Agent',
            'active' => 'boolean',
            'dive_center_id' => 'required|exists:dive_centers,id',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['active'] = $validated['active'] ?? true;

        $user = User::create($validated);
        
        // Return user without password
        $user->makeHidden(['password', 'remember_token']);
        return response()->json($user, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        // Ensure user belongs to the same dive center
        $currentUser = request()->user();
        if ($currentUser->dive_center_id && $user->dive_center_id !== $currentUser->dive_center_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user->makeHidden(['password', 'remember_token']);
        return $user;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        // Ensure user belongs to the same dive center
        $currentUser = $request->user();
        if ($currentUser->dive_center_id && $user->dive_center_id !== $currentUser->dive_center_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'phone' => 'nullable|string|max:50',
            'role' => 'sometimes|in:Admin,Instructor,DiveMaster,Agent',
            'active' => 'sometimes|boolean',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);
        
        // Return user without password
        $user->makeHidden(['password', 'remember_token']);
        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        // Ensure user belongs to the same dive center
        $currentUser = request()->user();
        if ($currentUser->dive_center_id && $user->dive_center_id !== $currentUser->dive_center_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Prevent deleting yourself
        if ($user->id === $currentUser->id) {
            return response()->json(['message' => 'You cannot delete your own account'], 403);
        }

        $user->delete();
        return response()->noContent();
    }
}

