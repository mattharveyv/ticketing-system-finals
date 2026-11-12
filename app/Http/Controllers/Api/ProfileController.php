<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ProfileController extends Controller
{
    public function updatePhoto(Request $request): JsonResponse
    {
        if ($request->hasFile('profile_photo')) {
            $validated = $request->validate([
                'profile_photo' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            ]);
            $photoPath = $validated['profile_photo']->storePublicly('profile-photos', 'public');
        } else {
            $validated = $request->validate([
                'profile_photo' => ['required', 'string', 'max:7000000'],
            ]);
            $photoContents = base64_decode($validated['profile_photo'], true);

            if ($photoContents === false || strlen($photoContents) > 5 * 1024 * 1024) {
                throw ValidationException::withMessages([
                    'profile_photo' => ['Choose a valid image smaller than 5 MB.'],
                ]);
            }

            $imageDetails = getimagesizefromstring($photoContents);

            if ($imageDetails === false || ! in_array($imageDetails['mime'], ['image/jpeg', 'image/png', 'image/webp'], true)) {
                throw ValidationException::withMessages([
                    'profile_photo' => ['Choose a JPEG, PNG, or WebP image.'],
                ]);
            }

            $extension = match ($imageDetails['mime']) {
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
            };
            $photoPath = 'profile-photos/'.Str::uuid().'.'.$extension;

            if (! Storage::disk('public')->put($photoPath, $photoContents)) {
                throw new RuntimeException('Unable to save the profile photo.');
            }
        }

        $student = $request->user();
        $previousPhotoPath = $student->profile_photo_path;

        if (! $photoPath) {
            throw new RuntimeException('Unable to save the profile photo.');
        }

        $student->update(['profile_photo_path' => $photoPath]);

        if ($previousPhotoPath) {
            Storage::disk('public')->delete($previousPhotoPath);
        }

        return UserResource::make($student->refresh())
            ->response()
            ->setStatusCode(200);
    }
}
