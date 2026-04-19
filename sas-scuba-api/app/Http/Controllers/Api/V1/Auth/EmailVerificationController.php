<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\VerifyEmailRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EmailVerificationController extends Controller
{
    /**
     * Verify email with token
     */
    public function verify(VerifyEmailRequest $request)
    {
        try {
            // Find token record
            $tokenRecord = DB::table('email_verifications')
                ->where('email', $request->email)
                ->latest('created_at')
                ->first();

            if (!$tokenRecord) {
                throw ValidationException::withMessages([
                    'token' => ['Invalid or expired verification token.'],
                ]);
            }

            // Check token expiration (24 hours)
            $createdAt = \Carbon\Carbon::parse($tokenRecord->created_at);
            if ($createdAt->addHours(24)->isPast()) {
                DB::table('email_verifications')->where('email', $request->email)->delete();
                throw ValidationException::withMessages([
                    'token' => ['This verification token has expired.'],
                ]);
            }

            // Verify token
            if (!Hash::check($request->token, $tokenRecord->token)) {
                throw ValidationException::withMessages([
                    'token' => ['Invalid or expired verification token.'],
                ]);
            }

            // Update user email_verified_at
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                throw ValidationException::withMessages([
                    'email' => ['User not found.'],
                ]);
            }

            $user->email_verified_at = now();
            $user->save();

            // Delete token
            DB::table('email_verifications')->where('email', $request->email)->delete();

            Log::info('Email verified successfully', [
                'email' => $request->email,
            ]);

            return response()->json([
                'message' => 'Email verified successfully.',
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('EmailVerificationController::verify - Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw ValidationException::withMessages([
                'token' => ['Failed to verify email. Please try again.'],
            ]);
        }
    }

    /**
     * Resend verification email
     */
    public function resend(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->email_verified_at) {
                return response()->json([
                    'message' => 'Email is already verified.',
                ], 200);
            }

            // Generate token
            $token = Str::random(64);

            // Delete any existing tokens for this email
            DB::table('email_verifications')->where('email', $user->email)->delete();

            // Store token (hashed)
            DB::table('email_verifications')->insert([
                'email' => $user->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]);

            // Send email (for now, just log it)
            $verifyUrl = config('app.frontend_url', 'http://localhost:3000') . '/verify-email?token=' . $token . '&email=' . urlencode($user->email);
            
            Log::info('Verification email requested', [
                'email' => $user->email,
                'verify_url' => $verifyUrl,
            ]);

            // TODO: Send actual email when Mail is configured
            // Mail::to($user->email)->send(new EmailVerificationMail($token, $user->email));

            return response()->json([
                'message' => 'Verification email sent successfully.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('EmailVerificationController::resend - Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to send verification email. Please try again.',
            ], 500);
        }
    }
}
