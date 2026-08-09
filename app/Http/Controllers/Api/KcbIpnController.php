<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class KcbIpnController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        Log::info('KCB IPN received', $request->all());

        $transactionReference = $request->input('transactionReference');
        $transactionStatus = $request->input('transactionStatus');

        if (! $transactionReference) {
            Log::warning('KCB IPN received with no transactionReference');
            return response()->json(['status' => 'ignored']);
        }

        $payment = Payment::where('checkout_request_id', $transactionReference)->first();

        if (! $payment) {
            Log::warning("KCB IPN for unknown transactionReference: {$transactionReference}");
            return response()->json(['status' => 'ignored']);
        }

        if ($transactionStatus === 'SUCCESS') {
            $payment->update([
                'status' => 'completed',
                'provider_receipt_number' => $request->input('ftReference'),
                'result_code' => '0',
                'result_desc' => $request->input('transactionMessage'),
                'paid_at' => now(),
            ]);

            $payment->invoice?->update(['status' => 'paid']);

            Log::info("KCB transfer completed. Reference: {$transactionReference}, ftReference: {$request->input('ftReference')}");
        } else {
            $payment->update([
                'status' => 'failed',
                'result_desc' => $request->input('transactionMessage'),
            ]);

            Log::info("KCB transfer failed. Reference: {$transactionReference}");
        }

        return response()->json(['status' => 'received']);
    }
}