import { getSession, setSession, store, saveStore, showModal, toast } from './core.js';

const demoAccounts = [
    { email: 'user@nexadesk.com', password: 'password', role: 'user', name: 'John Davis', firstName: 'John', lastName: 'Davis', department: 'Product' },
    { email: 'admin@gmail.com', password: 'admin123', role: 'admin', name: 'Jordan Lee', firstName: 'Jordan', lastName: 'Lee', department: 'IT' },
];

function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
}

function setLoading(form, loading) {
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = loading;
    button.querySelector('.button-label')?.toggleAttribute('hidden', loading);
    button.querySelector('.button-spinner')?.toggleAttribute('hidden', !loading);
}

function signIn(form, role) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const values = new FormData(form);
        const email = String(values.get('email') || '').trim().toLowerCase();
        const password = String(values.get('password') || '');
        const accounts = JSON.parse(localStorage.getItem('nexadesk-accounts') || '[]');
        const account = [...demoAccounts, ...accounts].find((item) => item.email.toLowerCase() === email && item.password === password && (item.role === role || (role === 'user' && item.role === 'admin')));
        const error = form.querySelector('.form-alert');
        if (!account) {
            showError(error, 'Invalid email or password.');
            return;
        }
        if (error) error.hidden = true;
        setLoading(form, true);
        await new Promise((resolve) => window.setTimeout(resolve, 400));
        setSession({ ...account, active: true });
        const next = new URLSearchParams(window.location.search).get('next');
        const target = account.role === 'admin' ? '/admin/dashboard' : (next?.startsWith('/user/') ? next : '/user/dashboard');
        window.location.assign(target);
    });
}

const loginForm = document.querySelector('#login-form');
if (loginForm) signIn(loginForm, 'user');
const adminForm = document.querySelector('#admin-login-form');
if (adminForm) signIn(adminForm, 'admin');

const registrationForm = document.querySelector('#register-form');
registrationForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(registrationForm);
    const password = String(values.get('password') || '');
    const confirmation = String(values.get('password_confirmation') || '');
    const error = document.querySelector('#register-error');
    if (!registrationForm.reportValidity()) return;
    if (password.length < 8) {
        showError(error, 'Choose a password with at least 8 characters.');
        return;
    }
    if (password !== confirmation) {
        showError(error, 'Your passwords do not match.');
        return;
    }
    const firstName = String(values.get('first_name')).trim();
    const lastName = String(values.get('last_name')).trim();
    const account = {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: String(values.get('email')).trim().toLowerCase(),
        phone: String(values.get('phone') || ''),
        department: String(values.get('department') || 'General'),
        password,
        role: 'user',
        active: true,
    };
    const accounts = JSON.parse(localStorage.getItem('nexadesk-accounts') || '[]');
    if ([...demoAccounts, ...accounts].some((item) => item.email.toLowerCase() === account.email)) {
        showError(error, 'An account with this email already exists.');
        return;
    }
    accounts.push(account);
    localStorage.setItem('nexadesk-accounts', JSON.stringify(accounts));
    setSession(account);
    saveStore();
    showModal('Account created successfully!', `<div class="success-modal-copy"><span class="success-check">✓</span><h3>Welcome to Problinx, ${firstName}!</h3><p>Your account is active. No email verification is needed for this demo.</p></div>`, '<a class="btn btn-secondary" href="/user/dashboard">Go to dashboard</a><a class="btn btn-primary" href="/user/tickets/create">Create your first ticket →</a>');
});

const forgotForm = document.querySelector('#forgot-form');
forgotForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!forgotForm.reportValidity()) return;
    document.querySelector('#reset-result').hidden = false;
    toast('Password reset simulation complete.');
});

const currentSession = getSession();
if (document.querySelector('#login-form') && currentSession?.role === 'user') window.location.replace('/user/dashboard');
if (document.querySelector('#admin-login-form') && currentSession?.role === 'admin') window.location.replace('/admin/dashboard');

const profileEdit = document.querySelector('[data-action="edit-profile"]');
profileEdit?.addEventListener('click', () => {
    const session = getSession() || {};
    showModal('Edit your profile', `<div class="field-wrap"><label for="edit-name">Full name</label><input class="field-input" id="edit-name" value="${session.name || 'John Davis'}"></div><div class="field-wrap" style="margin-top:12px"><label for="edit-phone">Phone number</label><input class="field-input" id="edit-phone" value="${session.phone || '(555) 010-2048'}"></div>`, '<button class="btn btn-secondary" data-action="close-modal">Cancel</button><button class="btn btn-primary" id="save-profile">Save profile</button>');
    document.querySelector('#save-profile')?.addEventListener('click', () => {
        const updated = { ...session, name: document.querySelector('#edit-name').value, phone: document.querySelector('#edit-phone').value };
        setSession(updated);
        const profileName = document.querySelector('#profile-name');
        if (profileName) profileName.textContent = updated.name;
        document.querySelector('#sidebar-name')?.replaceChildren(document.createTextNode(updated.name));
        window.Nexa.closeModal();
        toast('Profile updated in this browser.');
    });
});
