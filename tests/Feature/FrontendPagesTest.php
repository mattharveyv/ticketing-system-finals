<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FrontendPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_landing_and_auth_pages_render(): void
    {
        $this->get(route('home'))->assertOk()->assertSee('campus life.');
        $this->get(route('login'))->assertOk()->assertSee('Student sign in');
        $this->get(route('register'))->assertOk()->assertSee('Create a student account');
        $this->get(route('forgot-password'))->assertOk()->assertSee('Forgot your password?');
        $this->get(route('admin.login'))->assertOk()->assertSee('Staff sign in');
    }

    public function test_user_ticket_and_support_pages_render(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $ticket = $student->tickets()->create([
            'ticket_number' => 'MSEUF-2026-004281',
            'customer_name' => $student->name,
            'customer_email' => $student->email,
            'subject' => 'Campus Wi-Fi access',
            'category' => 'Network and Wi-Fi',
            'priority' => 'Medium',
            'status' => 'New',
            'agent' => 'Unassigned',
            'team' => 'IT Support',
            'description' => 'Unable to connect to the campus network.',
        ]);

        $this->actingAs($student);
        $paths = [
            route('user.dashboard'),
            route('user.tickets'),
            route('user.tickets.create'),
            route('user.tickets.submitted', $ticket->ticket_number),
            route('user.tickets.show', $ticket->ticket_number),
            route('user.knowledge'),
            route('user.knowledge.show', ['slug' => 'article-1']),
            route('user.notifications'),
            route('user.profile'),
            route('user.settings'),
        ];

        foreach ($paths as $path) {
            $this->get($path)->assertOk();
        }
    }

    public function test_admin_support_pages_render(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $ticket = Ticket::query()->create([
            'ticket_number' => 'MSEUF-2026-004282',
            'customer_name' => 'Test Student',
            'customer_email' => 'student@example.com',
            'subject' => 'Campus Wi-Fi access',
            'category' => 'Network and Wi-Fi',
            'priority' => 'Medium',
            'status' => 'New',
            'agent' => 'Unassigned',
            'team' => 'IT Support',
            'description' => 'Unable to connect to the campus network.',
        ]);

        $this->actingAs($admin);
        $paths = [
            route('admin.dashboard'),
            route('admin.tickets'),
            route('admin.kanban'),
            route('admin.tickets.show', $ticket->ticket_number),
            route('admin.customers'),
            route('admin.customers.show', ['customerId' => 'user@nexadesk.com']),
            route('admin.agents'),
            route('admin.agents.show', ['agentId' => 'alex@nexadesk.com']),
            route('admin.teams'),
            route('admin.sla'),
            route('admin.knowledge-base'),
            route('admin.canned-responses'),
            route('admin.reports'),
            route('admin.audit-logs'),
            route('admin.settings'),
        ];

        foreach ($paths as $path) {
            $this->get($path)->assertOk();
        }
    }
}
