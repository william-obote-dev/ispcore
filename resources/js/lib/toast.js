let container;

function ensureContainer() {
    if (!container) {
        container = document.createElement('div');
        container.id = 'ispc-toasts';
        document.body.appendChild(container);
    }
    return container;
}

const STYLES = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-slate-800',
};

export function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `ispc-fade-in pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${STYLES[type] || STYLES.info}`;
    el.textContent = message;
    ensureContainer().appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity 200ms ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 200);
    }, 3200);
}
