<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Expense;
use App\Models\Supplier;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    use AuthorizesDiveCenterAccess;

    /**
     * Display a listing of expenses.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $query = Expense::with(['supplier', 'expenseCategory', 'createdBy'])
            ->where('dive_center_id', $diveCenterId);

        // Filter by date range
        if ($request->has('date_from')) {
            $query->where('expense_date', '>=', $request->input('date_from'));
        }
        if ($request->has('date_to')) {
            $query->where('expense_date', '<=', $request->input('date_to'));
        }

        // Filter by amount range
        if ($request->has('amount_min')) {
            $query->where('amount', '>=', $request->input('amount_min'));
        }
        if ($request->has('amount_max')) {
            $query->where('amount', '<=', $request->input('amount_max'));
        }

        // Filter by category
        if ($request->has('expense_category_id')) {
            $query->where('expense_category_id', $request->input('expense_category_id'));
        }

        // Filter by supplier
        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->input('supplier_id'));
        }

        // Filter by currency
        if ($request->has('currency')) {
            $query->where('currency', $request->input('currency'));
        }

        // Filter by recurring status
        if ($request->has('is_recurring')) {
            $isRecurring = filter_var($request->input('is_recurring'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_recurring', $isRecurring);
        }

        // Search by description or expense_no
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('expense_no', 'like', "%{$search}%");
            });
        }

        // Get pagination parameters
        $perPage = $request->get('per_page', 20);
        $perPage = min(max($perPage, 1), 100); // Limit between 1 and 100

        return $query->orderBy('expense_date', 'desc')->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Store a newly created expense.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'expense_category_id' => 'required|exists:expense_categories,id',
            'expense_date' => 'required|date',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|string|size:3',
            'is_recurring' => 'nullable|boolean',
            'recurring_period' => 'nullable|in:Weekly,Monthly,Quarterly,Yearly',
            'notes' => 'nullable|string',
        ]);

        // Validate supplier belongs to dive center
        $supplier = Supplier::where('id', $validated['supplier_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        // Validate expense category belongs to dive center
        $expenseCategory = ExpenseCategory::where('id', $validated['expense_category_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        // Set default for is_recurring
        if (!isset($validated['is_recurring'])) {
            $validated['is_recurring'] = false;
        }

        // Clear recurring_period if not recurring
        if (!$validated['is_recurring']) {
            $validated['recurring_period'] = null;
        }

        DB::beginTransaction();
        try {
            $expense = Expense::create([
                'dive_center_id' => $diveCenterId,
                'supplier_id' => $validated['supplier_id'],
                'expense_category_id' => $validated['expense_category_id'],
                'created_by' => $user->id,
                'expense_no' => null, // Will be generated
                'expense_date' => $validated['expense_date'],
                'description' => $validated['description'],
                'amount' => $validated['amount'],
                'currency' => $validated['currency'],
                'is_recurring' => $validated['is_recurring'],
                'recurring_period' => $validated['recurring_period'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Generate expense number
            $expense->expense_no = $expense->generateExpenseNumber();
            $expense->save();

            $expense->load(['supplier', 'expenseCategory', 'createdBy']);
            
            DB::commit();
            return response()->json($expense, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create expense',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified expense.
     */
    public function show(Request $request, Expense $expense)
    {
        $this->authorizeDiveCenterAccess($expense, 'Unauthorized access to this expense');
        $expense->load(['supplier', 'expenseCategory', 'createdBy']);
        return $expense;
    }

    /**
     * Update the specified expense.
     */
    public function update(Request $request, Expense $expense)
    {
        $this->authorizeDiveCenterAccess($expense, 'Unauthorized access to this expense');
        $diveCenterId = $expense->dive_center_id;

        $validated = $request->validate([
            'supplier_id' => 'sometimes|required|exists:suppliers,id',
            'expense_category_id' => 'sometimes|required|exists:expense_categories,id',
            'expense_date' => 'sometimes|required|date',
            'description' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'currency' => 'sometimes|required|string|size:3',
            'is_recurring' => 'nullable|boolean',
            'recurring_period' => 'nullable|in:Weekly,Monthly,Quarterly,Yearly',
            'notes' => 'nullable|string',
        ]);

        // Validate supplier belongs to dive center if provided
        if (isset($validated['supplier_id'])) {
            $supplier = Supplier::where('id', $validated['supplier_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }

        // Validate expense category belongs to dive center if provided
        if (isset($validated['expense_category_id'])) {
            $expenseCategory = ExpenseCategory::where('id', $validated['expense_category_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }

        // Clear recurring_period if not recurring
        if (isset($validated['is_recurring']) && !$validated['is_recurring']) {
            $validated['recurring_period'] = null;
        }

        $expense->update($validated);
        $expense->load(['supplier', 'expenseCategory', 'createdBy']);
        return response()->json($expense);
    }

    /**
     * Remove the specified expense.
     */
    public function destroy(Expense $expense)
    {
        $this->authorizeDiveCenterAccess($expense, 'Unauthorized access to this expense');
        $expense->delete();
        return response()->noContent();
    }
}