<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_queue_entries', function (Blueprint $table) {
            $table->id();
            $table->string('queue_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('student_name');
            $table->string('student_id')->nullable();
            $table->string('student_email');
            $table->string('payment_type');
            $table->string('queue_type')->default('Regular');
            $table->string('other_details')->nullable();
            $table->string('status')->default('Waiting')->index();
            $table->unsignedBigInteger('call_sequence')->nullable()->unique();
            $table->timestamp('called_at')->nullable();
            $table->timestamp('served_at')->nullable();
            $table->timestamps();
        });

        DB::table('tickets')
            ->whereIn('status', ['Queued', 'Called'])
            ->update(['status' => 'New']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_queue_entries');
    }
};
