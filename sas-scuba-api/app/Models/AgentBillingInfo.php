<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentBillingInfo extends Model
{
    protected $fillable = [
        'agent_id',
        'company_legal_name',
        'billing_address',
        'invoice_email',
        'bank_name',
        'account_name',
        'account_number',
        'swift_iban',
        'payment_method',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
