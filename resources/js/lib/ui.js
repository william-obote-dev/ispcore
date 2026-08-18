import { escapeHtml } from './format.js';

export function field(name, label, type = 'text', required = false, placeholder = '') {
    return `
        <div>
            <label class="mb-1 block text-sm font-medium text-slate-700" for="f-${name}">
                ${escapeHtml(label)}${required ? ' <span class="text-red-500">*</span>' : ''}
            </label>
            <input
                id="f-${name}"
                name="${name}"
                type="${type}"
                ${required ? 'required' : ''}
                placeholder="${escapeHtml(placeholder)}"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
        </div>
    `;
}

export function textareaField(name, label, required = false) {
    return `
        <div>
            <label class="mb-1 block text-sm font-medium text-slate-700" for="f-${name}">
                ${escapeHtml(label)}${required ? ' <span class="text-red-500">*</span>' : ''}
            </label>
            <textarea
                id="f-${name}"
                name="${name}"
                rows="2"
                ${required ? 'required' : ''}
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            ></textarea>
        </div>
    `;
}

export function selectField(name, label, options, required = false) {
    const opts = options
        .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
        .join('');
    return `
        <div>
            <label class="mb-1 block text-sm font-medium text-slate-700" for="f-${name}">
                ${escapeHtml(label)}${required ? ' <span class="text-red-500">*</span>' : ''}
            </label>
            <select
                id="f-${name}"
                name="${name}"
                ${required ? 'required' : ''}
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
                <option value="" disabled selected>Select…</option>
                ${opts}
            </select>
        </div>
    `;
}

export function emptyState(title, subtitle) {
    return `
        <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p class="text-sm font-medium text-slate-700">${escapeHtml(title)}</p>
            <p class="mt-1 text-sm text-slate-400">${escapeHtml(subtitle)}</p>
        </div>
    `;
}

export function loadingHtml() {
    return `<div class="flex h-64 items-center justify-center text-sm text-slate-400">Loading…</div>`;
}

export function errorHtml(message) {
    return `<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">${escapeHtml(message)}</div>`;
}
