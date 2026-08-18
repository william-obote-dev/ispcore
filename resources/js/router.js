const routes = [];
let notFoundHandler = () => {};

export function route(pattern, handler) {
    const paramNames = [];
    const regexStr = pattern.replace(/:[^/]+/g, (m) => {
        paramNames.push(m.slice(1));
        return '([^/]+)';
    });
    const regex = new RegExp(`^${regexStr}$`);
    routes.push({ regex, paramNames, handler });
}

export function setNotFound(handler) {
    notFoundHandler = handler;
}

/** Navigate to a clean path using the History API and run the matching route. */
export function navigate(path, { replace = false } = {}) {
    if (location.pathname !== path) {
        if (replace) {
            history.replaceState({}, '', path);
        } else {
            history.pushState({}, '', path);
        }
    }
    resolve();
}

export async function resolve() {
    const path = location.pathname || '/';

    for (const r of routes) {
        const match = path.match(r.regex);
        if (match) {
            const params = {};
            r.paramNames.forEach((name, i) => {
                params[name] = decodeURIComponent(match[i + 1]);
            });
            await r.handler(params);
            return;
        }
    }

    await notFoundHandler();
}

function isInternalLink(anchor) {
    if (!anchor) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;
    if (anchor.dataset.external !== undefined) return false;
    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('//')) return false;
    return true;
}

function onDocumentClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = e.target.closest('a');
    if (!isInternalLink(anchor)) return;
    e.preventDefault();
    navigate(anchor.getAttribute('href'));
}

export function start() {
    document.addEventListener('click', onDocumentClick);
    window.addEventListener('popstate', resolve);
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', resolve);
    } else {
        resolve();
    }
}
