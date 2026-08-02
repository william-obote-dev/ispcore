<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Subscription;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;

class InvoiceController extends Controller
{
    public function __construct(private InvoiceService $invoiceService) {}

    public function generate(Subscription $subscription): JsonResponse
    {
        $invoice = $this->invoiceService->generateForSubscription($subscription);

        return response()->json($invoice->load('items', 'customer'), 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json($invoice->load('items', 'customer', 'subscription.plan'));
    }
}