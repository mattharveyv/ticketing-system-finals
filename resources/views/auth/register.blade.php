@extends('layouts.auth')

@section('title', 'Student Account — MSEUF Help Desk')

@section('auth-content')
<div class="auth-heading"><span class="auth-kicker">MSEUF STUDENT SUPPORT</span><h1>Create a student account</h1><p>Use your school details to submit and track campus support requests.</p></div>
<form action="{{ route('register.store') }}" method="POST" class="auth-form">
    @csrf
    @if ($errors->any())<div class="form-alert" role="alert">{{ $errors->first() }}</div>@endif
    <x-input label="Full name" name="name" placeholder="Your name" required autocomplete="name" />
    <x-input label="School email" name="email" type="email" placeholder="you@example.com" required autocomplete="email" />
    <x-input label="Student ID" name="student_id" placeholder="Your student number" required />
    <x-input label="College" name="college" placeholder="College or school" required />
    <div class="form-two"><x-input label="Program / course" name="program" placeholder="e.g. BS Information Technology" /><div class="field-wrap"><label for="year-level">Year level</label><select id="year-level" class="field-input" name="year_level"><option value="">Choose year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year</option><option>Graduate</option></select></div></div>
    <x-input label="Password" name="password" type="password" placeholder="At least 8 characters" required autocomplete="new-password" />
    <x-input label="Confirm password" name="password_confirmation" type="password" placeholder="Enter your password again" required autocomplete="new-password" />
    <button class="btn btn-primary btn-wide" type="submit">Create account <span>→</span></button>
</form>
<p class="auth-switch">Already registered? <a href="{{ route('login') }}">Student sign in</a></p>
@endsection
