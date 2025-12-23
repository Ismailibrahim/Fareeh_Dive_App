<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackageOptionResource extends JsonResource
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
            'name' => $this->name,
            'description' => $this->description,
            'item_id' => $this->item_id,
            'price' => (float) $this->price,
            'unit' => $this->unit,
            'is_active' => $this->is_active,
            'max_quantity' => $this->max_quantity,
            'sort_order' => $this->sort_order,
        ];
    }
}
