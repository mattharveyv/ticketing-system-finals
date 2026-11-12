@extends('layouts.app')
@section('title', 'Teams — Problinx')
@section('page-title', 'Teams')
@section('content')
@php($teams = require resource_path('data/teams.php'))
@php($agents = require resource_path('data/agents.php'))
<div class="page-heading"><div><span class="eyebrow">SUPPORT ORGANIZATION</span><h1>Teams</h1><p>See who is handling each support area.</p></div><button class="btn btn-primary" data-action="add-team">＋ Create team</button></div>
<div class="team-grid">@foreach ($teams as $team)<section class="panel team-card"><div class="team-heading"><span class="team-icon team-{{ $team['color'] }}">♧</span><span><h2>{{ $team['name'] }}</h2><small>Team lead · {{ $team['lead'] }}</small></span><button class="icon-button" data-action="edit-team" data-team="{{ $team['name'] }}">···</button></div><div class="team-stat-row"><span>Members<strong>{{ $team['members'] }}</strong></span><span>Open tickets<strong>{{ $team['open'] }}</strong></span></div><div class="team-members">@foreach (array_slice(array_values(array_filter($agents, fn ($agent) => $agent['team'] === $team['name'])), 0, 5) as $agent)<x-avatar :name="$agent['name']" size="tiny"/>@endforeach<span>{{ $team['members'] }} members</span></div></section>@endforeach</div>
@endsection
