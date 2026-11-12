@props(['ticket', 'admin' => false])
<article class="ticket-card" data-ticket-card data-id="{{ $ticket['id'] }}" data-status="{{ $ticket['status'] }}" data-priority="{{ $ticket['priority'] }}" data-category="{{ $ticket['category'] }}">
    <div class="ticket-card-top"><a class="ticket-id" href="{{ ($admin ? '/admin/tickets/' : '/user/tickets/').rawurlencode($ticket['id']) }}">{{ $ticket['id'] }}</a><x-status-badge :status="$ticket['status']" /></div>
    <a class="ticket-card-title" href="{{ ($admin ? '/admin/tickets/' : '/user/tickets/').rawurlencode($ticket['id']) }}">{{ $ticket['subject'] }}</a>
    <div class="ticket-card-meta"><span>{{ $ticket['category'] }}</span><x-priority-badge :priority="$ticket['priority']" /></div>
    <div class="ticket-card-footer"><span>{{ $admin ? $ticket['email'] : 'Assigned: '.$ticket['agent'] }}</span><span>{{ $ticket['updated'] }}</span></div>
</article>
