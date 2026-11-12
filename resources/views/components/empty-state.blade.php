@props(['title' => 'Nothing here yet', 'description' => 'When something is available, it will appear here.'])
<div class="empty-state"><span aria-hidden="true">◇</span><h3>{{ $title }}</h3><p>{{ $description }}</p>{{ $slot }}</div>
