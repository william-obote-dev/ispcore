<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class MpesaService
{
    public function getAccessToken(): string
    {
        return Cache::remember('mpesa_access_token', 3500, function () {
            $response = Http::withBasicAuth(
                config('mpesa.consumer_key'),
                config('mpesa.consumer_secret')
            )->get(config('mpesa.base_url') . '/oauth/v1/generate', [
                'grant_type' => 'client_credentials',
            ]);

            if (! $response->successful()) {
                throw new \RuntimeException('Failed to get M-Pesa access token: ' . $response->body());
            }

            return $response->json('access_token');
        });
    }

    public function stkPush(string $phone, float $amount, string $accountReference, string $description): array
{
    $shortcode = config('mpesa.shortcode');
    $passkey = config('mpesa.passkey');
    $timestamp = now()->format('YmdHis');
    $password = base64_encode($shortcode . $passkey . $timestamp);

    $response = Http::withToken($this->getAccessToken())
        ->post(config('mpesa.base_url') . '/mpesa/stkpush/v1/processrequest', [
            'BusinessShortCode' => $shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => (int) $amount,
            'PartyA' => $this->formatPhone($phone),
            'PartyB' => $shortcode,
            'PhoneNumber' => $this->formatPhone($phone),
            'CallBackURL' => config('mpesa.callback_url'),
            'AccountReference' => $accountReference,
            'TransactionDesc' => $description,
        ]);

    if (! $response->successful()) {
        throw new \RuntimeException('STK Push failed: ' . $response->body());
    }

    return $response->json();
}

private function formatPhone(string $phone): string
{
    $phone = preg_replace('/\D/', '', $phone);

    if (str_starts_with($phone, '0')) {
        $phone = '254' . substr($phone, 1);
    }

    return $phone;
}

}