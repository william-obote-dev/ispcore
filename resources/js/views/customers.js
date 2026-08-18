import { api } from '../lib/api.js';
import { navigate } from '../router.js';
import { toast } from '../lib/toast.js';
import { shellHtml, attachShellEvents } from '../shell.js';
import { openModal, showFormError } from '../lib/modal.js';
import { field, textareaField, selectField, emptyState, loadingHtml, errorHtml } from '../lib/ui.js';
import { statusBadge, dateFmt, money, escapeHtml } from '../lib/format.js';

// ── List ──────────────────────────────────────────────────────────────────

export async function renderCustomersList(root) {
    root.innerHTML = shellHtml('customers', loadingHtml());
    attachShellEvents(root);

    let customers;
    try {
        customers = await api('/customers');
    } catch (err) {
        root.querySelector('main').innerHTML = errorHtml(err.message);
        return;
    }

    root.querySelector('main').innerHTML = customersMarkup(customers);

    root.querySelector('[data-action="new-customer"]').addEventListener('click', () => {
        openCreateCustomerModal(() => renderCustomersList(root));
    });

    root.querySelectorAll('[data-action="open-customer"]').forEach((row) => {
        row.addEventListener('click', () => {
            navigate(`/customers/${row.dataset.id}`);
        });
    });

    const search = root.querySelector('[data-role="search"]');
    if (search) {
        search.addEventListener('input', () => {
            const q = search.value.trim().toLowerCase();
            root.querySelectorAll('[data-row]').forEach((row) => {
                row.classList.toggle('hidden', Boolean(q) && !row.dataset.search.includes(q));
            });
        });
    }
}

function customersMarkup(customers) {
    const rows = customers
        .map(
            (c) => `
        <tr data-row data-action="open-customer" data-id="${c.id}"
            data-search="${escapeHtml((c.name + ' ' + c.email + ' ' + c.phone).toLowerCase())}"
            class="cursor-pointer hover:bg-slate-50">
            <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">${escapeHtml(c.name)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-500">${escapeHtml(c.email)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-500">${escapeHtml(c.phone)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm">${statusBadge(c.status)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-400">${dateFmt(c.created_at)}</td>
        </tr>
    `
        )
        .join('');

    return `
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 class="text-xl font-semibold text-slate-900">Customers</h1>
                <p class="text-sm text-slate-500">${customers.length} total</p>
            </div>
            <div class="flex items-center gap-2">
                <input data-role="search" type="search" placeholder="Search customers…"
                    class="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" />
                <button data-action="new-customer" class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                    + New customer
                </button>
            </div>
        </div>
        ${
            customers.length === 0
                ? emptyState('No customers yet', 'Add your first customer to get started.')
                : `
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">${rows}</tbody>
            </table>
        </div>`
        }
    `;
}

function openCreateCustomerModal(onCreated) {
    const bodyHtml = `
        <form data-form="create-customer" class="space-y-4">
            ${field('name', 'Full name', 'text', true)}
            ${field('email', 'Email', 'email', true)}
            ${field('phone', 'Phone', 'text', true, '2547XXXXXXXX')}
            ${field('kra_pin', 'KRA PIN', 'text', false)}
            ${textareaField('address', 'Address', false)}
            <div data-role="form-error" class="hidden rounded-lg bg-red-50 p-3 text-sm text-red-700"></div>
            <div class="flex justify-end gap-2 pt-2">
                <button type="button" data-close class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Create customer</button>
            </div>
        </form>
    `;

    const { close, el } = openModal('New customer', bodyHtml);
    const form = el.querySelector('[data-form="create-customer"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const data = Object.fromEntries(new FormData(form).entries());
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating…';

        try {
            await api('/customers', { method: 'POST', body: data });
            toast('Customer created', 'success');
            close();
            onCreated?.();
        } catch (err) {
            showFormError(form, err);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create customer';
        }
    });
}

// ── Detail ────────────────────────────────────────────────────────────────

export async function renderCustomerDetail(root, { id }) {
    root.innerHTML = shellHtml('customers', loadingHtml());
    attachShellEvents(root);

    let customer;
    try {
        customer = await api(`/customers/${id}`);
    } catch (err) {
        root.querySelector('main').innerHTML = errorHtml(err.message);
        return;
    }

    root.querySelector('main').innerHTML = customerDetailMarkup(customer);
    wireCustomerDetail(root, customer);
}

function customerDetailMarkup(customer) {
    const subs = customer.subscriptions || [];
    const invoices = customer.invoices || [];

    const subsRows = subs
        .map(
            (s) => `
        <tr data-action="open-sub" data-id="${s.id}" class="cursor-pointer hover:bg-slate-50">
            <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">${escapeHtml(s.plan?.name || '—')}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-500">${s.plan ? `${s.plan.speed_mbps} Mbps` : '—'}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-500">${s.plan ? money(s.plan.price) : '—'}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm">${statusBadge(s.status)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-400">${dateFmt(s.start_date)}</td>
        </tr>
    `
        )
        .join('');

    const invoiceRows = invoices
        .map(
            (inv) => `
        <tr data-action="open-invoice" data-id="${inv.id}" class="cursor-pointer hover:bg-slate-50">
            <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">${escapeHtml(inv.invoice_number)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-500">${money(inv.total)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm">${statusBadge(inv.status)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-400">${dateFmt(inv.due_date)}</td>
        </tr>
    `
        )
        .join('');

    return `
        <a href="/customers" class="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">&larr; Back to customers</a>

        <div class="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6">
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-xl font-semibold text-slate-900">${escapeHtml(customer.name)}</h1>
                    ${statusBadge(customer.status)}
                </div>
                <dl class="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 text-sm text-slate-500 sm:grid-cols-2">
                    <div><span class="text-slate-400">Email:</span> ${escapeHtml(customer.email)}</div>
                    <div><span class="text-slate-400">Phone:</span> ${escapeHtml(customer.phone)}</div>
                    <div><span class="text-slate-400">KRA PIN:</span> ${escapeHtml(customer.kra_pin || '—')}</div>
                    <div><span class="text-slate-400">Customer since:</span> ${dateFmt(customer.created_at)}</div>
                    ${customer.address ? `<div class="sm:col-span-2"><span class="text-slate-400">Address:</span> ${escapeHtml(customer.address)}</div>` : ''}
                </dl>
            </div>
            <button data-action="new-subscription" class="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                + New subscription
            </button>
        </div>

        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Subscriptions</h2>
        ${
            subs.length === 0
                ? emptyState('No subscriptions', 'Subscribe this customer to a plan to start billing them.')
                : `
        <div class="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Speed</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Price</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Started</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">${subsRows}</tbody>
            </table>
        </div>`
        }

        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Invoices</h2>
        ${
            invoices.length === 0
                ? emptyState('No invoices', 'Generate an invoice from one of this customer\u2019s subscriptions.')
                : `
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice #</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Due</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">${invoiceRows}</tbody>
            </table>
        </div>`
        }
    `;
}

function wireCustomerDetail(root, customer) {
    root.querySelectorAll('[data-action="open-sub"]').forEach((row) => {
        row.addEventListener('click', () => {
            navigate(`/subscriptions/${row.dataset.id}`);
        });
    });
    root.querySelectorAll('[data-action="open-invoice"]').forEach((row) => {
        row.addEventListener('click', () => {
            navigate(`/invoices/${row.dataset.id}`);
        });
    });

    const newSubBtn = root.querySelector('[data-action="new-subscription"]');
    if (newSubBtn) {
        newSubBtn.addEventListener('click', () => openCreateSubscriptionModal(customer));
    }
}

async function openCreateSubscriptionModal(customer) {
    let plans;
    try {
        plans = await api('/plans');
    } catch (err) {
        toast(err.message, 'error');
        return;
    }

    if (plans.length === 0) {
        toast('No plans available yet. Create a plan first.', 'error');
        return;
    }

    const bodyHtml = `
        <form data-form="create-subscription" class="space-y-4">
            ${selectField(
                'plan_id',
                'Plan',
                plans.map((p) => ({
                    value: p.id,
                    label: `${p.name} — ${p.speed_mbps} Mbps — ${money(p.price)}/${p.billing_cycle}`,
                })),
                true
            )}
            ${field('start_date', 'Start date', 'date', false)}
            <div data-role="form-error" class="hidden rounded-lg bg-red-50 p-3 text-sm text-red-700"></div>
            <div class="flex justify-end gap-2 pt-2">
                <button type="button" data-close class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Subscribe</button>
            </div>
        </form>
    `;

    const { close, el } = openModal(`Subscribe ${customer.name}`, bodyHtml);
    const form = el.querySelector('[data-form="create-subscription"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const data = Object.fromEntries(new FormData(form).entries());
        if (!data.start_date) delete data.start_date;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Subscribing…';

        try {
            const subscription = await api(`/customers/${customer.id}/subscriptions`, { method: 'POST', body: data });
            toast('Subscription created', 'success');
            close();
            navigate(`/subscriptions/${subscription.id}`);
        } catch (err) {
            showFormError(form, err);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Subscribe';
        }
    });
}
