<?php

namespace App\Http\Controllers\Traits;

trait AuthorizesDiveCenterAccess
{
    /**
     * Verify that a resource belongs to the authenticated user's dive center
     *
     * @param mixed $resource The resource to check (must have dive_center_id property)
     * @param string $message Custom error message
     * @return void
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function authorizeDiveCenterAccess($resource, string $message = 'Unauthorized access to this resource')
    {
        $user = auth()->user();
        
        if (!$user || !$user->dive_center_id) {
            abort(403, 'User does not belong to a dive center');
        }
        
        if (!isset($resource->dive_center_id)) {
            abort(500, 'Resource does not have dive_center_id property');
        }
        
        if ($resource->dive_center_id !== $user->dive_center_id) {
            abort(403, $message);
        }
    }
    
    /**
     * Verify that a dive center ID matches the user's dive center
     *
     * @param int $diveCenterId The dive center ID to check
     * @param string $message Custom error message
     * @return void
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function authorizeDiveCenterId($diveCenterId, string $message = 'Unauthorized dive center')
    {
        $user = auth()->user();
        
        if (!$user || !$user->dive_center_id) {
            abort(403, 'User does not belong to a dive center');
        }
        
        if ($diveCenterId != $user->dive_center_id) {
            abort(403, $message);
        }
    }
}

