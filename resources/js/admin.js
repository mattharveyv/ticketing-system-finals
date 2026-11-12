import { store, saveStore, escapeHtml, toast, showModal, closeModal } from './core.js';

function refreshAdminTickets() {
    const search = document.querySelector('#admin-ticket-search')?.value.toLowerCase() || '';
    const status = document.querySelector('#admin-status-filter')?.value || '';
    const priority = document.querySelector('#admin-priority-filter')?.value || '';
    const category = document.querySelector('#admin-category-filter')?.value || '';
    const agent = document.querySelector('#admin-agent-filter')?.value || '';
    let visible = 0;
    document.querySelectorAll('[data-admin-ticket]').forEach((row) => {
        const matches = row.dataset.search.includes(search)
            && (!status || row.dataset.status === status)
            && (!priority || row.dataset.priority === priority)
            && (!category || row.dataset.category === category)
            && (!agent || row.dataset.agent === agent);
        row.hidden = !matches;
        if (matches) visible += 1;
    });
    const count = document.querySelector('#ticket-result-count');
    if (count) count.textContent = `${visible} tickets`;
}

['admin-ticket-search', 'admin-status-filter', 'admin-priority-filter', 'admin-category-filter', 'admin-agent-filter'].forEach((id) => {
    document.getElementById(id)?.addEventListener(id.includes('search') ? 'input' : 'change', refreshAdminTickets);
});

document.querySelector('#select-all-tickets')?.addEventListener('change', (event) => {
    document.querySelectorAll('.ticket-row-check').forEach((checkbox) => { checkbox.checked = event.target.checked; });
});
document.querySelectorAll('.ticket-row-check').forEach((checkbox) => checkbox.addEventListener('change', () => {
    const count = document.querySelectorAll('.ticket-row-check:checked').length;
    const label = document.querySelector('#selected-ticket-count');
    if (label) label.textContent = count ? `${count} selected` : 'No tickets selected';
}));

document.querySelector('[data-action="bulk-status"]')?.addEventListener('click', () => {
    const selected = [...document.querySelectorAll('.ticket-row-check:checked')].map((checkbox) => checkbox.value);
    const status = document.querySelector('#bulk-status').value;
    if (!selected.length || !status) return toast('Select tickets and a status first.', 'error');
    store.tickets.forEach((ticket) => { if (selected.includes(ticket.id)) ticket.status = status; });
    saveStore();
    toast(`${selected.length} ticket${selected.length === 1 ? '' : 's'} updated.`);
    window.location.reload();
});

document.querySelector('#admin-article-search')?.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll('[data-article-row]').forEach((row) => { row.hidden = !row.dataset.search.includes(query); });
});
document.querySelector('#customer-search')?.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll('[data-customer-row]').forEach((row) => { row.hidden = !row.dataset.search.includes(query); });
});
document.querySelector('#customer-department')?.addEventListener('change', (event) => {
    document.querySelectorAll('[data-customer-row]').forEach((row) => { row.hidden = Boolean(event.target.value && row.dataset.department !== event.target.value); });
});
document.querySelector('#audit-search')?.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll('[data-audit-row]').forEach((row) => { row.hidden = !row.dataset.search.includes(query); });
});

let draggedTicket = null;
function refreshKanbanCounts() {
    document.querySelectorAll('[data-kanban-column]').forEach((column) => {
        const count = column.querySelector('.kanban-column-head span');
        if (count) count.textContent = column.querySelectorAll('[data-kanban-ticket]').length;
    });
}

const kanbanBoard = document.querySelector('#kanban-board');
if (kanbanBoard) {
    kanbanBoard.querySelectorAll('[data-kanban-ticket]').forEach((card) => {
        const ticket = store.tickets.find((item) => item.id === card.dataset.kanbanTicket);
        const destination = ticket && kanbanBoard.querySelector(`[data-drop-status="${CSS.escape(ticket.status)}"]`);
        if (destination) destination.append(card);
        else if (ticket?.status === 'Closed') card.remove();
    });
    refreshKanbanCounts();
}

document.addEventListener('dragstart', (event) => {
    const card = event.target.closest('[data-kanban-ticket]');
    if (!card) return;
    draggedTicket = card.dataset.kanbanTicket;
    event.dataTransfer?.setData('text/plain', draggedTicket);
    card.classList.add('dragging');
});
document.addEventListener('dragend', (event) => event.target.closest('[data-kanban-ticket]')?.classList.remove('dragging'));
document.querySelectorAll('[data-drop-status]').forEach((zone) => {
    zone.addEventListener('dragover', (event) => event.preventDefault());
    zone.addEventListener('drop', (event) => {
        event.preventDefault();
        const id = event.dataTransfer?.getData('text/plain') || draggedTicket;
        const ticket = store.tickets.find((item) => item.id === id);
        if (!ticket) return;
        ticket.status = zone.dataset.dropStatus;
        zone.append(document.querySelector(`[data-kanban-ticket="${CSS.escape(id)}"]`));
        saveStore();
        refreshKanbanCounts();
        toast(`${ticket.id} moved to ${ticket.status}.`);
    });
});

const adminShell = document.querySelector('#app-shell[data-area="admin"]');
if (adminShell) {
    const ticketId = decodeURIComponent(adminShell.dataset.ticketId || '');
    const ticket = store.tickets.find((item) => item.id === ticketId);
    if (ticket) {
        const status = document.querySelector('#detail-status-select');
        const priority = document.querySelector('#detail-priority-select');
        const agent = document.querySelector('#detail-agent-select');
        if (status) status.value = ticket.status;
        if (priority) priority.value = ticket.priority;
        if (agent) agent.value = ticket.agent;
        [status, priority, agent].forEach((control) => control?.addEventListener('change', () => {
            ticket.status = status.value;
            ticket.priority = priority.value;
            ticket.agent = agent.value;
            saveStore();
            toast('Ticket updated in this browser.');
        }));
    }
}

document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'export-tickets' || action === 'export-report' || action === 'export-audit') {
        const csv = ['Ticket,Subject,Category,Priority,Status,Agent', ...store.tickets.map((ticket) => [ticket.id, ticket.subject, ticket.category, ticket.priority, ticket.status, ticket.agent].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\r\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        link.download = 'problinx-tickets.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    }
    if (action === 'print') window.print();
    if (action === 'resolve-ticket' || action === 'close-ticket') {
        const id = decodeURIComponent(document.querySelector('#app-shell')?.dataset.ticketId || '');
        const ticket = store.tickets.find((item) => item.id === id);
        if (ticket) {
            ticket.status = action === 'resolve-ticket' ? 'Resolved' : 'Closed';
            saveStore();
            toast(`Ticket ${ticket.id} ${ticket.status.toLowerCase()}.`);
            window.setTimeout(() => window.location.reload(), 250);
        }
    }
    if (action === 'escalate-ticket') {
        const id = decodeURIComponent(document.querySelector('#app-shell')?.dataset.ticketId || '');
        const ticket = store.tickets.find((item) => item.id === id);
        if (ticket) {
            ticket.status = 'Escalated';
            saveStore();
            toast('Ticket escalated to the next support level.');
            window.setTimeout(() => window.location.reload(), 250);
        }
    }
    if (action === 'internal-note') {
        showModal('Add internal note', '<textarea class="field-input textarea" id="internal-note" placeholder="Visible to support staff only"></textarea>', '<button class="btn btn-secondary" data-action="close-modal">Cancel</button><button class="btn btn-primary" id="save-internal-note">Add note</button>');
        document.querySelector('#save-internal-note')?.addEventListener('click', () => {
            const note = document.querySelector('#internal-note').value.trim();
            if (note) {
                const list = document.querySelector('#internal-notes');
                list?.insertAdjacentHTML('afterbegin', `<div class="note-item"><strong>Jordan Lee <small>Just now</small></strong><p>${escapeHtml(note)}</p></div>`);
                toast('Internal note added.');
            }
            closeModal();
        });
    }
    if (action === 'new-article' || action === 'edit-article' || action === 'new-response' || action === 'edit-response' || action === 'add-agent' || action === 'add-team' || action === 'edit-team' || action === 'edit-customer' || action === 'archive-article') {
        const title = action.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
        showModal(title, `<div class="field-wrap"><label for="manage-title">Name or title</label><input class="field-input" id="manage-title" value="${escapeHtml(event.target.closest('[data-title]')?.dataset.title || event.target.closest('[data-team]')?.dataset.team || '')}"></div><div class="field-wrap" style="margin-top:12px"><label for="manage-description">Details</label><textarea class="field-input textarea" id="manage-description" placeholder="Add a short description"></textarea></div>`, '<button class="btn btn-secondary" data-action="close-modal">Cancel</button><button class="btn btn-primary" id="save-admin-record">Save</button>');
        document.querySelector('#save-admin-record')?.addEventListener('click', () => {
            const titleInput = document.querySelector('#manage-title');
            const collection = action.includes('article') ? store.articles : action.includes('response') ? store.cannedResponses : action.includes('team') ? store.teams : store.agents;
            if (action.startsWith('new-')) collection.unshift({ title: titleInput.value, name: titleInput.value, body: document.querySelector('#manage-description').value, category: 'General', summary: document.querySelector('#manage-description').value, slug: `local-${Date.now()}`, views: 0, status: 'Draft' });
            saveStore();
            closeModal();
            toast('Saved in this browser demo.');
        });
    }
});

document.querySelectorAll('[data-report-range]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-report-range]').forEach((item) => item.classList.toggle('active', item === button));
    const rangeLabel = document.querySelector('.report-filter-bar .record-count');
    if (rangeLabel) rangeLabel.textContent = `${button.dataset.reportRange} · Sep 2026`;
}));
