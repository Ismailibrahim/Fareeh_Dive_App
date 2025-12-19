<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Instructor extends Model
{
    protected $fillable = [
        'user_id',
        'instructor_number',
        'certification_agency',
        'certification_level',
        'certification_date',
        'certification_expiry',
        'instructor_status',
        'specializations',
        'languages_spoken',
        'max_depth_authorized',
        'max_students_per_class',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'address',
        'nationality',
        'passport_number',
        'availability_status',
        'preferred_dive_times',
        'max_dives_per_day',
        'medical_certificate_expiry',
        'insurance_provider',
        'insurance_provider_contact_no',
        'insurance_type',
        'insurance_policy_number',
        'insurance_expiry',
        'years_of_experience',
        'total_dives_logged',
        'total_students_certified',
        'bio',
        'profile_photo_url',
        'certificate_file_url',
        'insurance_file_url',
        'contract_file_url',
        'notes',
        'hired_date',
        'last_evaluation_date',
        'performance_rating',
    ];

    protected $casts = [
        'certification_date' => 'date',
        'certification_expiry' => 'date',
        'medical_certificate_expiry' => 'date',
        'insurance_expiry' => 'date',
        'hired_date' => 'date',
        'last_evaluation_date' => 'date',
        'specializations' => 'array',
        'languages_spoken' => 'array',
        'preferred_dive_times' => 'array',
        'max_depth_authorized' => 'integer',
        'max_students_per_class' => 'integer',
        'max_dives_per_day' => 'integer',
        'years_of_experience' => 'integer',
        'total_dives_logged' => 'integer',
        'total_students_certified' => 'integer',
    ];

    /**
     * Get the user that owns the instructor record
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

