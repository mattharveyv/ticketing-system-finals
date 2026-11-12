@props(['name', 'size' => 'normal'])
@php($initials = collect(explode(' ', $name))->map(fn ($part) => str($part)->substr(0, 1))->take(2)->implode(''))
<span {{ $attributes->merge(['class' => 'avatar avatar-'.$size]) }} aria-label="{{ $name }}">{{ $initials }}</span>
