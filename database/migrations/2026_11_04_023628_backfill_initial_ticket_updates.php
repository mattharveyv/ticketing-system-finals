<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('tickets')
            ->whereNotExists(static function (Builder $query): void {
                $query->selectRaw('1')
                    ->from('ticket_updates')
                    ->whereColumn('ticket_updates.ticket_id', 'tickets.id');
            })
            ->orderBy('id')
            ->chunkById(500, static function (Collection $tickets): void {
                $updates = $tickets->map(static function (object $ticket): array {
                    $createdAt = $ticket->created_at ?? now();

                    return [
                        'ticket_id' => $ticket->id,
                        'user_id' => $ticket->user_id,
                        'event_type' => 'created',
                        'body' => 'Ticket submitted to '.($ticket->department ?? 'MSEUF support').'.',
                        'status' => $ticket->status,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ];
                })->all();

                if ($updates !== []) {
                    DB::table('ticket_updates')->insert($updates);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {}
};
