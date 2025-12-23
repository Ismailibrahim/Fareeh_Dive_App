<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackageBreakdownResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $breakdown = $this->resource->getBreakdown();

        return [
            'package' => [
                'id' => $this->resource->id,
                'package_code' => $this->resource->package_code,
                'name' => $this->resource->name,
                'nights' => $this->resource->nights,
                'days' => $this->resource->days,
                'total_dives' => $this->resource->total_dives,
                'price_per_person' => (float) $this->resource->price_per_person,
                'base_price' => (float) $this->resource->base_price,
            ],
            'breakdown' => $breakdown,
            'total_price' => (float) $this->resource->base_price,
        ];
    }
}
