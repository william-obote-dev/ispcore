<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class OdooService
{
    public function authenticate(): int
    {
        $response = Http::post(config('odoo.url') . '/jsonrpc', [
            'jsonrpc' => '2.0',
            'method' => 'call',
            'params' => [
                'service' => 'common',
                'method' => 'login',
                'args' => [
                    config('odoo.database'),
                    config('odoo.username'),
                    config('odoo.api_key'),
                ],
            ],
        ]);

        $result = $response->json('result');

        if (! $result) {
            throw new \RuntimeException('Odoo authentication failed: ' . $response->body());
        }

        return $result; // this is the uid
    }
}