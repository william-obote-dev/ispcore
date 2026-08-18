export function money(amount) {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n);
}

export function dateFmt(d) {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function dateTimeFmt(d) {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const STATUS_STYLES = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    draft: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    paused: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    overdue: 'bg-red-50 text-red-700 ring-red-600/20',
    failed: 'bg-red-50 text-red-700 ring-red-600/20',
    suspended: 'bg-red-50 text-red-700 ring-red-600/20',
    cancelled: 'bg-slate-100 text-slate-500 ring-slate-500/20',
    inactive: 'bg-slate-100 text-slate-500 ring-slate-500/20',
};

export function statusBadge(status) {
    const cls = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 ring-slate-500/20';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}">${label}</span>`;
}

export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
