import { auth, api } from './lib/api.js';
import { navigate } from './router.js';
import { escapeHtml } from './lib/format.js';

const NAV = [
    { key: 'customers', label: 'Customers', path: '/customers' },
    { key: 'plans', label: 'Plans', path: '/plans' },
];

function navLink(item, activeKey) {
    const active = item.key === activeKey;
    return `
        <a href="${item.path}" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
    }">
            ${item.label}
        </a>
    `;
}

export function shellHtml(activeKey, innerHtml) {
    const user = auth.getUser();
    return `
        <div class="flex min-h-screen bg-slate-50">
            <aside class="hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 sm:flex">
                <div class="mb-8 flex items-center gap-2 px-2">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">IC</div>
                    <div>
                        <p class="text-sm font-semibold text-slate-900">ISPCore</p>
                        <p class="text-xs text-slate-400">Operations console</p>
                    </div>
                </div>
                <nav class="flex flex-1 flex-col gap-1">
                    ${NAV.map((n) => navLink(n, activeKey)).join('')}
                </nav>
                <div class="border-t border-slate-200 pt-4">
                    <p class="truncate px-2 text-xs text-slate-400">${escapeHtml(user?.email || '')}</p>
                    <button data-action="logout" class="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100">
                        Log out
                    </button>
                </div>
            </aside>
            <div class="flex flex-1 flex-col">
                <header class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
                    <div class="flex items-center gap-2">
                        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">IC</div>
                        <span class="font-semibold text-slate-900">ISPCore</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <a href="/customers" class="text-sm text-slate-500">Customers</a>
                        <a href="/plans" class="text-sm text-slate-500">Plans</a>
                        <button data-action="logout" class="text-sm text-slate-500">Log out</button>
                    </div>
                </header>
                <main class="ispc-fade-in flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
                    ${innerHtml}
                </main>
            </div>
        </div>
    `;
}

export function attachShellEvents(root) {
    root.querySelectorAll('[data-action="logout"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            try {
                await api('/auth/logout', { method: 'POST' });
            } catch {
                // Ignore network errors on logout — clear the local session regardless.
            }
            auth.clear();
            navigate('/login', { replace: true });
        });
    });
}
