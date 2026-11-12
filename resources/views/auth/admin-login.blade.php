@extends('layouts.auth')

@section('title', 'Staff Sign In — MSEUF Help Desk')

@section('auth-content')
<div class="auth-heading"><span class="auth-kicker">MSEUF INFORMATION & SUPPORT SERVICES</span><h1>Staff sign in</h1><p>Open the staff dashboard and manage student support requests.</p></div>
<form action="{{ route('admin.login.store') }}" method="POST" class="auth-form">
    @csrf
    @if ($errors->any())<div class="form-alert" role="alert">{{ $errors->first() }}</div>@endif
    <x-input label="Staff email" name="email" type="email" placeholder="staff@example.edu" required autocomplete="email" />
    <div class="field-wrap"><label for="admin-password">Password<span class="required-mark">*</span></label><div class="password-wrap"><input class="field-input" type="password" id="admin-password" name="password" placeholder="Enter staff password" required autocomplete="current-password"><button class="password-toggle" type="button" data-toggle-password="admin-password">Show</button></div></div>
    <button class="btn btn-primary btn-wide" type="submit">Open staff dashboard <span>→</span></button>
</form>
<p class="auth-switch"><a href="{{ route('login') }}">← Back to student sign in</a></p>
@endsection
