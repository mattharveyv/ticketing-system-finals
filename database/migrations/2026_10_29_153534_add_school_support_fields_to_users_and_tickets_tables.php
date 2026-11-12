<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('student')->after('password');
            $table->string('student_id')->nullable()->unique()->after('role');
            $table->string('college')->nullable()->after('student_id');
            $table->string('program')->nullable()->after('college');
            $table->string('year_level')->nullable()->after('program');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('queue_number')->nullable()->unique()->after('ticket_number');
            $table->string('department')->default('IT Support')->after('team');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'queue_number', 'department']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['student_id']);
            $table->dropColumn(['role', 'student_id', 'college', 'program', 'year_level']);
        });
    }
};
