<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentContract extends Model
{
    protected $fillable = [
        'agent_id',
        'contract_start_date',
        'contract_end_date',
        'commission_valid_from',
        'commission_valid_until',
        'signed_agreement_url',
        'special_conditions',
    ];

    protected $casts = [
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'commission_valid_from' => 'date',
        'commission_valid_until' => 'date',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
