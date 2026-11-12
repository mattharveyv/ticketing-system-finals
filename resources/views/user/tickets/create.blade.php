@extends('layouts.app')
@section('title', 'New Support Request — MSEUF Help Desk')
@section('page-title', 'Submit a request')
@section('content')
<div class="page-heading"><div><span class="eyebrow">MSEUF STUDENT SUPPORT</span><h1>What can we help with?</h1><p>Choose a university office and send your concern directly to that support organization.</p></div><a class="subtle-link" href="{{ route('user.tickets') }}">← My support tickets</a></div>
<section class="panel request-form-panel">
    <form action="{{ route('user.tickets.store') }}" method="POST" class="request-form">
        @csrf
        @if ($errors->any())<div class="form-alert" role="alert">{{ $errors->first() }}</div>@endif
        <div class="form-two">
            <div class="field-wrap"><label for="support-type">University office / support organization<span class="required-mark">*</span></label><select class="field-input" id="support-type" name="support_type_id" required><option value="">Select an office</option>@foreach ($supportTypes as $supportType)<option value="{{ $supportType->id }}" @selected((string) old('support_type_id') === (string) $supportType->id)>{{ $supportType->name }}</option>@endforeach</select>@if ($supportTypes->isEmpty())<small>No support organizations are available. Please contact the help desk.</small>@endif</div>
            <div class="field-wrap"><label for="issue-category">Type of issue<span class="required-mark">*</span></label><select class="field-input" id="issue-category" name="category" required><option value="">Select an issue type</option>@foreach ($categories as $category)<option value="{{ $category }}" @selected(old('category') === $category)>{{ $category }}</option>@endforeach</select></div>
        </div>
        <x-input label="Request title" name="subject" placeholder="Briefly describe the issue" required maxlength="255" />
        <x-input label="Campus location (optional)" name="location" placeholder="Building, room, or campus" maxlength="255" />
        <div class="field-wrap"><label for="ticket-description">How can we help?<span class="required-mark">*</span></label><textarea class="field-input textarea" id="ticket-description" name="description" rows="6" placeholder="Include the details that will help the selected office respond." maxlength="10000" required>{{ old('description') }}</textarea></div>
        <div class="request-form-footer"><p>After you submit, the selected office will be able to review your ticket.</p><button class="btn btn-primary" type="submit" @disabled($supportTypes->isEmpty())>Submit support ticket <span>→</span></button></div>
    </form>
</section>
@endsection
