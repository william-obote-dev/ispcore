<?php

return [
    'api_key' => env('JENGA_API_KEY'),
    'merchant_code' => env('JENGA_MERCHANT_CODE'),
    'consumer_secret' => env('JENGA_CONSUMER_SECRET'),
    'base_url' => env('JENGA_BASE_URL', 'https://sandbox.jengahq.io'),
];