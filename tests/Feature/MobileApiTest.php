<?php

namespace Tests\Feature;

use App\Models\SupportType;
use App\Models\User;
use App\Notifications\PortalNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MobileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_register_and_receive_a_mobile_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Jamie Student',
            'email' => 'jamie@example.com',
            'student_id' => '20260042',
            'college' => 'College of Computing',
            'program' => 'Information Technology',
            'year_level' => '2nd Year',
            'password' => 'student-password',
            'password_confirmation' => 'student-password',
            'role' => 'admin',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.name', 'Jamie Student')
            ->assertJsonPath('user.student_id', '20260042')
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $this->assertDatabaseHas('users', [
            'email' => 'jamie@example.com',
            'role' => 'student',
        ]);
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_student_can_login_and_revoke_their_mobile_token(): void
    {
        $student = User::factory()->create([
            'email' => 'jamie@example.com',
            'password' => 'student-password',
            'role' => 'student',
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'jamie@example.com',
            'password' => 'student-password',
        ]);

        $login->assertOk()->assertJsonPath('user.id', $student->id);
        $token = $login->json('token');

        $this->withToken($token)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.email', 'jamie@example.com');

        $this->withToken($token)->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out successfully.');

        $this->assertDatabaseCount('personal_access_tokens', 0);
        Auth::forgetGuards();
        $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_student_can_upload_and_replace_their_profile_photo(): void
    {
        Storage::fake('public');
        $student = User::factory()->create(['role' => 'student']);
        $token = $student->createToken('test')->plainTextToken;

        $firstUpload = $this->withToken($token)->post('/api/user/profile-photo', [
            'profile_photo' => UploadedFile::fake()->image('first-photo.jpg'),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonStructure(['data' => ['profile_photo_url']]);
        $firstPhotoPath = $student->fresh()->profile_photo_path;
        Storage::disk('public')->assertExists($firstPhotoPath);
        $this->assertStringContainsString('/storage/'.$firstPhotoPath, $firstUpload->json('data.profile_photo_url'));

        $this->withToken($token)->post('/api/user/profile-photo', [
            'profile_photo' => UploadedFile::fake()->image('second-photo.png'),
        ], ['Accept' => 'application/json'])->assertOk();

        $secondPhotoPath = $student->fresh()->profile_photo_path;
        $this->assertNotSame($firstPhotoPath, $secondPhotoPath);
        Storage::disk('public')->assertMissing($firstPhotoPath);
        Storage::disk('public')->assertExists($secondPhotoPath);

        $otherStudent = User::factory()->create(['role' => 'student']);
        $otherToken = $otherStudent->createToken('test')->plainTextToken;
        Auth::forgetGuards();
        $this->withToken($otherToken)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.profile_photo_url', null);
    }

    public function test_profile_photo_upload_rejects_non_image_files(): void
    {
        Storage::fake('public');
        $student = User::factory()->create(['role' => 'student']);
        $token = $student->createToken('test')->plainTextToken;

        $this->withToken($token)->post('/api/user/profile-photo', [
            'profile_photo' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('profile_photo');

        $this->assertNull($student->fresh()->profile_photo_path);
        Storage::disk('public')->assertDirectoryEmpty('profile-photos');
    }

    public function test_student_can_upload_a_base64_profile_photo_from_expo_go(): void
    {
        Storage::fake('public');
        $student = User::factory()->create(['role' => 'student']);
        $token = $student->createToken('test')->plainTextToken;
        $photo = UploadedFile::fake()->image('profile-photo.jpg');

        $this->withToken($token)->postJson('/api/user/profile-photo', [
            'profile_photo' => base64_encode(file_get_contents($photo->getPathname())),
        ])->assertOk()
            ->assertJsonStructure(['data' => ['profile_photo_url']]);

        $photoPath = $student->fresh()->profile_photo_path;
        $this->assertSame('jpg', pathinfo($photoPath, PATHINFO_EXTENSION));
        Storage::disk('public')->assertExists($photoPath);
    }

    public function test_profile_photo_upload_rejects_invalid_base64_images(): void
    {
        Storage::fake('public');
        $student = User::factory()->create(['role' => 'student']);
        $token = $student->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/user/profile-photo', [
            'profile_photo' => base64_encode('not an image'),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('profile_photo');

        $this->assertNull($student->fresh()->profile_photo_path);
        Storage::disk('public')->assertDirectoryEmpty('profile-photos');
    }

    public function test_student_can_read_and_manage_only_their_own_notifications(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $otherStudent = User::factory()->create(['role' => 'student']);
        $firstNotification = new PortalNotification([
            'title' => 'Ticket update',
            'message' => 'A support office replied.',
            'url' => '/user/tickets/MSEUF-2026-000001',
            'category' => 'Ticket reply',
        ]);
        $secondNotification = new PortalNotification([
            'title' => 'Payment queue update',
            'message' => 'Your queue number was called.',
            'url' => '/user/payment-queue',
            'category' => 'Payment queue',
        ]);
        $student->notify($firstNotification);
        $student->notify($secondNotification);
        $otherStudent->notify(new PortalNotification([
            'title' => 'Private update',
            'message' => 'This is another student’s notification.',
            'url' => '/user/payment-queue',
            'category' => 'Payment queue',
        ]));
        $token = $student->createToken('test')->plainTextToken;
        $firstNotificationId = $student->notifications()->firstOrFail()->id;

        $this->withToken($token)->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.unread_count', 2);

        $this->withToken($token)->patchJson('/api/notifications/'.$firstNotificationId.'/read')
            ->assertOk()
            ->assertJsonPath('unread_count', 1);

        $otherToken = $otherStudent->createToken('test')->plainTextToken;
        Auth::forgetGuards();
        $this->withToken($otherToken)->patchJson('/api/notifications/'.$firstNotificationId.'/read')
            ->assertNotFound();

        $this->withToken($token)->patchJson('/api/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('unread_count', 0);

        $this->withToken($token)->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 0);
    }

    public function test_student_can_search_and_open_help_articles(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $token = $student->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/knowledge-base')
            ->assertOk()
            ->assertJsonCount(15, 'data')
            ->assertJsonPath('data.0.slug', 'article-1')
            ->assertJsonPath('meta.categories.0', 'Account');

        $this->withToken($token)->getJson('/api/knowledge-base?search=printer')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Fix common printer problems');

        $this->withToken($token)->getJson('/api/knowledge-base?category=Network')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->withToken($token)->getJson('/api/knowledge-base/article-1')
            ->assertOk()
            ->assertJsonPath('data.title', 'How to reset your password')
            ->assertJsonPath('data.sections.1.title', 'Try these steps');

        $this->withToken($token)->getJson('/api/knowledge-base/not-an-article')
            ->assertNotFound();
    }

    public function test_student_can_create_tickets_but_cannot_read_another_students_ticket(): void
    {
        $this->travelTo('2026-01-15 12:00:00');

        $student = User::factory()->create(['role' => 'student']);
        $supportType = SupportType::query()->create([
            'name' => 'IT Support',
            'is_active' => true,
        ]);
        $token = $student->createToken('test')->plainTextToken;

        $created = $this->withToken($token)->postJson('/api/tickets', [
            'subject' => 'Campus Wi-Fi is unavailable',
            'category' => 'Network and Wi-Fi',
            'support_type_id' => $supportType->id,
            'location' => 'Library',
            'description' => 'My device cannot connect to the campus network.',
        ]);

        $created->assertCreated()
            ->assertJsonPath('data.status', 'New')
            ->assertJsonPath('data.support_type', 'IT Support')
            ->assertJsonPath('data.ticket_number', 'MSEUF-2026-000001');

        $ticketNumber = $created->json('data.ticket_number');
        $this->withToken($token)->getJson('/api/tickets')
            ->assertOk()
            ->assertJsonPath('data.0.ticket_number', $ticketNumber);
        $this->withToken($token)->getJson('/api/tickets/'.$ticketNumber)
            ->assertOk()
            ->assertJsonPath('data.updates.0.status', 'New');

        $otherStudent = User::factory()->create(['role' => 'student']);
        $otherToken = $otherStudent->createToken('test')->plainTextToken;
        Auth::forgetGuards();
        $this->withToken($otherToken)->getJson('/api/tickets/'.$ticketNumber)->assertNotFound();
    }

    public function test_student_can_reply_to_their_ticket_and_admins_are_notified(): void
    {
        Notification::fake();
        $student = User::factory()->create(['role' => 'student']);
        $admin = User::factory()->create(['role' => 'admin']);
        $supportType = SupportType::query()->create([
            'name' => 'IT Support',
            'is_active' => true,
        ]);
        $token = $student->createToken('test')->plainTextToken;
        $created = $this->withToken($token)->postJson('/api/tickets', [
            'subject' => 'Need help signing in',
            'category' => 'Account access',
            'support_type_id' => $supportType->id,
            'description' => 'I cannot sign in to my student account.',
        ])->assertCreated();
        $ticketNumber = $created->json('data.ticket_number');

        $this->withToken($token)->postJson('/api/tickets/'.$ticketNumber.'/replies', [
            'message' => 'I have tried resetting my password.',
        ])->assertCreated()
            ->assertJsonPath('data.updates.1.event_type', 'reply')
            ->assertJsonPath('data.updates.1.body', 'I have tried resetting my password.');

        Notification::assertSentTo(
            $admin,
            PortalNotification::class,
            static fn (PortalNotification $notification): bool => $notification->data['title'] === 'A student replied to a support ticket',
        );

        $otherStudent = User::factory()->create(['role' => 'student']);
        $otherToken = $otherStudent->createToken('test')->plainTextToken;
        Auth::forgetGuards();
        $this->withToken($otherToken)->postJson('/api/tickets/'.$ticketNumber.'/replies', [
            'message' => 'This should not be added.',
        ])->assertNotFound();
    }

    public function test_student_can_join_their_payment_queue_and_check_live_position(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $token = $student->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/payment-queue', [
            'payment_type' => 'Other',
            'queue_type' => 'Priority',
            'other_details' => 'Transcript fee',
        ])->assertCreated()
            ->assertJsonPath('data.paymentType', 'Other')
            ->assertJsonPath('data.queueType', 'Priority');

        $this->withToken($token)->getJson('/api/payment-queue/status')
            ->assertOk()
            ->assertJsonPath('entries.0.status', 'Waiting')
            ->assertJsonPath('entries.0.position', 1)
            ->assertJsonPath('waitingCount', 1);

        $otherStudent = User::factory()->create(['role' => 'student']);
        $otherToken = $otherStudent->createToken('test')->plainTextToken;
        Auth::forgetGuards();
        $this->withToken($otherToken)->getJson('/api/payment-queue/status')
            ->assertOk()
            ->assertJsonCount(0, 'entries');
    }

    public function test_mobile_api_requires_a_student_account_for_protected_routes(): void
    {
        $this->getJson('/api/tickets')->assertUnauthorized();
        $this->getJson('/api/payment-queue/status')->assertUnauthorized();
        $this->getJson('/api/notifications')->assertUnauthorized();
        $this->getJson('/api/knowledge-base')->assertUnauthorized();

        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/tickets')->assertForbidden();
        $this->withToken($token)->getJson('/api/payment-queue/status')->assertForbidden();
        $this->withToken($token)->getJson('/api/notifications')->assertForbidden();
        $this->withToken($token)->getJson('/api/knowledge-base')->assertForbidden();
    }

    public function test_admin_credentials_cannot_be_used_to_sign_in_to_the_student_app(): void
    {
        User::factory()->create([
            'email' => 'admin@example.com',
            'password' => 'admin-password',
            'role' => 'admin',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'admin-password',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }
}
