@extends('layouts.app')
@section('title', 'Walk-in Payment Queue — MSEUF Help Desk')
@section('page-title', 'Walk-in payment queue')
@section('content')
<div class="page-heading">
    <div>
        <span class="eyebrow">WALK-IN PAYMENT SERVICES</span>
        <h1>Join the payment line</h1>
        <p>This queue is only for in-person payment assistance. Issues and other concerns should be sent as support tickets.</p>
    </div>
</div>
@if (session('status'))<div class="form-success" role="status">{{ session('status') }}</div>@endif

@php($myCalledEntry = $entries->first(fn ($entry) => in_array($entry->status, ['Called', 'Serving'], true)))
<section class="panel payment-live-call-panel" id="payment-queue-monitor" data-status-url="{{ route('user.payment-queue.status') }}" data-last-call-id="{{ $latestCallEntry?->id ?? '' }}">
    <div class="payment-live-call-main">
        <span class="eyebrow">NOW CALLING</span>
        <strong id="current-queue-number">{{ $currentEntry?->queue_number ?? 'No number is being called' }}</strong>
        <span id="current-queue-detail">{{ $currentEntry ? $currentEntry->payment_type.' · '.$currentEntry->queue_type : 'The number being called will update here automatically.' }}</span>
        <small><span data-waiting-count>{{ $waitingCount }}</span> student{{ $waitingCount === 1 ? '' : 's' }} waiting</small>
    </div>
    <div class="payment-live-call-side">
        <span class="payment-live-indicator"><i></i> Live updates every few seconds</span>
        <button class="btn btn-secondary" type="button" id="enable-queue-alerts" hidden>Enable browser call alerts</button>
    </div>
</section>

<p class="payment-queue-alert" id="payment-queue-alert" role="alert" aria-live="assertive" @if (! $myCalledEntry) hidden @endif>
    @if ($myCalledEntry)
        Your number {{ $myCalledEntry->queue_number }} has been called. Please proceed to the payment counter.
    @endif
</p>

<div class="payment-queue-user-layout">
    <section class="panel payment-join-card">
        <div class="panel-heading"><div><h2>Choose your payment service</h2><p>Join the walk-in line for tuition, balance, or another payment service.</p></div></div>
        <form action="{{ route('user.payment-queue.join') }}" method="POST" class="request-form">
            @csrf
            @if ($errors->any())<div class="form-alert" role="alert">{{ $errors->first() }}</div>@endif
            <div class="field-wrap"><label for="payment-type">Payment type<span class="required-mark">*</span></label><select id="payment-type" name="payment_type" class="field-input" required><option value="">Select payment service</option>@foreach (['Tuition', 'Balance', 'Other'] as $paymentType)<option value="{{ $paymentType }}" @selected(old('payment_type') === $paymentType)>{{ $paymentType }}</option>@endforeach</select></div>
            <div class="field-wrap"><label for="queue-type">Queue type<span class="required-mark">*</span></label><select id="queue-type" name="queue_type" class="field-input" required><option value="Regular" @selected(old('queue_type', 'Regular') === 'Regular')>Regular</option><option value="Priority" @selected(old('queue_type') === 'Priority')>Priority</option></select><small>Staff call two priority numbers for each regular number when both lines are waiting.</small></div>
            <div class="field-wrap" id="other-payment-details" hidden><label for="other-details">Describe the other payment service<span class="required-mark">*</span></label><input class="field-input" id="other-details" name="other_details" value="{{ old('other_details') }}" placeholder="Payment service needed" maxlength="150"></div>
            <button class="btn btn-primary" type="submit">Join payment line <span>→</span></button>
        </form>
    </section>

    <section class="panel payment-entry-panel">
        <div class="panel-heading"><div><h2>My queue numbers</h2><p>Your number and live place in line appear here.</p></div></div>
        <div class="payment-entry-list" id="active-payment-entries">
            @forelse ($entries as $entry)
                @php($position = $positions[$entry->id] ?? null)
                <article class="payment-entry-row {{ in_array($entry->status, ['Called', 'Serving'], true) ? 'is-being-called' : '' }}" data-payment-entry data-entry-id="{{ $entry->id }}" data-entry-status="{{ $entry->status }}">
                    <div><small>YOUR QUEUE NUMBER</small><strong data-entry-number>{{ $entry->queue_number }}</strong></div>
                    <div><small>PAYMENT TYPE</small><strong>{{ $entry->payment_type }}@if ($entry->other_details) · {{ $entry->other_details }}@endif</strong></div>
                    <div class="payment-entry-position" data-entry-position>{{ $entry->status === 'Waiting' && $position ? 'Position #'.$position.' in line' : ($entry->status === 'Waiting' ? 'Waiting for position' : 'Your number is at the counter') }}</div>
                    <span class="badge badge-priority-{{ strtolower($entry->queue_type) }}">{{ $entry->queue_type }}</span>
                    <span class="badge badge-status-{{ str($entry->status)->lower()->replace(' ', '-')->value() }}" data-entry-status-badge>{{ $entry->status }}</span>
                    <small class="payment-entry-called" data-entry-called-at @if (! $entry->called_at) hidden @endif>@if ($entry->called_at)Called {{ $entry->called_at->format('g:i A') }}@endif</small>
                </article>
            @empty
                <div class="empty-state" id="active-entries-empty"><h2>No active queue numbers</h2><p>Choose a payment service above to get your queue number.</p></div>
            @endforelse
        </div>
        <div class="payment-entry-list payment-entry-history" id="recent-payment-entries">
            @foreach ($recentEntries as $entry)
                <article class="payment-entry-row" data-payment-entry data-entry-id="{{ $entry->id }}" data-entry-status="{{ $entry->status }}">
                    <div><small>QUEUE NUMBER</small><strong data-entry-number>{{ $entry->queue_number }}</strong></div>
                    <div><small>PAYMENT TYPE</small><strong>{{ $entry->payment_type }}@if ($entry->other_details) · {{ $entry->other_details }}@endif</strong></div>
                    <div class="payment-entry-position" data-entry-position>{{ $entry->status }}</div>
                    <span class="badge badge-priority-{{ strtolower($entry->queue_type) }}">{{ $entry->queue_type }}</span>
                    <span class="badge badge-status-{{ str($entry->status)->lower()->replace(' ', '-')->value() }}" data-entry-status-badge>{{ $entry->status }}</span>
                    <small class="payment-entry-called" data-entry-called-at @if (! $entry->called_at) hidden @endif>@if ($entry->called_at)Called {{ $entry->called_at->format('g:i A') }}@endif</small>
                </article>
            @endforeach
        </div>
    </section>
</div>
@endsection
