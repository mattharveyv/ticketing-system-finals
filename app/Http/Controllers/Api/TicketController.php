<?php

namespace App\Http\Controllers\Api;

use App\Actions\CreateStudentTicket;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\SupportTypeResource;
use App\Http\Resources\Api\TicketResource;
use App\Models\SupportType;
use App\Models\User;
use App\Notifications\PortalNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    private const ISSUE_CATEGORIES = ['Account access', 'Classroom technology', 'Network and Wi-Fi', 'Facilities', 'Registration', 'Payments and finance', 'Library services', 'Student services', 'Other'];

    private const TICKET_STATUSES = ['New', 'In Progress', 'Waiting for Student', 'Resolved', 'Completed', 'Closed'];

    public function supportTypes(): AnonymousResourceCollection
    {
        return SupportTypeResource::collection(
            SupportType::query()->where('is_active', true)->orderBy('name')->get(),
        );
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::in(self::TICKET_STATUSES)],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);
        $studentTickets = $request->user()->tickets();
        $ticketsQuery = (clone $studentTickets)->with('supportType');

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $ticketsQuery->where(static function (Builder $query) use ($search): void {
                $query->where('ticket_number', 'like', '%'.$search.'%')
                    ->orWhere('subject', 'like', '%'.$search.'%');
            });
        }

        if (! empty($validated['status'])) {
            $ticketsQuery->where('status', $validated['status']);
        }

        $ticketStats = (clone $studentTickets)
            ->selectRaw(
                'COUNT(CASE WHEN status IN (?, ?, ?) THEN 1 END) as active, COUNT(CASE WHEN status IN (?, ?, ?) THEN 1 END) as resolved',
                ['New', 'In Progress', 'Waiting for Student', 'Resolved', 'Completed', 'Closed'],
            )
            ->first();

        return TicketResource::collection($ticketsQuery->latest()->paginate(20)->withQueryString())
            ->additional([
                'stats' => [
                    'active' => (int) $ticketStats->active,
                    'resolved' => (int) $ticketStats->resolved,
                ],
            ]);
    }

    public function store(Request $request, CreateStudentTicket $createStudentTicket): JsonResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(self::ISSUE_CATEGORIES)],
            'support_type_id' => ['required', 'integer', Rule::exists('support_types', 'id')->where('is_active', true)],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
        ]);

        $ticket = $createStudentTicket->handle($request->user(), $validated);

        return TicketResource::make($ticket->load('supportType'))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, string $ticketNumber): TicketResource
    {
        $ticket = $request->user()
            ->tickets()
            ->with(['supportType', 'updates.actor'])
            ->where('ticket_number', $ticketNumber)
            ->firstOrFail();

        return TicketResource::make($ticket);
    }

    public function reply(Request $request, string $ticketNumber): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);
        $ticket = $request->user()->tickets()
            ->where('ticket_number', $ticketNumber)
            ->firstOrFail();
        $ticket->updates()->create([
            'user_id' => $request->user()->id,
            'event_type' => 'reply',
            'body' => $validated['message'],
        ]);

        User::query()->where('role', 'admin')->each(static function (User $adminUser) use ($ticket): void {
            $adminUser->notify(new PortalNotification([
                'title' => 'A student replied to a support ticket',
                'message' => $ticket->ticket_number.' has a new reply.',
                'url' => route('admin.tickets.show', $ticket->ticket_number),
                'category' => 'Ticket reply',
            ]));
        });

        $ticket->load(['supportType', 'updates.actor']);

        return TicketResource::make($ticket)
            ->response()
            ->setStatusCode(201);
    }
}
