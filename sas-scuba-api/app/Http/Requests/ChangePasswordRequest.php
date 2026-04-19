<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by auth middleware
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $user = $this->user();
            
            if (!$user) {
                $validator->errors()->add('current_password', 'User not authenticated.');
                return;
            }

            // Check current password
            if (!Hash::check($this->current_password, $user->password)) {
                $validator->errors()->add('current_password', 'The current password is incorrect.');
            }

            // Check new password is different from current
            if (Hash::check($this->password, $user->password)) {
                $validator->errors()->add('password', 'The new password must be different from your current password.');
            }
        });
    }
}
