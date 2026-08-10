<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('network_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->string('simulated_ip')->nullable();
            $table->unsignedInteger('bandwidth_kbps');
            $table->enum('status', ['active', 'throttled', 'suspended'])->default('active');
            $table->timestamp('status_changed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('network_sessions');
    }
};
