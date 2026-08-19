import { api } from '../lib/api.js';
import { navigate } from '../router.js';
import { shellHtml, attachShellEvents } from '../shell.js';
import { loadingHtml, errorHtml, emptyState } from '../lib/ui.js';
import { statusBadge, dateFmt, money, escapeHtml } from '../lib/format.js';

export async function renderDashboard(root) {
    root.innerHTML = shellHtml('dashboard', loadingHtml());
    attachShellEvents(root);

    let summary;
    try {
        summary = await api('/dashboard/summary');
    } catch (err) {
        root.querySelector('main').innerHTML = errorHtml(err.message);
        return;
    }

    root.querySelector('main').innerHTML = markup(summary);
    wire(root);
}

function statCard(label, value, sub) {
    return `
        <div class="rounded-xl border border-slate-200 bg-white p-5">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">${escapeHtml(label)}</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">${value}</p>
            ${sub ? `<p class="mt-1 text-xs text-slate-400">${sub}</p>` : ''}
        </div>
    `;
}

function markup(summary) {
    const t = summary.totals;
    const customers = summary.recent_customers || [];
    const invoices = summary.recent_invoices || [];

    const customerRows = customers
        .map(
            (c) => `
        <tr data-action="open-customer" data-id="${c.id}" class="cursor-pointer hover:bg-slate-50">
            <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">${escapeHtml(c.name)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-500">${escapeHtml(c.email)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm">${statusBadge(c.status)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-400">${dateFmt(c.created_at)}</td>
        </tr>
    `
        )
        .join('');

    const invoiceRows = invoices
        .map(
            (inv) => `
        <tr data-action="open-invoice" data-id="${inv.id}" class="cursor-pointer hover:bg-slate-50">
            <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">${escapeHtml(inv.invoice_number)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-500">${escapeHtml(inv.customer?.name || '—')}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-500">${money(inv.total)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm">${statusBadge(inv.status)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-400">${dateFmt(inv.due_date)}</td>
        </tr>
    `
        )
        .join('');

    return `
        <div class="mb-6">
            <h1 class="text-xl font-semibold text-slate-900">Dashboard</h1>
            <p class="text-sm text-slate-500">An overview of your operations</p>
        </div>

        <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            ${statCard('Customers', t.customers, `${t.active_customers} active`)}
            ${statCard('Active subscriptions', t.active_subscriptions)}
            ${statCard('Outstanding invoices', t.outstanding_invoices, money(t.outstanding_amount))}
            ${statCard('Revenue this month', money(t.revenue_this_month), t.overdue_invoices ? `${t.overdue_invoices} overdue` : 'No overdue invoices')}
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
                <div class="mb-3 flex items-center justify-between">
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent customers</h2>
                    <a href="/customers" class="text-xs font-medium text-slate-500 hover:text-slate-700">View all &rarr;</a>
                </div>
                ${
                    customers.length === 0
                        ? emptyState('No customers yet', 'New customers will show up here.')
                        : `
                <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table class="min-w-full divide-y divide-slate-200">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">${customerRows}</tbody>
                    </table>
                </div>`
                }
            </div>

            <div>
                <div class="mb-3 flex items-center justify-between">
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent invoices</h2>
                    <a href="/invoices" class="text-xs font-medium text-slate-500 hover:text-slate-700">View all &rarr;</a>
                </div>
                ${
                    invoices.length === 0
                        ? emptyState('No invoices yet', 'Generated invoices will show up here.')
                        : `
                <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table class="min-w-full divide-y divide-slate-200">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice #</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Due</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">${invoiceRows}</tbody>
                    </table>
                </div>`
                }
            </div>
        </div>
    `;
}

function wire(root) {
    root.querySelectorAll('[data-action="open-customer"]').forEach((row) => {
        row.addEventListener('click', () => navigate(`/customers/${row.dataset.id}`));
    });
    root.querySelectorAll('[data-action="open-invoice"]').forEach((row) => {
        row.addEventListener('click', () => navigate(`/invoices/${row.dataset.id}`));
    });
}
