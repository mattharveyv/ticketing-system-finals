<?php

namespace App\Actions;

use App\Models\SupportType;
use App\Models\Ticket;
use App\Models\User;

class CreateStudentTicket
{
    /**
     * @param  array{subject: string, category: string, support_type_id: int|string, location?: ?string, description: string}  $validated
     */
    public function handle(User $student, array $validated): Ticket
    {
        $supportType = SupportType::query()
            ->where('is_active', true)
            ->findOrFail($validated['support_type_id']);

        $ticket = $student->tickets()->create([
            'customer_name' => $student->name,
            'customer_email' => $student->email,
            'subject' => $validated['subject'],
            'category' => $validated['category'],
            'priority' => 'Medium',
            'status' => 'New',
            'support_type_id' => $supportType->id,
            'team' => $supportType->name,
            'department' => $supportType->name,
            'location' => $validated['location'] ?? null,
            'description' => $validated['description'],
        ]);

        $ticket->update([
            'ticket_number' => sprintf('MSEUF-%s-%06d', now()->format('Y'), $ticket->getKey()),
        ]);

        $ticket->updates()->create([
            'user_id' => $student->id,
            'event_type' => 'created',
            'body' => 'Ticket submitted to '.$supportType->name.'.',
            'status' => 'New',
        ]);

        return $ticket;
    }
}
