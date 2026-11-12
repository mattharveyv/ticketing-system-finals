@props(['admin' => false, 'unreadNotificationCount' => 0])
@php
    $groups = $admin ? [
        ['MSEUF SUPPORT', [['/admin/dashboard', 'Overview', 'grid'], ['/admin/tickets', 'Support tickets', 'ticket'], ['/admin/payment-queue', 'Payment queue', 'payment'], ['/admin/support-types', 'Support organizations', 'team'], ['/admin/notifications', 'Notifications', 'bell']]],
    ] : [
        ['STUDENT HELP DESK', [['/user/dashboard', 'Dashboard', 'grid'], ['/user/tickets', 'My support tickets', 'ticket'], ['/user/tickets/create', 'Submit a request', 'plus'], ['/user/payment-queue', 'Payment queue', 'payment'], ['/user/notifications', 'Notifications', 'bell']]],
    ];
@endphp
<aside class="sidebar" id="sidebar">
    <a class="brand" href="{{ $admin ? route('admin.dashboard') : route('user.dashboard') }}"><span class="brand-symbol">E</span><span class="brand-name"><strong>MSEUF Help Desk</strong><small>{{ $admin ? 'STAFF CONSOLE' : 'STUDENT SERVICE HUB' }}</small></span><button class="sidebar-close" data-action="close-drawer" aria-label="Close menu">×</button></a>
    <div class="workspace-chip"><span class="workspace-mark">M</span><span><strong>Manuel S. Enverga University</strong><small>Foundation</small></span><span aria-hidden="true">⌄</span></div>
    <nav class="side-nav" aria-label="{{ $admin ? 'Admin' : 'User' }} navigation">
        @foreach ($groups as [$group, $items])
            <div class="nav-group"><div class="nav-label">{{ $group }}</div>
                @foreach ($items as [$url, $label, $icon])
                    <a class="nav-link {{ request()->is(ltrim($url, '/')) ? 'active' : '' }}" href="{{ $url }}"><span class="nav-icon" aria-hidden="true">{{ ['grid' => '▦', 'ticket' => '▤', 'plus' => '＋', 'team' => '♧', 'payment' => '$', 'bell' => '◉'][$icon] }}</span>{{ $label }}@if ($icon === 'bell' && $unreadNotificationCount > 0)<span class="nav-count">{{ $unreadNotificationCount }}</span>@endif</a>
                @endforeach
            </div>
        @endforeach
        <div class="nav-group"><div class="nav-label">ACCOUNT</div><form action="{{ route('logout') }}" method="POST">@csrf<button class="nav-link logout-link" type="submit"><span class="nav-icon">↗</span>Sign out</button></form></div>
    </nav>
    <div class="sidebar-footer"><div class="sidebar-help"><span class="help-mark">?</span><span><strong>Need assistance?</strong><small>Submit a support ticket</small></span></div><div class="sidebar-user"><x-avatar :name="auth()->user()->name" /><span><strong>{{ auth()->user()->name }}</strong><small>{{ $admin ? 'MSEUF Support Staff' : 'MSEUF Student' }}</small></span></div></div>
</aside>
