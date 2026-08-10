<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NetworkSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'subscription_id',
        'simulated_ip',
        'bandwidth_kbps',
        'status',
        'status_changed_at',
    ];

    protected function casts(): array
    {
        return ['status_changed_at' => 'datetime'];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}