import { route, setNotFound, start, navigate } from './router.js';
import { auth } from './lib/api.js';
import { renderLogin } from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { renderCustomersList, renderCustomerDetail } from './views/customers.js';
import { renderSubscriptionsList, renderSubscriptionDetail } from './views/subscriptions.js';
import { renderInvoicesList, renderInvoiceDetail } from './views/invoices.js';
import { renderPlans } from './views/plans.js';

const root = document.getElementById('app');

function requireAuth(handler) {
    return async (params) => {
        if (!auth.isAuthenticated()) {
            navigate('/login', { replace: true });
            return;
        }
        await handler(root, params);
    };
}

route('/login', async () => {
    if (auth.isAuthenticated()) {
        navigate('/dashboard', { replace: true });
        return;
    }
    await renderLogin(root);
});

route('/dashboard', requireAuth(renderDashboard));
route('/customers', requireAuth(renderCustomersList));
route('/customers/:id', requireAuth(renderCustomerDetail));
route('/subscriptions', requireAuth(renderSubscriptionsList));
route('/subscriptions/:id', requireAuth(renderSubscriptionDetail));
route('/invoices', requireAuth(renderInvoicesList));
route('/invoices/:id', requireAuth(renderInvoiceDetail));
route('/plans', requireAuth(renderPlans));

route('/', async () => {
    navigate(auth.isAuthenticated() ? '/dashboard' : '/login', { replace: true });
});

setNotFound(async () => {
    navigate(auth.isAuthenticated() ? '/dashboard' : '/login', { replace: true });
});

start();
