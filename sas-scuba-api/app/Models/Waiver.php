<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Waiver extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'dive_center_id',
        'name',
        'slug',
        'type',
        'description',
        'content',
        'fields',
        'translations',
        'requires_signature',
        'expiry_days',
        'require_witness',
        'is_active',
        'display_order',
        'generate_qr_code',
        'qr_code_url',
        'created_by',
    ];

    protected $casts = [
        'fields' => 'array',
        'translations' => 'array',
        'requires_signature' => 'boolean',
        'require_witness' => 'boolean',
        'is_active' => 'boolean',
        'generate_qr_code' => 'boolean',
        'expiry_days' => 'integer',
        'display_order' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($waiver) {
            if (empty($waiver->slug)) {
                $waiver->slug = Str::slug($waiver->name);
            }
        });
    }

    /**
     * Get the dive center that owns the waiver.
     */
    public function diveCenter(): BelongsTo
    {
        return $this->belongsTo(DiveCenter::class);
    }

    /**
     * Get all signatures for this waiver.
     */
    public function signatures(): HasMany
    {
        return $this->hasMany(WaiverSignature::class);
    }

    /**
     * Get the user who created this waiver.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to get only active waivers.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by dive center.
     */
    public function scopeForDiveCenter($query, int $diveCenterId)
    {
        return $query->where('dive_center_id', $diveCenterId);
    }

    /**
     * Scope to filter by type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Get translation for a specific locale and key.
     */
    public function getTranslation(string $locale, string $key, ?string $default = null): ?string
    {
        $translations = $this->translations ?? [];
        return $translations[$locale][$key] ?? $default ?? $this->{$key};
    }

    /**
     * Check if waiver has expiry configured.
     */
    public function hasExpiry(): bool
    {
        return $this->expiry_days !== null && $this->expiry_days > 0;
    }
}
