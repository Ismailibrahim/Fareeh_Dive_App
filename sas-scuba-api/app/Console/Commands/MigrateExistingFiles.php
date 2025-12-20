<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TenantFile;
use App\Models\TenantStorageUsage;
use App\Models\DiveCenter;
use App\Models\Customer;
use App\Models\EquipmentItem;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class MigrateExistingFiles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'files:migrate-existing 
                            {--dry-run : Run without making changes}
                            {--force : Force migration even if files already exist}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate existing uploaded files to the new tenant-isolated structure';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        if ($dryRun) {
            $this->info('DRY RUN MODE - No changes will be made');
        }

        $publicPath = storage_path('app/public');
        
        if (!File::exists($publicPath)) {
            $this->error('Public storage directory does not exist');
            return 1;
        }

        $this->info('Scanning existing files...');
        
        // Map old folder structure to new entity types
        $folderMap = [
            'certifications' => ['entity_type' => 'customer', 'category' => 'dive-certificate'],
            'customers' => ['entity_type' => 'customer', 'category' => 'customer-photo'],
            'equipment-items' => ['entity_type' => 'equipment_item', 'category' => 'equipment-photo'],
            'instructors' => ['entity_type' => 'instructor', 'category' => 'dive-certificate'],
            'agents' => ['entity_type' => 'agent', 'category' => 'invoice'],
        ];

        $migrated = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($folderMap as $oldFolder => $config) {
            $oldPath = $publicPath . '/' . $oldFolder;
            
            if (!File::exists($oldPath)) {
                continue;
            }

            $this->info("Processing folder: {$oldFolder}");

            // Get all files in the folder
            $files = File::allFiles($oldPath);

            foreach ($files as $file) {
                try {
                    $result = $this->migrateFile(
                        $file,
                        $oldFolder,
                        $config['entity_type'],
                        $config['category'],
                        $dryRun,
                        $force
                    );

                    if ($result === 'migrated') {
                        $migrated++;
                    } elseif ($result === 'skipped') {
                        $skipped++;
                    } else {
                        $errors++;
                    }
                } catch (\Exception $e) {
                    $this->error("Error migrating {$file->getFilename()}: " . $e->getMessage());
                    $errors++;
                }
            }
        }

        $this->info("\nMigration complete:");
        $this->info("  Migrated: {$migrated}");
        $this->info("  Skipped: {$skipped}");
        $this->info("  Errors: {$errors}");

        return 0;
    }

    /**
     * Migrate a single file.
     *
     * @param \SplFileInfo $file
     * @param string $oldFolder
     * @param string $entityType
     * @param string $category
     * @param bool $dryRun
     * @param bool $force
     * @return string
     */
    private function migrateFile(
        \SplFileInfo $file,
        string $oldFolder,
        string $entityType,
        string $category,
        bool $dryRun,
        bool $force
    ): string {
        $relativePath = str_replace(storage_path('app/public') . '/', '', $file->getPathname());
        
        // Check if file already migrated
        $existing = TenantFile::where('storage_path', $relativePath)->first();
        if ($existing && !$force) {
            $this->warn("  Skipping {$file->getFilename()} (already migrated)");
            return 'skipped';
        }

        // Try to determine entity_id from file path or name
        // This is a best-effort approach - may need manual review
        $entityId = $this->guessEntityId($file, $oldFolder, $entityType);

        if (!$entityId) {
            $this->warn("  Skipping {$file->getFilename()} (cannot determine entity)");
            return 'skipped';
        }

        // Get tenant_id from entity
        $tenantId = $this->getTenantIdFromEntity($entityType, $entityId);

        if (!$tenantId) {
            $this->warn("  Skipping {$file->getFilename()} (entity not found)");
            return 'skipped';
        }

        if ($dryRun) {
            $this->info("  Would migrate: {$file->getFilename()} -> tenant {$tenantId}, {$entityType} {$entityId}");
            return 'migrated';
        }

        // Create database record
        $tenantFile = TenantFile::create([
            'tenant_id' => $tenantId,
            'entity_type' => $entityType,
            'entity_id' => (string) $entityId,
            'file_category' => $category,
            'original_name' => $file->getFilename(),
            'storage_path' => $relativePath,
            'file_size' => $file->getSize(),
            'mime_type' => mime_content_type($file->getPathname()) ?: 'application/octet-stream',
            'storage_driver' => 'local',
            'uploaded_by' => null, // Unknown for migrated files
        ]);

        // Update storage usage
        $usage = TenantStorageUsage::firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'storage_bytes' => 0,
                'file_count' => 0,
                'last_updated' => now(),
            ]
        );
        $usage->incrementUsage($file->getSize());

        $this->info("  Migrated: {$file->getFilename()}");
        return 'migrated';
    }

    /**
     * Try to guess entity ID from file path or name.
     *
     * @param \SplFileInfo $file
     * @param string $oldFolder
     * @param string $entityType
     * @return int|null
     */
    private function guessEntityId(\SplFileInfo $file, string $oldFolder, string $entityType): ?int
    {
        $path = $file->getPathname();
        
        // Try to extract ID from path (e.g., customers/123/file.jpg)
        if (preg_match('/\/(\d+)\//', $path, $matches)) {
            return (int) $matches[1];
        }

        // For customer certifications, try to find by file URL in existing records
        if ($oldFolder === 'certifications') {
            // This would require checking customer_certifications table
            // For now, return null and let user manually migrate
        }

        return null;
    }

    /**
     * Get tenant ID from entity.
     *
     * @param string $entityType
     * @param int $entityId
     * @return int|null
     */
    private function getTenantIdFromEntity(string $entityType, int $entityId): ?int
    {
        $modelClass = $this->getModelClass($entityType);
        
        if (!$modelClass) {
            return null;
        }

        $entity = $modelClass::find($entityId);
        
        return $entity->dive_center_id ?? null;
    }

    /**
     * Get model class for entity type.
     *
     * @param string $entityType
     * @return string|null
     */
    private function getModelClass(string $entityType): ?string
    {
        $map = [
            'customer' => Customer::class,
            'equipment_item' => EquipmentItem::class,
            'instructor' => \App\Models\Instructor::class,
            'agent' => \App\Models\Agent::class,
        ];

        return $map[$entityType] ?? null;
    }
}

