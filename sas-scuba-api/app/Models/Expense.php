<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'dive_center_id',
        'supplier_id',
        'expense_category_id',
        'created_by',
        'expense_no',
        'expense_date',
        'description',
        'amount',
        'currency',
        'is_recurring',
        'recurring_period',
        'notes',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
        'is_recurring' => 'boolean',
    ];

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function expenseCategory()
    {
        return $this->belongsTo(ExpenseCategory::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function generateExpenseNumber(): string
    {
        $year = date('Y');
        $count = self::where('dive_center_id', $this->dive_center_id)
            ->whereYear('created_at', $year)
            ->count() + 1;
        
        return sprintf('EXP-%s-%03d', $year, $count);
    }
}