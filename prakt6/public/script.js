const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');

// отримати та відобразити всі завдання
async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Помилка завантаження завдань:', error);
    }
}

// рендеринг списку на сторінці
function renderTasks(tasks) {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const li = document.createElement('li');
        if (task.status === 'done') {
            li.classList.add('done');
        }

        li.innerHTML = `
            <strong>${task.title}</strong>
            <span>${task.description}</span>
            <div class="task-actions">
                <button class="btn-toggle" onclick="toggleTaskStatus(${task.id}, '${task.status}')">
                    ${task.status === 'active' ? 'Виконати' : 'Відновити'}
                </button>
                <button class="btn-delete" onclick="deleteTask(${task.id})">Видалити</button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// додавання нового завдання (POST)
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (!title) return;

    try {
        await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });

        titleInput.value = '';
        descInput.value = '';
        fetchTasks();
    } catch (error) {
        console.error('Помилка створення завдання:', error);
    }
});

// зміна статусу завдання (PUT)
async function toggleTaskStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'done' : 'active';
    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        fetchTasks();
    } catch (error) {
        console.error('Помилка оновлення статусу:', error);
    }
}

// видалення завдання (DELETE)
async function deleteTask(id) {
    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        });
        fetchTasks();
    } catch (error) {
        console.error('Помилка видалення:', error);
    }
}

// початкове завантаження завдань при відкритті сторінки
fetchTasks();