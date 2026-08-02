<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends Controller
{
    public function store(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'start_date' => 'nullable|date',
        ]);

        $subscription = $customer->subscriptions()->create([
            'plan_id' => $validated['plan_id'],
            'start_date' => $validated['start_date'] ?? now(),
            'status' => 'active',
        ]);

        return response()->json($subscription->load('plan', 'customer'), 201);
    }

    public function show(Subscription $subscription): JsonResponse
    {
        return response()->json($subscription->load('plan', 'customer', 'invoices'));
    }
}
