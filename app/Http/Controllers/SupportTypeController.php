<?php

namespace App\Http\Controllers;

use App\Models\SupportType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SupportTypeController extends Controller
{
    public function index(): View
    {
        return view('admin.support-types.index', [
            'supportTypes' => SupportType::query()->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150', 'unique:support_types,name'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        SupportType::create([...$validated, 'is_active' => true]);

        return redirect()->route('admin.support-types')->with('status', 'Support organization added to the student request form.');
    }

    public function updateStatus(SupportType $supportType): RedirectResponse
    {
        $supportType->update(['is_active' => ! $supportType->is_active]);

        return redirect()->route('admin.support-types')->with('status', 'Support organization availability updated.');
    }
}
