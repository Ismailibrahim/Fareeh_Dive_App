<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class PasswordController extends Controller
{
    /**
     * Change password (authenticated users)
     */
    public function change(ChangePasswordRequest $request)
    {
        try {
            $user = $request->user();

            $user->password = Hash::make($request->password);
            $user->save();

            Log::info('Password changed successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            return response()->json([
                'message' => 'Password changed successfully.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('PasswordController::change - Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to change password. Please try again.',
            ], 500);
        }
    }
}
