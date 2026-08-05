<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function send(string $phone, string $message): bool
    {
        $response = Http::asForm()->withHeaders([
            'apiKey' => config('africastalking.api_key'),
            'Accept' => 'application/json',
        ])->post(config('africastalking.base_url') . '/messaging', [
            'username' => config('africastalking.username'),
            'to' => $this->formatPhone($phone),
            'message' => $message,
        ]);

        if (! $response->successful()) {
            Log::error('SMS send failed: ' . $response->body());
            return false;
        }

        Log::info('SMS sent', ['phone' => $phone, 'response' => $response->json()]);

        return true;
    }

    private function formatPhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone);

        if (str_starts_with($phone, '0')) {
            $phone = '254' . substr($phone, 1);
        }

        return '+' . $phone;
    }
}