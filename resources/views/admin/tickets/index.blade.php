@extends('layouts.app')
@section('title', 'Support Tickets — MSEUF Help Desk')
@section('page-title', 'Support tickets')
@section('content')
<div class="page-heading"><div><span class="eyebrow">MSEUF STUDENT SUPPORT</span><h1>Support tickets</h1><p>Every student concern is sent to its selected university organization. Review and update tickets here.</p></div><a class="btn btn-secondary" href="{{ route('admin.kanban') }}">Kanban board →</a></div>
<section class="panel queue-table-panel"><div class="panel-heading"><div><h2>All submitted tickets</h2><p>{{ $tickets->total() }} total support requests</p></div><a class="subtle-link" href="{{ route('admin.support-types') }}">Manage support organizations →</a></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Ticket</th><th>Student</th><th>Concern</th><th>Support organization</th><th>Issue type</th><th>Status</th><th>Submitted</th><th></th></tr></thead><tbody>
@forelse ($tickets as $ticket)
<tr><td><strong>{{ $ticket->ticket_number }}</strong></td><td>{{ $ticket->student?->name ?? $ticket->customer_name }}<small class="table-subtitle">{{ $ticket->student?->student_id ?? $ticket->customer_email }}</small></td><td>{{ $ticket->subject }}</td><td>{{ $ticket->supportType?->name ?? $ticket->department }}</td><td>{{ $ticket->category }}</td><td><x-status-badge :status="$ticket->status" /></td><td>{{ $ticket->created_at->format('M j, Y g:i A') }}</td><td><a class="btn btn-secondary btn-small" href="{{ route('admin.tickets.show', $ticket->ticket_number) }}">Open ticket</a></td></tr>
@empty
<tr><td colspan="8">No student support tickets have been submitted.</td></tr>
@endforelse
</tbody></table></div><div class="table-footer">{{ $tickets->links() }}</div></section>
@endsection
