<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class JengaService
{
    public function getAccessToken(): string
    {
        return Cache::remember('jenga_access_token', 3500, function () {
            $response = Http::withHeaders([
                'Api-Key' => config('jenga.api_key'),
                'Content-Type' => 'application/json',
            ])->post(config('jenga.base_url') . '/authentication/api/v3/authenticate/merchant', [
                'merchantCode' => config('jenga.merchant_code'),
                'consumerSecret' => config('jenga.consumer_secret'),
            ]);

            if (! $response->successful()) {
                throw new \RuntimeException('Failed to get Jenga access token: ' . $response->body());
            }

            return $response->json('accessToken');
        });
    }
}