@props(['label', 'name', 'type' => 'text', 'required' => false, 'placeholder' => '', 'value' => null])

<div class="field-wrap">
    <label for="{{ $name }}">{{ $label }}@if ($required)<span class="required-mark">*</span>@endif</label>
    <input id="{{ $name }}" name="{{ $name }}" type="{{ $type }}" value="{{ old($name, $value) }}" placeholder="{{ $placeholder }}" @required($required) {{ $attributes->merge(['class' => 'field-input']) }}>
</div>
