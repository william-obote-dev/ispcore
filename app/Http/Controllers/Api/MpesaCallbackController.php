<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
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

        $resultCode = $callback['ResultCode'] ?? null;
        $checkoutRequestId = $callback['CheckoutRequestID'] ?? null;

        if ($resultCode === 0) {
            $metadata = collect($callback['CallbackMetadata']['Item'] ?? []);

            $mpesaReceiptNumber = $metadata->firstWhere('Name', 'MpesaReceiptNumber')['Value'] ?? null;
            $amountPaid = $metadata->firstWhere('Name', 'Amount')['Value'] ?? null;
            $accountReference = $this->extractAccountReference($request);

            $invoice = Invoice::where('invoice_number', $accountReference)->first();

            if ($invoice) {
                $invoice->update(['status' => 'paid']);
                Log::info("Invoice {$invoice->invoice_number} marked as paid via M-Pesa. Receipt: {$mpesaReceiptNumber}");
            } else {
                Log::warning("M-Pesa payment succeeded but no matching invoice found for reference: {$accountReference}");
            }
        } else {
            Log::info("M-Pesa payment failed or cancelled. CheckoutRequestID: {$checkoutRequestId}, ResultCode: {$resultCode}");
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    private function extractAccountReference(Request $request): ?string
    {
        // Safaricom's callback doesn't echo back AccountReference directly,
        // so in production we'd look this up via CheckoutRequestID stored
        // when we initiated the STK push. For now, sandbox testing will
        // pass it through a query param we control (see routes/api.php).
        return $request->query('ref');
    }
}