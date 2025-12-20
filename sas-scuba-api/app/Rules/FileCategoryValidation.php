<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Http\UploadedFile;

class FileCategoryValidation implements Rule
{
    private string $category;
    private string $message = '';

    // Category-specific validation rules
    private const RULES = [
        'customer-photo' => [
            'mimes' => ['jpeg', 'jpg', 'png', 'webp'],
            'max_size' => 5 * 1024 * 1024, // 5MB
            'min_dimensions' => [200, 200],
        ],
        'dive-certificate' => [
            'mimes' => ['jpeg', 'jpg', 'png', 'pdf'],
            'max_size' => 10 * 1024 * 1024, // 10MB
        ],
        'insurance-card' => [
            'mimes' => ['jpeg', 'jpg', 'png', 'pdf'],
            'max_size' => 5 * 1024 * 1024, // 5MB
        ],
        'equipment-photo' => [
            'mimes' => ['jpeg', 'jpg', 'png', 'webp'],
            'max_size' => 10 * 1024 * 1024, // 10MB
        ],
        'dive-site-map' => [
            'mimes' => ['jpeg', 'jpg', 'png', 'pdf'],
            'max_size' => 15 * 1024 * 1024, // 15MB
        ],
        'service-receipt' => [
            'mimes' => ['jpeg', 'jpg', 'png', 'pdf'],
            'max_size' => 5 * 1024 * 1024, // 5MB
        ],
        'invoice' => [
            'mimes' => ['pdf', 'jpeg', 'jpg', 'png'],
            'max_size' => 5 * 1024 * 1024, // 5MB
        ],
    ];

    public function __construct(string $category)
    {
        $this->category = $category;
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value): bool
    {
        if (!($value instanceof UploadedFile)) {
            $this->message = 'The file must be a valid uploaded file.';
            return false;
        }

        if (!isset(self::RULES[$this->category])) {
            $this->message = "Invalid file category: {$this->category}";
            return false;
        }

        $rules = self::RULES[$this->category];

        // Check file type
        $extension = strtolower($value->getClientOriginalExtension());
        $mimeType = $value->getMimeType();
        
        if (!in_array($extension, $rules['mimes']) && !$this->isValidMimeType($mimeType, $rules['mimes'])) {
            $allowedTypes = implode(', ', $rules['mimes']);
            $this->message = "File type not allowed. Allowed types: {$allowedTypes}";
            return false;
        }

        // Verify magic bytes (not just extension)
        if (!$this->verifyMagicBytes($value, $rules['mimes'])) {
            $this->message = 'File type does not match file content.';
            return false;
        }

        // Check file size
        if ($value->getSize() > $rules['max_size']) {
            $maxSizeMB = $rules['max_size'] / (1024 * 1024);
            $this->message = "File must be less than {$maxSizeMB}MB";
            return false;
        }

        // Check image dimensions for customer-photo
        if ($this->category === 'customer-photo' && isset($rules['min_dimensions'])) {
            $dimensions = getimagesize($value->getRealPath());
            if ($dimensions === false) {
                $this->message = 'Unable to read image dimensions.';
                return false;
            }
            
            [$minWidth, $minHeight] = $rules['min_dimensions'];
            if ($dimensions[0] < $minWidth || $dimensions[1] < $minHeight) {
                $this->message = "Image must be at least {$minWidth}x{$minHeight} pixels";
                return false;
            }
        }

        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message(): string
    {
        return $this->message;
    }

    /**
     * Check if MIME type is valid for the category.
     *
     * @param string $mimeType
     * @param array $allowedExtensions
     * @return bool
     */
    private function isValidMimeType(string $mimeType, array $allowedExtensions): bool
    {
        $mimeMap = [
            'jpeg' => ['image/jpeg'],
            'jpg' => ['image/jpeg'],
            'png' => ['image/png'],
            'webp' => ['image/webp'],
            'pdf' => ['application/pdf'],
        ];

        foreach ($allowedExtensions as $ext) {
            if (isset($mimeMap[$ext]) && in_array($mimeType, $mimeMap[$ext])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verify file magic bytes match the extension.
     *
     * @param UploadedFile $file
     * @param array $allowedExtensions
     * @return bool
     */
    private function verifyMagicBytes(UploadedFile $file, array $allowedExtensions): bool
    {
        $path = $file->getRealPath();
        $handle = fopen($path, 'rb');
        
        if (!$handle) {
            return false;
        }

        $bytes = fread($handle, 12);
        fclose($handle);

        if (!$bytes) {
            return false;
        }

        // Magic byte signatures
        $signatures = [
            'jpeg' => ["\xFF\xD8\xFF"],
            'jpg' => ["\xFF\xD8\xFF"],
            'png' => ["\x89\x50\x4E\x47\x0D\x0A\x1A\x0A"],
            'webp' => ["RIFF", "WEBP"],
            'pdf' => ["%PDF"],
        ];

        foreach ($allowedExtensions as $ext) {
            if (!isset($signatures[$ext])) {
                continue;
            }

            foreach ($signatures[$ext] as $signature) {
                if (strpos($bytes, $signature) === 0) {
                    return true;
                }
            }
        }

        // For PDF, also check if it's a valid PDF structure
        if (in_array('pdf', $allowedExtensions)) {
            return strpos($bytes, '%PDF') === 0;
        }

        return false;
    }
}

