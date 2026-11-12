<!doctype html>
<html lang="en" data-theme="light">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f4f7f6">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'MSEUF Help Desk')</title>
    <meta name="description" content="Student help and support ticketing for Manuel S. Enverga University Foundation.">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    @yield('body')
    <div id="modal-root"></div>
    <x-toast />
</body>
</html>
