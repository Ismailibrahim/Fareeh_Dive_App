<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentCommercialTerm extends Model
{
    protected $fillable = [
        'agent_id',
        'commission_type',
        'commission_rate',
        'currency',
        'vat_applicable',
        'tax_registration_no',
        'payment_terms',
        'credit_limit',
        'exclude_equipment_from_commission',
        'include_manual_items_in_commission',
    ];

    protected $casts = [
        'vat_applicable' => 'boolean',
        'commission_rate' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'exclude_equipment_from_commission' => 'boolean',
        'include_manual_items_in_commission' => 'boolean',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
