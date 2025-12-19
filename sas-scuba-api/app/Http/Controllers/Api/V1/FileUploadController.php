<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png',
            'folder' => 'nullable|string|in:certifications,instructors,customers,equipment-items,agents',
        ]);

        try {
            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fileName = Str::uuid() . '.' . $extension;
            
            // Use folder from request or default to 'certifications'
            $folder = $request->input('folder', 'certifications');
            
            // For agents folder, use agents/contracts subfolder
            if ($folder === 'agents') {
                $folder = 'agents/contracts';
            }
            
            // Store in public disk for easy access
            $path = $file->storeAs($folder, $fileName, 'public');
            
            // Return the URL
            $url = Storage::disk('public')->url($path);
            
            return response()->json([
                'success' => true,
                'url' => $url,
                'path' => $path,
                'original_name' => $originalName,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload file: ' . $e->getMessage()
            ], 500);
        }
    }
}

