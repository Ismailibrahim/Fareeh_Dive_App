# Instructor Table Implementation Plan - Option 1

## Overview
Create an `instructors` table with a one-to-one relationship to the `users` table. This stores instructor-specific data while maintaining all existing relationships (`booking_instructors`, `commission_entries`) that reference `user_id`.

---

## Database Schema

### Migration File
**Location:** `sas-scuba-api/database/migrations/YYYY_MM_DD_HHMMSS_create_instructors_table.php`

### Table Structure

```php
Schema::create('instructors', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
    
    // Core Certification Fields
    $table->string('instructor_number')->nullable();
    $table->string('certification_agency')->nullable(); // PADI, SSI, NAUI, CMAS, etc.
    $table->string('certification_level')->nullable(); // Open Water Instructor, Advanced, Master, Course Director
    $table->date('certification_date')->nullable();
    $table->date('certification_expiry')->nullable();
    $table->enum('instructor_status', ['Active', 'Suspended', 'Expired'])->default('Active');
    
    // Qualifications
    $table->json('specializations')->nullable(); // Array: ["Night Diver", "Wreck Diver", "Deep Diver"]
    $table->json('languages_spoken')->nullable(); // Array: ["English", "Spanish", "French"]
    $table->integer('max_depth_authorized')->nullable(); // Maximum depth in meters
    $table->integer('max_students_per_class')->nullable(); // Max student-to-instructor ratio
    
    // Financial
    $table->decimal('hourly_rate', 10, 2)->nullable();
    $table->decimal('commission_percentage', 5, 2)->nullable(); // Default commission rate
    $table->string('tax_id')->nullable();
    $table->json('bank_account_details')->nullable(); // Sensitive payment info
    $table->string('payment_method')->nullable(); // Preferred payment method
    
    // Contact & Emergency
    $table->string('emergency_contact_name')->nullable();
    $table->string('emergency_contact_phone')->nullable();
    $table->string('emergency_contact_relationship')->nullable();
    $table->text('address')->nullable();
    $table->string('nationality')->nullable();
    $table->string('passport_number')->nullable();
    
    // Availability & Schedule
    $table->enum('availability_status', ['Available', 'Unavailable', 'On Leave'])->default('Available');
    $table->json('preferred_dive_times')->nullable(); // Array of preferred times
    $table->integer('max_dives_per_day')->nullable();
    
    // Medical & Insurance
    $table->date('medical_certificate_expiry')->nullable();
    $table->string('insurance_provider')->nullable();
    $table->string('insurance_policy_number')->nullable();
    $table->date('insurance_expiry')->nullable();
    
    // Professional History
    $table->integer('years_of_experience')->nullable();
    $table->integer('total_dives_logged')->nullable();
    $table->integer('total_students_certified')->nullable();
    $table->text('bio')->nullable();
    $table->string('profile_photo_url')->nullable();
    
    // Documents
    $table->string('certificate_file_url')->nullable();
    $table->string('insurance_file_url')->nullable();
    $table->string('contract_file_url')->nullable();
    
    // Metadata
    $table->text('notes')->nullable();
    $table->date('hired_date')->nullable();
    $table->date('last_evaluation_date')->nullable();
    $table->decimal('performance_rating', 3, 2)->nullable(); // e.g., 4.5/5.0
    
    $table->timestamps();
    
    // Indexes
    $table->index('instructor_status');
});
```

### Key Constraints
- `user_id` has `unique()` constraint ensuring one-to-one relationship
- Foreign key with `onDelete('cascade')` - deleting a user removes their instructor record
- Index on `instructor_status` for filtering queries

---

## Model Files

### 1. Instructor Model
**Location:** `sas-scuba-api/app/Models/Instructor.php`

```php
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
        'hourly_rate',
        'commission_percentage',
        'tax_id',
        'bank_account_details',
        'payment_method',
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
        'bank_account_details' => 'array',
        'hourly_rate' => 'decimal:2',
        'commission_percentage' => 'decimal:2',
        'performance_rating' => 'decimal:2',
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
```

### 2. Update User Model
**Location:** `sas-scuba-api/app/Models/User.php`

**Add relationship method:**

```php
/**
 * Get the instructor profile for this user (if role is Instructor)
 */
public function instructor()
{
    return $this->hasOne(Instructor::class);
}
```

**Also update fillable array** (based on migration requirements):
```php
protected $fillable = [
    'dive_center_id',
    'full_name',
    'email',
    'password',
    'phone',
    'role',
    'active',
];
```

---

## Field Descriptions by Category

### Core Certification Fields
- **instructor_number**: Official certification number (e.g., "PADI #12345", "SSI #67890")
- **certification_agency**: Agency that issued certification (PADI, SSI, NAUI, CMAS, etc.)
- **certification_level**: Level of certification (Open Water Instructor, Advanced Instructor, Master Instructor, Course Director, etc.)
- **certification_date**: Date when they became certified as an instructor
- **certification_expiry**: Date when certification expires (if applicable)
- **instructor_status**: Current status (Active, Suspended, Expired)

### Qualifications
- **specializations**: JSON array of diving specializations (e.g., ["Night Diver", "Wreck Diver", "Deep Diver", "Underwater Photography"])
- **languages_spoken**: JSON array of languages (e.g., ["English", "Spanish", "French", "German"])
- **max_depth_authorized**: Maximum depth in meters they're authorized to teach (e.g., 18, 30, 40)
- **max_students_per_class**: Maximum student-to-instructor ratio (e.g., 4, 6, 8)

### Financial Information
- **hourly_rate**: Base hourly rate for the instructor
- **commission_percentage**: Default commission rate (can be overridden by commission_rules table)
- **tax_id**: Tax identification number for payroll/tax purposes
- **bank_account_details**: JSON object with payment account information (sensitive data)
- **payment_method**: Preferred payment method (e.g., "Bank Transfer", "Cash", "Check")

### Contact & Emergency
- **emergency_contact_name**: Name of emergency contact person
- **emergency_contact_phone**: Phone number of emergency contact
- **emergency_contact_relationship**: Relationship to instructor (e.g., "Spouse", "Parent", "Friend")
- **address**: Full address (if different from user profile or more detailed)
- **nationality**: Nationality of instructor
- **passport_number**: Passport number for travel/record keeping

### Availability & Schedule
- **availability_status**: Current availability (Available, Unavailable, On Leave)
- **preferred_dive_times**: JSON array of preferred dive times (e.g., ["08:00", "14:00"])
- **max_dives_per_day**: Maximum number of dives they can do per day

### Medical & Insurance
- **medical_certificate_expiry**: Expiration date of medical certificate
- **insurance_provider**: Insurance company name
- **insurance_policy_number**: Policy number
- **insurance_expiry**: Insurance expiration date

### Professional History
- **years_of_experience**: Total years of teaching experience
- **total_dives_logged**: Total number of dives logged
- **total_students_certified**: Number of students they've certified
- **bio**: Biography or description of instructor
- **profile_photo_url**: URL to profile photo

### Documents
- **certificate_file_url**: Link to scanned certification document
- **insurance_file_url**: Link to insurance document
- **contract_file_url**: Link to employment contract

### Metadata
- **notes**: Internal notes about the instructor
- **hired_date**: Date when they started working at this dive center
- **last_evaluation_date**: Date of last performance evaluation
- **performance_rating**: Rating/score from evaluations (e.g., 4.5 out of 5.0)

---

## Implementation Steps

1. **Create Migration File**
   - Generate migration: `php artisan make:migration create_instructors_table`
   - Add all fields with appropriate types
   - Add foreign key constraint with cascade delete
   - Add unique constraint on user_id
   - Add indexes

2. **Create Instructor Model**
   - Create file: `app/Models/Instructor.php`
   - Set fillable array with all fields
   - Set casts for JSON and date fields
   - Define user relationship

3. **Update User Model**
   - Add `instructor()` relationship method
   - Update fillable array to match migration

4. **Run Migration**
   - Test migration: `php artisan migrate`
   - Verify table structure in database
   - Test relationship queries

5. **Test Relationships**
   ```php
   // Test one-to-one relationship
   $user = User::where('role', 'Instructor')->first();
   $instructor = $user->instructor; // Should work
   
   // Test reverse relationship
   $instructor = Instructor::first();
   $user = $instructor->user; // Should work
   ```

---

## Usage Examples

### Creating an Instructor Record
```php
// When creating a user with instructor role
$user = User::create([
    'dive_center_id' => 1,
    'full_name' => 'John Doe',
    'email' => 'john@example.com',
    'password' => Hash::make('password'),
    'phone' => '1234567890',
    'role' => 'Instructor',
    'active' => true,
]);

// Create instructor profile
$instructor = Instructor::create([
    'user_id' => $user->id,
    'instructor_number' => 'PADI #12345',
    'certification_agency' => 'PADI',
    'certification_level' => 'Open Water Scuba Instructor',
    'certification_date' => '2020-01-15',
    'instructor_status' => 'Active',
    'specializations' => ['Night Diver', 'Wreck Diver'],
    'languages_spoken' => ['English', 'Spanish'],
    'max_depth_authorized' => 30,
    'availability_status' => 'Available',
]);
```

### Querying Instructor Data
```php
// Get instructor with user data
$instructor = Instructor::with('user')->first();
echo $instructor->user->email; // Access user data
echo $instructor->certification_level; // Access instructor data

// Get user with instructor data
$user = User::where('role', 'Instructor')->with('instructor')->first();
echo $user->full_name; // User data
echo $user->instructor->instructor_number; // Instructor data

// Get all active instructors
$activeInstructors = User::where('role', 'Instructor')
    ->whereHas('instructor', function($query) {
        $query->where('instructor_status', 'Active');
    })
    ->with('instructor')
    ->get();
```

---

## Benefits of This Structure

1. **Backward Compatible**: Existing `booking_instructors` and `commission_entries` tables continue to work with `user_id`
2. **Clean Separation**: User/auth data separate from instructor-specific data
3. **Flexible**: Can add similar tables for DiveMasters or Agents later
4. **Data Integrity**: One-to-one relationship ensures each instructor has one profile
5. **Easy Queries**: Can easily join user and instructor data when needed
6. **Scalable**: JSON fields allow flexible data without creating many junction tables

---

## Future Enhancements (Not in Initial Implementation)

1. **API Endpoints**: Create CRUD endpoints for instructor management
2. **Frontend Forms**: Create forms for creating/editing instructor profiles
3. **Link Customer Certifications**: Update `customer_certifications.instructor` field to reference `instructor_id` instead of text
4. **Validation Rules**: Add comprehensive validation for instructor data
5. **File Upload**: Implement file upload for certificates, insurance, contracts
6. **Search/Filter**: Add search and filter capabilities for instructors
7. **Reporting**: Generate reports on instructor performance, certifications, etc.

---

## Notes

- All fields are nullable to allow incremental data entry (users can add details over time)
- JSON fields provide flexibility without creating additional tables
- Financial fields can work alongside or override the `commission_rules` system
- The structure maintains compatibility with existing multi-tenant architecture (via dive_center_id on users table)

