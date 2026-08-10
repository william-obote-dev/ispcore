<?php

namespace App\Services;

use App\Models\NetworkSession;
use App\Models\Subscription;

/**
 * Simulates RADIUS-style network session control (e.g. FreeRADIUS + Mikrotik).
 *
 * In production, these methods would issue real CoA (Change of Authorization)
 * packets to network hardware to actually throttle/suspend a customer's
 * connection. Here, they update a database record with the same interface
 * a real implementation would use — the business logic (when to throttle,
 * when to restore) is real; only the network-layer enforcement is simulated.
 */
class NetworkService
{
    public function provisionSession(Subscription $subscription): NetworkSession
    {
        return NetworkSession::updateOrCreate(
            ['subscription_id' => $subscription->id],
            [
                'simulated_ip' => $this->fakeIp(),
                'bandwidth_kbps' => $subscription->plan->speed_mbps * 1000,
                'status' => 'active',
                'status_changed_at' => now(),
            ]
        );
    }

    public function throttleSession(Subscription $subscription): NetworkSession
    {
        return $this->updateStatus($subscription, 'throttled', bandwidthFraction: 0.1);
    }

    public function suspendSession(Subscription $subscription): NetworkSession
    {
        return $this->updateStatus($subscription, 'suspended', bandwidthFraction: 0);
    }

    public function restoreSession(Subscription $subscription): NetworkSession
    {
        $subscription->loadMissing('plan');

        return $this->updateStatus($subscription, 'active', bandwidthFraction: 1);
    }

    private function updateStatus(Subscription $subscription, string $status, float $bandwidthFraction): NetworkSession
    {
        $subscription->loadMissing('plan');

        return NetworkSession::updateOrCreate(
            ['subscription_id' => $subscription->id],
            [
                'bandwidth_kbps' => (int) ($subscription->plan->speed_mbps * 1000 * $bandwidthFraction),
                'status' => $status,
                'status_changed_at' => now(),
            ]
        );
    }

    private function fakeIp(): string
    {
        return '10.' . rand(0, 255) . '.' . rand(0, 255) . '.' . rand(1, 254);
    }
}