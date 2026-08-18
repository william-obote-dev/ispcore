import { api } from '../lib/api.js';
import { shellHtml, attachShellEvents } from '../shell.js';
import { emptyState, loadingHtml, errorHtml } from '../lib/ui.js';
import { statusBadge, money, escapeHtml } from '../lib/format.js';

export async function renderPlans(root) {
    root.innerHTML = shellHtml('plans', loadingHtml());
    attachShellEvents(root);

    let plans;
    try {
        plans = await api('/plans');
    } catch (err) {
        root.querySelector('main').innerHTML = errorHtml(err.message);
        return;
    }

    root.querySelector('main').innerHTML = markup(plans);
}

function markup(plans) {
    if (plans.length === 0) {
        return `
            <h1 class="mb-6 text-xl font-semibold text-slate-900">Plans</h1>
            ${emptyState('No plans configured', 'Add plans in the database to offer them to customers.')}
        `;
    }

    const cards = plans
        .map(
            (p) => `
        <div class="rounded-xl border border-slate-200 bg-white p-6">
            <div class="mb-2 flex items-center justify-between">
                <h3 class="text-base font-semibold text-slate-900">${escapeHtml(p.name)}</h3>
                ${statusBadge(p.is_active ? 'active' : 'inactive')}
            </div>
            <p class="text-2xl font-semibold text-slate-900">${money(p.price)}
                <span class="text-sm font-normal text-slate-400">/ ${escapeHtml(p.billing_cycle)}</span>
            </p>
            <p class="mt-2 text-sm text-slate-500">${p.speed_mbps} Mbps</p>
        </div>
    `
        )
        .join('');

    return `
        <div class="mb-6">
            <h1 class="text-xl font-semibold text-slate-900">Plans</h1>
            <p class="text-sm text-slate-500">${plans.length} plans configured</p>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">${cards}</div>
    `;
}
