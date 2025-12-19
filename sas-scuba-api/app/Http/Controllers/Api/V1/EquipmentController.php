<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EquipmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Equipment::query();

        if ($user->dive_center_id) {
            $query->where('dive_center_id', $user->dive_center_id);
        }

        // Filter by category if provided
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Add server-side search
        if ($request->has('search') && !empty($request->get('search'))) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        // Get pagination parameters
        $perPage = $request->get('per_page', 20);
        $perPage = min(max($perPage, 1), 100); // Limit between 1 and 100

        return $query->with('equipmentItems')->paginate($perPage);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge(['dive_center_id' => $request->user()->dive_center_id]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'dive_center_id' => 'required|exists:dive_centers,id',
            'sizes' => 'nullable|array',
            'sizes.*' => 'string|max:50',
            'brands' => 'nullable|array',
            'brands.*' => 'string|max:100',
        ]);

        $equipment = Equipment::create($validated);
        return response()->json($equipment->load('equipmentItems'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Equipment $equipment)
    {
        return $equipment->load('equipmentItems');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Equipment $equipment)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'nullable|string|max:255',
            'sizes' => 'nullable|array',
            'sizes.*' => 'string|max:50',
            'brands' => 'nullable|array',
            'brands.*' => 'string|max:100',
        ]);

        $equipment->update($validated);
        return response()->json($equipment->load('equipmentItems'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Equipment $equipment)
    {
        $equipment->delete();
        return response()->noContent();
    }

    /**
     * Bulk create multiple equipment items.
     */
    public function bulkStore(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $request->validate([
            'equipment' => 'required|array|min:1',
            'equipment.*.name' => 'required|string|max:255',
            'equipment.*.category' => 'nullable|string|max:255',
            'equipment.*.sizes' => 'nullable|array',
            'equipment.*.sizes.*' => 'string|max:50',
            'equipment.*.brands' => 'nullable|array',
            'equipment.*.brands.*' => 'string|max:100',
        ]);

        $results = [
            'success' => [],
            'errors' => [],
        ];

        DB::beginTransaction();
        try {
            foreach ($request->equipment as $index => $equipmentData) {
                try {
                    // Check for duplicate by name (case-insensitive)
                    $existing = Equipment::where('dive_center_id', $diveCenterId)
                        ->whereRaw('LOWER(name) = ?', [strtolower($equipmentData['name'])])
                        ->first();

                    if ($existing) {
                        $results['errors'][] = [
                            'row' => $index + 1,
                            'name' => $equipmentData['name'],
                            'error' => 'Duplicate equipment name already exists',
                        ];
                        continue;
                    }

                    $equipment = Equipment::create([
                        'dive_center_id' => $diveCenterId,
                        'name' => $equipmentData['name'],
                        'category' => $equipmentData['category'] ?? null,
                        'sizes' => $equipmentData['sizes'] ?? [],
                        'brands' => $equipmentData['brands'] ?? [],
                        'active' => true,
                    ]);

                    $results['success'][] = [
                        'row' => $index + 1,
                        'id' => $equipment->id,
                        'name' => $equipment->name,
                    ];
                } catch (\Exception $e) {
                    $results['errors'][] = [
                        'row' => $index + 1,
                        'name' => $equipmentData['name'] ?? 'Unknown',
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Bulk create completed',
                'success_count' => count($results['success']),
                'error_count' => count($results['errors']),
                'results' => $results,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Bulk create failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Preview Excel import without saving to database.
     */
    public function importPreview(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
        ]);

        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            if (empty($rows) || count($rows) < 2) {
                return response()->json([
                    'message' => 'Excel file is empty or has no data rows',
                ], 400);
            }

            // Get header row (first row)
            $headers = array_map('strtolower', array_map('trim', $rows[0]));
            
            // Find column indices
            $nameIndex = array_search('name', $headers);
            $categoryIndex = array_search('category', $headers);
            $sizesIndex = array_search('sizes', $headers);
            $brandsIndex = array_search('brands', $headers);
            $activeIndex = array_search('active', $headers);

            if ($nameIndex === false) {
                return response()->json([
                    'message' => 'Excel file must have a "Name" column',
                ], 400);
            }

            $valid = [];
            $duplicates = [];
            $errors = [];

            // Get existing equipment names for duplicate checking
            $existingNames = Equipment::where('dive_center_id', $diveCenterId)
                ->pluck('name')
                ->map(fn($name) => strtolower($name))
                ->toArray();

            // Process data rows (skip header)
            foreach (array_slice($rows, 1) as $rowIndex => $row) {
                $rowNumber = $rowIndex + 2; // +2 because array is 0-indexed and we skip header

                try {
                    $name = trim($row[$nameIndex] ?? '');
                    
                    if (empty($name)) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'name' => '',
                            'error' => 'Name is required',
                        ];
                        continue;
                    }

                    // Check for duplicate
                    if (in_array(strtolower($name), $existingNames)) {
                        $duplicates[] = [
                            'row' => $rowNumber,
                            'name' => $name,
                        ];
                        continue;
                    }

                    // Parse sizes
                    $sizes = [];
                    if ($sizesIndex !== false && isset($row[$sizesIndex]) && !empty(trim($row[$sizesIndex]))) {
                        $sizes = array_map('trim', explode(',', $row[$sizesIndex]));
                        $sizes = array_filter($sizes, fn($s) => !empty($s));
                    }

                    // Parse brands
                    $brands = [];
                    if ($brandsIndex !== false && isset($row[$brandsIndex]) && !empty(trim($row[$brandsIndex]))) {
                        $brands = array_map('trim', explode(',', $row[$brandsIndex]));
                        $brands = array_filter($brands, fn($b) => !empty($b));
                    }

                    // Get category
                    $category = null;
                    if ($categoryIndex !== false && isset($row[$categoryIndex])) {
                        $category = trim($row[$categoryIndex]);
                        if (empty($category)) {
                            $category = null;
                        }
                    }

                    // Get active status
                    $active = true;
                    if ($activeIndex !== false && isset($row[$activeIndex])) {
                        $activeValue = strtolower(trim($row[$activeIndex]));
                        $active = in_array($activeValue, ['1', 'true', 'yes', 'y']);
                    }

                    // Validate
                    if (strlen($name) < 2) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'name' => $name,
                            'error' => 'Name must be at least 2 characters',
                        ];
                        continue;
                    }

                    if (strlen($name) > 255) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'name' => $name,
                            'error' => 'Name must be less than 255 characters',
                        ];
                        continue;
                    }

                    $valid[] = [
                        'row' => $rowNumber,
                        'name' => $name,
                        'category' => $category,
                        'sizes' => array_values($sizes),
                        'brands' => array_values($brands),
                        'active' => $active,
                    ];
                } catch (\Exception $e) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'name' => $row[$nameIndex] ?? 'Unknown',
                        'error' => $e->getMessage(),
                    ];
                }
            }

            return response()->json([
                'valid' => $valid,
                'duplicates' => $duplicates,
                'errors' => $errors,
                'summary' => [
                    'total_rows' => count($rows) - 1,
                    'valid_count' => count($valid),
                    'duplicate_count' => count($duplicates),
                    'error_count' => count($errors),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to parse Excel file',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import validated equipment data to database.
     */
    public function import(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $request->validate([
            'equipment' => 'required|array|min:1',
            'equipment.*.name' => 'required|string|max:255',
            'equipment.*.category' => 'nullable|string|max:255',
            'equipment.*.sizes' => 'nullable|array',
            'equipment.*.sizes.*' => 'string|max:50',
            'equipment.*.brands' => 'nullable|array',
            'equipment.*.brands.*' => 'string|max:100',
            'equipment.*.active' => 'nullable|boolean',
        ]);

        $results = [
            'success' => [],
            'errors' => [],
        ];

        DB::beginTransaction();
        try {
            foreach ($request->equipment as $index => $equipmentData) {
                try {
                    // Double-check for duplicates (in case data changed between preview and import)
                    $existing = Equipment::where('dive_center_id', $diveCenterId)
                        ->whereRaw('LOWER(name) = ?', [strtolower($equipmentData['name'])])
                        ->first();

                    if ($existing) {
                        $results['errors'][] = [
                            'row' => $equipmentData['row'] ?? $index + 1,
                            'name' => $equipmentData['name'],
                            'error' => 'Duplicate equipment name already exists',
                        ];
                        continue;
                    }

                    $equipment = Equipment::create([
                        'dive_center_id' => $diveCenterId,
                        'name' => $equipmentData['name'],
                        'category' => $equipmentData['category'] ?? null,
                        'sizes' => $equipmentData['sizes'] ?? [],
                        'brands' => $equipmentData['brands'] ?? [],
                        'active' => $equipmentData['active'] ?? true,
                    ]);

                    $results['success'][] = [
                        'row' => $equipmentData['row'] ?? $index + 1,
                        'id' => $equipment->id,
                        'name' => $equipment->name,
                    ];
                } catch (\Exception $e) {
                    $results['errors'][] = [
                        'row' => $equipmentData['row'] ?? $index + 1,
                        'name' => $equipmentData['name'] ?? 'Unknown',
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Import completed',
                'success_count' => count($results['success']),
                'error_count' => count($results['errors']),
                'results' => $results,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Import failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download Excel template for equipment import.
     */
    public function downloadTemplate()
    {
        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Set headers
            $headers = ['Name', 'Category', 'Sizes', 'Brands', 'Active'];
            $sheet->fromArray([$headers], null, 'A1');

            // Set header style (bold)
            $sheet->getStyle('A1:E1')->getFont()->setBold(true);
            $sheet->getStyle('A1:E1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFE0E0E0');

            // Add sample data row
            $sampleData = [
                'BCD',
                'Equipment',
                'XS,S,M,L,XL',
                'Scubapro,Aqualung',
                'true'
            ];
            $sheet->fromArray([$sampleData], null, 'A2');

            // Add instructions row
            $instructions = [
                'Required: Name (min 2 characters)',
                'Optional: Category',
                'Optional: Comma-separated sizes (e.g., XS,S,M,L)',
                'Optional: Comma-separated brands (e.g., Brand1,Brand2)',
                'Optional: Active status (true/false, default: true)'
            ];
            $sheet->fromArray([$instructions], null, 'A4');

            // Auto-size columns
            foreach (range('A', 'E') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            // Create writer
            $writer = new Xlsx($spreadsheet);
            
            // Stream the file
            $fileName = 'equipment_import_template_' . date('Y-m-d') . '.xlsx';
            
            return response()->streamDownload(function () use ($writer) {
                $writer->save('php://output');
            }, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate template',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

