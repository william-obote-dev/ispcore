import { api, auth, ApiError } from '../lib/api.js';
import { navigate } from '../router.js';
import { toast } from '../lib/toast.js';

export async function renderLogin(root) {
    root.innerHTML = `
        <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div class="ispc-fade-in w-full max-w-sm">
                <div class="mb-8 text-center">
                    <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                        IC
                    </div>
                    <h1 class="text-xl font-semibold text-slate-900">ISPCore</h1>
                    <p class="mt-1 text-sm text-slate-500">Sign in to the operations console</p>
                </div>
                <form data-form="login" class="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700" for="f-email">Email</label>
                        <input id="f-email" name="email" type="email" required autofocus
                            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700" for="f-password">Password</label>
                        <input id="f-password" name="password" type="password" required
                            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" />
                    </div>
                    <div data-role="form-error" class="hidden rounded-lg bg-red-50 p-3 text-sm text-red-700"></div>
                    <button type="submit" class="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
                        Sign in
                    </button>
                </form>
            </div>
        </div>
    `;

    const form = root.querySelector('[data-form="login"]');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const errorBox = form.querySelector('[data-role="form-error"]');
        errorBox.classList.add('hidden');

        const data = Object.fromEntries(new FormData(form).entries());
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in…';

        try {
            const result = await api('/auth/login', { method: 'POST', body: data });
            auth.setSession(result.token, result.user);
            toast(`Welcome back, ${result.user.name}`, 'success');
            navigate('/dashboard');
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Unable to sign in.';
            errorBox.textContent = message;
            errorBox.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign in';
        }
    });
}
