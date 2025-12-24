<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\BookingDive;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BoatListController extends Controller
{
    use AuthorizesDiveCenterAccess;

    /**
     * Display boat list grouped by boat, date, time, and dive site
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        // Build base query with all required relationships
        $query = BookingDive::with([
            'boat',
            'diveSite',
            'booking.customer.certification',
            'booking.basket.bookingEquipment.equipmentItem.equipment',
            'booking.bookingEquipment.equipmentItem.equipment',
            'bookingInstructors.user'
        ])
        ->join('bookings', 'booking_dives.booking_id', '=', 'bookings.id')
        ->where('bookings.dive_center_id', $diveCenterId)
        ->select('booking_dives.*');

        // Apply filters
        // For date filtering, use COALESCE to fallback to booking_date when dive_date is NULL
        // This ensures dives without a dive_date still appear in the boat list
        if ($request->has('date_from')) {
            $dateFrom = $request->get('date_from');
            $query->whereRaw('COALESCE(booking_dives.dive_date, bookings.booking_date) >= ?', [$dateFrom]);
        }

        if ($request->has('date_to')) {
            $dateTo = $request->get('date_to');
            $query->whereRaw('COALESCE(booking_dives.dive_date, bookings.booking_date) <= ?', [$dateTo]);
        }

        if ($request->has('boat_id')) {
            $query->where('booking_dives.boat_id', $request->get('boat_id'));
        }

        if ($request->has('dive_site_id')) {
            $query->where('booking_dives.dive_site_id', $request->get('dive_site_id'));
        }

        // Get all booking dives
        $bookingDives = $query->get();
        
        // Ensure all relationships are loaded (in case join interfered with eager loading)
        $bookingDives->load([
            'booking.basket.bookingEquipment.equipmentItem.equipment',
            'booking.bookingEquipment.equipmentItem.equipment',
            'booking.customer.certification',
            'boat',
            'diveSite',
            'bookingInstructors.user'
        ]);

        // Group by boat_id, dive_date, dive_time, dive_site_id
        $groupedSessions = [];
        
        foreach ($bookingDives as $dive) {
            // Create a unique key for grouping
            // Handle NULL values by converting them to string 'null'
            $boatId = $dive->boat_id ?? 'null';
            $diveDate = $dive->dive_date ? $dive->dive_date->format('Y-m-d') : 'null';
            $diveTime = $dive->dive_time ?? 'null';
            $diveSiteId = $dive->dive_site_id ?? 'null';
            
            $sessionKey = "boat_{$boatId}_{$diveDate}_{$diveTime}_site_{$diveSiteId}";

            if (!isset($groupedSessions[$sessionKey])) {
                $groupedSessions[$sessionKey] = [
                    'session_key' => $sessionKey,
                    'boat' => $dive->boat ? [
                        'id' => $dive->boat->id,
                        'name' => $dive->boat->name,
                    ] : null,
                    'dive_date' => $dive->dive_date ? $dive->dive_date->format('Y-m-d') : null,
                    'dive_time' => $dive->dive_time,
                    'dive_site' => $dive->diveSite ? [
                        'id' => $dive->diveSite->id,
                        'name' => $dive->diveSite->name,
                    ] : null,
                    'customers' => [],
                    'dive_guides' => [],
                ];
            }

            // Add customer if not already added (avoid duplicates)
            if ($dive->booking && $dive->booking->customer) {
                $customerId = $dive->booking->customer->id;
                $customerExists = false;
                
                foreach ($groupedSessions[$sessionKey]['customers'] as $existingCustomer) {
                    if ($existingCustomer['customer']['id'] === $customerId) {
                        $customerExists = true;
                        break;
                    }
                }

                if (!$customerExists) {
                    // Get equipment basket for this booking
                    // Baskets can be linked via booking.basket_id OR basket.booking_id
                    $equipmentBasket = null;
                    $basket = null;
                    
                    // Try to get basket via booking.basket_id relationship
                    if (!$dive->booking->relationLoaded('basket')) {
                        $dive->booking->load('basket.bookingEquipment.equipmentItem.equipment');
                    }
                    
                    if ($dive->booking->basket) {
                        $basket = $dive->booking->basket;
                    } else {
                        // Try to find basket via basket.booking_id
                        $basket = \App\Models\EquipmentBasket::where('booking_id', $dive->booking->id)
                            ->with('bookingEquipment.equipmentItem.equipment')
                            ->first();
                    }
                    
                    // If still no basket, try to find by customer_id (baskets can be customer-specific)
                    if (!$basket && $dive->booking->customer_id) {
                        $basket = \App\Models\EquipmentBasket::where('customer_id', $dive->booking->customer_id)
                            ->where('dive_center_id', $diveCenterId)
                            ->where('status', 'Active')
                            ->with('bookingEquipment.equipmentItem.equipment')
                            ->orderBy('created_at', 'desc')
                            ->first();
                    }
                    
                    if ($basket) {
                        // Ensure bookingEquipment is loaded
                        if (!$basket->relationLoaded('bookingEquipment')) {
                            $basket->load('bookingEquipment.equipmentItem.equipment');
                        }
                        
                        $equipment = [];
                        
                        foreach ($basket->bookingEquipment as $bookingEquipment) {
                            $equipmentData = [
                                'id' => $bookingEquipment->id,
                                'equipment_source' => $bookingEquipment->equipment_source,
                                'price' => $bookingEquipment->price,
                                'checkout_date' => $bookingEquipment->checkout_date ? $bookingEquipment->checkout_date->format('Y-m-d') : null,
                                'return_date' => $bookingEquipment->return_date ? $bookingEquipment->return_date->format('Y-m-d') : null,
                                'assignment_status' => $bookingEquipment->assignment_status,
                            ];

                            // Add center equipment details
                            if ($bookingEquipment->equipment_source === 'Center') {
                                // Ensure equipmentItem is loaded
                                if (!$bookingEquipment->relationLoaded('equipmentItem') && $bookingEquipment->equipment_item_id) {
                                    $bookingEquipment->load('equipmentItem.equipment');
                                }
                                
                                if ($bookingEquipment->equipmentItem) {
                                    $equipmentData['equipment_item'] = [
                                        'id' => $bookingEquipment->equipmentItem->id,
                                        'inventory_code' => $bookingEquipment->equipmentItem->inventory_code,
                                        'size' => $bookingEquipment->equipmentItem->size,
                                        'serial_no' => $bookingEquipment->equipmentItem->serial_no,
                                        'brand' => $bookingEquipment->equipmentItem->brand,
                                        'equipment' => $bookingEquipment->equipmentItem->equipment ? [
                                            'id' => $bookingEquipment->equipmentItem->equipment->id,
                                            'name' => $bookingEquipment->equipmentItem->equipment->name,
                                        ] : null,
                                    ];
                                }
                            }

                            // Add customer own equipment details
                            if ($bookingEquipment->equipment_source === 'Customer Own') {
                                $equipmentData['customer_equipment'] = [
                                    'type' => $bookingEquipment->customer_equipment_type,
                                    'brand' => $bookingEquipment->customer_equipment_brand,
                                    'model' => $bookingEquipment->customer_equipment_model,
                                    'serial' => $bookingEquipment->customer_equipment_serial,
                                    'notes' => $bookingEquipment->customer_equipment_notes,
                                ];
                            }

                            $equipment[] = $equipmentData;
                        }

                        $equipmentBasket = [
                            'id' => $basket->id,
                            'basket_no' => $basket->basket_no,
                            'center_bucket_no' => $basket->center_bucket_no,
                            'checkout_date' => $basket->checkout_date ? $basket->checkout_date->format('Y-m-d') : null,
                            'expected_return_date' => $basket->expected_return_date ? $basket->expected_return_date->format('Y-m-d') : null,
                            'status' => $basket->status,
                            'equipment' => $equipment,
                        ];
                    } else {
                        // No basket found, check for equipment directly on booking
                        if (!$dive->booking->relationLoaded('bookingEquipment')) {
                            $dive->booking->load('bookingEquipment.equipmentItem.equipment');
                        }
                        
                        if ($dive->booking->bookingEquipment && $dive->booking->bookingEquipment->count() > 0) {
                            // Create a virtual basket from booking equipment
                            $equipment = [];
                            
                            foreach ($dive->booking->bookingEquipment as $bookingEquipment) {
                                $equipmentData = [
                                    'id' => $bookingEquipment->id,
                                    'equipment_source' => $bookingEquipment->equipment_source,
                                    'price' => $bookingEquipment->price,
                                    'checkout_date' => $bookingEquipment->checkout_date ? $bookingEquipment->checkout_date->format('Y-m-d') : null,
                                    'return_date' => $bookingEquipment->return_date ? $bookingEquipment->return_date->format('Y-m-d') : null,
                                    'assignment_status' => $bookingEquipment->assignment_status,
                                ];

                                // Add center equipment details
                                if ($bookingEquipment->equipment_source === 'Center' && $bookingEquipment->equipmentItem) {
                                    $equipmentData['equipment_item'] = [
                                        'id' => $bookingEquipment->equipmentItem->id,
                                        'inventory_code' => $bookingEquipment->equipmentItem->inventory_code,
                                        'size' => $bookingEquipment->equipmentItem->size,
                                        'serial_no' => $bookingEquipment->equipmentItem->serial_no,
                                        'brand' => $bookingEquipment->equipmentItem->brand,
                                        'equipment' => $bookingEquipment->equipmentItem->equipment ? [
                                            'id' => $bookingEquipment->equipmentItem->equipment->id,
                                            'name' => $bookingEquipment->equipmentItem->equipment->name,
                                        ] : null,
                                    ];
                                }

                                // Add customer own equipment details
                                if ($bookingEquipment->equipment_source === 'Customer Own') {
                                    $equipmentData['customer_equipment'] = [
                                        'type' => $bookingEquipment->customer_equipment_type,
                                        'brand' => $bookingEquipment->customer_equipment_brand,
                                        'model' => $bookingEquipment->customer_equipment_model,
                                        'serial' => $bookingEquipment->customer_equipment_serial,
                                        'notes' => $bookingEquipment->customer_equipment_notes,
                                    ];
                                }

                                $equipment[] = $equipmentData;
                            }
                            
                            $equipmentBasket = [
                                'id' => null,
                                'basket_no' => 'Direct Booking Equipment',
                                'center_bucket_no' => null,
                                'checkout_date' => null,
                                'expected_return_date' => null,
                                'status' => 'Active',
                                'equipment' => $equipment,
                            ];
                        }
                    }

                    // Get certification data if available
                    $certification = null;
                    try {
                        // Ensure certification is loaded
                        if (!$dive->booking->customer->relationLoaded('certification')) {
                            $dive->booking->customer->load('certification');
                        }
                        
                        if ($dive->booking->customer->certification) {
                            $cert = $dive->booking->customer->certification;
                            $certification = [
                                'id' => $cert->id,
                                'certification_name' => $cert->certification_name,
                                'certification_no' => $cert->certification_no,
                                'certification_date' => $cert->certification_date ? (is_string($cert->certification_date) ? $cert->certification_date : $cert->certification_date->format('Y-m-d')) : null,
                                'agency' => $cert->agency,
                                'instructor' => $cert->instructor,
                                'no_of_dives' => $cert->no_of_dives,
                                'last_dive_date' => $cert->last_dive_date ? (is_string($cert->last_dive_date) ? $cert->last_dive_date : $cert->last_dive_date->format('Y-m-d')) : null,
                            ];
                        }
                    } catch (\Exception $e) {
                        // Certification relationship not available, skip
                        \Log::warning('Failed to load certification for customer ' . $dive->booking->customer->id . ': ' . $e->getMessage());
                    }

                    // Safely format departure_date
                    $departureDate = null;
                    try {
                        if ($dive->booking->customer->departure_date) {
                            if (is_string($dive->booking->customer->departure_date)) {
                                $departureDate = $dive->booking->customer->departure_date;
                            } elseif (is_object($dive->booking->customer->departure_date) && method_exists($dive->booking->customer->departure_date, 'format')) {
                                $departureDate = $dive->booking->customer->departure_date->format('Y-m-d');
                            }
                        }
                    } catch (\Exception $e) {
                        // Departure date not available, skip
                    }

                    $groupedSessions[$sessionKey]['customers'][] = [
                        'customer' => [
                            'id' => $dive->booking->customer->id,
                            'full_name' => $dive->booking->customer->full_name,
                            'email' => $dive->booking->customer->email,
                            'phone' => $dive->booking->customer->phone,
                            'nationality' => $dive->booking->customer->nationality,
                            'gender' => $dive->booking->customer->gender,
                            'departure_date' => $departureDate,
                            'departure_flight' => $dive->booking->customer->departure_flight,
                            'departure_flight_time' => $dive->booking->customer->departure_flight_time,
                            'departure_to' => $dive->booking->customer->departure_to,
                        ],
                        'certification' => $certification,
                        'equipment_basket' => $equipmentBasket,
                    ];
                }
            }

            // Add dive guides (instructors)
            foreach ($dive->bookingInstructors as $bookingInstructor) {
                if ($bookingInstructor->user) {
                    $guideId = $bookingInstructor->user->id;
                    $guideExists = false;
                    
                    foreach ($groupedSessions[$sessionKey]['dive_guides'] as $existingGuide) {
                        if ($existingGuide['id'] === $guideId) {
                            $guideExists = true;
                            break;
                        }
                    }

                    if (!$guideExists) {
                        $groupedSessions[$sessionKey]['dive_guides'][] = [
                            'id' => $bookingInstructor->id,
                            'user_id' => $bookingInstructor->user->id,
                            'full_name' => $bookingInstructor->user->full_name,
                            'role' => $bookingInstructor->role,
                        ];
                    }
                }
            }
        }

        // Convert to indexed array and sort by dive_date and dive_time
        $sessions = array_values($groupedSessions);
        usort($sessions, function ($a, $b) {
            // Sort by date first
            $dateCompare = strcmp($a['dive_date'] ?? '', $b['dive_date'] ?? '');
            if ($dateCompare !== 0) {
                return $dateCompare;
            }
            // Then by time
            return strcmp($a['dive_time'] ?? '', $b['dive_time'] ?? '');
        });

        return response()->json($sessions);
    }
}

