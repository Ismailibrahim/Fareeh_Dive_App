<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\DiveLog;
use App\Models\Customer;
use Illuminate\Http\Request;

class DiveLogController extends Controller
{
    use AuthorizesDiveCenterAccess;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = DiveLog::with(['customer', 'diveSite', 'boat', 'instructor'])
            ->where('dive_center_id', $user->dive_center_id);
        
        // Filter by customer if provided
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->get('customer_id'));
        }
        
        // Filter by date range if provided
        if ($request->has('date_from')) {
            $query->where('dive_date', '>=', $request->get('date_from'));
        }
        
        if ($request->has('date_to')) {
            $query->where('dive_date', '<=', $request->get('date_to'));
        }
        
        // Filter by dive site if provided
        if ($request->has('dive_site_id')) {
            $query->where('dive_site_id', $request->get('dive_site_id'));
        }
        
        // Search functionality
        if ($request->has('search') && !empty($request->get('search'))) {
            $search = $request->get('search');
            $search = preg_replace('/[^a-zA-Z0-9\s@.-]/', '', $search);
            $search = substr($search, 0, 100);
            $search = trim($search);
            
            if (!empty($search)) {
                $query->whereHas('customer', function($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%");
                })->orWhereHas('diveSite', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            }
        }
        
        // Get pagination parameters
        $perPage = $request->get('per_page', 20);
        $perPage = min(max($perPage, 1), 100);
        
        return $query->orderBy('dive_date', 'desc')
            ->orderBy('entry_time', 'desc')
            ->paginate($perPage);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;
        
        $request->merge(['dive_center_id' => $diveCenterId]);
        
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'dive_site_id' => 'required|exists:dive_sites,id',
            'dive_date' => 'required|date',
            'entry_time' => 'required|date_format:H:i',
            'exit_time' => 'required|date_format:H:i|after:entry_time',
            'total_dive_time' => 'nullable|integer|min:1|max:600',
            'max_depth' => 'required|numeric|min:0|max:200',
            'boat_id' => 'nullable|exists:boats,id',
            'dive_type' => 'required|in:Recreational,Training,Technical,Night,Wreck,Cave,Drift,Other',
            'instructor_id' => 'nullable|exists:users,id',
            'visibility' => 'nullable|numeric|min:0|max:100',
            'visibility_unit' => 'nullable|in:meters,feet',
            'current' => 'nullable|numeric|min:0|max:10',
            'current_unit' => 'nullable|in:knots,m/s',
            'tank_size' => 'nullable|numeric|min:0|max:1000',
            'tank_size_unit' => 'nullable|in:liters,cubic_feet',
            'gas_mix' => 'required|in:Air,Nitrox,Trimix',
            'starting_pressure' => 'nullable|numeric|min:0|max:500',
            'ending_pressure' => 'nullable|numeric|min:0|max:500',
            'pressure_unit' => 'nullable|in:bar,psi',
            'notes' => 'nullable|string',
            'dive_center_id' => 'required|exists:dive_centers,id',
        ]);
        
        // Validate customer belongs to dive center
        $customer = Customer::where('id', $validated['customer_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();
        
        // Validate dive site belongs to dive center
        $diveSite = \App\Models\DiveSite::where('id', $validated['dive_site_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();
        
        // Validate boat belongs to dive center if provided
        if (!empty($validated['boat_id'])) {
            $boat = \App\Models\Boat::where('id', $validated['boat_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }
        
        // Validate instructor belongs to dive center if provided
        if (!empty($validated['instructor_id'])) {
            $instructor = \App\Models\User::where('id', $validated['instructor_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }
        
        // Calculate total dive time if not provided
        if (empty($validated['total_dive_time'])) {
            $entry = \Carbon\Carbon::parse($validated['entry_time']);
            $exit = \Carbon\Carbon::parse($validated['exit_time']);
            
            // Handle case where exit time is next day
            if ($exit->lessThan($entry)) {
                $exit->addDay();
            }
            
            $validated['total_dive_time'] = $entry->diffInMinutes($exit);
        }
        
        // Set default units if not provided
        $validated['visibility_unit'] = $validated['visibility_unit'] ?? 'meters';
        $validated['current_unit'] = $validated['current_unit'] ?? 'knots';
        $validated['tank_size_unit'] = $validated['tank_size_unit'] ?? 'liters';
        $validated['pressure_unit'] = $validated['pressure_unit'] ?? 'bar';
        
        $diveLog = DiveLog::create($validated);
        $diveLog->load(['customer', 'diveSite', 'boat', 'instructor']);
        
        return response()->json($diveLog, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, DiveLog $diveLog)
    {
        // Verify dive log belongs to user's dive center
        $this->authorizeDiveCenterAccess($diveLog, 'Unauthorized access to this dive log');
        
        $diveLog->load(['customer', 'diveSite', 'boat', 'instructor']);
        return $diveLog;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DiveLog $diveLog)
    {
        // Verify dive log belongs to user's dive center
        $this->authorizeDiveCenterAccess($diveLog, 'Unauthorized access to this dive log');
        
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;
        
        $validated = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'dive_site_id' => 'sometimes|exists:dive_sites,id',
            'dive_date' => 'sometimes|date',
            'entry_time' => 'sometimes|date_format:H:i',
            'exit_time' => 'sometimes|date_format:H:i',
            'total_dive_time' => 'nullable|integer|min:1|max:600',
            'max_depth' => 'sometimes|numeric|min:0|max:200',
            'boat_id' => 'nullable|exists:boats,id',
            'dive_type' => 'sometimes|in:Recreational,Training,Technical,Night,Wreck,Cave,Drift,Other',
            'instructor_id' => 'nullable|exists:users,id',
            'visibility' => 'nullable|numeric|min:0|max:100',
            'visibility_unit' => 'nullable|in:meters,feet',
            'current' => 'nullable|numeric|min:0|max:10',
            'current_unit' => 'nullable|in:knots,m/s',
            'tank_size' => 'nullable|numeric|min:0|max:1000',
            'tank_size_unit' => 'nullable|in:liters,cubic_feet',
            'gas_mix' => 'sometimes|in:Air,Nitrox,Trimix',
            'starting_pressure' => 'nullable|numeric|min:0|max:500',
            'ending_pressure' => 'nullable|numeric|min:0|max:500',
            'pressure_unit' => 'nullable|in:bar,psi',
            'notes' => 'nullable|string',
        ]);
        
        // Validate exit_time is after entry_time if both are provided
        if (isset($validated['entry_time']) && isset($validated['exit_time'])) {
            $entry = \Carbon\Carbon::parse($validated['entry_time']);
            $exit = \Carbon\Carbon::parse($validated['exit_time']);
            
            // Allow next day exit times
            if ($exit->lessThan($entry)) {
                $exit->addDay();
            }
            
            // Recalculate total dive time if times changed
            if (!isset($validated['total_dive_time'])) {
                $validated['total_dive_time'] = $entry->diffInMinutes($exit);
            }
        } elseif ((isset($validated['entry_time']) || isset($validated['exit_time'])) && !isset($validated['total_dive_time'])) {
            // If only one time changed, recalculate with existing values
            $entry = \Carbon\Carbon::parse($validated['entry_time'] ?? $diveLog->entry_time);
            $exit = \Carbon\Carbon::parse($validated['exit_time'] ?? $diveLog->exit_time);
            
            if ($exit->lessThan($entry)) {
                $exit->addDay();
            }
            
            $validated['total_dive_time'] = $entry->diffInMinutes($exit);
        }
        
        // Validate foreign keys belong to dive center
        if (isset($validated['customer_id'])) {
            $customer = Customer::where('id', $validated['customer_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }
        
        if (isset($validated['dive_site_id'])) {
            $diveSite = \App\Models\DiveSite::where('id', $validated['dive_site_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }
        
        if (!empty($validated['boat_id'])) {
            $boat = \App\Models\Boat::where('id', $validated['boat_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }
        
        if (!empty($validated['instructor_id'])) {
            $instructor = \App\Models\User::where('id', $validated['instructor_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }
        
        $diveLog->update($validated);
        $diveLog->load(['customer', 'diveSite', 'boat', 'instructor']);
        
        return response()->json($diveLog);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, DiveLog $diveLog)
    {
        // Verify dive log belongs to user's dive center
        $this->authorizeDiveCenterAccess($diveLog, 'Unauthorized access to this dive log');
        
        $diveLog->delete();
        return response()->noContent();
    }

    /**
     * Get dive logs for a specific customer.
     */
    public function indexByCustomer(Request $request, Customer $customer)
    {
        // Verify customer belongs to user's dive center
        $this->authorizeDiveCenterAccess($customer, 'Unauthorized access to this customer');
        
        $query = DiveLog::with(['diveSite', 'boat', 'instructor'])
            ->where('customer_id', $customer->id)
            ->where('dive_center_id', $customer->dive_center_id);
        
        // Filter by date range if provided
        if ($request->has('date_from')) {
            $query->where('dive_date', '>=', $request->get('date_from'));
        }
        
        if ($request->has('date_to')) {
            $query->where('dive_date', '<=', $request->get('date_to'));
        }
        
        $perPage = $request->get('per_page', 20);
        $perPage = min(max($perPage, 1), 100);
        
        return $query->orderBy('dive_date', 'desc')
            ->orderBy('entry_time', 'desc')
            ->paginate($perPage);
    }
}



