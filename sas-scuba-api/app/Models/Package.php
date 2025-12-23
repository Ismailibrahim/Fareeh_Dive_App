<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Package extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'dive_center_id',
        'package_code',
        'name',
        'description',
        'nights',
        'days',
        'total_dives',
        'base_price',
        'price_per_person',
        'currency',
        'is_active',
        'sort_order',
        'valid_from',
        'valid_until',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'price_per_person' => 'decimal:2',
        'is_active' => 'boolean',
        'nights' => 'integer',
        'days' => 'integer',
        'total_dives' => 'integer',
        'sort_order' => 'integer',
        'valid_from' => 'date',
        'valid_until' => 'date',
    ];

    // Relationships
    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function components()
    {
        return $this->hasMany(PackageComponent::class)->orderBy('sort_order');
    }

    public function options()
    {
        return $this->hasMany(PackageOption::class)->orderBy('sort_order');
    }

    public function pricingTiers()
    {
        return $this->hasMany(PackagePricingTier::class)->orderBy('min_persons');
    }

    public function bookings()
    {
        return $this->hasMany(PackageBooking::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForDiveCenter($query, $diveCenterId)
    {
        return $query->where('dive_center_id', $diveCenterId);
    }

    public function scopeAvailable($query, $date = null)
    {
        if ($date === null) {
            $date = now()->toDateString();
        }

        return $query->where(function ($q) use ($date) {
            $q->whereNull('valid_from')
              ->orWhere('valid_from', '<=', $date);
        })->where(function ($q) use ($date) {
            $q->whereNull('valid_until')
              ->orWhere('valid_until', '>=', $date);
        });
    }

    // Methods
    public function isAvailable($date = null): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($date === null) {
            $date = now()->toDateString();
        }

        if ($this->valid_from && $date < $this->valid_from) {
            return false;
        }

        if ($this->valid_until && $date > $this->valid_until) {
            return false;
        }

        return true;
    }

    public function calculatePrice(int $persons, array $optionIds = []): float
    {
        // Get base price per person based on group size
        $tier = $this->pricingTiers()
            ->where('is_active', true)
            ->where('min_persons', '<=', $persons)
            ->where(function ($q) use ($persons) {
                $q->whereNull('max_persons')
                  ->orWhere('max_persons', '>=', $persons);
            })
            ->orderBy('min_persons', 'desc')
            ->first();

        $basePricePerPerson = $tier ? $tier->price_per_person : $this->price_per_person;
        $baseTotal = $basePricePerPerson * $persons;

        // Add options
        $optionsTotal = 0;
        if (!empty($optionIds)) {
            $options = $this->options()
                ->where('is_active', true)
                ->whereIn('id', $optionIds)
                ->get();

            foreach ($options as $option) {
                $optionsTotal += $option->price;
            }
        }

        return (float) ($baseTotal + $optionsTotal);
    }

    public function getBreakdown(): array
    {
        $breakdown = [
            [
                'type' => 'Item Name',
                'name' => $this->name,
                'description' => '',
                'unit_price' => $this->price_per_person,
                'quantity' => 1,
                'unit' => 'person',
                'total' => $this->price_per_person,
            ],
            [
                'type' => 'Breakdown',
                'name' => '',
                'description' => '',
                'unit_price' => null,
                'quantity' => null,
                'unit' => '',
                'total' => null,
            ],
        ];

        foreach ($this->components()->orderBy('sort_order')->get() as $component) {
            $breakdown[] = [
                'type' => $component->component_type,
                'name' => $component->name,
                'description' => $component->description ?? '',
                'unit_price' => $component->unit_price,
                'quantity' => $component->quantity,
                'unit' => $component->unit,
                'total' => $component->total_price,
            ];
        }

        $breakdown[] = [
            'type' => 'Total',
            'name' => '',
            'description' => '',
            'unit_price' => null,
            'quantity' => null,
            'unit' => '',
            'total' => $this->base_price,
        ];

        return $breakdown;
    }

    public function validateBreakdown(): bool
    {
        $componentsTotal = $this->components()
            ->where('is_inclusive', true)
            ->sum('total_price');

        return abs($componentsTotal - $this->base_price) < 0.01; // Allow for floating point precision
    }
}
