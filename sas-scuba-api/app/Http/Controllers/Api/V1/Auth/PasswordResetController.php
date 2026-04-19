<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    /**
     * Send password reset email
     */
    public function forgot(ForgotPasswordRequest $request)
    {
        try {
            $user = User::where('email', $request->email)->first();

            // Don't reveal if email exists (security best practice)
            // Always return success message
            if (!$user) {
                return response()->json([
                    'message' => 'If that email address exists, we will send a password reset link.',
                ], 200);
            }

            // Generate token
            $token = Str::random(64);

            // Delete any existing tokens for this email
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            // Store token (hashed)
            DB::table('password_reset_tokens')->insert([
                'email' => $request->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]);

            // Send email (for now, just log it - implement Mail class later)
            $resetUrl = config('app.frontend_url', 'http://localhost:3000') . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);
            
            Log::info('Password reset requested', [
                'email' => $request->email,
                'reset_url' => $resetUrl,
            ]);

            // TODO: Send actual email when Mail is configured
            // Mail::to($request->email)->send(new PasswordResetMail($token, $request->email));

            return response()->json([
                'message' => 'If that email address exists, we will send a password reset link.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('PasswordResetController::forgot - Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Still return success to prevent email enumeration
            return response()->json([
                'message' => 'If that email address exists, we will send a password reset link.',
            ], 200);
        }
    }

    /**
     * Reset password with token
     */
    public function reset(ResetPasswordRequest $request)
    {
        try {
            // Find token record
            $tokenRecord = DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->first();

            if (!$tokenRecord) {
                throw ValidationException::withMessages([
                    'token' => ['Invalid or expired reset token.'],
                ]);
            }

            // Check token expiration (60 minutes)
            $createdAt = \Carbon\Carbon::parse($tokenRecord->created_at);
            if ($createdAt->addMinutes(60)->isPast()) {
                DB::table('password_reset_tokens')->where('email', $request->email)->delete();
                throw ValidationException::withMessages([
                    'token' => ['This password reset token has expired.'],
                ]);
            }

            // Verify token
            if (!Hash::check($request->token, $tokenRecord->token)) {
                throw ValidationException::withMessages([
                    'token' => ['Invalid or expired reset token.'],
                ]);
            }

            // Update password
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                throw ValidationException::withMessages([
                    'email' => ['User not found.'],
                ]);
            }

            $user->password = Hash::make($request->password);
            $user->save();

            // Delete token
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            Log::info('Password reset successful', [
                'email' => $request->email,
            ]);

            return response()->json([
                'message' => 'Password has been reset successfully.',
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('PasswordResetController::reset - Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw ValidationException::withMessages([
                'token' => ['Failed to reset password. Please try again.'],
            ]);
        }
    }
}
