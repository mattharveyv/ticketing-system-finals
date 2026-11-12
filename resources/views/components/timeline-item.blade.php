@props(['title', 'time', 'icon' => '✓', 'description' => ''])
<div class="timeline-item"><span class="timeline-mark" aria-hidden="true">{{ $icon }}</span><div><strong>{{ $title }}</strong>@if ($description)<p>{{ $description }}</p>@endif<small>{{ $time }}</small></div></div>
