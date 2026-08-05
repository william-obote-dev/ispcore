<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class MpesaCallbackController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
    Log::info('M-Pesa callback received', $request->all());

    $callback = $request->input('Body.stkCallback');

    if (! $callback) {
        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Ignored']);
    }

    $checkoutRequestId = $callback['CheckoutRequestID'] ?? null;
    $resultCode = $callback['ResultCode'] ?? null;

    $payment = Payment::where('checkout_request_id', $checkoutRequestId)->first();

    if (! $payment) {
        Log::warning("M-Pesa callback received for unknown CheckoutRequestID: {$checkoutRequestId}");
        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    if ($resultCode === 0) {
        $metadata = collect($callback['CallbackMetadata']['Item'] ?? []);
        $receiptNumber = $metadata->firstWhere('Name', 'MpesaReceiptNumber')['Value'] ?? null;

        $payment->update([
            'status' => 'completed',
            'provider_receipt_number' => $receiptNumber,
            'result_code' => $resultCode,
            'result_desc' => $callback['ResultDesc'] ?? null,
            'paid_at' => now(),
        ]);

        $invoice = $payment->invoice;
        $invoice->update(['status' => 'paid']);

        Log::info("Payment completed for invoice {$invoice->invoice_number}. Receipt: {$receiptNumber}");

        app(\App\Services\SmsService::class)->send(
            $payment->phone,
            "Payment confirmed! KES {$payment->amount} received for invoice {$invoice->invoice_number}. Receipt: {$receiptNumber}. Thank you for your business."
        );
    } else {
        $payment->update([
            'status' => 'failed',
            'result_code' => $resultCode,
            'result_desc' => $callback['ResultDesc'] ?? null,
        ]);

        Log::info("Payment failed for invoice {$payment->invoice->invoice_number}. Reason: {$callback['ResultDesc']}");
    }

    return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
   }
}