<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->text('bio')->nullable()->after('skills');
        });

        Schema::table('job_applications', function (Blueprint $table): void {
            $table->string('cv_path')->nullable()->after('status');
            $table->string('cv_name')->nullable()->after('cv_path');
        });
    }

    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table): void {
            $table->dropColumn(['cv_path', 'cv_name']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('bio');
        });
    }
};
