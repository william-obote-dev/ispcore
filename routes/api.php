<?php

use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\InvoiceController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/customers', [CustomerController::class, 'index']);
Route::post('/customers', [CustomerController::class, 'store']);
Route::get('/customers/{customer}', [CustomerController::class, 'show']);

Route::post('/customers/{customer}/subscriptions', [SubscriptionController::class, 'store']);
Route::get('/subscriptions/{subscription}', [SubscriptionController::class, 'show']);

Route::post('/subscriptions/{subscription}/invoice', [InvoiceController::class, 'generate']);
Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);

Route::post('/mpesa/callback', [\App\Http\Controllers\Api\MpesaCallbackController::class, 'handle']);

Route::post('/invoices/{invoice}/pay', [InvoiceController::class, 'pay']);
Route::get('/invoices/{invoice}/status', [InvoiceController::class, 'status']);
Route::post('/invoices/{invoice}/pay-with-card', [InvoiceController::class, 'payWithCard']);

Route::get('/paystack/callback', [\App\Http\Controllers\Api\PaystackCallbackController::class, 'handle']);

Route::post('/kcb/ipn', [\App\Http\Controllers\Api\KcbIpnController::class, 'handle']);
