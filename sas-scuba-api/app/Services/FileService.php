<?php

namespace App\Services;

use App\Models\TenantFile;
use App\Models\TenantStorageUsage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class FileService
{
    public function __construct(
        private StorageService $storageService
    ) {}

    /**
     * Upload a file and create database record.
     *
     * @param UploadedFile $file
     * @param int $tenantId
     * @param string $entityType
     * @param string $entityId
     * @param string $category
     * @param User $uploadedBy
     * @return TenantFile
     * @throws \Exception
     */
    public function uploadFile(
        UploadedFile $file,
        int $tenantId,
        string $entityType,
        string $entityId,
        string $category,
        User $uploadedBy
    ): TenantFile {
        // Generate storage path
        $path = $this->generateStoragePath($tenantId, $entityType, $entityId, $category, $file);
        
        // Upload file to storage
        $storagePath = $this->storageService->upload($path, $file);
        
        // Create database record
        $tenantFile = DB::transaction(function () use (
            $file,
            $tenantId,
            $entityType,
            $entityId,
            $category,
            $uploadedBy,
            $storagePath
        ) {
            $tenantFile = TenantFile::create([
                'tenant_id' => $tenantId,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'file_category' => $category,
                'original_name' => $file->getClientOriginalName(),
                'storage_path' => $storagePath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'storage_driver' => $this->storageService->getDriver(),
                'uploaded_by' => $uploadedBy->id,
            ]);

            // Update storage usage
            $this->updateStorageUsage($tenantId, $file->getSize(), 1);

            return $tenantFile;
        });

        return $tenantFile;
    }

    /**
     * Delete a file and remove database record.
     *
     * @param TenantFile $tenantFile
     * @return bool
     */
    public function deleteFile(TenantFile $tenantFile): bool
    {
        return DB::transaction(function () use ($tenantFile) {
            // Delete from storage
            $deleted = $this->storageService->delete($tenantFile->storage_path);
            
            if ($deleted) {
                // Update storage usage
                $this->updateStorageUsage(
                    $tenantFile->tenant_id,
                    -$tenantFile->file_size,
                    -1
                );
                
                // Delete database record
                $tenantFile->delete();
            }
            
            return $deleted;
        });
    }

    /**
     * Get files for an entity.
     *
     * @param int $tenantId
     * @param string $entityType
     * @param string $entityId
     * @param string|null $category Optional category filter
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getFilesForEntity(
        int $tenantId,
        string $entityType,
        string $entityId,
        ?string $category = null
    ) {
        $query = TenantFile::forTenant($tenantId)
            ->forEntity($entityType, $entityId);
        
        if ($category) {
            $query->byCategory($category);
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Generate storage path for a file.
     *
     * @param int $tenantId
     * @param string $entityType
     * @param string $entityId
     * @param string $category
     * @param UploadedFile $file
     * @return string
     */
    private function generateStoragePath(
        int $tenantId,
        string $entityType,
        string $entityId,
        string $category,
        UploadedFile $file
    ): string {
        // Get tenant slug (sanitized name)
        $tenant = \App\Models\DiveCenter::find($tenantId);
        $tenantSlug = $this->slugify($tenant->name ?? "tenant-{$tenantId}");
        
        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;
        
        // Build path: tenants/{tenant-slug}/{entity-type}/{entity-id}/{category}/{filename}
        return "uploads/tenants/{$tenantSlug}/{$entityType}/{$entityId}/{$category}/{$filename}";
    }

    /**
     * Update storage usage for a tenant.
     *
     * @param int $tenantId
     * @param int $sizeDelta Bytes to add (positive) or subtract (negative)
     * @param int $countDelta File count delta
     * @return void
     */
    private function updateStorageUsage(int $tenantId, int $sizeDelta, int $countDelta): void
    {
        $usage = TenantStorageUsage::firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'storage_bytes' => 0,
                'file_count' => 0,
                'last_updated' => now(),
            ]
        );

        if ($sizeDelta > 0) {
            $usage->increment('storage_bytes', $sizeDelta);
            $usage->increment('file_count', $countDelta);
        } else {
            $usage->decrement('storage_bytes', abs($sizeDelta));
            $usage->decrement('file_count', abs($countDelta));
        }
        
        $usage->update(['last_updated' => now()]);
    }

    /**
     * Convert string to URL-friendly slug.
     *
     * @param string $text
     * @return string
     */
    private function slugify(string $text): string
    {
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9]+/', '-', $text);
        $text = trim($text, '-');
        return $text ?: 'tenant';
    }
}

