<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Http\Requests\StoreWaiverRequest;
use App\Models\Waiver;
use App\Services\WaiverService;
use Illuminate\Http\Request;

class WaiverController extends Controller
{
    use AuthorizesDiveCenterAccess;

    public function __construct(
        private WaiverService $waiverService
    ) {}

    /**
     * Display a listing of waivers.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $waivers = Waiver::forDiveCenter($user->dive_center_id)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $waivers,
        ]);
    }

    /**
     * Store a newly created waiver.
     */
    public function store(StoreWaiverRequest $request)
    {
        $user = $request->user();
        $waiver = $this->waiverService->createWaiver(
            $request->validated(),
            $user->dive_center_id,
            $user->id
        );

        return response()->json([
            'success' => true,
            'data' => $waiver,
        ], 201);
    }

    /**
     * Display the specified waiver.
     */
    public function show(Request $request, Waiver $waiver)
    {
        $this->authorizeDiveCenterAccess($waiver);
        
        return response()->json([
            'success' => true,
            'data' => $waiver->load(['diveCenter', 'creator']),
        ]);
    }

    /**
     * Update the specified waiver.
     */
    public function update(StoreWaiverRequest $request, Waiver $waiver)
    {
        $this->authorizeDiveCenterAccess($waiver);
        
        $waiver->update($request->validated());

        return response()->json([
            'success' => true,
            'data' => $waiver,
        ]);
    }

    /**
     * Remove the specified waiver.
     */
    public function destroy(Request $request, Waiver $waiver)
    {
        $this->authorizeDiveCenterAccess($waiver);
        
        // Check if waiver has signatures
        if ($waiver->signatures()->exists()) {
            // Soft delete instead
            $waiver->delete();
            return response()->json([
                'success' => true,
                'message' => 'Waiver archived (has existing signatures)',
            ]);
        }

        $waiver->forceDelete();
        return response()->json([
            'success' => true,
            'message' => 'Waiver deleted',
        ]);
    }
}
