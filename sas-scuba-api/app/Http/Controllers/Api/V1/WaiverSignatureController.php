<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Http\Requests\StoreWaiverSignatureRequest;
use App\Models\WaiverSignature;
use App\Models\Waiver;
use App\Models\Customer;
use App\Services\WaiverService;
use Illuminate\Http\Request;

class WaiverSignatureController extends Controller
{
    use AuthorizesDiveCenterAccess;

    public function __construct(
        private WaiverService $waiverService
    ) {}

    /**
     * Display a listing of waiver signatures.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = WaiverSignature::whereHas('waiver', function ($q) use ($user) {
            $q->where('dive_center_id', $user->dive_center_id);
        })
        ->with(['waiver', 'customer', 'signedBy']);

        // Filters
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->has('waiver_id')) {
            $query->where('waiver_id', $request->waiver_id);
        }
        if ($request->has('is_valid')) {
            $query->where('is_valid', $request->boolean('is_valid'));
        }
        if ($request->has('expired')) {
            if ($request->boolean('expired')) {
                $query->whereNotNull('expires_at')
                    ->where('expires_at', '<', now());
            } else {
                $query->where(function ($q) {
                    $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>=', now());
                });
            }
        }

        $signatures = $query->latest('signed_at')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $signatures,
        ]);
    }

    /**
     * Store a newly created waiver signature.
     */
    public function store(StoreWaiverSignatureRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        // Verify waiver belongs to dive center
        $waiver = Waiver::findOrFail($validated['waiver_id']);
        $this->authorizeDiveCenterAccess($waiver);

        // Verify customer belongs to dive center
        $customer = Customer::findOrFail($validated['customer_id']);
        $this->authorizeDiveCenterAccess($customer);

        $signature = $this->waiverService->createSignature(
            $validated['waiver_id'],
            $validated['customer_id'],
            $validated['signature_data'],
            $user->id,
            $validated['booking_id'] ?? null,
            $validated['form_data'] ?? null,
            $validated['witness_user_id'] ?? null,
            $validated['signature_format'] ?? 'png'
        );

        return response()->json([
            'success' => true,
            'data' => $signature->load(['waiver', 'customer']),
        ], 201);
    }

    /**
     * Display the specified waiver signature.
     */
    public function show(Request $request, WaiverSignature $signature)
    {
        $this->authorizeDiveCenterAccess($signature->waiver);
        
        return response()->json([
            'success' => true,
            'data' => $signature->load(['waiver', 'customer', 'signedBy', 'witness']),
        ]);
    }

    /**
     * Verify a waiver signature.
     */
    public function verify(Request $request, WaiverSignature $signature)
    {
        $this->authorizeDiveCenterAccess($signature->waiver);
        
        $request->validate([
            'status' => 'required|in:verified,rejected',
            'notes' => 'nullable|string',
        ]);

        if ($request->status === 'verified') {
            $signature->verify($request->user()->id, $request->notes);
        } else {
            $signature->update([
                'verification_status' => 'rejected',
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
                'verification_notes' => $request->notes,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $signature->fresh(),
        ]);
    }

    /**
     * Invalidate a waiver signature.
     */
    public function invalidate(Request $request, WaiverSignature $signature)
    {
        $this->authorizeDiveCenterAccess($signature->waiver);
        
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $signature->invalidate($request->reason);

        return response()->json([
            'success' => true,
            'message' => 'Signature invalidated',
        ]);
    }

    /**
     * Get customer waiver status for a specific waiver.
     */
    public function getCustomerWaiverStatus(Request $request, Customer $customer)
    {
        $this->authorizeDiveCenterAccess($customer);
        
        $request->validate([
            'waiver_id' => 'required|exists:waivers,id',
        ]);

        $waiver = Waiver::findOrFail($request->waiver_id);
        $this->authorizeDiveCenterAccess($waiver);

        $status = $this->waiverService->checkCustomerWaiverStatus($customer->id, $waiver->id);

        return response()->json([
            'success' => true,
            'data' => $status,
        ]);
    }

    /**
     * Get all required waivers for a customer.
     */
    public function getRequiredWaivers(Request $request, Customer $customer)
    {
        $this->authorizeDiveCenterAccess($customer);
        
        $user = $request->user();
        $waivers = $this->waiverService->getRequiredWaiversForCustomer($customer->id, $user->dive_center_id);

        return response()->json([
            'success' => true,
            'data' => $waivers,
        ]);
    }
}
