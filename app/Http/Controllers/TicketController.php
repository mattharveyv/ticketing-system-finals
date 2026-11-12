<?php

namespace App\Http\Controllers;

use App\Actions\CreateStudentTicket;
use App\Models\PaymentQueueEntry;
use App\Models\SupportType;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\PortalNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class TicketController extends Controller
{
    private const ISSUE_CATEGORIES = ['Account access', 'Classroom technology', 'Network and Wi-Fi', 'Facilities', 'Registration', 'Payments and finance', 'Library services', 'Student services', 'Other'];

    private const OPEN_STATUSES = ['New', 'In Progress', 'Waiting for Student'];

    private const COMPLETED_STATUSES = ['Resolved', 'Completed', 'Closed'];

    public function studentDashboard(Request $request): View
    {
        $student = $request->user();

        return view('user.dashboard', [
            'tickets' => $student->tickets()->with('supportType')->latest()->take(5)->get(),
            'supportTypes' => SupportType::query()->where('is_active', true)->orderBy('name')->get(),
            'openCount' => $student->tickets()->whereIn('status', self::OPEN_STATUSES)->count(),
            'resolvedCount' => $student->tickets()->whereIn('status', self::COMPLETED_STATUSES)->count(),
            'paymentWaitingCount' => PaymentQueueEntry::query()->where('status', 'Waiting')->count(),
        ]);
    }

    public function studentIndex(Request $request): View
    {
        return view('user.tickets.index', [
            'tickets' => $request->user()->tickets()->with('supportType')->latest()->paginate(10),
        ]);
    }

    public function create(): View
    {
        return view('user.tickets.create', [
            'categories' => self::ISSUE_CATEGORIES,
            'supportTypes' => SupportType::query()->where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request, CreateStudentTicket $createStudentTicket): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(self::ISSUE_CATEGORIES)],
            'support_type_id' => ['required', 'integer', Rule::exists('support_types', 'id')->where('is_active', true)],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
        ]);

        $ticket = $createStudentTicket->handle($request->user(), $validated);

        return redirect()->route('user.tickets.submitted', $ticket->ticket_number);
    }

    public function submitted(Request $request, string $ticketNumber): View
    {
        $ticket = $request->user()->tickets()->with(['supportType', 'updates.actor'])->where('ticket_number', $ticketNumber)->firstOrFail();

        return view('user.tickets.submitted', compact('ticket'));
    }

    public function studentShow(Request $request, string $ticketNumber): View
    {
        $ticket = $request->user()->tickets()->with(['supportType', 'updates.actor'])->where('ticket_number', $ticketNumber)->firstOrFail();

        return view('user.tickets.show', compact('ticket'));
    }

    public function adminDashboard(): View
    {
        return view('admin.dashboard', [
            'newTicketCount' => Ticket::query()->where('status', 'New')->count(),
            'openTicketCount' => Ticket::query()->whereIn('status', self::OPEN_STATUSES)->count(),
            'resolvedCount' => Ticket::query()->whereIn('status', self::COMPLETED_STATUSES)->count(),
            'paymentWaitingCount' => PaymentQueueEntry::query()->where('status', 'Waiting')->count(),
            'recentTickets' => Ticket::query()->with(['student', 'supportType'])->latest()->take(8)->get(),
        ]);
    }

    public function adminIndex(): View
    {
        return view('admin.tickets.index', [
            'tickets' => Ticket::query()->with(['student', 'supportType'])->latest()->paginate(20),
        ]);
    }

    public function adminKanban(): View
    {
        $statuses = ['New', 'In Progress', 'Waiting for Student', 'Resolved', 'Completed', 'Closed'];
        $tickets = Ticket::query()->latest()->get();
        $lanes = collect($statuses)->mapWithKeys(static function (string $status) use ($tickets): array {
            return [
                $status => $tickets->where('status', $status)->map(static fn (Ticket $ticket): array => [
                    'id' => $ticket->ticket_number,
                    'subject' => $ticket->subject,
                    'priority' => $ticket->priority,
                    'team' => $ticket->team,
                    'agent' => $ticket->agent,
                ])->values(),
            ];
        });

        return view('admin.tickets.kanban', compact('lanes'));
    }

    public function adminShow(string $ticketNumber): View
    {
        $ticket = Ticket::query()->with(['student', 'supportType', 'updates.actor'])->where('ticket_number', $ticketNumber)->firstOrFail();

        return view('admin.tickets.show', [
            'ticket' => $ticket,
            'statuses' => ['New', 'In Progress', 'Waiting for Student', 'Resolved', 'Completed', 'Closed'],
        ]);
    }

    public function updateStatus(Request $request, string $ticketNumber): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['New', 'In Progress', 'Waiting for Student', 'Resolved', 'Completed', 'Closed'])],
        ]);

        $ticket = Ticket::query()->where('ticket_number', $ticketNumber)->firstOrFail();
        $previousStatus = $ticket->status;

        if ($previousStatus === $validated['status']) {
            return redirect()->route('admin.tickets.show', $ticket->ticket_number)->with('status', 'The ticket already has that status.');
        }

        DB::transaction(function () use ($ticket, $validated, $request, $previousStatus): void {
            $ticket->update($validated);
            $ticket->updates()->create([
                'user_id' => $request->user()->id,
                'event_type' => 'status',
                'body' => 'Status changed from '.$previousStatus.' to '.$validated['status'].'.',
                'status' => $validated['status'],
            ]);
        });

        if ($ticket->student) {
            $ticket->student->notify(new PortalNotification([
                'title' => 'Support ticket status changed',
                'message' => $ticket->ticket_number.' is now '.$validated['status'].'.',
                'url' => route('user.tickets.show', $ticket->ticket_number),
                'category' => 'Status changed',
            ]));
        }

        return redirect()->route('admin.tickets.show', $ticket->ticket_number)->with('status', 'Support ticket updated.');
    }

    public function studentReply(Request $request, string $ticketNumber): RedirectResponse
    {
        $ticket = $request->user()->tickets()->where('ticket_number', $ticketNumber)->firstOrFail();

        return $this->saveReply($request, $ticket, false);
    }

    public function adminReply(Request $request, string $ticketNumber): RedirectResponse
    {
        $ticket = Ticket::query()->where('ticket_number', $ticketNumber)->firstOrFail();

        return $this->saveReply($request, $ticket, true);
    }

    private function saveReply(Request $request, Ticket $ticket, bool $admin): RedirectResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);
        $author = $request->user();

        $ticket->updates()->create([
            'user_id' => $author->id,
            'event_type' => 'reply',
            'body' => $validated['message'],
        ]);

        if ($admin) {
            if ($ticket->student) {
                $ticket->student->notify(new PortalNotification([
                    'title' => 'A support office replied to your ticket',
                    'message' => $ticket->ticket_number.' has a new reply.',
                    'url' => route('user.tickets.show', $ticket->ticket_number),
                    'category' => 'Ticket reply',
                ]));
            }
        } else {
            User::query()->where('role', 'admin')->each(static function (User $adminUser) use ($ticket): void {
                $adminUser->notify(new PortalNotification([
                    'title' => 'A student replied to a support ticket',
                    'message' => $ticket->ticket_number.' has a new reply.',
                    'url' => route('admin.tickets.show', $ticket->ticket_number),
                    'category' => 'Ticket reply',
                ]));
            });
        }

        $route = $admin ? 'admin.tickets.show' : 'user.tickets.show';

        return redirect()->route($route, $ticket->ticket_number)->with('status', 'Your reply was added to the ticket.');
    }
}
