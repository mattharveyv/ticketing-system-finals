@extends('layouts.app')
@section('title', 'Walk-in Payment Queue — MSEUF Staff')
@section('page-title', 'Payment queue')
@section('content')
<div class="page-heading"><div><span class="eyebrow">WALK-IN PAYMENT SERVICES</span><h1>Student payment queue</h1><p>Call students in arrival order for tuition, balance, and other payment services. Support issue tickets are managed separately.</p></div></div>
@if (session('status'))<div class="form-success" role="status">{{ session('status') }}</div>@endif

<section class="payment-queue-callout panel {{ $currentEntry ? 'has-current-entry' : '' }}">
    <div class="payment-current-student">
        <span class="eyebrow">{{ $currentEntry ? 'NOW CALLING' : 'NOW SERVING' }}</span>
        @if ($currentEntry)
            <strong>{{ $currentEntry->queue_number }}</strong>
            <span>{{ $currentEntry->student_name }}</span>
            <small>{{ $currentEntry->payment_type }} · {{ $currentEntry->queue_type }}@if ($currentEntry->other_details) · {{ $currentEntry->other_details }}@endif</small>
        @else
            <strong>No student being called</strong>
            <span>Call the next student when the counter is ready.</span>
        @endif
    </div>
    <div class="payment-next-actions">
        @if ($currentEntry)
            <p>Finish or skip the current student before calling the next number.</p>
            <div class="payment-current-actions">
                @if ($currentEntry->status === 'Called')
                    <form action="{{ route('admin.payment-queue.update', $currentEntry) }}" method="POST">@csrf @method('PATCH')<input type="hidden" name="status" value="Serving"><button class="btn btn-secondary" type="submit">Start service</button></form>
                @endif
                <form action="{{ route('admin.payment-queue.update', $currentEntry) }}" method="POST">@csrf @method('PATCH')<input type="hidden" name="status" value="Served"><button class="btn btn-primary" type="submit">Mark served ✓</button></form>
                <form action="{{ route('admin.payment-queue.update', $currentEntry) }}" method="POST">@csrf @method('PATCH')<input type="hidden" name="status" value="Skipped"><button class="btn btn-secondary" type="submit">Skip number</button></form>
            </div>
        @else
            <span class="eyebrow">NEXT BY ARRIVAL</span>
            @if ($waitingEntries->isNotEmpty())
                <strong>{{ $waitingEntries->first()->queue_number }}</strong>
                <span>{{ $waitingEntries->first()->student_name }} · {{ $waitingEntries->first()->payment_type }} · {{ $waitingEntries->first()->queue_type }}</span>
            @else
                <strong>The line is clear</strong>
                <span>New student entries will appear here.</span>
            @endif
            <form action="{{ route('admin.payment-queue.call-next') }}" method="POST">@csrf<button class="btn btn-primary" type="submit" @disabled($waitingEntries->isEmpty())>Call next student <span>→</span></button></form>
        @endif
    </div>
</section>

<section class="panel queue-table-panel"><div class="panel-heading"><div><h2>Waiting for service</h2><p>{{ $waitingEntries->count() }} student{{ $waitingEntries->count() === 1 ? '' : 's' }} · priority calls follow a 2:1 cycle with FIFO within each type</p></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Position</th><th>Queue number</th><th>Student</th><th>Student ID</th><th>Payment type</th><th>Queue type</th><th>Joined</th></tr></thead><tbody>
@forelse ($waitingEntries as $entry)
<tr><td>{{ $positions[$entry->id] }}</td><td><strong>{{ $entry->queue_number }}</strong></td><td>{{ $entry->student_name }}</td><td>{{ $entry->student_id ?? '—' }}</td><td>{{ $entry->payment_type }}@if ($entry->other_details)<small class="table-subtitle">{{ $entry->other_details }}</small>@endif</td><td><span class="badge badge-priority-{{ strtolower($entry->queue_type) }}">{{ $entry->queue_type }}</span></td><td>{{ $entry->created_at->format('M j, Y g:i A') }}</td></tr>
@empty
<tr><td colspan="7">No students are waiting for payment service.</td></tr>
@endforelse
</tbody></table></div></section>

@if ($recentEntries->isNotEmpty())<section class="panel recent-calls-panel"><div class="panel-heading"><div><h2>Recently completed or skipped</h2><p>Payment line history</p></div></div><div class="recent-call-list">@foreach ($recentEntries as $entry)<div><strong>{{ $entry->queue_number }}</strong><span>{{ $entry->student_name }} · {{ $entry->payment_type }}</span><x-status-badge :status="$entry->status" /><small>{{ $entry->updated_at->format('M j, g:i A') }}</small></div>@endforeach</div></section>@endif
@endsection
