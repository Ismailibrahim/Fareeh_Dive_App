<?php

namespace App\Services;

use App\Models\Waiver;
use App\Models\WaiverSignature;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WaiverService
{
    /**
     * Create a new waiver.
     */
    public function createWaiver(array $data, int $diveCenterId, ?int $userId = null): Waiver
    {
        return DB::transaction(function () use ($data, $diveCenterId, $userId) {
            $waiver = Waiver::create([
                'dive_center_id' => $diveCenterId,
                'name' => $data['name'],
                'slug' => $data['slug'] ?? Str::slug($data['name']),
                'type' => $data['type'],
                'description' => $data['description'] ?? null,
                'content' => $data['content'],
                'fields' => $data['fields'] ?? null,
                'translations' => $data['translations'] ?? null,
                'requires_signature' => $data['requires_signature'] ?? true,
                'expiry_days' => $data['expiry_days'] ?? null,
                'require_witness' => $data['require_witness'] ?? false,
                'is_active' => $data['is_active'] ?? true,
                'display_order' => $data['display_order'] ?? 0,
                'generate_qr_code' => $data['generate_qr_code'] ?? false,
                'created_by' => $userId,
            ]);

            // Generate QR code if requested
            if ($waiver->generate_qr_code) {
                $this->generateQrCode($waiver);
            }

            return $waiver;
        });
    }

    /**
     * Create a waiver signature.
     */
    public function createSignature(
        int $waiverId,
        int $customerId,
        string $signatureData,
        ?int $userId = null,
        ?int $bookingId = null,
        ?array $formData = null,
        ?int $witnessUserId = null,
        ?string $signatureFormat = 'png'
    ): WaiverSignature {
        $waiver = Waiver::findOrFail($waiverId);
        
        // Calculate expiry date
        $expiresAt = $waiver->expiry_days 
            ? now()->addDays($waiver->expiry_days)
            : null;

        return WaiverSignature::create([
            'waiver_id' => $waiverId,
            'customer_id' => $customerId,
            'booking_id' => $bookingId,
            'signature_data' => $signatureData,
            'signature_format' => $signatureFormat,
            'form_data' => $formData,
            'signed_by_user_id' => $userId,
            'witness_user_id' => $witnessUserId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'signed_at' => now(),
            'expires_at' => $expiresAt,
            'is_valid' => true,
            'verification_status' => 'pending',
        ]);
    }

    /**
     * Check customer waiver status.
     */
    public function checkCustomerWaiverStatus(int $customerId, int $waiverId): array
    {
        $signature = WaiverSignature::where('customer_id', $customerId)
            ->where('waiver_id', $waiverId)
            ->where('is_valid', true)
            ->latest('signed_at')
            ->first();

        if (!$signature) {
            return [
                'status' => 'missing',
                'message' => 'Waiver not signed',
                'signature' => null,
            ];
        }

        if ($signature->isExpired()) {
            return [
                'status' => 'expired',
                'message' => 'Waiver expired',
                'expired_at' => $signature->expires_at,
                'signature' => $signature,
            ];
        }

        $daysUntilExpiry = $signature->daysUntilExpiry();

        return [
            'status' => 'valid',
            'message' => 'Waiver is valid',
            'signed_at' => $signature->signed_at,
            'expires_at' => $signature->expires_at,
            'days_until_expiry' => $daysUntilExpiry,
            'signature' => $signature,
        ];
    }

    /**
     * Get required waivers for a customer.
     */
    public function getRequiredWaiversForCustomer(int $customerId, int $diveCenterId): array
    {
        $waivers = Waiver::forDiveCenter($diveCenterId)
            ->active()
            ->orderBy('display_order')
            ->get();

        $requiredWaivers = [];
        
        foreach ($waivers as $waiver) {
            $status = $this->checkCustomerWaiverStatus($customerId, $waiver->id);
            $requiredWaivers[] = [
                'waiver' => $waiver,
                'status' => $status['status'],
                'signature' => $status['signature'],
            ];
        }

        return $requiredWaivers;
    }

    /**
     * Generate QR code for waiver (placeholder - will be implemented with QR library).
     */
    private function generateQrCode(Waiver $waiver): void
    {
        // TODO: Implement QR code generation using SimpleSoftwareIO/simple-qrcode
        // $url = url("/waivers/{$waiver->slug}");
        // Generate QR code and store URL
    }
}
