<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ticket_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event_type');
            $table->text('body');
            $table->string('status')->nullable();
            $table->timestamps();

            $table->index(['ticket_id', 'created_at']);
        });

        DB::table('tickets')->orderBy('id')->chunkById(500, static function (Collection $tickets): void {
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
    public function down(): void
    {
        Schema::dropIfExists('ticket_updates');
    }
};
