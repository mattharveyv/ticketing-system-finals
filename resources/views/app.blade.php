<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f4f6f7">
    <title>Northstar Support | Helpdesk</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <div class="app-shell">
        <aside class="sidebar" id="sidebar" aria-label="Main navigation">
            <a class="brand" href="#dashboard"><span class="brand-mark">N</span><span class="brand-copy"><strong>northstar</strong><small>SUPPORT DESK</small></span><button class="icon-btn close-menu" data-action="close-menu" aria-label="Close navigation">×</button></a>
            <div class="workspace"><span class="workspace-icon">N</span><span><strong>Northstar Labs</strong><small>Enterprise workspace</small></span><b>⌄</b></div>
            <nav id="navigation"></nav>
            <div class="sidebar-bottom"><div class="help-card"><b>?</b><span><strong>Need a hand?</strong><small>Our team is here for you.</small></span><button data-page="knowledge">Visit help center →</button></div><button class="sidebar-user" data-page="profile"><span class="avatar">AM</span><span><strong>Alex Morgan</strong><small>Customer · Product</small></span><b>···</b></button></div>
        </aside>
        <div class="scrim" data-action="close-menu"></div>
        <section class="main-shell">
            <header class="topbar"><div class="crumb"><button class="icon-btn menu-btn" data-action="open-menu" aria-label="Open navigation">☰</button><span id="crumb"></span></div><div class="top-actions"><label class="global-search"><span>⌕</span><input id="global-search" type="search" placeholder="Search tickets, articles…" aria-label="Search tickets and articles"><kbd>⌘ K</kbd></label><button class="icon-btn" data-action="theme" title="Toggle dark mode" aria-label="Toggle dark mode">◐</button><button class="icon-btn notification-btn" data-page="notifications" aria-label="Notifications">♧<i id="unread-dot"></i></button><button class="top-avatar" data-page="profile">AM</button></div></header>
            <main class="content" id="screen" aria-live="polite"></main>
        </section>
    </div>
    <div id="modal"></div><div id="toasts" aria-live="polite"></div>
</body>
</html>