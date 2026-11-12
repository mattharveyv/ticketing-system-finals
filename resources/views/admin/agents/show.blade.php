@extends('layouts.app')
@section('title', 'Agent Profile — Problinx')
@section('page-title', 'Agent profile')
@section('content')
@php($agents = require resource_path('data/agents.php'))
@php($agent = collect($agents)->firstWhere('email', $agentId) ?? $agents[0])
@php($tickets = array_values(array_filter(require resource_path('data/tickets.php'), fn ($ticket) => $ticket['agent'] === $agent['name'])))
<div class="page-heading"><div><a class="back-link" href="{{ route('admin.agents') }}">← Agents</a><h1>{{ $agent['name'] }}</h1><p>{{ $agent['email'] }} · {{ $agent['team'] }}</p></div><x-badge :tone="'presence-'.strtolower($agent['status'])">{{ $agent['status'] }}</x-badge></div><section class="stats-grid"><x-stat-card label="Open tickets" :value="$agent['open']" note="Current workload" icon="▤"/><x-stat-card label="Resolved tickets" :value="$agent['resolved']" note="This month" icon="✓" tone="green"/><x-stat-card label="Workload" :value="$agent['workload']" note="Assignment balance" icon="◷" tone="blue"/></section><section class="panel"><div class="panel-heading"><h2>Assigned tickets</h2></div><div class="ticket-card-list">@foreach ($tickets as $ticket)<x-ticket-card :ticket="$ticket" :admin="true"/>@endforeach</div></section>
@endsection
