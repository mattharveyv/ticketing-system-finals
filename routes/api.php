<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KnowledgeBaseController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\PaymentQueueController;
use App\Http\Resources\Api\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->middleware('throttle:10,1')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware(['auth:sanctum', 'student'])->group(function (): void {
    Route::get('/user', fn (Request $request) => UserResource::make($request->user()));
    Route::post('/user/profile-photo', [ProfileController::class, 'updatePhoto']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::get('/knowledge-base', [KnowledgeBaseController::class, 'index']);
    Route::get('/knowledge-base/{slug}', [KnowledgeBaseController::class, 'show']);
    Route::get('/support-types', [TicketController::class, 'supportTypes']);
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{ticketNumber}', [TicketController::class, 'show']);
    Route::post('/tickets/{ticketNumber}/replies', [TicketController::class, 'reply']);
    Route::get('/payment-queue/status', [PaymentQueueController::class, 'studentStatus']);
    Route::post('/payment-queue', [PaymentQueueController::class, 'apiJoin']);
});
