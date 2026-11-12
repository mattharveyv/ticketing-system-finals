<?php

namespace Tests\Feature;

use App\Models\SupportType;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_submission_is_saved_and_redirects_with_ticket_details(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $supportType = SupportType::query()->create([
            'name' => 'IT Support',
            'is_active' => true,
        ]);
        $this->actingAs($student);

        $response = $this->post(route('user.tickets.store'), [
            'subject' => 'Cannot connect to VPN',
            'category' => 'Network and Wi-Fi',
            'support_type_id' => $supportType->id,
            'location' => 'Remote',
            'description' => 'The VPN disconnects immediately after login.',
        ]);

        $response->assertRedirectToRoute('user.tickets.submitted', [
            'ticketNumber' => 'MSEUF-'.now()->format('Y').'-000001',
        ]);
        $this->assertDatabaseHas('tickets', [
            'user_id' => $student->id,
            'customer_email' => $student->email,
            'subject' => 'Cannot connect to VPN',
            'status' => 'New',
            'support_type_id' => $supportType->id,
        ]);
    }

    public function test_admin_ticket_list_shows_persisted_tickets(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        Ticket::create([
            'ticket_number' => 'NX-2026-009876',
            'customer_name' => 'Jordan Customer',
            'customer_email' => 'jordan@example.com',
            'subject' => 'VPN access is unavailable',
            'category' => 'Network',
            'priority' => 'High',
            'status' => 'New',
            'agent' => 'Unassigned',
            'team' => 'IT Support',
            'description' => 'Connection fails after authentication.',
        ]);

        $this->get(route('admin.tickets'))
            ->assertSee('NX-2026-009876')
            ->assertSee('VPN access is unavailable')
            ->assertSee('jordan@example.com');
    }

    public function test_invalid_submission_does_not_create_a_ticket(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'student']));

        $response = $this->post(route('user.tickets.store'), []);

        $response->assertSessionHasErrors(['subject', 'category', 'support_type_id', 'description']);
        $this->assertDatabaseCount('tickets', 0);
    }
}
