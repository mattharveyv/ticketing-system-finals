@props(['ticket', 'admin' => false])

<section class="panel ticket-updates-panel">
    <div class="panel-heading">
        <div>
            <h2>Ticket updates</h2>
            <p>Replies and status changes for {{ $ticket->ticket_number }}.</p>
        </div>
    </div>

    <div class="ticket-update-list">
        @forelse ($ticket->updates as $update)
            <article class="ticket-update {{ $update->event_type === 'status' ? 'ticket-update-status' : 'ticket-update-reply' }}">
                <div class="ticket-update-heading">
                    <strong>{{ $update->actor?->name ?? 'System' }}</strong>
                    @if ($update->event_type === 'status')
                        <x-status-badge :status="$update->status ?? 'Updated'" />
                    @else
                        <span class="ticket-update-type">Reply</span>
                    @endif
                    <time datetime="{{ $update->created_at->toIso8601String() }}">{{ $update->created_at->format('M j, Y g:i A') }}</time>
                </div>
                <p>{{ $update->body }}</p>
            </article>
        @empty
            <div class="empty-state"><p>No updates have been posted yet.</p></div>
        @endforelse
    </div>

    <form action="{{ $admin ? route('admin.tickets.reply', $ticket->ticket_number) : route('user.tickets.reply', $ticket->ticket_number) }}" method="POST" class="ticket-reply-form">
        @csrf
        <label for="ticket-reply-message">{{ $admin ? 'Reply to the student' : 'Send a reply to the support office' }}</label>
        <textarea class="field-input textarea" id="ticket-reply-message" name="message" rows="4" maxlength="5000" required placeholder="Write your update here…">{{ old('message') }}</textarea>
        @error('message')<small class="field-error">{{ $message }}</small>@enderror
        <button class="btn btn-primary" type="submit">Send reply <span>→</span></button>
    </form>
</section>
