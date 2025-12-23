<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PricingRule;
use Illuminate\Http\Request;

class PricingRuleController extends Controller
{
    /**
     * Display a listing of pricing rules.
     */
    public function index(Request $request)
    {
        $query = PricingRule::query();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('rule_type')) {
            $query->byType($request->input('rule_type'));
        }

        return response()->json($query->ordered()->get());
    }

    /**
     * Store a newly created pricing rule.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'rule_name' => 'required|string|max:255',
            'rule_type' => 'required|in:OVERLAP_HANDLING,VALIDATION,DISCOUNT,SURCHARGE',
            'condition' => 'nullable|array',
            'action' => 'required|in:APPLY_LOWEST,APPLY_HIGHEST_PRIORITY,REJECT,WARN',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $rule = PricingRule::create($validated);

        return response()->json($rule, 201);
    }

    /**
     * Display the specified pricing rule.
     */
    public function show(PricingRule $pricingRule)
    {
        return response()->json($pricingRule);
    }

    /**
     * Update the specified pricing rule.
     */
    public function update(Request $request, PricingRule $pricingRule)
    {
        $validated = $request->validate([
            'rule_name' => 'sometimes|string|max:255',
            'rule_type' => 'sometimes|in:OVERLAP_HANDLING,VALIDATION,DISCOUNT,SURCHARGE',
            'condition' => 'nullable|array',
            'action' => 'sometimes|in:APPLY_LOWEST,APPLY_HIGHEST_PRIORITY,REJECT,WARN',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $pricingRule->update($validated);

        return response()->json($pricingRule);
    }

    /**
     * Remove the specified pricing rule.
     */
    public function destroy(PricingRule $pricingRule)
    {
        $pricingRule->delete();

        return response()->noContent();
    }
}
