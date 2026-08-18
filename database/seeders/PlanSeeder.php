<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            ['name' => 'Home Lite', 'speed_mbps' => 10, 'price' => 1500, 'billing_cycle' => 'monthly'],
            ['name' => 'Home Standard', 'speed_mbps' => 25, 'price' => 2500, 'billing_cycle' => 'monthly'],
            ['name' => 'Home Pro', 'speed_mbps' => 50, 'price' => 4000, 'billing_cycle' => 'monthly'],
            ['name' => 'Business Fiber', 'speed_mbps' => 100, 'price' => 8000, 'billing_cycle' => 'monthly'],
            ['name' => 'Business Fiber Plus', 'speed_mbps' => 200, 'price' => 15000, 'billing_cycle' => 'quarterly'],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['name' => $plan['name']], $plan);
        }
    }
}
