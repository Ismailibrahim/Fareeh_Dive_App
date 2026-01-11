<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExpenseCategoryController extends Controller
{
    use AuthorizesDiveCenterAccess;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = ExpenseCategory::query();

        if ($user->dive_center_id) {
            $query->where('dive_center_id', $user->dive_center_id);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $diveCenterId = $request->user()->dive_center_id;
        $request->merge(['dive_center_id' => $diveCenterId]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('expense_categories', 'name')->where('dive_center_id', $diveCenterId)
            ],
            'description' => 'nullable|string',
            'dive_center_id' => 'required|exists:dive_centers,id',
        ]);

        $expenseCategory = ExpenseCategory::create($validated);
        return response()->json($expenseCategory, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, ExpenseCategory $expenseCategory)
    {
        $this->authorizeDiveCenterAccess($expenseCategory, 'Unauthorized access to this expense category');
        return $expenseCategory;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ExpenseCategory $expenseCategory)
    {
        $this->authorizeDiveCenterAccess($expenseCategory, 'Unauthorized access to this expense category');

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('expense_categories', 'name')
                    ->ignore($expenseCategory->id)
                    ->where('dive_center_id', $expenseCategory->dive_center_id)
            ],
            'description' => 'nullable|string',
        ]);

        $expenseCategory->update($validated);
        return response()->json($expenseCategory);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ExpenseCategory $expenseCategory)
    {
        $this->authorizeDiveCenterAccess($expenseCategory, 'Unauthorized access to this expense category');
        $expenseCategory->delete();
        return response()->noContent();
    }
}