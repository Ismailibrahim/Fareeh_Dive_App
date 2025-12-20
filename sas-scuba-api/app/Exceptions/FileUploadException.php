<?php

namespace App\Exceptions;

use Exception;

class FileUploadException extends Exception
{
    public static function fileTooLarge(int $maxSizeMB): self
    {
        return new self("File must be less than {$maxSizeMB}MB", 422);
    }

    public static function invalidFileType(array $allowedTypes): self
    {
        $types = implode(', ', $allowedTypes);
        return new self("Only {$types} files are allowed", 422);
    }

    public static function storageQuotaExceeded(): self
    {
        return new self("Storage limit reached. Please upgrade your plan.", 403);
    }

    public static function uploadFailed(string $reason = 'Unknown error'): self
    {
        return new self("Upload failed: {$reason}", 500);
    }

    public static function permissionDenied(): self
    {
        return new self("You don't have permission to upload here", 403);
    }

    public static function entityNotFound(): self
    {
        return new self("The entity you're trying to upload to does not exist", 404);
    }
}

