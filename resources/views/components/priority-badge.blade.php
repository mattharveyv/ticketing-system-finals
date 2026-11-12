@props(['priority'])
@php($tone = str($priority)->lower()->value())
<x-badge :tone="'priority-'.$tone">{{ $priority }}</x-badge>
