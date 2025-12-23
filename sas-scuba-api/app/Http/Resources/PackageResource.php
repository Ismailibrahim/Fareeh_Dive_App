<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackageResource extends JsonResource
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
            'dive_center_id' => $this->dive_center_id,
            'package_code' => $this->package_code,
            'name' => $this->name,
            'description' => $this->description,
            'nights' => $this->nights,
            'days' => $this->days,
            'total_dives' => $this->total_dives,
            'base_price' => (float) $this->base_price,
            'price_per_person' => (float) $this->price_per_person,
            'currency' => $this->currency,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'valid_from' => $this->valid_from?->format('Y-m-d'),
            'valid_until' => $this->valid_until?->format('Y-m-d'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relationships
            'components' => PackageComponentResource::collection($this->whenLoaded('components')),
            'options' => PackageOptionResource::collection($this->whenLoaded('options')),
            'pricing_tiers' => PackagePricingTierResource::collection($this->whenLoaded('pricingTiers')),
            'dive_center' => new DiveCenterResource($this->whenLoaded('diveCenter')),
        ];
    }
}
