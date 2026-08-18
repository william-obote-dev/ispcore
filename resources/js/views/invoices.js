import { api } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import { shellHtml, attachShellEvents } from '../shell.js';
import { openModal, showFormError } from '../lib/modal.js';
import { field, loadingHtml, errorHtml } from '../lib/ui.js';
import { statusBadge, dateFmt, dateTimeFmt, money, escapeHtml } from '../lib/format.js';

let pollTimer = null;

export async function renderInvoiceDetail(root, { id }) {
    stopPolling();
    root.innerHTML = shellHtml('customers', loadingHtml());
    attachShellEvents(root);

    let invoice;
    try {
        invoice = await api(`/invoices/${id}`);
    } catch (err) {
        root.querySelector('main').innerHTML = errorHtml(err.message);
        return;
    }

    root.querySelector('main').innerHTML = markup(invoice);
    wire(root, invoice);
    refreshStatus(root, invoice.id, { silent: true });
}

function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
}

function markup(invoice) {
    const items = invoice.items || [];
    const customer = invoice.customer;
    const subscription = invoice.subscription;

    const itemRows = items
        .map(
            (it) => `
        <tr>
            <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(it.description)}</td>
            <td class="px-4 py-3 text-right text-sm text-slate-500">${it.quantity}</td>
            <td class="px-4 py-3 text-right text-sm text-slate-500">${money(it.unit_price)}</td>
            <td class="px-4 py-3 text-right text-sm font-medium text-slate-900">${money(it.line_total)}</td>
        </tr>
    `
        )
        .join('');

    const canPay = invoice.status !== 'paid' && invoice.status !== 'cancelled';

    return `
        <a href="/customers/${customer.id}" class="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">&larr; Back to ${escapeHtml(customer.name)}</a>

        <div class="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6">
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-xl font-semibold text-slate-900">${escapeHtml(invoice.invoice_number)}</h1>
                    <span data-role="status-badge">${statusBadge(invoice.status)}</span>
                </div>
                <dl class="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 text-sm text-slate-500 sm:grid-cols-2">
                    <div><span class="text-slate-400">Customer:</span> ${escapeHtml(customer.name)}</div>
                    ${subscription?.plan ? `<div><span class="text-slate-400">Plan:</span> ${escapeHtml(subscription.plan.name)}</div>` : ''}
                    <div><span class="text-slate-400">Issued:</span> ${dateFmt(invoice.issue_date)}</div>
                    <div><span class="text-slate-400">Due:</span> ${dateFmt(invoice.due_date)}</div>
                </dl>
            </div>
            ${
                canPay
                    ? `
            <div class="flex shrink-0 flex-wrap gap-2">
                <button data-action="pay-mpesa" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    Pay via M-Pesa
                </button>
                <button data-action="pay-card" class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                    Pay with card
                </button>
            </div>`
                    : ''
            }
        </div>

        <div class="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Qty</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Unit price</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Line total</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">${itemRows}</tbody>
            </table>
            <div class="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <div class="ml-auto max-w-xs space-y-1 text-sm">
                    <div class="flex justify-between text-slate-500"><span>Subtotal</span><span>${money(invoice.subtotal)}</span></div>
                    <div class="flex justify-between text-slate-500"><span>VAT (16%)</span><span>${money(invoice.vat_amount)}</span></div>
                    <div class="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900"><span>Total</span><span>${money(invoice.total)}</span></div>
                </div>
            </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Payment status</h2>
                <button data-action="refresh-status" class="text-xs font-medium text-slate-500 hover:text-slate-700">Refresh</button>
            </div>
            <div data-role="payment-status" class="text-sm text-slate-500">Checking…</div>
        </div>
    `;
}

function paymentStatusMarkup(status) {
    const p = status.latest_payment;
    if (!p) {
        return `<p class="text-sm text-slate-400">No payment has been initiated for this invoice yet.</p>`;
    }
    return `
        <dl class="grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
            <div class="flex items-center gap-2"><span class="text-slate-400">Status:</span> ${statusBadge(p.status)}</div>
            ${p.checkout_request_id ? `<div><span class="text-slate-400">Checkout ref:</span> ${escapeHtml(p.checkout_request_id)}</div>` : ''}
            ${p.receipt_number ? `<div><span class="text-slate-400">Receipt:</span> ${escapeHtml(p.receipt_number)}</div>` : ''}
            ${p.result_desc ? `<div class="sm:col-span-2"><span class="text-slate-400">Note:</span> ${escapeHtml(p.result_desc)}</div>` : ''}
            ${p.paid_at ? `<div><span class="text-slate-400">Paid at:</span> ${dateTimeFmt(p.paid_at)}</div>` : ''}
        </dl>
    `;
}

async function refreshStatus(root, invoiceId, { silent = false } = {}) {
    const box = root.querySelector('[data-role="payment-status"]');
    if (!box) return;
    try {
        const status = await api(`/invoices/${invoiceId}/status`);
        box.innerHTML = paymentStatusMarkup(status);
        const badge = root.querySelector('[data-role="status-badge"]');
        if (badge) badge.innerHTML = statusBadge(status.invoice_status);
        return status;
    } catch (err) {
        if (!silent) toast(err.message, 'error');
        box.innerHTML = `<p class="text-sm text-red-600">Could not load payment status.</p>`;
    }
}

function startPolling(root, invoiceId) {
    stopPolling();
    let attempts = 0;
    pollTimer = setInterval(async () => {
        attempts += 1;
        const status = await refreshStatus(root, invoiceId, { silent: true });
        const done = status && status.latest_payment && status.latest_payment.status !== 'pending';
        if (done || attempts >= 15) {
            stopPolling();
            if (done && status.latest_payment.status === 'completed') {
                toast('Payment confirmed', 'success');
            }
        }
    }, 4000);
}

function wire(root, invoice) {
    root.querySelector('[data-action="refresh-status"]')?.addEventListener('click', () => refreshStatus(root, invoice.id));

    root.querySelector('[data-action="pay-mpesa"]')?.addEventListener('click', () => openMpesaModal(root, invoice));
    root.querySelector('[data-action="pay-card"]')?.addEventListener('click', () => openCardModal(root, invoice));
}

function openMpesaModal(root, invoice) {
    const bodyHtml = `
        <p class="mb-4 text-sm text-slate-500">We'll send an STK push of <strong>${money(invoice.total)}</strong> to this number.</p>
        <form data-form="pay-mpesa" class="space-y-4">
            ${field('phone', 'M-Pesa phone number', 'text', true, '2547XXXXXXXX')}
            <div data-role="form-error" class="hidden rounded-lg bg-red-50 p-3 text-sm text-red-700"></div>
            <div class="flex justify-end gap-2 pt-2">
                <button type="button" data-close class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Send STK push</button>
            </div>
        </form>
    `;

    const { close, el } = openModal('Pay via M-Pesa', bodyHtml);
    const form = el.querySelector('[data-form="pay-mpesa"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const data = Object.fromEntries(new FormData(form).entries());
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';

        try {
            await api(`/invoices/${invoice.id}/pay`, { method: 'POST', body: data });
            toast('STK push sent — approve it on the customer\u2019s phone', 'success');
            close();
            startPolling(root, invoice.id);
            refreshStatus(root, invoice.id);
        } catch (err) {
            showFormError(form, err);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send STK push';
        }
    });
}

function openCardModal(root, invoice) {
    const bodyHtml = `
        <p class="mb-4 text-sm text-slate-500">Opens a Paystack checkout for <strong>${money(invoice.total)}</strong> in a new tab.</p>
        <form data-form="pay-card" class="space-y-4">
            ${field('email', 'Customer email', 'email', true)}
            <div data-role="form-error" class="hidden rounded-lg bg-red-50 p-3 text-sm text-red-700"></div>
            <div class="flex justify-end gap-2 pt-2">
                <button type="button" data-close class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Continue to checkout</button>
            </div>
        </form>
    `;

    const { close, el } = openModal('Pay with card (Paystack)', bodyHtml);
    const form = el.querySelector('[data-form="pay-card"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const data = Object.fromEntries(new FormData(form).entries());
        submitBtn.disabled = true;
        submitBtn.textContent = 'Preparing checkout…';

        try {
            const result = await api(`/invoices/${invoice.id}/pay-with-card`, { method: 'POST', body: data });
            toast(`Checkout ready — reference ${result.reference}`, 'success');
            close();
            if (result.authorization_url) {
                window.open(result.authorization_url, '_blank', 'noopener');
            }
            startPolling(root, invoice.id);
            refreshStatus(root, invoice.id);
        } catch (err) {
            showFormError(form, err);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Continue to checkout';
        }
    });
}
