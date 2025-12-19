<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use App\Models\Agent;
use Illuminate\Http\Request;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Tag::where('dive_center_id', $user->dive_center_id);
        
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%");
        }
        
        return $query->orderBy('name')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:tags,name,NULL,id,dive_center_id,' . $user->dive_center_id,
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);
        
        $tag = Tag::create([
            'dive_center_id' => $user->dive_center_id,
            'name' => $validated['name'],
            'color' => $validated['color'] ?? '#3B82F6',
        ]);
        
        return response()->json($tag, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Tag $tag)
    {
        return $tag->load('agents');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Tag $tag)
    {
        $user = $request->user();
        
        // Ensure tag belongs to user's dive center
        if ($tag->dive_center_id !== $user->dive_center_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:tags,name,' . $tag->id . ',id,dive_center_id,' . $user->dive_center_id,
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);
        
        $tag->update($validated);
        
        return response()->json($tag);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tag $tag)
    {
        $user = request()->user();
        
        // Ensure tag belongs to user's dive center
        if ($tag->dive_center_id !== $user->dive_center_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Check if tag is attached to any agents
        if ($tag->agents()->exists()) {
            return response()->json([
                'error' => 'Cannot delete tag that is attached to agents'
            ], 422);
        }
        
        $tag->delete();
        return response()->noContent();
    }

    /**
     * Attach tag to agent
     */
    public function attachToAgent($agentId, $tagId)
    {
        $user = request()->user();
        
        $agent = Agent::where('dive_center_id', $user->dive_center_id)->findOrFail($agentId);
        $tag = Tag::where('dive_center_id', $user->dive_center_id)->findOrFail($tagId);
        
        if (!$agent->tags()->where('tag_id', $tagId)->exists()) {
            $agent->tags()->attach($tagId);
        }
        
        return response()->json(['message' => 'Tag attached successfully']);
    }

    /**
     * Detach tag from agent
     */
    public function detachFromAgent($agentId, $tagId)
    {
        $user = request()->user();
        
        $agent = Agent::where('dive_center_id', $user->dive_center_id)->findOrFail($agentId);
        $tag = Tag::where('dive_center_id', $user->dive_center_id)->findOrFail($tagId);
        
        $agent->tags()->detach($tagId);
        
        return response()->noContent();
    }
}
