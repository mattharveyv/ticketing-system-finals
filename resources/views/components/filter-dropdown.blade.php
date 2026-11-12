@props(['id', 'label', 'options' => []])
<select id="{{ $id }}" class="filter-select" aria-label="{{ $label }}"><option value="">{{ $label }}</option>@foreach ($options as $option)<option value="{{ $option }}">{{ $option }}</option>@endforeach</select>
