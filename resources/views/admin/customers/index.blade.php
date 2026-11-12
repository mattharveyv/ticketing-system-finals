@extends('layouts.app')
@section('title', 'Customers — Problinx')
@section('page-title', 'Customers')
@section('content')
@php($users = require resource_path('data/users.php'))
<div class="page-heading"><div><span class="eyebrow">CUSTOMER DIRECTORY</span><h1>Customers</h1><p>Review customer accounts and their support history.</p></div><span class="record-count">{{ count($users) }} customer records</span></div>
<div class="panel"><div class="ticket-filter-row"><x-search-bar id="customer-search" placeholder="Search name or email"/><x-filter-dropdown id="customer-department" label="All departments" :options="['Product','Design','Finance','Operations','Marketing','Human Resources']"/></div><div class="table-scroll"><table class="data-table" id="customer-table"><thead><tr><th>Customer</th><th>Email</th><th>Department</th><th>Open tickets</th><th>Total tickets</th><th>Last activity</th><th></th></tr></thead><tbody>@foreach ($users as $user)@if ($user['role'] === 'Customer')<tr data-customer-row data-search="{{ strtolower($user['name'].' '.$user['email']) }}" data-department="{{ $user['department'] }}"><td><span class="table-person"><x-avatar :name="$user['name']" size="tiny"/><strong>{{ $user['name'] }}</strong></span></td><td>{{ $user['email'] }}</td><td>{{ $user['department'] }}</td><td>{{ min($user['tickets'], 2) }}</td><td>{{ $user['tickets'] }}</td><td>{{ $user['last_activity'] }}</td><td><a class="icon-link" href="{{ url('/admin/customers/'.rawurlencode($user['email'])) }}">↗</a></td></tr>@endif @endforeach</tbody></table></div></div>
@endsection
