<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackagePricingTierResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'package_id' => $this->package_id,
            'min_persons' => $this->min_persons,
            'max_persons' => $this->max_persons,
            'price_per_person' => (float) $this->price_per_person,
            'discount_percentage' => (float) $this->discount_percentage,
            'is_active' => $this->is_active,
        ];
    }
}
