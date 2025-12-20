<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TenantFile;
use App\Models\TenantStorageUsage;
use App\Services\StorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileStorageController extends Controller
{
    public function __construct(
        private StorageService $storageService
    ) {}

    /**
     * Get storage usage for the current tenant.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function usage(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->dive_center_id;

        $usage = TenantStorageUsage::firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'storage_bytes' => 0,
                'file_count' => 0,
                'last_updated' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'usage' => [
                'storageBytes' => $usage->storage_bytes,
                'storageFormatted' => $usage->formatted_storage,
                'fileCount' => $usage->file_count,
                'lastUpdated' => $usage->last_updated,
            ]
        ]);
    }

    /**
     * Download a file securely.
     *
     * @param Request $request
     * @param int $fileId
     * @return \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
     */
    public function download(Request $request, int $fileId)
    {
        $user = $request->user();
        $tenantId = $user->dive_center_id;

        $file = TenantFile::findOrFail($fileId);
        
        // Verify file belongs to tenant
        if ($file->tenant_id !== $tenantId) {
            abort(403, 'Unauthorized access to this file');
        }

        // Get the appropriate disk
        $disk = $file->storage_driver === 's3' ? 's3' : 'public';
        
        // Check if file exists
        if (!Storage::disk($disk)->exists($file->storage_path)) {
            abort(404, 'File not found in storage');
        }

        // Return file download
        return Storage::disk($disk)->download(
            $file->storage_path,
            $file->original_name
        );
    }
}

