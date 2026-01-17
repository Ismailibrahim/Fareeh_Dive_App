<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, \Laravel\Sanctum\HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'dive_center_id',
        'full_name',
        'email',
        'password',
        'phone',
        'role',
        'active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    /**
     * Get the instructor profile for this user (if role is Instructor)
     */
    public function instructor()
    {
        return $this->hasOne(Instructor::class);
    }

    /**
     * Get the array representation of the user for session storage.
     * This prevents relationship serialization issues.
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'dive_center_id' => $this->dive_center_id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'active' => $this->active,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }

    /**
     * Prepare the model for serialization.
     * This prevents relationships from being serialized which can cause errors.
     */
    public function __sleep(): array
    {
        // Clear relationships before serialization
        $this->unsetRelations();
        
        // Return only the attributes we want to serialize
        return array_keys($this->getAttributes());
    }
}
