import { getSession, store } from './core.js';

const session = getSession();
const email = session?.email || 'user@nexadesk.com';
const ownTickets = store.tickets.filter((ticket) => ticket.email === email);
const counts = {
    'open-tickets': ownTickets.filter((ticket) => ['New', 'Open', 'In Progress', 'Waiting', 'Escalated'].includes(ticket.status)).length,
    'pending-tickets': ownTickets.filter((ticket) => ticket.status === 'Waiting').length,
    resolved: ownTickets.filter((ticket) => ticket.status === 'Resolved').length,
    closed: ownTickets.filter((ticket) => ticket.status === 'Closed').length,
};

document.querySelectorAll('[data-stat]').forEach((element) => {
    const key = element.dataset.stat;
    if (counts[key] !== undefined) element.textContent = counts[key];
});

const welcomeName = document.querySelector('#welcome-name');
if (welcomeName && session?.firstName) welcomeName.textContent = session.firstName;

const globalSearch = document.querySelector('#global-search');
globalSearch?.addEventListener('input', () => {
    const query = globalSearch.value.trim().toLowerCase();
    if (window.location.pathname === '/user/knowledge-base') {
        document.querySelectorAll('[data-article-card]').forEach((card) => {
            card.hidden = !card.textContent.toLowerCase().includes(query);
        });
    }
});

document.addEventListener('click', (event) => {
    const category = event.target.closest('[data-article-category]');
    if (category) {
        document.querySelectorAll('[data-article-card]').forEach((card) => {
            card.hidden = category.dataset.articleCategory !== card.dataset.category;
        });
    }
    const popular = event.target.closest('[data-article-search]');
    if (popular) {
        const input = document.querySelector('#article-search');
        if (input) {
            input.value = popular.dataset.articleSearch;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    const helpful = event.target.closest('[data-helpful]');
    if (helpful) {
        helpful.closest('#article-helpful').innerHTML = '<strong>Thanks for your feedback.</strong>';
    }
    const themeChoice = event.target.closest('[data-theme-choice]');
    if (themeChoice) {
        document.documentElement.dataset.theme = themeChoice.dataset.themeChoice;
        localStorage.setItem('nexadesk-theme', themeChoice.dataset.themeChoice);
        document.querySelectorAll('[data-theme-choice]').forEach((button) => button.classList.toggle('active', button === themeChoice));
    }
    const saveSettings = event.target.closest('[data-action="save-settings"], [data-action="save-admin-settings"]');
    if (saveSettings) {
        const preferences = [...document.querySelectorAll('[data-preference]')].map((item) => [item.dataset.preference, item.checked]);
        localStorage.setItem('nexadesk-preferences', JSON.stringify(Object.fromEntries(preferences)));
        window.Nexa.toast('Settings saved in this browser.');
    }
});

const savedPreferences = JSON.parse(localStorage.getItem('nexadesk-preferences') || '{}');
document.querySelectorAll('[data-preference]').forEach((input) => {
    if (savedPreferences[input.dataset.preference] !== undefined) input.checked = savedPreferences[input.dataset.preference];
});
