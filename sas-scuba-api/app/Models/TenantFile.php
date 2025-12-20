<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantFile extends Model
{
    protected $fillable = [
        'tenant_id',
        'entity_type',
        'entity_id',
        'file_category',
        'original_name',
        'storage_path',
        'file_size',
        'mime_type',
        'storage_driver',
        'uploaded_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    /**
     * Get the dive center (tenant) that owns this file.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(DiveCenter::class, 'tenant_id');
    }

    /**
     * Get the user who uploaded this file.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the full URL to access this file.
     */
    public function getUrlAttribute(): string
    {
        if ($this->storage_driver === 's3') {
            return \Storage::disk('s3')->url($this->storage_path);
        }
        
        return \Storage::disk('public')->url($this->storage_path);
    }

    /**
     * Scope to filter files by tenant.
     */
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to filter files by entity.
     */
    public function scopeForEntity($query, string $entityType, string $entityId)
    {
        return $query->where('entity_type', $entityType)
            ->where('entity_id', $entityId);
    }

    /**
     * Scope to filter files by category.
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('file_category', $category);
    }
}

