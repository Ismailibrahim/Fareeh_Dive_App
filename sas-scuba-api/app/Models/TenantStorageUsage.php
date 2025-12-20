<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantStorageUsage extends Model
{
    protected $primaryKey = 'tenant_id';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'tenant_id',
        'storage_bytes',
        'file_count',
    ];

    protected $casts = [
        'storage_bytes' => 'integer',
        'file_count' => 'integer',
        'last_updated' => 'datetime',
    ];

    public $timestamps = false;

    /**
     * Get the dive center (tenant) for this storage usage.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(DiveCenter::class, 'tenant_id');
    }

    /**
     * Increment storage usage when a file is uploaded.
     */
    public function incrementUsage(int $fileSize): void
    {
        $this->increment('storage_bytes', $fileSize);
        $this->increment('file_count');
        $this->update(['last_updated' => now()]);
    }

    /**
     * Decrement storage usage when a file is deleted.
     */
    public function decrementUsage(int $fileSize): void
    {
        $this->decrement('storage_bytes', $fileSize);
        $this->decrement('file_count');
        $this->update(['last_updated' => now()]);
    }

    /**
     * Get storage usage in human-readable format.
     */
    public function getFormattedStorageAttribute(): string
    {
        $bytes = $this->storage_bytes;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}

