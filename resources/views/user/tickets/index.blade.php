@extends('layouts.app')
@section('title', 'My Requests — MSEUF Help Desk')
@section('page-title', 'My support requests')
@section('content')
<div class="page-heading"><div><span class="eyebrow">MSEUF STUDENT SUPPORT</span><h1>My support requests</h1><p>Review ticket status and staff updates.</p></div><x-button href="{{ route('user.tickets.create') }}" variant="primary">＋ New request</x-button></div>
<section class="panel"><div class="table-scroll"><table class="data-table"><thead><tr><th>Ticket</th><th>Concern</th><th>Support organization</th><th>Issue type</th><th>Status</th><th>Submitted</th></tr></thead><tbody>
@forelse ($tickets as $ticket)
<tr><td><a href="{{ route('user.tickets.show', $ticket->ticket_number) }}">{{ $ticket->ticket_number }}</a></td><td><a href="{{ route('user.tickets.show', $ticket->ticket_number) }}">{{ $ticket->subject }}</a></td><td>{{ $ticket->supportType?->name ?? $ticket->department }}</td><td>{{ $ticket->category }}</td><td><x-status-badge :status="$ticket->status" /></td><td>{{ $ticket->created_at->format('M j, Y') }}</td></tr>
@empty
<tr><td colspan="6">You have not submitted a support request yet. <a href="{{ route('user.tickets.create') }}">Create your first request</a>.</td></tr>
@endforelse
</tbody></table></div><div class="table-footer">{{ $tickets->links() }}</div></section>
@endsection
