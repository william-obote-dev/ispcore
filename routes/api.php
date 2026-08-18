<?php

use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MpesaCallbackController;
use App\Http\Controllers\Api\PaystackCallbackController;
use App\Http\Controllers\Api\KcbIpnController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ── PUBLIC: authentication ──
Route::post('/auth/login', [AuthController::class, 'login']);

// ── PUBLIC: external provider webhooks (they can't send a login token) ──
Route::post('/mpesa/callback', [MpesaCallbackController::class, 'handle']);
Route::get('/paystack/callback', [PaystackCallbackController::class, 'handle']);
Route::post('/kcb/ipn', [KcbIpnController::class, 'handle']);

// ── PROTECTED: everything else requires a valid login token ──
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/plans', [PlanController::class, 'index']);

    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);

    Route::post('/customers/{customer}/subscriptions', [SubscriptionController::class, 'store']);
    Route::get('/subscriptions/{subscription}', [SubscriptionController::class, 'show']);

    Route::post('/subscriptions/{subscription}/invoice', [InvoiceController::class, 'generate']);
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::get('/invoices/{invoice}/status', [InvoiceController::class, 'status']);
    Route::post('/invoices/{invoice}/pay', [InvoiceController::class, 'pay']);
    Route::post('/invoices/{invoice}/pay-with-card', [InvoiceController::class, 'payWithCard']);
});