<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $user = User::create([
                'full_name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            // Use session-based authentication for SPA
            Auth::login($user);

            // Query user directly from database to avoid serialization issues
            $userData = DB::table('users')
                ->select([
                    'id',
                    'dive_center_id',
                    'full_name',
                    'email',
                    'phone',
                    'role',
                    'active',
                    'created_at',
                    'updated_at',
                ])
                ->where('id', $user->id)
                ->first();

            return response()->json([
                'user' => (array) $userData,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('AuthController::register - Error during registration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw ValidationException::withMessages([
                'email' => ['Registration failed. Please try again.'],
            ]);
        }
    }

    public function login(Request $request)
    {
        try {
            Log::info('Login attempt', [
                'email' => $request->email,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $request->validate([
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            if (!Auth::attempt($request->only('email', 'password'))) {
                Log::warning('Login failed - Invalid credentials', [
                    'email' => $request->email,
                    'ip' => $request->ip(),
                ]);
                throw ValidationException::withMessages([
                    'email' => ['Invalid credentials'],
                ]);
            }

            $userId = Auth::id();
            $request->session()->regenerate();

            // Query user directly from database to avoid serialization issues
            $user = DB::table('users')
                ->select([
                    'id',
                    'dive_center_id',
                    'full_name',
                    'email',
                    'phone',
                    'role',
                    'active',
                    'created_at',
                    'updated_at',
                ])
                ->where('id', $userId)
                ->first();

            if (!$user) {
                Log::warning('AuthController::login - User not found after authentication', [
                    'user_id' => $userId,
                ]);
                Auth::logout();
                throw ValidationException::withMessages([
                    'email' => ['Authentication failed'],
                ]);
            }

            return response()->json([
                'user' => (array) $user,
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('AuthController::login - Error during login', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw ValidationException::withMessages([
                'email' => ['Login failed. Please try again.'],
            ]);
        }
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        try {
            // Use Auth::id() instead of $request->user() to avoid any model serialization
            // This only gets the ID without loading the full user model
            $userId = Auth::id();
            
            if (!$userId) {
                return response()->json([
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Query user directly from database using DB facade to completely bypass Eloquent
            // This avoids any model serialization, relationship, or accessor issues
            $user = DB::table('users')
                ->select([
                    'id',
                    'dive_center_id',
                    'full_name',
                    'email',
                    'phone',
                    'role',
                    'active',
                    'created_at',
                    'updated_at',
                ])
                ->where('id', $userId)
                ->first();

            if (!$user) {
                Log::warning('AuthController::user - User not found in database', [
                    'user_id' => $userId,
                ]);
                return response()->json([
                    'message' => 'User not found'
                ], 404);
            }

            // Convert stdClass to array - this is completely safe and bypasses all Eloquent issues
            return response()->json((array) $user);
            
        } catch (\Illuminate\Auth\AuthenticationException $e) {
            Log::warning('AuthController::user - Authentication exception', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'User not authenticated'
            ], 401);
        } catch (\Exception $e) {
            $userId = null;
            try {
                $userId = Auth::id();
            } catch (\Exception $ex) {
                // Ignore errors when trying to get user ID for logging
            }
            
            Log::error('AuthController::user - Error fetching authenticated user', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'user_id' => $userId,
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch user information',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while fetching user information'
            ], 500);
        }
    }
}
