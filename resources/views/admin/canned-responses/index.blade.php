@extends('layouts.app')
@section('title', 'Canned Responses — Problinx')
@section('page-title', 'Canned responses')
@section('content')
@php($responses = require resource_path('data/canned-responses.php'))
<div class="page-heading"><div><span class="eyebrow">HELP YOUR TEAM REPLY QUICKLY</span><h1>Canned responses</h1><p>Reusable reply starters your team can personalize before sending.</p></div><button class="btn btn-primary" data-action="new-response">＋ New response</button></div>
<div class="response-grid">@foreach ($responses as $response)<article class="panel response-card" data-response-card data-search="{{ strtolower($response['title'].' '.$response['body']) }}"><div class="response-card-head"><span class="response-icon">↩</span><button class="icon-button" data-action="edit-response" data-title="{{ $response['title'] }}">···</button></div><h2>{{ $response['title'] }}</h2><p>{{ $response['body'] }}</p><div class="response-footer"><span>Available to all agents</span><button class="text-button" data-action="edit-response" data-title="{{ $response['title'] }}">Edit</button></div></article>@endforeach</div>
@endsection
