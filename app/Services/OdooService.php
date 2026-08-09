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

    public function findOrCreatePartner(string $name, string $email): int
{
    $uid = $this->authenticate();

    // Search for existing partner by email
    $existing = Http::post(config('odoo.url') . '/jsonrpc', [
        'jsonrpc' => '2.0',
        'method' => 'call',
        'params' => [
            'service' => 'object',
            'method' => 'execute_kw',
            'args' => [
                config('odoo.database'),
                $uid,
                config('odoo.api_key'),
                'res.partner',
                'search',
                [[['email', '=', $email]]],
            ],
        ],
    ])->json('result');

    if (! empty($existing)) {
        return $existing[0];
    }

    // Create new partner
    $created = Http::post(config('odoo.url') . '/jsonrpc', [
        'jsonrpc' => '2.0',
        'method' => 'call',
        'params' => [
            'service' => 'object',
            'method' => 'execute_kw',
            'args' => [
                config('odoo.database'),
                $uid,
                config('odoo.api_key'),
                'res.partner',
                'create',
                [['name' => $name, 'email' => $email]],
            ],
        ],
    ])->json('result');

    return $created;
}

public function syncInvoice(\App\Models\Invoice $invoice): int
{
    $uid = $this->authenticate();

    $partnerId = $this->findOrCreatePartner(
        $invoice->customer->name,
        $invoice->customer->email
    );

    $response = Http::post(config('odoo.url') . '/jsonrpc', [
        'jsonrpc' => '2.0',
        'method' => 'call',
        'params' => [
            'service' => 'object',
            'method' => 'execute_kw',
            'args' => [
                config('odoo.database'),
                $uid,
                config('odoo.api_key'),
                'account.move',
                'create',
                [[
                    'move_type' => 'out_invoice',
                    'partner_id' => $partnerId,
                    'invoice_date' => $invoice->issue_date->format('Y-m-d'),
                    'invoice_line_ids' => $invoice->items->map(fn ($item) => [
                        0, 0, [
                            'name' => $item->description,
                            'quantity' => $item->quantity,
                            'price_unit' => $item->unit_price,
                        ],
                    ])->toArray(),
                ]],
            ],
        ],
    ]);

    $result = $response->json('result');

    if (! $result) {
        throw new \RuntimeException('Odoo invoice sync failed: ' . $response->body());
    }

    return $result; // Odoo's internal invoice ID
}
}