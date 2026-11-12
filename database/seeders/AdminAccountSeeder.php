<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = env('MSEUF_ADMIN_EMAIL');
        $password = env('MSEUF_ADMIN_PASSWORD');

        if (! $email || ! $password) {
            return;
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => env('MSEUF_ADMIN_NAME', 'MSEUF Support Administrator'),
                'password' => Hash::make($password),
                'role' => 'admin',
            ],
        );
    }
}
