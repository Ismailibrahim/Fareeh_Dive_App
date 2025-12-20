<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Services\FileService;
use App\Rules\FileCategoryValidation;
use App\Exceptions\FileUploadException;
use App\Models\TenantFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FileUploadController extends Controller
{
    use AuthorizesDiveCenterAccess;

    public function __construct(
        private FileService $fileService
    ) {}

    /**
     * Upload a file.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->dive_center_id;

        // Validate request
        $validator = Validator::make($request->all(), [
            'file' => ['required', 'file'],
            'entityType' => ['required', 'string', 'in:customer,equipment,dive_site,invoice,equipment_item'],
            'entityId' => ['required', 'string'],
            'category' => [
                'required',
                'string',
                'in:customer-photo,dive-certificate,insurance-card,equipment-photo,dive-site-map,service-receipt,invoice'
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify entity exists and belongs to tenant
        $this->verifyEntityAccess($request->input('entityType'), $request->input('entityId'), $tenantId);

        // Validate file against category rules
        $file = $request->file('file');
        $category = $request->input('category');
        
        $categoryValidator = Validator::make(
            ['file' => $file],
            ['file' => [new FileCategoryValidation($category)]]
        );

        if ($categoryValidator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $categoryValidator->errors()->first('file')
            ], 422);
        }

        try {
            // Upload file
            $tenantFile = $this->fileService->uploadFile(
                $file,
                $tenantId,
                $request->input('entityType'),
                $request->input('entityId'),
                $category,
                $user
            );

            return response()->json([
                'success' => true,
                'fileId' => $tenantFile->id,
                'url' => $tenantFile->url,
                'originalName' => $tenantFile->original_name,
                'fileSize' => $tenantFile->file_size,
                'mimeType' => $tenantFile->mime_type,
                'category' => $tenantFile->file_category,
                'createdAt' => $tenantFile->created_at,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * List files for an entity.
     *
     * @param Request $request
     * @param string $entityType
     * @param string $entityId
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request, string $entityType, string $entityId)
    {
        $user = $request->user();
        $tenantId = $user->dive_center_id;

        // Verify entity access
        $this->verifyEntityAccess($entityType, $entityId, $tenantId);

        // Optional category filter
        $category = $request->query('category');

        $files = $this->fileService->getFilesForEntity(
            $tenantId,
            $entityType,
            $entityId,
            $category
        );

        return response()->json([
            'success' => true,
            'files' => $files->map(function ($file) {
                return [
                    'id' => $file->id,
                    'url' => $file->url,
                    'originalName' => $file->original_name,
                    'fileSize' => $file->file_size,
                    'mimeType' => $file->mime_type,
                    'category' => $file->file_category,
                    'uploadedBy' => $file->uploader->full_name ?? null,
                    'createdAt' => $file->created_at,
                ];
            })
        ]);
    }

    /**
     * Get file details.
     *
     * @param Request $request
     * @param int $fileId
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, int $fileId)
    {
        $user = $request->user();
        $tenantId = $user->dive_center_id;

        $file = TenantFile::findOrFail($fileId);
        
        // Verify file belongs to tenant
        if ($file->tenant_id !== $tenantId) {
            abort(403, 'Unauthorized access to this file');
        }

        return response()->json([
            'success' => true,
            'file' => [
                'id' => $file->id,
                'url' => $file->url,
                'originalName' => $file->original_name,
                'fileSize' => $file->file_size,
                'mimeType' => $file->mime_type,
                'category' => $file->file_category,
                'entityType' => $file->entity_type,
                'entityId' => $file->entity_id,
                'uploadedBy' => $file->uploader->full_name ?? null,
                'createdAt' => $file->created_at,
            ]
        ]);
    }

    /**
     * Delete a file.
     *
     * @param Request $request
     * @param int $fileId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, int $fileId)
    {
        $user = $request->user();
        $tenantId = $user->dive_center_id;

        $file = TenantFile::findOrFail($fileId);
        
        // Verify file belongs to tenant
        if ($file->tenant_id !== $tenantId) {
            abort(403, 'Unauthorized access to this file');
        }

        try {
            $this->fileService->deleteFile($file);
            
            return response()->json([
                'success' => true,
                'message' => 'File deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify that the entity exists and belongs to the tenant.
     *
     * @param string $entityType
     * @param string $entityId
     * @param int $tenantId
     * @return void
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    private function verifyEntityAccess(string $entityType, string $entityId, int $tenantId): void
    {
        $modelClass = $this->getModelClass($entityType);
        
        if (!$modelClass) {
            abort(400, "Invalid entity type: {$entityType}");
        }

        $entity = $modelClass::find($entityId);
        
        if (!$entity) {
            abort(404, "Entity not found");
        }

        // Check if entity has dive_center_id and it matches
        if (isset($entity->dive_center_id)) {
            if ($entity->dive_center_id !== $tenantId) {
                abort(403, 'Unauthorized access to this entity');
            }
        } else {
            // For entities without dive_center_id, we might need different logic
            // For now, we'll allow it but this should be reviewed per entity type
        }
    }

    /**
     * Get the model class for an entity type.
     *
     * @param string $entityType
     * @return string|null
     */
    private function getModelClass(string $entityType): ?string
    {
        $map = [
            'customer' => \App\Models\Customer::class,
            'equipment' => \App\Models\Equipment::class,
            'equipment_item' => \App\Models\EquipmentItem::class,
            'dive_site' => \App\Models\DiveSite::class,
            'invoice' => \App\Models\Invoice::class,
        ];

        return $map[$entityType] ?? null;
    }
}
