@props(['label', 'value', 'note' => '', 'icon' => '▤', 'tone' => 'teal'])
<article class="stat-card"><div class="stat-heading"><span>{{ $label }}</span><span class="stat-icon stat-icon-{{ $tone }}" aria-hidden="true">{{ $icon }}</span></div><strong class="stat-value" data-stat="{{ str($label)->slug() }}">{{ $value }}</strong><small>{{ $note }}</small></article>
