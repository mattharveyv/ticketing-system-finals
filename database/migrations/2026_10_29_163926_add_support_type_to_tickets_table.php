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
        if (! Schema::hasColumn('tickets', 'support_type_id')) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->foreignId('support_type_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            });
        }

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('tickets', 'support_type_id')) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->dropForeign(['support_type_id']);
                $table->dropColumn('support_type_id');
            });
        }

    }
};
