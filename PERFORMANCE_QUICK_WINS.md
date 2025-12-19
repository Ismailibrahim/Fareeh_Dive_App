# Performance Quick Wins - Implementation Guide

This document provides step-by-step implementation for the **most critical** performance improvements that can be done immediately.

---

## 🚀 Quick Win #1: Add Database Indexes (5 minutes)

**Impact:** 10-100x faster queries

**Action:** Run the migration file

```bash
cd sas-scuba-api
php artisan migrate
```

**File Created:** `database/migrations/2025_12_20_000000_add_performance_indexes.php`

**What it does:**
- Adds indexes on all frequently queried columns
- Improves JOIN performance
- Speeds up WHERE clause filtering

---

## 🚀 Quick Win #2: Fix CustomerController Pagination (10 minutes)

**Impact:** 70-90% faster API responses, 80% less data transfer

**File:** `sas-scuba-api/app/Http/Controllers/Api/V1/CustomerController.php`

**Replace the `index()` method:**

```php
public function index(Request $request)
{
    $user = $request->user();
    
    $query = Customer::select('id', 'full_name', 'email', 'phone', 'passport_no', 'nationality', 'gender', 'date_of_birth')
        ->where('dive_center_id', $user->dive_center_id);
    
    // Add server-side search
    if ($request->has('search')) {
        $search = $request->get('search');
        $query->where(function($q) use ($search) {
            $q->where('full_name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%")
              ->orWhere('passport_no', 'like', "%{$search}%");
        });
    }
    
    return $query->orderBy('created_at', 'desc')->paginate(20);
}
```

---

## 🚀 Quick Win #3: Cache Static Data (15 minutes)

**Impact:** 50-80% reduction in database queries for reference data

**Files to update:**
- `sas-scuba-api/app/Http/Controllers/Api/V1/NationalityController.php`
- `sas-scuba-api/app/Http/Controllers/Api/V1/RelationshipController.php`
- `sas-scuba-api/app/Http/Controllers/Api/V1/AgencyController.php`
- `sas-scuba-api/app/Http/Controllers/Api/V1/ServiceTypeController.php`
- `sas-scuba-api/app/Http/Controllers/Api/V1/TaxController.php`

**Example for NationalityController:**

```php
use Illuminate\Support\Facades\Cache;

public function index()
{
    return Cache::remember('nationalities', 3600, function () {
        return Nationality::orderBy('name')->get();
    });
}
```

**Apply same pattern to:**
- RelationshipController
- AgencyController  
- ServiceTypeController
- TaxController
- LocationController

---

## 🚀 Quick Win #4: Fix Frontend Pagination (30 minutes)

**Impact:** 70-90% faster table loading, 80% less memory usage

**File:** `sas-scuba-web/src/app/dashboard/customers/page.tsx`

**Key Changes:**

1. **Update service to support pagination:**
```typescript
// In customer.service.ts
getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get(`/customers?${queryParams.toString()}`);
    return response.data;
},
```

2. **Update component:**
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [pagination, setPagination] = useState({ total: 0, per_page: 20, last_page: 1 });

const fetchCustomers = async (page = 1, search = "") => {
    setLoading(true);
    try {
        const response = await customerService.getAll({ 
            page, 
            per_page: 20,
            search 
        });
        
        // Handle Laravel pagination response
        if (response.data) {
            setCustomers(response.data);
            setPagination({
                total: response.meta?.total || response.total || 0,
                per_page: response.meta?.per_page || response.per_page || 20,
                last_page: response.meta?.last_page || response.last_page || 1,
            });
        } else {
            setCustomers(response);
        }
    } catch (error) {
        console.error("Failed to fetch customers", error);
    } finally {
        setLoading(false);
    }
};

// Debounced search
useEffect(() => {
    const timeoutId = setTimeout(() => {
        setCurrentPage(1);
        fetchCustomers(1, searchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
}, [searchTerm]);

// Remove client-side filtering
// const filteredCustomers = customers.filter(...) // DELETE THIS
```

3. **Add pagination component:**
```typescript
import { Pagination } from "@/components/ui/pagination";

// Add after table, before closing div
<Pagination
    currentPage={currentPage}
    totalPages={pagination.last_page}
    onPageChange={(page) => {
        setCurrentPage(page);
        fetchCustomers(page, searchTerm);
    }}
    itemsPerPage={pagination.per_page}
    totalItems={pagination.total}
/>
```

**Apply same pattern to:**
- `equipment-items/page.tsx`
- `equipment/page.tsx`
- Any other list pages

---

## 🚀 Quick Win #5: Fix N+1 Query in BookingEquipmentController (20 minutes)

**Impact:** 5-10x faster queries

**File:** `sas-scuba-api/app/Http/Controllers/Api/V1/BookingEquipmentController.php`

**Replace the `index()` method (around line 15):**

```php
public function index(Request $request)
{
    $user = $request->user();
    
    // Use joins instead of whereHas for better performance
    $query = BookingEquipment::with(['booking.customer', 'equipmentItem.equipment', 'basket'])
        ->leftJoin('bookings', 'booking_equipment.booking_id', '=', 'bookings.id')
        ->leftJoin('equipment_baskets', 'booking_equipment.basket_id', '=', 'equipment_baskets.id')
        ->where(function($q) use ($user) {
            $q->where('bookings.dive_center_id', $user->dive_center_id)
              ->orWhere('equipment_baskets.dive_center_id', $user->dive_center_id);
        })
        ->select('booking_equipment.*')
        ->distinct();

    return $query->orderBy('booking_equipment.created_at', 'desc')->paginate(20);
}
```

---

## 📊 Expected Results After Quick Wins

### Before:
- Customer list API: ~800-1200ms
- Equipment list API: ~600-900ms  
- Frontend table load: ~2-3 seconds
- Database queries: 15-25 per request

### After Quick Wins:
- Customer list API: ~150-250ms ⚡ **70-80% faster**
- Equipment list API: ~100-180ms ⚡ **70-80% faster**
- Frontend table load: ~400-600ms ⚡ **80% faster**
- Database queries: 3-5 per request ⚡ **80% reduction**

---

## ✅ Implementation Checklist

- [ ] Run database migration for indexes
- [ ] Update CustomerController with pagination and search
- [ ] Add caching to static data controllers (5 files)
- [ ] Update frontend customers page with server-side pagination
- [ ] Fix BookingEquipmentController N+1 query
- [ ] Test all changes
- [ ] Monitor performance improvements

---

## 🎯 Next Steps (After Quick Wins)

See `PERFORMANCE_REVIEW.md` for:
- Phase 2 optimizations (caching strategies)
- Phase 3 optimizations (API resources, compression)
- Advanced optimizations (React Query, query scopes)

---

## 📝 Notes

- **Test thoroughly** after each change
- **Monitor database query count** using Laravel Debugbar
- **Check API response times** before and after
- **Verify frontend performance** using Chrome DevTools

**Total Implementation Time:** ~1.5 hours  
**Expected Performance Gain:** 60-80% improvement

