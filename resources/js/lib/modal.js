/**
 * Opens a centered modal dialog. Returns { close, el } so callers can wire
 * up their own form submit handlers against el.
 */
export function openModal(title, bodyHtml) {
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4';
    backdrop.innerHTML = `
        <div class="ispc-fade-in w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-slate-900">${title}</h2>
                <button type="button" data-close class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">✕</button>
            </div>
            <div>${bodyHtml}</div>
        </div>
    `;
    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close();
    });
    backdrop.querySelector('[data-close]').addEventListener('click', close);
    document.addEventListener(
        'keydown',
        function onKey(e) {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', onKey);
            }
        },
        { once: true }
    );

    return { close, el: backdrop };
}

/** Shows validation / API errors inside a form's [data-role="form-error"] box. */
export function showFormError(form, err) {
    const box = form.querySelector('[data-role="form-error"]');
    if (!box) return;
    let message = err.message || 'Something went wrong.';
    if (err.errors) {
        message = Object.values(err.errors).flat().join(' ');
    }
    box.textContent = message;
    box.classList.remove('hidden');
}
