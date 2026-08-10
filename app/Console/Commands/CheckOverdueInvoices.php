<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Services\HubSpotService;
use App\Services\NetworkService;
use App\Services\SmsService;
use Illuminate\Console\Command;

class CheckOverdueInvoices extends Command
{
    protected $signature = 'ispcore:check-overdue';
    protected $description = 'Check for overdue invoices and take action: SMS reminder, network throttle, CRM deal';

    public function handle(
        SmsService $sms,
        NetworkService $network,
        HubSpotService $hubspot
    ): void {
        $overdue = Invoice::where('status', 'sent')
            ->where('due_date', '<', now())
            ->with('customer', 'subscription')
            ->get();

        $this->info("Found {$overdue->count()} overdue invoice(s).");

        foreach ($overdue as $invoice) {
            $daysOverdue = $invoice->due_date->diffInDays(now());

            if ($daysOverdue >= 7 && $invoice->subscription) {
                $network->suspendSession($invoice->subscription);
                $this->line("  {$invoice->invoice_number}: suspended (7+ days overdue)");
            } elseif ($daysOverdue >= 2 && $invoice->subscription) {
                $network->throttleSession($invoice->subscription);
                $this->line("  {$invoice->invoice_number}: throttled (2+ days overdue)");
            }

            $sms->send(
                $invoice->customer->phone,
                "Reminder: Invoice {$invoice->invoice_number} for KES {$invoice->total} is overdue. Please pay to avoid service interruption."
            );

            $contactId = $hubspot->findOrCreateContact(
                $invoice->customer->name,
                $invoice->customer->email,
                $invoice->customer->phone
            );

            $hubspot->createDeal(
                $contactId,
                "Overdue: {$invoice->invoice_number}",
                (float) $invoice->total
            );

            $invoice->update(['status' => 'overdue']);
        }
    }
}