const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

// мідлвейр для обробки жсон та віддачі статичних файлів з папки публік
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// мідлвер для логування запитів
app.use((req, res, next) => {
    console.log(`[LOG] Отримано запит: ${req.method} ${req.url}`);
    next();
});

// функція для читання завдань
function getTasks() {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
}

// функція для збереження завдань
function saveTasks(tasks) {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

// рест апі

// GET /api/tasks - отримати всі завдання
app.get('/api/tasks', (req, res) => {
    const tasks = getTasks();
    res.json(tasks);
});

// GET /api/tasks/:id - отримати завдання за ID
app.get('/api/tasks/:id', (req, res) => {
    const tasks = getTasks();
    const task = tasks.find(t => t.id == req.params.id);
    if (!task) {
        return res.status(404).json({ message: 'Завдання не знайдено' });
    }
    res.json(task);
});

// POST /api/tasks - додати нове завдання
app.post('/api/tasks', (req, res) => {
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Поле title є обов’язковим' });
    }

    const tasks = getTasks();
    const newTask = {
        id: Date.now(),
        title,
        description: description || '',
        status: 'active'
    };

    tasks.push(newTask);
    saveTasks(tasks);
    res.status(201).json(newTask);
});

// PUT /api/tasks/:id - змінити статус або опис завдання
app.put('/api/tasks/:id', (req, res) => {
    const tasks = getTasks();
    const index = tasks.findIndex(t => t.id == req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: 'Завдання не знайдено' });
    }

    const { title, description, status } = req.body;
    if (title !== undefined) tasks[index].title = title;
    if (description !== undefined) tasks[index].description = description;
    if (status !== undefined) tasks[index].status = status;

    saveTasks(tasks);
    res.json(tasks[index]);
});

// DELETE /api/tasks/:id - видалити завдання
app.delete('/api/tasks/:id', (req, res) => {
    let tasks = getTasks();
    const filteredTasks = tasks.filter(t => t.id != req.params.id);

    if (tasks.length === filteredTasks.length) {
        return res.status(404).json({ message: 'Завдання не знайдено' });
    }

    saveTasks(filteredTasks);
    res.json({ message: 'Завдання успішно видалено' });
});

// Глобальний обробник помилок (база мідлвер)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Помилка сервера' });
});

app.listen(PORT, () => {
    console.log(`Сервер REST API запущено на http://localhost:${PORT}`);
});