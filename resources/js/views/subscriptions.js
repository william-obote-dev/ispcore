import { api } from '../lib/api.js';
import { navigate } from '../router.js';
import { toast } from '../lib/toast.js';
import { shellHtml, attachShellEvents } from '../shell.js';
import { emptyState, loadingHtml, errorHtml } from '../lib/ui.js';
import { statusBadge, dateFmt, money, escapeHtml } from '../lib/format.js';

export async function renderSubscriptionDetail(root, { id }) {
    root.innerHTML = shellHtml('customers', loadingHtml());
    attachShellEvents(root);

    let subscription;
    try {
        subscription = await api(`/subscriptions/${id}`);
    } catch (err) {
        root.querySelector('main').innerHTML = errorHtml(err.message);
        return;
    }

    root.querySelector('main').innerHTML = markup(subscription);
    wire(root, subscription);
}

function markup(sub) {
    const plan = sub.plan;
    const customer = sub.customer;
    const invoices = sub.invoices || [];

    const invoiceRows = invoices
        .map(
            (inv) => `
        <tr data-action="open-invoice" data-id="${inv.id}" class="cursor-pointer hover:bg-slate-50">
            <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">${escapeHtml(inv.invoice_number)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-500">${money(inv.total)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm">${statusBadge(inv.status)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-400">${dateFmt(inv.issue_date)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-400">${dateFmt(inv.due_date)}</td>
        </tr>
    `
        )
        .join('');

    return `
        <a href="/customers/${customer.id}" class="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">&larr; Back to ${escapeHtml(customer.name)}</a>

        <div class="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6">
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-xl font-semibold text-slate-900">${escapeHtml(plan?.name || 'Subscription')}</h1>
                    ${statusBadge(sub.status)}
                </div>
                <dl class="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 text-sm text-slate-500 sm:grid-cols-2">
                    <div><span class="text-slate-400">Customer:</span> ${escapeHtml(customer.name)}</div>
                    <div><span class="text-slate-400">Speed:</span> ${plan ? `${plan.speed_mbps} Mbps` : '—'}</div>
                    <div><span class="text-slate-400">Price:</span> ${plan ? `${money(plan.price)} / ${plan.billing_cycle}` : '—'}</div>
                    <div><span class="text-slate-400">Started:</span> ${dateFmt(sub.start_date)}</div>
                    ${sub.end_date ? `<div><span class="text-slate-400">Ends:</span> ${dateFmt(sub.end_date)}</div>` : ''}
                </dl>
            </div>
            <button data-action="generate-invoice" class="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Generate invoice
            </button>
        </div>

        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Invoices</h2>
        ${
            invoices.length === 0
                ? emptyState('No invoices yet', 'Generate an invoice for this subscription\u2019s current billing period.')
                : `
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice #</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Issued</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Due</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">${invoiceRows}</tbody>
            </table>
        </div>`
        }
    `;
}

function wire(root, sub) {
    root.querySelectorAll('[data-action="open-invoice"]').forEach((row) => {
        row.addEventListener('click', () => {
            navigate(`/invoices/${row.dataset.id}`);
        });
    });

    const genBtn = root.querySelector('[data-action="generate-invoice"]');
    if (genBtn) {
        genBtn.addEventListener('click', async () => {
            genBtn.disabled = true;
            genBtn.textContent = 'Generating…';
            try {
                const invoice = await api(`/subscriptions/${sub.id}/invoice`, { method: 'POST' });
                toast(`Invoice ${invoice.invoice_number} generated`, 'success');
                navigate(`/invoices/${invoice.id}`);
            } catch (err) {
                toast(err.message, 'error');
                genBtn.disabled = false;
                genBtn.textContent = 'Generate invoice';
            }
        });
    }
}
