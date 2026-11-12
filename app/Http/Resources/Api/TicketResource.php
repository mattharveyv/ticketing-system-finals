<?php

namespace App\Http\Resources\Api;

use App\Models\TicketUpdate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'ticket_number' => $this->ticket_number,
            'subject' => $this->subject,
            'category' => $this->category,
            'priority' => $this->priority,
            'status' => $this->status,
            'support_type' => $this->supportType?->name ?? $this->department,
            'location' => $this->location,
            'description' => $this->description,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'updates' => $this->whenLoaded('updates', fn (): array => $this->updates->map(
                fn (TicketUpdate $update): array => [
                    'event_type' => $update->event_type,
                    'body' => $update->body,
                    'status' => $update->status,
                    'author' => $update->actor?->name ?? 'MSEUF Support',
                    'created_at' => $update->created_at?->toIso8601String(),
                ],
            )->all()),
        ];
    }
}
