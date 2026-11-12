@extends('layouts.app')
@section('title', 'Customer Details — Problinx')
@section('page-title', 'Customer details')
@section('content')
@php($users = require resource_path('data/users.php'))
@php($customer = collect($users)->firstWhere('email', $customerId) ?? $users[0])
@php($tickets = array_values(array_filter(require resource_path('data/tickets.php'), fn ($ticket) => $ticket['email'] === $customer['email'])))
<div class="page-heading"><div><a class="back-link" href="{{ route('admin.customers') }}">← Customers</a><h1>{{ $customer['name'] }}</h1><p>{{ $customer['email'] }} · {{ $customer['department'] }}</p></div><x-button variant="secondary" data-action="edit-customer">Edit customer</x-button></div>
<section class="stats-grid"><x-stat-card label="Open tickets" :value="count(array_filter($tickets, fn ($ticket) => in_array($ticket['status'], ['New','Open','In Progress','Waiting','Escalated'], true)))" note="Currently active" icon="▤"/><x-stat-card label="Total tickets" :value="count($tickets)" note="All requests" icon="◷" tone="blue"/><x-stat-card label="Last activity" :value="$customer['last_activity']" note="Customer update" icon="↩" tone="green"/></section><section class="panel"><div class="panel-heading"><div><h2>Ticket history</h2><p>Requests created by {{ $customer['name'] }}</p></div></div><div class="ticket-card-list">@forelse ($tickets as $ticket)<x-ticket-card :ticket="$ticket" :admin="true"/>@empty<x-empty-state title="No ticket history"/></x-forelse></div></section>
@endsection
