@extends('layouts.app')
@section('title', 'Agents — Problinx')
@section('page-title', 'Agents')
@section('content')
@php($agents = require resource_path('data/agents.php'))
<div class="page-heading"><div><span class="eyebrow">SUPPORT CAPACITY</span><h1>Agent management</h1><p>Review team availability and current ticket workload.</p></div><button class="btn btn-primary" data-action="add-agent">＋ Add agent</button></div>
<div class="agent-card-grid">@foreach ($agents as $agent)<a class="panel agent-management-card" href="{{ url('/admin/agents/'.rawurlencode($agent['email'])) }}"><div class="agent-profile"><x-avatar :name="$agent['name']"/><span><strong>{{ $agent['name'] }}</strong><small>{{ $agent['team'] }}</small></span><x-badge :tone="'presence-'.strtolower($agent['status'])">{{ $agent['status'] }}</x-badge></div><div class="agent-metrics"><span>Open<strong>{{ $agent['open'] }}</strong></span><span>Resolved<strong>{{ $agent['resolved'] }}</strong></span><span>Workload<strong>{{ $agent['workload'] }}</strong></span></div><div class="workload-track"><i style="--load:{{ min($agent['open'] * 5, 100) }}%"></i></div></a>@endforeach</div>
@endsection
