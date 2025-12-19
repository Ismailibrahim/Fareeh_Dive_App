# Instructor Table Structure Options - Detailed Explanation

## Current System Context

Your current system has:
- **`users` table** - Stores all staff members (Admin, Instructor, DiveMaster, Agent)
  - Fields: id, dive_center_id, full_name, email, password, phone, role, active
- **`booking_instructors` table** - Links instructors to dives via `user_id`
- **`commission_entries` table** - Links commissions to users via `user_id`
- **`customer_certifications` table** - Has an `instructor` field (currently just text string)

---

## Option 1: Extends Users (One-to-One Relationship) ⭐ RECOMMENDED

### What This Means
Create an `instructors` table that has a **one-to-one relationship** with the `users` table. Only users with `role='Instructor'` will have a corresponding record in the `instructors` table.

### Database Structure
```
users table (existing)
├── id (primary key)
├── dive_center_id
├── full_name
├── email
├── password
├── phone
├── role ('Instructor', 'DiveMaster', etc.)
└── active

instructors table (new)
├── id (primary key)
├── user_id (foreign key → users.id, UNIQUE, one-to-one)
├── [instructor-specific fields below]
└── timestamps
```

### How It Works
- When a user has `role='Instructor'`, create a record in `instructors` table linked to that user
- When querying instructor data: `$user->instructor->certification_level`
- Existing relationships stay intact: `booking_instructors` still uses `user_id`

### Example Code
```php
// User Model
class User extends Authenticatable {
    public function instructor() {
        return $this->hasOne(Instructor::class);
    }
}

// Instructor Model
class Instructor extends Model {
    public function user() {
        return $this->belongsTo(User::class);
    }
}

// Usage
$instructor = User::where('role', 'Instructor')->first();
$certification = $instructor->instructor->certification_level; // Access instructor-specific data
$email = $instructor->email; // Access user data
```

### Pros ✅
- ✅ **Doesn't break existing code** - All `booking_instructors`, `commission_entries` still work
- ✅ **Clean separation** - User/auth data vs instructor-specific data
- ✅ **Flexible** - Can have other role-specific tables later (e.g., `dive_masters` table)
- ✅ **Easy to query** - `User::where('role', 'Instructor')->with('instructor')->get()`
- ✅ **Follows database normalization** - No data duplication

### Cons ❌
- ⚠️ Requires joining tables when fetching instructor data (but Eloquent handles this easily)
- ⚠️ Need to ensure data integrity (only users with role='Instructor' should have instructor records)

### When to Use
**Best choice for your system** because:
- You already have `booking_instructors` using `user_id`
- You have `commission_entries` using `user_id`
- Changing these would require significant refactoring
- You might want similar tables for DiveMasters or Agents later

---

## Option 2: Completely Separate Table (NOT Linked to Users)

### What This Means
Create a standalone `instructors` table with its own ID. This would be completely independent from the `users` table.

### Database Structure
```
users table (existing)
├── id (primary key)
├── [existing fields]
└── role

instructors table (new, standalone)
├── id (primary key, NOT linked to users.id)
├── dive_center_id
├── full_name
├── email
├── phone
├── [instructor-specific fields]
└── timestamps

booking_instructors table (WOULD NEED CHANGING)
├── instructor_id (instead of user_id) ← PROBLEM!
└── [other fields]
```

### How It Works
- Instructors would have their own IDs separate from users
- Would need to change `booking_instructors` from `user_id` to `instructor_id`
- Would need to change `commission_entries` from `user_id` to `instructor_id`
- Duplicate data: full_name, email, phone stored in both tables

### Example Code
```php
// Completely separate - no relationship to users
class Instructor extends Model {
    // Standalone model
}

// WOULD REQUIRE CHANGING:
// booking_instructors table: user_id → instructor_id
// commission_entries table: user_id → instructor_id
```

### Pros ✅
- ✅ Simpler queries if you never need user data
- ✅ Complete separation of concerns

### Cons ❌
- ❌ **BREAKS EXISTING SYSTEM** - Must refactor `booking_instructors` table
- ❌ **BREAKS EXISTING SYSTEM** - Must refactor `commission_entries` table
- ❌ **Data duplication** - Name, email, phone stored in both tables
- ❌ **Authentication issues** - How do instructors log in? Need separate auth?
- ❌ **Inconsistent** - Other roles (DiveMaster, Agent) still in users table
- ❌ **More complex** - Two sources of truth for instructor data

### When to Use
**NOT recommended for your system** because:
- Would require major refactoring of existing relationships
- Creates data duplication
- Inconsistent with how other roles are stored

---

## Option 3: Just Field Suggestions (No Structure Yet)

### What This Means
You want comprehensive suggestions for what fields to store, but haven't decided on the table structure yet.

### This Document Provides
- Comprehensive list of instructor-specific fields
- Industry-standard data points for scuba instructors
- Examples and explanations for each field

### When to Use
If you want to:
- Review field suggestions first
- Plan the structure based on requirements
- Make an informed decision after seeing all options

---

## Recommendation for Your System

**Choose Option 1 (Extends Users)** because:

1. **Minimal disruption** - Existing code continues to work
2. **Industry standard** - This pattern is common in Laravel applications
3. **Scalable** - Can add similar tables for DiveMasters, Agents later
4. **Data integrity** - Single source of truth for user data
5. **Flexible queries** - Easy to get instructor-specific data with user data

---

## Suggested Fields for Instructors Table

Based on scuba diving industry standards, here are fields you should consider:

### Core Instructor Information
- `user_id` (FK to users, unique)
- `instructor_number` - Official certification number (e.g., "PADI #12345")
- `certification_agency` - Agency that issued certification (PADI, SSI, NAUI, CMAS, etc.)
- `certification_level` - Level of certification (Open Water Instructor, Advanced Instructor, Master Instructor, Course Director, etc.)
- `certification_date` - When they became certified as instructor
- `certification_expiry` - When certification expires (if applicable)
- `instructor_status` - Active, Suspended, Expired

### Specializations & Qualifications
- `specializations` - JSON array of specializations (Night Diver, Wreck Diver, Deep Diver, etc.)
- `languages_spoken` - JSON array of languages
- `max_depth_authorized` - Maximum depth they're authorized to teach
- `max_students_per_class` - Maximum student-to-instructor ratio

### Contact & Emergency
- `emergency_contact_name`
- `emergency_contact_phone`
- `emergency_contact_relationship`
- `address` - Full address (if different from user profile)
- `nationality`
- `passport_number` - For travel/dive center records

### Financial & Commission
- `hourly_rate` - Base hourly rate
- `commission_percentage` - Default commission rate (can be overridden by commission_rules)
- `tax_id` - Tax identification number
- `bank_account_details` - JSON for payment info
- `payment_method` - How they prefer to be paid

### Availability & Schedule
- `availability_status` - Available, Unavailable, On Leave
- `preferred_dive_times` - JSON array of preferred times
- `max_dives_per_day` - Maximum number of dives they can do per day

### Medical & Insurance
- `medical_certificate_expiry` - Medical certificate expiration date
- `insurance_provider` - Insurance company name
- `insurance_policy_number`
- `insurance_expiry`

### Professional History
- `years_of_experience` - Total years teaching
- `total_dives_logged` - Total number of dives
- `total_students_certified` - Number of students they've certified
- `bio` - Text description/bio
- `profile_photo_url` - URL to profile photo

### Documents & Certificates
- `certificate_file_url` - Link to scanned certificate
- `insurance_file_url` - Link to insurance document
- `contract_file_url` - Link to employment contract

### Notes & Metadata
- `notes` - Internal notes about the instructor
- `hired_date` - When they started working at this dive center
- `last_evaluation_date` - Last performance evaluation
- `performance_rating` - Rating/score from evaluations

---

## Next Steps

Once you choose an option, I can:
1. Create the migration file with the appropriate structure
2. Create the Instructor model with relationships
3. Suggest API endpoints for instructor management
4. Plan the frontend form components

Let me know which option you prefer, and I'll create a detailed implementation plan!

