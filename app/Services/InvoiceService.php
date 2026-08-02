<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    private const VAT_RATE = 0.16; // Kenya standard VAT rate

    public function generateForSubscription(Subscription $subscription): Invoice
    {
        $subscription->loadMissing('plan', 'customer');

        $subtotal = $subscription->plan->price;
        $vatAmount = round($subtotal * self::VAT_RATE, 2);
        $total = $subtotal + $vatAmount;

        return DB::transaction(function () use ($subscription, $subtotal, $vatAmount, $total) {
            $invoice = Invoice::create([
                'invoice_number' => $this->nextInvoiceNumber(),
                'customer_id' => $subscription->customer_id,
                'subscription_id' => $subscription->id,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $total,
                'issue_date' => now(),
                'due_date' => now()->addDays(14),
                'status' => 'sent',
            ]);

            $invoice->items()->create([
                'description' => $subscription->plan->name . ' subscription',
                'quantity' => 1,
                'unit_price' => $subtotal,
                'line_total' => $subtotal,
            ]);

            return $invoice;
        });
    }

    private function nextInvoiceNumber(): string
    {
        $year = now()->format('Y');

        $lastInvoice = Invoice::where('invoice_number', 'like', "INV-{$year}-%")
            ->orderByDesc('id')
            ->first();

        $nextSequence = $lastInvoice
            ? ((int) substr($lastInvoice->invoice_number, -4)) + 1
            : 1;

        return sprintf('INV-%s-%04d', $year, $nextSequence);
    }
}