<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackageComponentResource extends JsonResource
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
            'component_type' => $this->component_type,
            'name' => $this->name,
            'description' => $this->description,
            'item_id' => $this->item_id,
            'unit_price' => (float) $this->unit_price,
            'quantity' => $this->quantity,
            'unit' => $this->unit,
            'total_price' => (float) $this->total_price,
            'is_inclusive' => $this->is_inclusive,
            'sort_order' => $this->sort_order,
        ];
    }
}
