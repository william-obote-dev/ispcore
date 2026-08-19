<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $outstandingStatuses = ['sent', 'overdue'];

        $revenueThisMonth = Payment::where('status', 'completed')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        return response()->json([
            'totals' => [
                'customers' => Customer::count(),
                'active_customers' => Customer::where('status', 'active')->count(),
                'active_subscriptions' => Subscription::where('status', 'active')->count(),
                'outstanding_invoices' => Invoice::whereIn('status', $outstandingStatuses)->count(),
                'outstanding_amount' => (float) Invoice::whereIn('status', $outstandingStatuses)->sum('total'),
                'overdue_invoices' => Invoice::where('status', 'overdue')->count(),
                'revenue_this_month' => (float) $revenueThisMonth,
            ],
            'recent_customers' => Customer::latest()->limit(5)->get(),
            'recent_invoices' => Invoice::with('customer')->latest()->limit(5)->get(),
        ]);
    }
}
