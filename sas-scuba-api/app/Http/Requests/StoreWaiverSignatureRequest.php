<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWaiverSignatureRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'waiver_id' => ['required', 'exists:waivers,id'],
            'customer_id' => ['required', 'exists:customers,id'],
            'booking_id' => ['nullable', 'exists:bookings,id'],
            'signature_data' => ['required', 'string'], // Base64 encoded
            'signature_format' => ['nullable', 'in:png,svg,jpg'],
            'form_data' => ['nullable', 'array'],
            'witness_user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
