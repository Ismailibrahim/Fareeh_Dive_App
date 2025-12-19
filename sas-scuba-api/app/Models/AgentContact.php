<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentContact extends Model
{
    protected $fillable = [
        'agent_id',
        'contact_person_name',
        'job_title',
        'email',
        'phone',
        'secondary_contact',
        'preferred_communication_method',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
