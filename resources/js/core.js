const seeded = window.NEXA_SEED || {};
const dataKey = 'nexadesk-state';
let stored = {};

try {
    stored = JSON.parse(localStorage.getItem(dataKey) || '{}');
} catch {
    stored = {};
}

export const store = {
    tickets: [],
    users: [],
    agents: [],
    teams: [],
    articles: [],
    notifications: [],
    cannedResponses: [],
    ...structuredClone(seeded),
    ...stored,
};

export function saveStore() {
    localStorage.setItem(dataKey, JSON.stringify(store));
}

export function getSession() {
    try {
        return JSON.parse(localStorage.getItem('nexadesk-session') || 'null');
    } catch {
        return null;
    }
}

export function setSession(user) {
    localStorage.setItem('nexadesk-session', JSON.stringify(user));
}

export function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
}

export function toast(message, tone = 'success') {
    const region = document.querySelector('#toast-region');
    if (!region) return;
    const item = document.createElement('div');
    item.className = `toast-message toast-${tone}`;
    item.textContent = message;
    region.append(item);
    window.setTimeout(() => item.remove(), 3200);
}

export function showModal(title, content, actions = '') {
    const root = document.querySelector('#modal-root');
    if (!root) return;
    root.innerHTML = `<div class="modal-backdrop"><section class="modal-dialog" role="dialog" aria-modal="true"><header class="modal-header"><h2>${escapeHtml(title)}</h2><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></header><div class="modal-body">${content}</div>${actions ? `<footer class="modal-actions">${actions}</footer>` : ''}</section></div>`;
}

export function closeModal() {
    const root = document.querySelector('#modal-root');
    if (root) root.innerHTML = '';
}

window.Nexa = { store, saveStore, toast, showModal, closeModal, getSession, setSession };

document.documentElement.dataset.theme = localStorage.getItem('nexadesk-theme') || 'light';

document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'landing-menu') {
        const navigation = document.querySelector('.landing-nav');
        const open = navigation?.classList.toggle('menu-open') || false;
        event.target.closest('[data-action]')?.setAttribute('aria-expanded', String(open));
    }
    if (action === 'open-drawer') {
        document.querySelector('#sidebar')?.classList.add('open');
        document.querySelector('.drawer-scrim')?.classList.add('visible');
    }
    if (action === 'close-drawer') {
        document.querySelector('#sidebar')?.classList.remove('open');
        document.querySelector('.drawer-scrim')?.classList.remove('visible');
    }
    if (action === 'close-modal') closeModal();
    if (action === 'toggle-theme') {
        const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('nexadesk-theme', theme);
        toast(`${theme === 'dark' ? 'Dark' : 'Light'} mode enabled`);
    }
    const passwordButton = event.target.closest('[data-toggle-password]');
    if (passwordButton) {
        const input = document.getElementById(passwordButton.dataset.togglePassword);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
            passwordButton.textContent = input.type === 'password' ? 'Show' : 'Hide';
        }
    }
    if (action === 'logout') {
        localStorage.removeItem('nexadesk-session');
        window.location.assign('/');
    }
});

document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector('#global-search')?.focus();
    }
    if (event.key === 'Escape') closeModal();
});

document.addEventListener('keydown', (event) => {
    if (event.target.id !== 'global-search' || event.key !== 'Enter') return;
    const query = event.target.value.trim().toLowerCase();
    if (!query) return;
    const ticket = store.tickets.find((item) => `${item.id} ${item.subject}`.toLowerCase().includes(query));
    const customer = store.users.find((item) => `${item.name} ${item.email}`.toLowerCase().includes(query));
    const article = store.articles.find((item) => item.title.toLowerCase().includes(query));
    if (ticket) window.location.assign(`${document.body.dataset.area === 'admin' ? '/admin' : '/user'}/tickets/${encodeURIComponent(ticket.id)}`);
    else if (customer && document.body.dataset.area === 'admin') window.location.assign(`/admin/customers/${encodeURIComponent(customer.email)}`);
    else if (article) window.location.assign(`/user/knowledge-base/${article.slug}`);
    else toast('No matching tickets, people, or articles', 'error');
});

document.addEventListener('DOMContentLoaded', () => {
    const session = getSession();
    const name = document.querySelector('#sidebar-name');
    if (name && session?.name) name.textContent = session.name;
    const welcome = document.querySelector('#welcome-name');
    if (welcome && session?.firstName) welcome.textContent = session.firstName;
});
