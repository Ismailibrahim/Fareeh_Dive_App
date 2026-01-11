<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    protected $fillable = [
        'dive_center_id',
        'name',
        'description',
    ];

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}