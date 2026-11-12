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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->nullable()->unique();
            $table->string('customer_name');
            $table->string('customer_email')->index();
            $table->string('subject');
            $table->string('category');
            $table->string('priority');
            $table->string('status')->default('New');
            $table->string('agent')->default('Unassigned');
            $table->string('team');
            $table->string('device')->nullable();
            $table->string('location')->nullable();
            $table->text('description');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
