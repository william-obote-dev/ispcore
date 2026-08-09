<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class KcbService
{
    public function getAccessToken(): string
    {
        return Cache::remember('kcb_access_token', 3500, function () {
            $response = Http::withBasicAuth(
                config('kcb.consumer_key'),
                config('kcb.consumer_secret')
            )->asForm()->post(config('kcb.base_url') . '/token', [
                'grant_type' => 'client_credentials',
            ]);

            if (! $response->successful()) {
                throw new \RuntimeException('Failed to get KCB access token: ' . $response->body());
            }

            return $response->json('access_token');
        });
    }
}