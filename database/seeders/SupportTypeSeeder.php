<?php

namespace Database\Seeders;

use App\Models\SupportType;
use Illuminate\Database\Seeder;

class SupportTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ([
            'IT Support',
            'Registrar',
            'Finance Office',
            'Facilities and Maintenance',
            'Library Services',
            'Guidance and Counseling',
            'Campus Safety',
            'Student Affairs',
        ] as $name) {
            SupportType::firstOrCreate(['name' => $name], ['is_active' => true]);
        }
    }
}
