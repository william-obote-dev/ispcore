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

    public function getAccountBalance(string $accountNumber): array
{
    $response = Http::withToken($this->getAccessToken())
        ->get(config('kcb.base_url') . '/account/balance/1.0.0', [
            'accountNumber' => $accountNumber,
        ]);

    if (! $response->successful()) {
        throw new \RuntimeException('KCB balance check failed: ' . $response->body());
    }

    return $response->json();
}

public function getAccountStatement(string $accountNumber, string $startDate, string $endDate): array
{
    $response = Http::withToken($this->getAccessToken())
        ->get(config('kcb.base_url') . '/account/statement/1.0.0', [
            'accountNumber' => $accountNumber,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);

    if (! $response->successful()) {
        throw new \RuntimeException('KCB statement fetch failed: ' . $response->body());
    }

    return $response->json();
}

public function transferFunds(array $params): array
{
    $response = Http::withToken($this->getAccessToken())
        ->post(config('kcb.base_url') . '/fundstransfer/1.0.0/api/v1/transfer', [
            'companyCode' => config('kcb.company_code'),
            'transactionType' => $params['transactionType'] ?? 'IF',
            'debitAccountNumber' => config('kcb.debit_account'),
            'creditAccountNumber' => $params['creditAccountNumber'],
            'debitAmount' => $params['amount'],
            'paymentDetails' => $params['paymentDetails'],
            'transactionReference' => $this->generateReference(),
            'currency' => 'KES',
            'beneficiaryDetails' => $params['beneficiaryDetails'],
            'beneficiaryBankCode' => $params['beneficiaryBankCode'] ?? '01',
        ]);

    return $response->json();
}

private function generateReference(): string
{
    // Max 12 chars per spec
    return strtoupper(substr(uniqid('FT'), 0, 12));
}

}