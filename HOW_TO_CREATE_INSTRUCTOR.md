# How to Create an Instructor

## Frontend Verification ✅

The frontend is **ready** and fully configured! Here's what's in place:

### ✅ Components Created
- **InstructorForm** - Complete form with all sections
- **Instructors List Page** - Table and mobile card views
- **Create Instructor Page** - New instructor creation
- **Edit Instructor Page** - Update existing instructors

### ✅ API Service
- `instructor.service.ts` - All CRUD methods ready

### ✅ Navigation
- "Instructors" menu item added to sidebar (with GraduationCap icon)

---

## How to Create an Instructor

### Method 1: Through the Web Interface

1. **Navigate to Instructors Page**
   - Click on **"Instructors"** in the left sidebar (🏫 icon)
   - Or go directly to: `http://localhost:3000/dashboard/instructors`

2. **Click "Add Instructor" Button**
   - Click the **"Add Instructor"** button in the top right

3. **Fill in the Form**
   
   The form is organized into logical sections:

   #### User Information (Required for New Instructors)
   - **Full Name** - Required
   - **Email** - Required (must be unique)
   - **Password** - Required (minimum 8 characters)
   - **Phone** - Optional

   #### Certification Information
   - **Instructor Number** - e.g., "PADI #12345"
   - **Certification Agency** - Select from dropdown (PADI, SSI, NAUI, CMAS, BSAC, Other)
   - **Certification Level** - e.g., "Open Water Scuba Instructor"
   - **Certification Date** - Date picker
   - **Certification Expiry** - Date picker
   - **Status** - Active, Suspended, or Expired (default: Active)

   #### Qualifications & Limits
   - **Max Depth Authorized** (meters)
   - **Max Students Per Class**

   #### Contact & Emergency Information
   - **Address** - Full address text area
   - **Nationality** - Text field
   - **Passport Number** - Text field
   - **Emergency Contact Name** - Text field
   - **Emergency Contact Phone** - Text field
   - **Emergency Contact Relationship** - e.g., "Spouse", "Parent"

   #### Availability & Schedule
   - **Availability Status** - Available, Unavailable, or On Leave (default: Available)
   - **Max Dives Per Day** - Number field

   #### Financial Information
   - **Hourly Rate** - Decimal number
   - **Commission Percentage** - Decimal number (0-100)
   - **Payment Method** - Text field (e.g., "Bank Transfer")

   #### Professional History
   - **Years of Experience** - Number field
   - **Total Dives Logged** - Number field
   - **Total Students Certified** - Number field
   - **Biography** - Text area
   - **Hired Date** - Date picker

   #### Medical & Insurance
   - **Medical Certificate Expiry** - Date picker
   - **Insurance Provider** - Text field
   - **Insurance Policy Number** - Text field
   - **Insurance Expiry** - Date picker

   #### Additional Notes
   - **Notes** - Text area for internal notes

4. **Submit the Form**
   - Click **"Create Instructor"** button at the bottom
   - The system will:
     - Create a new user account with role "Instructor"
     - Create the instructor profile linked to that user
     - Redirect you back to the instructors list

### Method 2: Using API Directly (For Testing/Development)

You can also create an instructor using the API:

```bash
POST /api/v1/instructors
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "instructor_number": "PADI #12345",
  "certification_agency": "PADI",
  "certification_level": "Open Water Scuba Instructor",
  "certification_date": "2020-01-15",
  "instructor_status": "Active",
  "availability_status": "Available",
  "max_depth_authorized": 30,
  "max_students_per_class": 4,
  "hourly_rate": 50.00,
  "commission_percentage": 15.00
}
```

---

## Quick Start Example

**Minimum Required Fields to Create an Instructor:**
- Full Name
- Email
- Password

All other fields are optional and can be filled in later by editing the instructor profile.

---

## After Creating an Instructor

Once created, you can:

1. **View in List** - See all instructors in the list page
2. **Edit** - Click "Edit" from the actions menu
3. **Search** - Use the search box to find instructors by name, email, or certification
4. **Filter** - (Future enhancement) Filter by status or availability
5. **Delete** - Remove instructor (with confirmation dialog)

---

## Important Notes

### User Account Creation
- When you create a new instructor through the form, the system automatically:
  - Creates a user account with the provided email/password
  - Sets the user's role to "Instructor"
  - Links the user to your dive center (based on logged-in user's dive center)
  - Creates the instructor profile linked to that user

### Linking to Existing User
- If an instructor user already exists, you can create the instructor profile by:
  - Providing the `user_id` in the API request
  - The system will verify the user exists and update their role to "Instructor"

### Data Validation
- Email must be unique (not already in use)
- Password must be at least 8 characters
- Dates must be in valid format (YYYY-MM-DD)
- Numeric fields must be valid numbers

---

## Troubleshooting

### "Email already exists" Error
- The email you're using is already registered
- Use a different email or check if the user already has an instructor profile

### "Validation failed" Error
- Check that required fields are filled
- Verify email format is correct
- Ensure password meets minimum requirements (8 characters)

### Form Not Submitting
- Check browser console for errors
- Verify backend API is running
- Ensure you're logged in

---

## Next Steps

After creating instructors, you can:
- Assign them to bookings/dives via the `booking_instructors` table
- Calculate commissions based on their `commission_percentage`
- Track their certifications and expiry dates
- Manage their availability for scheduling

---

**Ready to create your first instructor?** 

Go to: `http://localhost:3000/dashboard/instructors` and click "Add Instructor"!

