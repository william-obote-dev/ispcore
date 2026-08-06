<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PaystackCallbackController extends Controller
{
    public function __construct(private PaystackService $paystackService) {}

    public function handle(Request $request): JsonResponse
    {
        $reference = $request->query('reference') ?? $request->input('data.reference');

        if (! $reference) {
            Log::warning('Paystack callback received with no reference');
            return response()->json(['status' => 'ignored']);
        }

        $payment = Payment::where('checkout_request_id', $reference)->first();

        if (! $payment) {
            Log::warning("Paystack callback for unknown reference: {$reference}");
            return response()->json(['status' => 'ignored']);
        }

        $transaction = $this->paystackService->verifyTransaction($reference);

        if ($transaction['status'] === 'success') {
            $payment->update([
                'status' => 'completed',
                'provider_receipt_number' => $transaction['id'],
                'result_code' => '0',
                'result_desc' => 'success',
                'paid_at' => now(),
            ]);

            $payment->invoice->update(['status' => 'paid']);

            Log::info("Paystack payment completed for invoice {$payment->invoice->invoice_number}");
        } else {
            $payment->update([
                'status' => 'failed',
                'result_desc' => $transaction['gateway_response'] ?? 'unknown',
            ]);

            Log::info("Paystack payment failed for invoice {$payment->invoice->invoice_number}");
        }

        return response()->json(['status' => 'processed']);
    }
}