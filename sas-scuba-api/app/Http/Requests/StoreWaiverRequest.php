<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWaiverRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled in controller
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $waiverId = $this->route('waiver')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:waivers,slug,' . $waiverId],
            'type' => ['required', 'in:liability,medical,checklist,custom'],
            'description' => ['nullable', 'string', 'max:1000'],
            'content' => ['required', 'string'],
            'fields' => ['nullable', 'array'],
            'translations' => ['nullable', 'array'],
            'requires_signature' => ['boolean'],
            'expiry_days' => ['nullable', 'integer', 'min:1', 'max:3650'], // Max 10 years
            'require_witness' => ['boolean'],
            'is_active' => ['boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'generate_qr_code' => ['boolean'],
        ];
    }
}
