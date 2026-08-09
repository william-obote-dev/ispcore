<?php

return [
    'consumer_key' => env('KCB_CONSUMER_KEY'),
    'consumer_secret' => env('KCB_CONSUMER_SECRET'),
    'base_url' => env('KCB_BASE_URL', 'https://uat.buni.kcbgroup.com'),
    'company_code' => env('KCB_COMPANY_CODE', 'KE0010001'),
    'debit_account' => env('KCB_DEBIT_ACCOUNT', '37890012'),
];