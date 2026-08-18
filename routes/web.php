<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Client-side (JS) routes — /customers, /invoices/5, etc. — all render the same
// app shell; the SPA router then takes over based on the URL path. Excludes
// /api/* so the JSON API routes in routes/api.php are never shadowed.
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '^(?!api\/).*$');
