<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Subscription;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function pay(Request $request, Invoice $invoice)
    {
    $validated = $request->validate([
        'phone' => 'required|string',
    ]);

    $payment = app(\App\Services\MpesaService::class)->stkPush($invoice, $validated['phone']);

    return response()->json($payment);
     }

     public function status(Invoice $invoice): JsonResponse
     {
    $latestPayment = $invoice->payments()->latest()->first();

    return response()->json([
        'invoice_number' => $invoice->invoice_number,
        'invoice_status' => $invoice->status,
        'total' => $invoice->total,
        'latest_payment' => $latestPayment ? [
            'status' => $latestPayment->status,
            'checkout_request_id' => $latestPayment->checkout_request_id,
            'result_desc' => $latestPayment->result_desc,
            'receipt_number' => $latestPayment->provider_receipt_number,
            'paid_at' => $latestPayment->paid_at,
        ] : null,
    ]);
       }

    public function payWithCard(Request $request, Invoice $invoice)
     {
    $validated = $request->validate([
        'email' => 'required|email',
    ]);

    $result = app(\App\Services\PaystackService::class)->initialize($invoice, $validated['email']);

    return response()->json([
        'authorization_url' => $result['authorization_url'],
        'reference' => $result['reference'],
        'payment' => $result['payment'],
    ]);
    
      }


}