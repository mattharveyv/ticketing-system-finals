@extends('layouts.app')
@section('title', $ticket->ticket_number.' — MSEUF Support Ticket')
@section('page-title', 'Request details')
@section('content')
@php($isCompleted = in_array($ticket->status, ['Resolved', 'Completed', 'Closed'], true))
<div class="page-heading ticket-detail-heading">
    <div>
        <a class="back-link" href="{{ route('admin.tickets') }}">← All support tickets</a>
        <h1>{{ $ticket->subject }}</h1>
        <p class="ticket-subtitle">{{ $ticket->ticket_number }}</p>
    </div>
    <x-status-badge :status="$ticket->status" />
</div>

@if (session('status'))<div class="form-success" role="status">{{ session('status') }}</div>@endif
@if ($errors->any())<div class="form-alert" role="alert">{{ $errors->first() }}</div>@endif

<section class="ticket-resolution-card panel {{ $isCompleted ? 'is-complete' : '' }}">
    <span class="ticket-resolution-icon" aria-hidden="true">{{ $isCompleted ? '✓' : '!' }}</span>
    <div class="ticket-resolution-copy">
        <strong>{{ $isCompleted ? 'This request is completed' : 'Finish this support request' }}</strong>
        <p>{{ $isCompleted ? 'This ticket is included in the resolved / completed total on the staff dashboard.' : 'When the issue is fixed, mark it resolved to update the dashboard total.' }}</p>
    </div>
    @if (! $isCompleted)
        <form action="{{ route('admin.tickets.update', $ticket->ticket_number) }}" method="POST">
            @csrf
            @method('PATCH')
            <input type="hidden" name="status" value="Resolved">
            <button class="btn btn-primary" type="submit">Mark as resolved <span>✓</span></button>
        </form>
    @endif
</section>

<div class="ticket-detail-layout admin-resolution-layout">
    <div class="detail-main">
        <section class="panel request-description-panel">
            <div class="panel-heading">
                <div>
                    <h2>Student request</h2>
                    <p>{{ $ticket->student?->name ?? $ticket->customer_name }} · {{ $ticket->student?->student_id ?? $ticket->customer_email }}</p>
                </div>
            </div>
            <div class="request-description">{{ $ticket->description }}</div>
            @if ($ticket->location)
                <p class="request-location"><strong>Campus location</strong>{{ $ticket->location }}</p>
            @endif
            <div class="request-labels">
                <span><small>Support organization</small><strong>{{ $ticket->supportType?->name ?? $ticket->department }}</strong></span>
                <span><small>Issue type</small><strong>{{ $ticket->category }}</strong></span>
                <span><small>Submitted</small><strong>{{ $ticket->created_at->format('M j, Y') }}</strong></span>
            </div>
        </section>

        <section class="panel support-routing-panel">
            <div class="panel-heading">
                <div><h2>Support handling</h2><p>Issue tickets are routed directly to the selected organization.</p></div>
            </div>
            <p>This support ticket is separate from the walk-in payment line.</p>
        </section>
        <x-ticket-updates :ticket="$ticket" admin />
    </div>

    <aside class="detail-aside">
        <section class="panel update-request-panel">
            <div class="panel-heading"><div><h2>Update ticket</h2><p>Change the support status.</p></div></div>
            <form action="{{ route('admin.tickets.update', $ticket->ticket_number) }}" method="POST" class="request-form">
                @csrf
                @method('PATCH')
                <div class="field-wrap">
                    <label for="status">Status</label>
                    <select class="field-input" id="status" name="status">
                        @foreach ($statuses as $status)
                            <option value="{{ $status }}" @selected(old('status', $ticket->status) === $status)>{{ $status }}</option>
                        @endforeach
                    </select>
                </div>
                <button class="btn btn-secondary" type="submit">Save changes</button>
            </form>
        </section>

        <section class="panel request-information-panel">
            <div class="panel-heading"><h2>Request information</h2></div>
            <dl class="detail-list">
                <div><dt>Submitted</dt><dd>{{ $ticket->created_at->format('M j, Y g:i A') }}</dd></div>
                <div><dt>Student email</dt><dd>{{ $ticket->student?->email ?? $ticket->customer_email }}</dd></div>
            </dl>
        </section>
    </aside>
</div>
@endsection
