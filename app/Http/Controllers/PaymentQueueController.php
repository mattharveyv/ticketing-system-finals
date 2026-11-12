<?php

namespace App\Http\Controllers;

use App\Models\PaymentQueueEntry;
use App\Notifications\PortalNotification;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class PaymentQueueController extends Controller
{
    public function studentIndex(Request $request): View
    {
        $waitingEntries = $this->orderedWaitingEntries();
        $positions = $waitingEntries->values()->mapWithKeys(static fn (PaymentQueueEntry $entry, int $index): array => [$entry->id => $index + 1]);

        return view('user.payment-queue.index', [
            'entries' => $request->user()->paymentQueueEntries()
                ->whereIn('status', ['Waiting', 'Called', 'Serving'])
                ->orderBy('created_at')
                ->get(),
            'recentEntries' => $request->user()->paymentQueueEntries()
                ->whereIn('status', ['Served', 'Skipped'])
                ->latest('updated_at')
                ->take(10)
                ->get(),
            'positions' => $positions,
            'currentEntry' => $this->currentEntry(),
            'latestCallEntry' => $request->user()->paymentQueueEntries()->whereNotNull('called_at')->latest('called_at')->first(),
            'waitingCount' => PaymentQueueEntry::query()->where('status', 'Waiting')->count(),
        ]);
    }

    public function studentStatus(Request $request): JsonResponse
    {
        $waitingEntries = $this->orderedWaitingEntries();
        $waitingCount = $waitingEntries->count();
        $positions = $waitingEntries->values()->mapWithKeys(static fn (PaymentQueueEntry $entry, int $index): array => [$entry->id => $index + 1]);
        $user = $request->user();
        $activeEntries = $user->paymentQueueEntries()
            ->whereIn('status', ['Waiting', 'Called', 'Serving'])
            ->orderBy('created_at')
            ->get();
        $recentEntries = $user->paymentQueueEntries()
            ->whereIn('status', ['Served', 'Skipped'])
            ->latest('updated_at')
            ->take(10)
            ->get();
        $entries = $activeEntries->concat($recentEntries)
            ->map(static fn (PaymentQueueEntry $entry): array => [
                'id' => $entry->id,
                'queueNumber' => $entry->queue_number,
                'status' => $entry->status,
                'paymentType' => $entry->payment_type,
                'queueType' => $entry->queue_type,
                'otherDetails' => $entry->other_details,
                'position' => $positions[$entry->id] ?? null,
                'calledAt' => $entry->called_at?->format('g:i A'),
            ]);
        $currentEntry = $this->currentEntry();

        return response()->json([
            'entries' => $entries,
            'currentCall' => $currentEntry ? [
                'queueNumber' => $currentEntry->queue_number,
                'paymentType' => $currentEntry->payment_type,
                'queueType' => $currentEntry->queue_type,
            ] : null,
            'waitingCount' => $waitingCount,
        ]);
    }

    public function join(Request $request): RedirectResponse
    {
        $validated = $this->validateJoinRequest($request);
        $entry = $this->createEntry($request, $validated);

        return redirect()->route('user.payment-queue')->with('status', 'You joined the payment line. Your number is '.$entry->queue_number.'.');
    }

    public function apiJoin(Request $request): JsonResponse
    {
        $validated = $this->validateJoinRequest($request);
        $entry = $this->createEntry($request, $validated);
        $position = $this->orderedWaitingEntries()->values()->search(
            static fn (PaymentQueueEntry $waitingEntry): bool => $waitingEntry->id === $entry->id,
        );

        return response()->json([
            'data' => [
                'id' => $entry->id,
                'queueNumber' => $entry->queue_number,
                'status' => $entry->status,
                'paymentType' => $entry->payment_type,
                'queueType' => $entry->queue_type,
                'otherDetails' => $entry->other_details,
                'position' => $position === false ? null : $position + 1,
                'calledAt' => null,
            ],
        ], 201);
    }

    public function adminIndex(): View
    {
        $orderedWaitingEntries = $this->orderedWaitingEntries();

        $positions = $orderedWaitingEntries->values()->mapWithKeys(static fn (PaymentQueueEntry $entry, int $index): array => [$entry->id => $index + 1]);

        return view('admin.payment-queue.index', [
            'waitingEntries' => $orderedWaitingEntries,
            'positions' => $positions,
            'currentEntry' => $this->currentEntry(),
            'recentEntries' => PaymentQueueEntry::query()->whereIn('status', ['Served', 'Skipped'])->latest('updated_at')->take(10)->get(),
        ]);
    }

    public function callNext(): RedirectResponse
    {
        $entry = DB::transaction(function (): ?PaymentQueueEntry {
            $nextEntry = PaymentQueueEntry::query()
                ->where('status', 'Waiting')
                ->orderBy('created_at')
                ->orderBy('id')
                ->lockForUpdate()
                ->first();

            if (! $nextEntry) {
                return null;
            }

            $activeEntry = PaymentQueueEntry::query()
                ->whereIn('status', ['Called', 'Serving'])
                ->lockForUpdate()
                ->first();

            if ($activeEntry) {
                return null;
            }

            $nextSequence = ((int) PaymentQueueEntry::query()->whereNotNull('call_sequence')->max('call_sequence')) + 1;
            $preferredQueueType = (($nextSequence - 1) % 3) < 2 ? 'Priority' : 'Regular';
            $nextEntry = PaymentQueueEntry::query()
                ->where('status', 'Waiting')
                ->where('queue_type', $preferredQueueType)
                ->orderBy('created_at')
                ->orderBy('id')
                ->lockForUpdate()
                ->first();

            if (! $nextEntry) {
                $fallbackQueueType = $preferredQueueType === 'Priority' ? 'Regular' : 'Priority';
                $nextEntry = PaymentQueueEntry::query()
                    ->where('status', 'Waiting')
                    ->where('queue_type', $fallbackQueueType)
                    ->orderBy('created_at')
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->first();
            }

            if (! $nextEntry) {
                return null;
            }

            $nextEntry->update([
                'status' => 'Called',
                'called_at' => now(),
                'call_sequence' => $nextSequence,
            ]);

            return $nextEntry;
        });

        if (! $entry) {
            return redirect()->route('admin.payment-queue')->with('status', 'Finish or skip the current student before calling the next one, or the waiting line is empty.');
        }

        $entry->student?->notify(new PortalNotification([
            'title' => 'Your payment queue number was called',
            'message' => $entry->queue_number.' is being called for '.$entry->payment_type.'.',
            'url' => route('user.payment-queue'),
            'category' => 'Payment queue',
        ]));

        return redirect()->route('admin.payment-queue')->with('status', 'Now calling '.$entry->queue_number.'.');
    }

    public function updateStatus(Request $request, PaymentQueueEntry $entry): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['Serving', 'Served', 'Skipped'])],
        ]);

        $entry->update([
            'status' => $validated['status'],
            'served_at' => in_array($validated['status'], ['Served', 'Skipped'], true) ? now() : null,
        ]);

        return redirect()->route('admin.payment-queue')->with('status', $entry->queue_number.' marked '.$validated['status'].'.');
    }

    private function orderedWaitingEntries(): Collection
    {
        $waitingEntries = PaymentQueueEntry::query()
            ->where('status', 'Waiting')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();
        $priorityEntries = $waitingEntries->where('queue_type', 'Priority')->values();
        $regularEntries = $waitingEntries->where('queue_type', 'Regular')->values();
        $nextSequence = ((int) PaymentQueueEntry::query()->whereNotNull('call_sequence')->max('call_sequence')) + 1;
        $orderedWaitingEntries = new Collection;

        while ($priorityEntries->isNotEmpty() || $regularEntries->isNotEmpty()) {
            $preferredQueueType = (($nextSequence - 1) % 3) < 2 ? 'Priority' : 'Regular';
            $preferredEntries = $preferredQueueType === 'Priority' ? $priorityEntries : $regularEntries;
            $fallbackEntries = $preferredQueueType === 'Priority' ? $regularEntries : $priorityEntries;
            $entry = $preferredEntries->shift() ?? $fallbackEntries->shift();

            $orderedWaitingEntries->push($entry);
            $nextSequence++;
        }

        return $orderedWaitingEntries;
    }

    private function currentEntry(): ?PaymentQueueEntry
    {
        return PaymentQueueEntry::query()
            ->whereIn('status', ['Called', 'Serving'])
            ->latest('called_at')
            ->first();
    }

    /**
     * @return array{payment_type: string, queue_type: string, other_details?: string|null}
     */
    private function validateJoinRequest(Request $request): array
    {
        return $request->validate([
            'payment_type' => ['required', Rule::in(['Tuition', 'Balance', 'Other'])],
            'queue_type' => ['required', Rule::in(['Regular', 'Priority'])],
            'other_details' => ['nullable', 'required_if:payment_type,Other', 'string', 'max:150'],
        ]);
    }

    /**
     * @param  array{payment_type: string, queue_type: string, other_details?: string|null}  $validated
     */
    private function createEntry(Request $request, array $validated): PaymentQueueEntry
    {
        return $request->user()->paymentQueueEntries()->create([
            'queue_number' => 'PAY-'.substr((string) Str::ulid(), -10),
            'student_name' => $request->user()->name,
            'student_id' => $request->user()->student_id,
            'student_email' => $request->user()->email,
            'payment_type' => $validated['payment_type'],
            'queue_type' => $validated['queue_type'],
            'other_details' => $validated['other_details'] ?? null,
        ]);
    }
}
