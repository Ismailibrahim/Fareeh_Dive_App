<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class StorageService
{
    private string $driver;

    public function __construct()
    {
        $this->driver = config('filesystems.default', 'local');
    }

    /**
     * Upload a file to storage.
     *
     * @param string $path The storage path
     * @param UploadedFile $file The file to upload
     * @return string The storage path
     */
    public function upload(string $path, UploadedFile $file): string
    {
        $disk = $this->getDisk();
        // Ensure directory exists
        $directory = dirname($path);
        Storage::disk($disk)->makeDirectory($directory);
        // Store file
        return $file->storeAs($directory, basename($path), $disk);
    }

    /**
     * Delete a file from storage.
     *
     * @param string $path The storage path
     * @return bool True if deleted successfully
     */
    public function delete(string $path): bool
    {
        $disk = $this->getDisk();
        return Storage::disk($disk)->delete($path);
    }

    /**
     * Get the URL for a file.
     *
     * @param string $path The storage path
     * @return string The file URL
     */
    public function url(string $path): string
    {
        $disk = $this->getDisk();
        return Storage::disk($disk)->url($path);
    }

    /**
     * Check if a file exists.
     *
     * @param string $path The storage path
     * @return bool True if file exists
     */
    public function exists(string $path): bool
    {
        $disk = $this->getDisk();
        return Storage::disk($disk)->exists($path);
    }

    /**
     * Get the storage disk to use.
     *
     * @return string The disk name
     */
    private function getDisk(): string
    {
        // For Phase 1, we use 'public' for local storage
        // For Phase 2, we'll switch to 's3' when STORAGE_DRIVER=s3
        if ($this->driver === 's3') {
            return 's3';
        }
        
        return 'public';
    }

    /**
     * Get the current storage driver.
     *
     * @return string
     */
    public function getDriver(): string
    {
        return $this->driver;
    }
}

