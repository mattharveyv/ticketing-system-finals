<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'student_id' => ['required', 'string', 'max:50', 'unique:users,student_id'],
            'college' => ['required', 'string', 'max:150'],
            'program' => ['nullable', 'string', 'max:150'],
            'year_level' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $student = User::query()->create([
            ...$validated,
            'password' => Hash::make($validated['password']),
            'role' => 'student',
        ]);

        return $this->createTokenResponse($request, $student, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $student = User::query()
            ->where('email', $credentials['email'])
            ->where('role', 'student')
            ->first();

        if (! $student || ! Hash::check($credentials['password'], $student->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        return $this->createTokenResponse($request, $student);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    private function createTokenResponse(Request $request, User $student, int $status = 200): JsonResponse
    {
        $token = $student->createToken('expo-mobile', ['*'], now()->addDays(30));

        return response()->json([
            'token' => $token->plainTextToken,
            'user' => UserResource::make($student)->resolve($request),
        ], $status);
    }
}
