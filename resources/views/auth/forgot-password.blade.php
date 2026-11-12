@extends('layouts.auth')

@section('title', 'Forgot Password — Problinx')

@section('auth-content')
<div class="auth-heading"><span class="auth-kicker">ACCOUNT ACCESS</span><h1>Forgot your password?</h1><p>Enter your email to run a local password reset simulation.</p></div>
<form id="forgot-form" class="auth-form"><div class="field-wrap"><label for="reset-email">Email address</label><input class="field-input" type="email" id="reset-email" name="email" placeholder="you@company.com" required></div><button class="btn btn-primary btn-wide" type="submit">Reset password <span>→</span></button></form>
<div id="reset-result" class="form-success" hidden>Password reset simulation complete.</div><p class="auth-switch"><a href="{{ route('login') }}">← Back to Login</a></p>
@endsection
