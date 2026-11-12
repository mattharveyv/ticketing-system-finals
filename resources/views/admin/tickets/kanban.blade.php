@extends('layouts.app')
@section('title', 'Queue Status Board — MSEUF Help Desk')
@section('page-title', 'Kanban board')
@section('content')
<div class="page-heading"><div><span class="eyebrow">MSEUF SUPPORT OPERATIONS</span><h1>Queue status board</h1><p>Review requests by their current status. Open a request to change its status.</p></div><a class="btn btn-secondary" href="{{ route('admin.tickets') }}">← Student queue</a></div>
<div class="kanban-board" id="kanban-board">
	@foreach ($lanes as $status => $laneTickets)
		<section class="kanban-column" data-kanban-column="{{ $status }}">
			<div class="kanban-column-head"><strong>{{ strtoupper($status) }}</strong><span>{{ count($laneTickets) }}</span></div>
			<div class="kanban-dropzone" data-drop-status="{{ $status }}">
				@foreach ($laneTickets as $ticket)
					<article class="kanban-card">
						<a href="{{ route('admin.tickets.show', $ticket['id']) }}">{{ $ticket['id'] }}</a>
						<h3>{{ $ticket['subject'] }}</h3>
						<div><x-priority-badge :priority="$ticket['priority']"/><small>{{ $ticket['team'] }}</small></div>
						<footer><x-avatar :name="$ticket['agent'] === 'Unassigned' ? 'Problinx' : $ticket['agent']" size="tiny"/><small>{{ $ticket['agent'] }}</small></footer>
					</article>
				@endforeach
			</div>
		</section>
	@endforeach
</div>
@endsection
