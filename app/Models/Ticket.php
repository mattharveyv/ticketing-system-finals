<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $fillable = [
        'ticket_number',
        'user_id',
        'support_type_id',
        'customer_name',
        'customer_email',
        'subject',
        'category',
        'priority',
        'status',
        'agent',
        'team',
        'department',
        'device',
        'location',
        'description',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function supportType(): BelongsTo
    {
        return $this->belongsTo(SupportType::class);
    }

    public function updates(): HasMany
    {
        return $this->hasMany(TicketUpdate::class)->orderBy('created_at')->orderBy('id');
    }
}
