@props(['status'])
@php($tone = str($status)->lower()->replace(' ', '-')->value())
<x-badge :tone="'status-'.$tone">{{ $status }}</x-badge>
