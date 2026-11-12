<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentQueueEntry extends Model
{
    protected $fillable = [
        'queue_number',
        'user_id',
        'student_name',
        'student_id',
        'student_email',
        'payment_type',
        'queue_type',
        'other_details',
        'status',
        'call_sequence',
        'called_at',
        'served_at',
    ];

    protected function casts(): array
    {
        return [
            'called_at' => 'datetime',
            'served_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
