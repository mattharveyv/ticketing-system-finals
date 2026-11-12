@extends('layouts.guest')

@section('content')
    <main class="auth-page">
        <a class="brand brand-light" href="{{ route('home') }}"><span class="brand-symbol">E</span><span><strong>MSEUF Help Desk</strong><small>MANUEL S. ENVERGA UNIVERSITY FOUNDATION</small></span></a>
        <section class="auth-card">
            @yield('auth-content')
        </section>
        <p class="auth-foot">Student support for the MSEUF community. <a href="{{ route('home') }}">Home</a></p>
    </main>
@endsection
