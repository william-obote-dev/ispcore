<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class HubSpotService
{
    private function client()
    {
        return Http::withToken(config('hubspot.access_token'))
            ->baseUrl(config('hubspot.base_url'));
    }

    public function findOrCreateContact(string $name, string $email, string $phone): string
    {
        $existing = $this->client()->post('/crm/v3/objects/contacts/search', [
            'filterGroups' => [[
                'filters' => [[
                    'propertyName' => 'email',
                    'operator' => 'EQ',
                    'value' => $email,
                ]],
            ]],
        ]);

        $results = $existing->json('results');

        if (! empty($results)) {
            return $results[0]['id'];
        }

        [$firstName, $lastName] = array_pad(explode(' ', $name, 2), 2, '');

        $created = $this->client()->post('/crm/v3/objects/contacts', [
            'properties' => [
                'email' => $email,
                'firstname' => $firstName,
                'lastname' => $lastName,
                'phone' => $phone,
            ],
        ]);

        if (! $created->successful()) {
            throw new \RuntimeException('HubSpot contact creation failed: ' . $created->body());
        }

        return $created->json('id');
    }

    public function createDeal(string $contactId, string $dealName, float $amount, string $stage = 'appointmentscheduled'): string
{
    $response = $this->client()->post('/crm/v3/objects/deals', [
        'properties' => [
            'dealname' => $dealName,
            'amount' => $amount,
            'dealstage' => $stage,
        ],
        'associations' => [[
            'to' => ['id' => $contactId],
            'types' => [[
                'associationCategory' => 'HUBSPOT_DEFINED',
                'associationTypeId' => 3, // Contact to Deal
            ]],
        ]],
    ]);

    if (! $response->successful()) {
        throw new \RuntimeException('HubSpot deal creation failed: ' . $response->body());
    }

    return $response->json('id');
}

}