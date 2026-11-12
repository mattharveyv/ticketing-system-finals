@extends('layouts.app')
@section('title', 'Notifications — MSEUF Help Desk')
@section('page-title', 'Notifications')
@section('content')
<div class="page-heading">
    <div>
        <span class="eyebrow">YOUR UPDATES</span>
        <h1>Notifications</h1>
        <p>Ticket replies, status changes, and payment queue calls appear here.</p>
    </div>
    @if ($unreadCount > 0)
        <form action="{{ $isAdmin ? route('admin.notifications.read-all') : route('user.notifications.read-all') }}" method="POST">
            @csrf
            @method('PATCH')
            <button class="btn btn-secondary" type="submit">Mark all as read</button>
        </form>
    @endif
</div>

@if (session('status'))<div class="form-success" role="status">{{ session('status') }}</div>@endif

<section class="panel">
    <div class="panel-heading notification-toolbar">
        <div><h2>Recent updates</h2><p>{{ $unreadCount }} unread notification{{ $unreadCount === 1 ? '' : 's' }}</p></div>
    </div>
    <div class="notification-list">
        @forelse ($notifications as $notification)
            @php($data = $notification->data)
            <article class="notification-item {{ $notification->read_at ? '' : 'unread' }}">
                <span class="notification-icon" aria-hidden="true">{{ str_contains(strtolower($data['category'] ?? ''), 'payment') ? '$' : (str_contains(strtolower($data['category'] ?? ''), 'reply') ? '↩' : '◈') }}</span>
                <a class="notification-message" href="{{ $data['url'] ?? '#' }}">
                    <strong>{{ $data['title'] ?? 'MSEUF Help Desk update' }}</strong>
                    <small>{{ $data['message'] ?? '' }} · {{ $notification->created_at->diffForHumans() }}</small>
                </a>
                @if (! $notification->read_at)
                    <form action="{{ $isAdmin ? route('admin.notifications.read', $notification->id) : route('user.notifications.read', $notification->id) }}" method="POST">
                        @csrf
                        @method('PATCH')
                        <button class="icon-button notification-mark-read" type="submit" aria-label="Mark notification as read">✓</button>
                    </form>
                @endif
            </article>
        @empty
            <div class="empty-state"><h2>You’re all caught up</h2><p>New ticket updates and payment queue calls will appear here.</p></div>
        @endforelse
    </div>
    @if ($notifications->hasPages())<div class="table-footer">{{ $notifications->links() }}</div>@endif
</section>
@endsection
