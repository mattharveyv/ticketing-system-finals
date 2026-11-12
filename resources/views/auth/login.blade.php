@extends('layouts.auth')

@section('title', 'Student Sign In — MSEUF Help Desk')

@section('auth-content')
<div class="auth-heading"><span class="auth-kicker">MANUEL S. ENVERGA UNIVERSITY FOUNDATION</span><h1>Student sign in</h1><p>Sign in to submit a request and follow your place in the support queue.</p></div>
<form action="{{ route('login.store') }}" method="POST" class="auth-form">
    @csrf
    @if ($errors->any())<div class="form-alert" role="alert">{{ $errors->first() }}</div>@endif
    <x-input label="School email" name="email" type="email" placeholder="you@example.com" required autocomplete="email" />
    <div class="field-wrap"><div class="field-label-row"><label for="login-password">Password<span class="required-mark">*</span></label></div><div class="password-wrap"><input class="field-input" type="password" id="login-password" name="password" placeholder="Enter your password" required autocomplete="current-password"><button class="password-toggle" type="button" data-toggle-password="login-password">Show</button></div></div>
    <label class="checkbox-row"><input type="checkbox" name="remember"><span>Remember me</span></label>
    <button class="btn btn-primary btn-wide" type="submit">Sign in <span>→</span></button>
</form>
<p class="auth-switch">Need a student account? <a href="{{ route('register') }}">Create account</a></p>
<p class="auth-switch"><a href="{{ route('admin.login') }}">Staff sign in</a></p>
@endsection
