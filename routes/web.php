<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentQueueController;
use App\Http\Controllers\SupportTypeController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;
use Illuminate\View\View;

Route::view('/', 'landing')->name('home');
Route::get('/login', static fn (): View => view('auth.login'))->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.store');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register'])->name('register.store');
Route::view('/forgot-password', 'auth.forgot-password')->name('forgot-password');
Route::get('/admin/login', static fn (): View => view('auth.admin-login'))->name('admin.login');
Route::post('/admin/login', [AuthController::class, 'adminLogin'])->name('admin.login.store');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware(['auth', 'student'])->prefix('user')->name('user.')->group(function (): void {
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::get('/dashboard', [TicketController::class, 'studentDashboard'])->name('dashboard');
    Route::get('/tickets', [TicketController::class, 'studentIndex'])->name('tickets');
    Route::get('/tickets/create', [TicketController::class, 'create'])->name('tickets.create');
    Route::post('/tickets', [TicketController::class, 'store'])->name('tickets.store');
    Route::get('/tickets/submitted/{ticketNumber}', [TicketController::class, 'submitted'])->name('tickets.submitted');
    Route::post('/tickets/{ticketNumber}/replies', [TicketController::class, 'studentReply'])->name('tickets.reply');
    Route::get('/tickets/{ticketNumber}', [TicketController::class, 'studentShow'])->name('tickets.show');
    Route::get('/payment-queue', [PaymentQueueController::class, 'studentIndex'])->name('payment-queue');
    Route::get('/payment-queue/status', [PaymentQueueController::class, 'studentStatus'])->name('payment-queue.status');
    Route::post('/payment-queue', [PaymentQueueController::class, 'join'])->name('payment-queue.join');
    Route::view('/knowledge-base', 'user.knowledge-base.index')->name('knowledge');
    Route::get('/knowledge-base/{slug}', static fn (string $slug): View => view('user.knowledge-base.show', compact('slug')))->name('knowledge.show');
    Route::view('/profile', 'user.profile')->name('profile');
    Route::view('/settings', 'user.settings')->name('settings');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::get('/dashboard', [TicketController::class, 'adminDashboard'])->name('dashboard');
    Route::get('/tickets', [TicketController::class, 'adminIndex'])->name('tickets');
    Route::get('/tickets/kanban', [TicketController::class, 'adminKanban'])->name('kanban');
    Route::get('/tickets/{ticketNumber}', [TicketController::class, 'adminShow'])->name('tickets.show');
    Route::post('/tickets/{ticketNumber}/replies', [TicketController::class, 'adminReply'])->name('tickets.reply');
    Route::patch('/tickets/{ticketNumber}', [TicketController::class, 'updateStatus'])->name('tickets.update');
    Route::get('/payment-queue', [PaymentQueueController::class, 'adminIndex'])->name('payment-queue');
    Route::post('/payment-queue/call-next', [PaymentQueueController::class, 'callNext'])->name('payment-queue.call-next');
    Route::patch('/payment-queue/{entry}', [PaymentQueueController::class, 'updateStatus'])->name('payment-queue.update');
    Route::get('/support-types', [SupportTypeController::class, 'index'])->name('support-types');
    Route::post('/support-types', [SupportTypeController::class, 'store'])->name('support-types.store');
    Route::patch('/support-types/{supportType}/status', [SupportTypeController::class, 'updateStatus'])->name('support-types.status');
    Route::view('/customers', 'admin.customers.index')->name('customers');
    Route::get('/customers/{customerId}', static fn (string $customerId): View => view('admin.customers.show', compact('customerId')))->name('customers.show');
    Route::view('/agents', 'admin.agents.index')->name('agents');
    Route::get('/agents/{agentId}', static fn (string $agentId): View => view('admin.agents.show', compact('agentId')))->name('agents.show');
    Route::view('/teams', 'admin.teams.index')->name('teams');
    Route::view('/sla', 'admin.sla.index')->name('sla');
    Route::view('/knowledge-base', 'admin.knowledge-base.index')->name('knowledge-base');
    Route::view('/canned-responses', 'admin.canned-responses.index')->name('canned-responses');
    Route::view('/reports', 'admin.reports.index')->name('reports');
    Route::view('/audit-logs', 'admin.audit-logs.index')->name('audit-logs');
    Route::view('/settings', 'admin.settings.index')->name('settings');
});

