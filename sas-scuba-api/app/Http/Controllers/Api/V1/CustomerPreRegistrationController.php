<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\CustomerPreRegistration;
use App\Models\Customer;
use App\Models\EmergencyContact;
use App\Models\CustomerCertification;
use App\Models\CustomerInsurance;
use App\Models\CustomerAccommodation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CustomerPreRegistrationController extends Controller
{
    use AuthorizesDiveCenterAccess;

    /**
     * Generate a new pre-registration link (staff only)
     */
    public function generateLink(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'expires_in_days' => 'nullable|integer|min:1|max:365',
        ]);

        $expiresInDays = $validated['expires_in_days'] ?? 30; // Default 30 days
        $expiresAt = Carbon::now()->addDays($expiresInDays);

        $preRegistration = CustomerPreRegistration::create([
            'dive_center_id' => $user->dive_center_id,
            'token' => CustomerPreRegistration::generateToken(),
            'expires_at' => $expiresAt,
            'status' => 'pending',
        ]);

        return response()->json([
            'id' => $preRegistration->id,
            'token' => $preRegistration->token,
            'url' => url("/pre-registration/{$preRegistration->token}"),
            'expires_at' => $preRegistration->expires_at->toIso8601String(),
            'created_at' => $preRegistration->created_at->toIso8601String(),
        ], 201);
    }

    /**
     * Get registration form data by token (public, no auth)
     */
    public function getByToken($token)
    {
        $preRegistration = CustomerPreRegistration::where('token', $token)->firstOrFail();

        // Check if expired
        if ($preRegistration->isExpired()) {
            return response()->json([
                'message' => 'This registration link has expired.',
            ], 410);
        }

        // Check if already submitted
        if ($preRegistration->submitted_at !== null) {
            return response()->json([
                'message' => 'This registration link has already been used.',
                'submitted_at' => $preRegistration->submitted_at->toIso8601String(),
            ], 410);
        }

        return response()->json([
            'token' => $preRegistration->token,
            'expires_at' => $preRegistration->expires_at->toIso8601String(),
            'dive_center' => [
                'id' => $preRegistration->diveCenter->id,
                'name' => $preRegistration->diveCenter->name,
            ],
        ]);
    }

    /**
     * Submit customer registration data (public, no auth)
     */
    public function submit(Request $request, $token)
    {
        $preRegistration = CustomerPreRegistration::where('token', $token)->firstOrFail();

        // Check if expired
        if ($preRegistration->isExpired()) {
            return response()->json([
                'message' => 'This registration link has expired.',
            ], 410);
        }

        // Check if already submitted
        if ($preRegistration->submitted_at !== null) {
            return response()->json([
                'message' => 'This registration link has already been used.',
            ], 410);
        }

        // Validate customer data
        $validated = $request->validate([
            'customer' => 'required|array',
            'customer.full_name' => 'required|string|max:255',
            'customer.email' => 'nullable|email|max:255',
            'customer.phone' => 'nullable|string|max:50',
            'customer.passport_no' => 'nullable|string|max:50',
            'customer.date_of_birth' => 'nullable|date',
            'customer.gender' => 'nullable|string',
            'customer.nationality' => 'nullable|string',
            
            'emergency_contacts' => 'nullable|array',
            'emergency_contacts.*.name' => 'nullable|string|max:255',
            'emergency_contacts.*.email' => 'nullable|email|max:255',
            'emergency_contacts.*.phone_1' => 'nullable|string|max:50',
            'emergency_contacts.*.phone_2' => 'nullable|string|max:50',
            'emergency_contacts.*.phone_3' => 'nullable|string|max:50',
            'emergency_contacts.*.address' => 'nullable|string',
            'emergency_contacts.*.relationship' => 'nullable|string|max:100',
            'emergency_contacts.*.is_primary' => 'nullable|boolean',
            
            'certifications' => 'nullable|array',
            'certifications.*.certification_name' => 'required|string',
            'certifications.*.certification_no' => 'nullable|string',
            'certifications.*.certification_date' => 'required|date',
            'certifications.*.last_dive_date' => 'nullable|date',
            'certifications.*.no_of_dives' => 'nullable|integer|min:0',
            'certifications.*.agency' => 'nullable|string',
            'certifications.*.instructor' => 'nullable|string',
            'certifications.*.file_url' => 'nullable|string',
            'certifications.*.license_status' => 'nullable|boolean',
            
            'insurance' => 'nullable|array',
            'insurance.insurance_provider' => 'nullable|string',
            'insurance.insurance_no' => 'nullable|string',
            'insurance.insurance_hotline_no' => 'nullable|string',
            'insurance.file_url' => 'nullable|string',
            'insurance.expiry_date' => 'nullable|date',
            'insurance.status' => 'nullable|boolean',
            
            'accommodation' => 'nullable|array',
            'accommodation.name' => 'nullable|string',
            'accommodation.address' => 'nullable|string',
            'accommodation.contact_no' => 'nullable|string',
            'accommodation.island' => 'nullable|string',
            'accommodation.room_no' => 'nullable|string',
        ]);

        // Update pre-registration with submitted data
        $preRegistration->update([
            'customer_data' => $validated['customer'],
            'emergency_contacts_data' => $validated['emergency_contacts'] ?? [],
            'certifications_data' => $validated['certifications'] ?? [],
            'insurance_data' => $validated['insurance'] ?? null,
            'accommodation_data' => $validated['accommodation'] ?? null,
            'submitted_at' => Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Registration submitted successfully. Your information will be reviewed by our staff.',
            'submission_id' => $preRegistration->id,
        ], 201);
    }

    /**
     * List all pre-registration submissions (staff only)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = CustomerPreRegistration::where('dive_center_id', $user->dive_center_id)
            ->whereNotNull('submitted_at')
            ->with(['reviewedByUser', 'createdCustomer']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by customer name or email
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereJsonContains('customer_data->full_name', $search)
                  ->orWhereJsonContains('customer_data->email', $search);
            });
        }

        $perPage = min(max($request->get('per_page', 20), 1), 100);
        
        $submissions = $query->orderBy('submitted_at', 'desc')->paginate($perPage);

        // Transform the data for frontend
        $submissions->getCollection()->transform(function ($submission) {
            return [
                'id' => $submission->id,
                'token' => $submission->token,
                'status' => $submission->status,
                'customer_name' => $submission->customer_data['full_name'] ?? 'N/A',
                'customer_email' => $submission->customer_data['email'] ?? null,
                'submitted_at' => $submission->submitted_at?->toIso8601String(),
                'reviewed_at' => $submission->reviewed_at?->toIso8601String(),
                'reviewed_by' => $submission->reviewedByUser ? [
                    'id' => $submission->reviewedByUser->id,
                    'name' => $submission->reviewedByUser->full_name ?? $submission->reviewedByUser->email,
                ] : null,
                'expires_at' => $submission->expires_at->toIso8601String(),
            ];
        });

        return response()->json($submissions);
    }

    /**
     * Get specific submission details (staff only)
     */
    public function show($id)
    {
        $submission = CustomerPreRegistration::with(['reviewedByUser', 'createdCustomer', 'diveCenter'])
            ->findOrFail($id);

        $this->authorizeDiveCenterAccess($submission, 'Unauthorized access to this submission');

        return response()->json([
            'id' => $submission->id,
            'token' => $submission->token,
            'status' => $submission->status,
            'customer_data' => $submission->customer_data,
            'emergency_contacts_data' => $submission->emergency_contacts_data,
            'certifications_data' => $submission->certifications_data,
            'insurance_data' => $submission->insurance_data,
            'accommodation_data' => $submission->accommodation_data,
            'submitted_at' => $submission->submitted_at?->toIso8601String(),
            'reviewed_at' => $submission->reviewed_at?->toIso8601String(),
            'review_notes' => $submission->review_notes,
            'reviewed_by' => $submission->reviewedByUser ? [
                'id' => $submission->reviewedByUser->id,
                'name' => $submission->reviewedByUser->full_name ?? $submission->reviewedByUser->email,
            ] : null,
            'created_customer_id' => $submission->created_customer_id,
            'expires_at' => $submission->expires_at->toIso8601String(),
            'created_at' => $submission->created_at->toIso8601String(),
        ]);
    }

    /**
     * Approve submission and create customer record (staff only)
     */
    public function approve(Request $request, $id)
    {
        $submission = CustomerPreRegistration::findOrFail($id);
        
        $this->authorizeDiveCenterAccess($submission, 'Unauthorized access to this submission');

        if ($submission->status !== 'pending') {
            return response()->json([
                'message' => 'This submission has already been processed.',
            ], 422);
        }

        $validated = $request->validate([
            'review_notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Create customer
            $customer = Customer::create([
                'dive_center_id' => $submission->dive_center_id,
                'full_name' => $submission->customer_data['full_name'],
                'email' => $submission->customer_data['email'] ?? null,
                'phone' => $submission->customer_data['phone'] ?? null,
                'passport_no' => $submission->customer_data['passport_no'] ?? null,
                'date_of_birth' => $submission->customer_data['date_of_birth'] ?? null,
                'gender' => $submission->customer_data['gender'] ?? null,
                'nationality' => $submission->customer_data['nationality'] ?? null,
            ]);

            // Create emergency contacts
            if (!empty($submission->emergency_contacts_data)) {
                $primarySet = false;
                foreach ($submission->emergency_contacts_data as $contactData) {
                    // Set first contact as primary if none is marked
                    if (!$primarySet && !isset($contactData['is_primary'])) {
                        $contactData['is_primary'] = true;
                        $primarySet = true;
                    }
                    // If this one is primary, unset others
                    if (isset($contactData['is_primary']) && $contactData['is_primary']) {
                        $primarySet = true;
                    }

                    EmergencyContact::create([
                        'customer_id' => $customer->id,
                        'name' => $contactData['name'] ?? null,
                        'email' => $contactData['email'] ?? null,
                        'phone_1' => $contactData['phone_1'] ?? null,
                        'phone_2' => $contactData['phone_2'] ?? null,
                        'phone_3' => $contactData['phone_3'] ?? null,
                        'address' => $contactData['address'] ?? null,
                        'relationship' => $contactData['relationship'] ?? null,
                        'is_primary' => $contactData['is_primary'] ?? false,
                    ]);
                }

                // Ensure at least one primary contact
                if (!$primarySet && !empty($submission->emergency_contacts_data)) {
                    $firstContact = EmergencyContact::where('customer_id', $customer->id)->first();
                    if ($firstContact) {
                        $firstContact->update(['is_primary' => true]);
                    }
                }
            }

            // Create certifications
            if (!empty($submission->certifications_data)) {
                foreach ($submission->certifications_data as $certData) {
                    CustomerCertification::create([
                        'customer_id' => $customer->id,
                        'certification_name' => $certData['certification_name'],
                        'certification_no' => $certData['certification_no'] ?? null,
                        'certification_date' => $certData['certification_date'],
                        'last_dive_date' => $certData['last_dive_date'] ?? null,
                        'no_of_dives' => $certData['no_of_dives'] ?? null,
                        'agency' => $certData['agency'] ?? null,
                        'instructor' => $certData['instructor'] ?? null,
                        'file_url' => $certData['file_url'] ?? null,
                        'license_status' => $certData['license_status'] ?? true,
                    ]);
                }
            }

            // Create insurance
            if (!empty($submission->insurance_data)) {
                CustomerInsurance::create([
                    'customer_id' => $customer->id,
                    'insurance_provider' => $submission->insurance_data['insurance_provider'] ?? null,
                    'insurance_no' => $submission->insurance_data['insurance_no'] ?? null,
                    'insurance_hotline_no' => $submission->insurance_data['insurance_hotline_no'] ?? null,
                    'file_url' => $submission->insurance_data['file_url'] ?? null,
                    'expiry_date' => $submission->insurance_data['expiry_date'] ?? null,
                    'status' => $submission->insurance_data['status'] ?? true,
                ]);
            }

            // Create accommodation
            if (!empty($submission->accommodation_data)) {
                CustomerAccommodation::create([
                    'customer_id' => $customer->id,
                    'name' => $submission->accommodation_data['name'] ?? null,
                    'address' => $submission->accommodation_data['address'] ?? null,
                    'contact_no' => $submission->accommodation_data['contact_no'] ?? null,
                    'island' => $submission->accommodation_data['island'] ?? null,
                    'room_no' => $submission->accommodation_data['room_no'] ?? null,
                ]);
            }

            // Update submission status
            $submission->update([
                'status' => 'approved',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => Carbon::now(),
                'review_notes' => $validated['review_notes'] ?? null,
                'created_customer_id' => $customer->id,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Submission approved and customer created successfully.',
                'customer_id' => $customer->id,
                'submission_id' => $submission->id,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error approving pre-registration: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Failed to approve submission.',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while approving the submission',
            ], 500);
        }
    }

    /**
     * Reject submission (staff only)
     */
    public function reject(Request $request, $id)
    {
        $submission = CustomerPreRegistration::findOrFail($id);
        
        $this->authorizeDiveCenterAccess($submission, 'Unauthorized access to this submission');

        if ($submission->status !== 'pending') {
            return response()->json([
                'message' => 'This submission has already been processed.',
            ], 422);
        }

        $validated = $request->validate([
            'review_notes' => 'required|string|min:1',
        ]);

        $submission->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => Carbon::now(),
            'review_notes' => $validated['review_notes'],
        ]);

        return response()->json([
            'message' => 'Submission rejected successfully.',
            'submission_id' => $submission->id,
        ], 200);
    }
}
