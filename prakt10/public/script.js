// Розширений клієнтський код з prakt6: REST API, редагування, фільтрація і Chart.js.
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const titleInput = document.getElementById('title');
const priorityInput = document.getElementById('priority');
const errorBox = document.getElementById('error-box');
const filterStatus = document.getElementById('filter-status');
const filterPriority = document.getElementById('filter-priority');
const searchInput = document.getElementById('search');
let tasks = [];
let editingId = null;
let chart = null;

function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
}
async function api(url, method = 'GET', data = undefined) {
    const response = await fetch(url, {
        method,
        headers: data ? { 'Content-Type': 'application/json' } : {},
        body: data ? JSON.stringify(data) : undefined
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Потрібна авторизація');
    }
    if (!response.ok) {
        throw new Error(result.errors?.map(e => e.msg).join('; ') || result.message || 'Помилка запиту');
    }
    return result;
}

// GET: отримання та відображення завдань власника.
async function fetchTasks() {
    try {
        tasks = await api('/api/tasks');
        renderTasks();
    } catch (error) { showError(error.message); }
}
function renderTasks() {
    taskList.replaceChildren();
    const status = filterStatus.value;
    const priority = filterPriority.value;
    const query = searchInput.value.trim().toLowerCase();
    const filtered = tasks.filter(t =>
        (status === 'all' || (status === 'done' ? t.completed : !t.completed)) &&
        (priority === 'all' || t.priority === priority) &&
        t.title.toLowerCase().includes(query)
    );
    const empty = document.getElementById('empty-list');
    empty.hidden = filtered.length > 0;
    empty.textContent = tasks.length ? 'За фільтром нічого не знайдено' : 'Завдань поки немає';

    for (const task of filtered) {
        const li = document.createElement('li');
        if (task.completed) li.classList.add('done');
        const heading = document.createElement('strong');
        heading.textContent = task.title; // безпечне відображення введеного тексту
        const description = document.createElement('span');
        description.textContent = `Пріоритет: ${task.priority} • ${task.completed ? 'Виконано' : 'Не виконано'}`;
        const actions = document.createElement('div');
        actions.className = 'task-actions';
        const makeButton = (label, css, handler) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = label;
            button.className = css;
            button.addEventListener('click', handler);
            return button;
        };
        actions.append(
            makeButton(task.completed ? 'Відновити' : 'Виконати', 'btn-toggle', () => toggleTaskStatus(task)),
            makeButton('Редагувати', 'btn-edit', () => editTask(task)),
            makeButton('Видалити', 'btn-delete', () => deleteTask(task.id))
        );
        li.append(heading, description, actions);
        taskList.append(li);
    }
    updateChart();
}

// Chart.js — за зразком prakt1, тепер значення беруться з REST API.
function updateChart() {
    const completed = tasks.filter(t => t.completed).length;
    document.getElementById('stat-text').textContent = `${completed} із ${tasks.length} завдань виконано`;
    if (typeof Chart === 'undefined') return;
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('myChart'), {
        type: 'doughnut',
        data: {
            labels: ['Виконано', 'Не виконано'],
            datasets: [{
                data: [completed, tasks.length - completed],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// POST і PUT: одна форма для створення та редагування.
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const data = { title: titleInput.value.trim(), priority: priorityInput.value };
    try {
        if (editingId) await api(`/api/tasks/${editingId}`, 'PUT', data);
        else await api('/api/tasks', 'POST', data);
        cancelEdit();
        await fetchTasks();
    } catch (error) { showError(error.message); }
});
function editTask(task) {
    editingId = task.id;
    titleInput.value = task.title;
    priorityInput.value = task.priority;
    document.getElementById('form-title').textContent = 'Редагувати завдання';
    document.getElementById('save-btn').textContent = 'Зберегти';
    document.getElementById('cancel-btn').hidden = false;
    titleInput.focus();
}
function cancelEdit() {
    editingId = null;
    taskForm.reset();
    document.getElementById('form-title').textContent = 'Додати завдання';
    document.getElementById('save-btn').textContent = 'Додати';
    document.getElementById('cancel-btn').hidden = true;
}
document.getElementById('cancel-btn').addEventListener('click', cancelEdit);
async function toggleTaskStatus(task) {
    try {
        await api(`/api/tasks/${task.id}`, 'PUT', { completed: !task.completed });
        await fetchTasks();
    } catch (error) { showError(error.message); }
}
async function deleteTask(id) {
    if (!confirm('Видалити це завдання?')) return;
    try {
        await api(`/api/tasks/${id}`, 'DELETE');
        if (editingId === id) cancelEdit();
        await fetchTasks();
    } catch (error) { showError(error.message); }
}
for (const field of [filterStatus, filterPriority, searchInput]) {
    field.addEventListener(field === searchInput ? 'input' : 'change', renderTasks);
}
// Ім'я авторизованого користувача (з prakt9).
fetch('/api/current-user')
    .then(res => res.ok ? res.json() : Promise.reject(new Error('Авторизуйся')))
    .then(user => { document.getElementById('user-name').textContent = user.name; })
    .catch(() => { window.location.href = '/login'; });
fetchTasks();
