<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;

class PaystackService
{
    public function initialize(Invoice $invoice, string $email): array
    {
        $response = Http::withToken(config('paystack.secret_key'))
            ->post(config('paystack.base_url') . '/transaction/initialize', [
                'email' => $email,
                'amount' => (int) ($invoice->total * 100), // Paystack expects kobo/cents
                'reference' => $this->generateReference($invoice),
                'callback_url' => config('app.url') . '/api/paystack/callback',
                'metadata' => [
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                ],
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Paystack initialization failed: ' . $response->body());
        }

        $data = $response->json('data');

        $payment = $invoice->payments()->create([
            'provider' => 'paystack',
            'checkout_request_id' => $data['reference'],
            'phone' => 'n/a',
            'amount' => $invoice->total,
            'status' => 'pending',
        ]);

        return [
            'authorization_url' => $data['authorization_url'],
            'reference' => $data['reference'],
            'payment' => $payment,
        ];
    }

    public function verifyTransaction(string $reference): array
    {
        $response = Http::withToken(config('paystack.secret_key'))
            ->get(config('paystack.base_url') . "/transaction/verify/{$reference}");

        if (! $response->successful()) {
            throw new \RuntimeException('Paystack verification failed: ' . $response->body());
        }

        return $response->json('data');
    }

    private function generateReference(Invoice $invoice): string
    {
        return $invoice->invoice_number . '-' . uniqid();
    }
}