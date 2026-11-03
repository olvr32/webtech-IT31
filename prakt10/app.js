// Практична робота №10. Todo App — розширення prakt9 (авторизація) + prakt6 (REST API).
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const flash = require('connect-flash');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const TASKS_FILE = path.join(__dirname, 'data', 'tasks.json');
const PRIORITIES = ['низька', 'середня', 'висока'];

// Middleware (як у prakt9).
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'prakt10-local-session-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    console.log(`[LOG] ${req.method} ${req.url}`);
    next();
});

// JSON-файли як просте локальне сховище (з prakt6/prakt9).
function readData(file) {
    if (!fs.existsSync(file)) return [];
    const content = fs.readFileSync(file, 'utf8');
    const items = JSON.parse(content || '[]');
    if (!Array.isArray(items)) throw new Error('Невірна структура JSON');
    return items;
}
function saveData(file, data) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Перевірка входу користувача: різна реакція для сторінок та REST API.
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}
function isApiAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.status(401).json({ message: 'Потрібна авторизація' });
}
function isNotAuthenticated(req, res, next) {
    if (!req.session.user) return next();
    res.redirect('/dashboard');
}
function checkValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
}

// Реєстрація та вхід (з prakt9).
app.get('/', (req, res) => {
    res.redirect(req.session.user ? '/dashboard' : '/login');
});
app.get('/register', isNotAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.get('/login', isNotAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

const registerValidation = [
    body('name').trim().isLength({ min: 3, max: 30 }).withMessage('ПІБ має містити від 3 до 30 символів'),
    body('email').trim().isEmail().withMessage('Невірний формат email')
        .customSanitizer(value => String(value).toLowerCase()),
    body('password').isLength({ min: 6, max: 72 }).withMessage('Пароль: від 6 до 72 символів'),
    body('passwordConfirm').custom((value, { req }) => value === req.body.password)
        .withMessage('Паролі не збігаються')
];

async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;
        const users = readData(USERS_FILE);
        if (users.some(u => u.email === email)) {
            return res.status(400).json({ errors: [{ msg: 'Цей email вже зареєстровано' }] });
        }
        const newUser = {
            id: randomUUID(), name, email,
            password: await bcrypt.hash(password, 12)
        };
        users.push(newUser);
        saveData(USERS_FILE, users);
        req.session.regenerate((err) => {
            if (err) return next(err);
            req.session.user = { id: newUser.id, name, email };
            req.session.save((err) => {
                if (err) return next(err);
                res.status(201).json({ redirect: '/dashboard' });
            });
        });
    } catch (error) { next(error); }
}
app.post(['/register', '/api/register'], registerValidation, checkValidation, register);

async function login(req, res, next) {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = req.body.password;
        const user = readData(USERS_FILE).find(u => u.email === email);
        if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ msg: 'Невірний email або пароль' });
        }
        req.session.regenerate((err) => {
            if (err) return next(err);
            req.session.user = { id: user.id, name: user.name, email: user.email };
            req.session.save((err) => {
                if (err) return next(err);
                res.json({ redirect: '/dashboard' });
            });
        });
    } catch (error) { next(error); }
}
app.post(['/login', '/api/login'], login);

// Залишаємо знайомий маршрут /dashboard та API користувача.
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});
app.get('/api/current-user', isApiAuthenticated, (req, res) => {
    res.json(req.session.user);
});
app.get('/api/me', isApiAuthenticated, (req, res) => res.json(req.session.user));
app.get(['/logout', '/api/logout'], (req, res, next) => {
    req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// REST API завдань (основа — prakt6), доступне лише авторизованому користувачу.
app.use('/api/tasks', isApiAuthenticated);
const taskValidation = [
    body('title').trim().isLength({ min: 1, max: 100 })
        .withMessage('Назва завдання: від 1 до 100 символів'),
    body('priority').optional().isIn(PRIORITIES).withMessage('Невідомий пріоритет'),
    checkValidation
];
const updateValidation = [
    body('title').optional().trim().isLength({ min: 1, max: 100 })
        .withMessage('Назва завдання: від 1 до 100 символів'),
    body('priority').optional().isIn(PRIORITIES).withMessage('Невідомий пріоритет'),
    body('completed').optional().isBoolean({ strict: true }).withMessage('Статус має бути true або false'),
    checkValidation
];

app.get('/api/tasks', (req, res) => {
    const tasks = readData(TASKS_FILE);
    res.json(tasks.filter(t => t.userId === req.session.user.id));
});
app.post('/api/tasks', taskValidation, (req, res) => {
    const tasks = readData(TASKS_FILE);
    const task = {
        id: randomUUID(),
        userId: req.session.user.id,
        title: req.body.title,
        completed: false,
        priority: req.body.priority || 'середня',
        createdAt: new Date().toISOString()
    };
    tasks.push(task);
    saveData(TASKS_FILE, tasks);
    res.status(201).json(task);
});
app.put('/api/tasks/:id', updateValidation, (req, res) => {
    const tasks = readData(TASKS_FILE);
    const task = tasks.find(t => t.id === req.params.id && t.userId === req.session.user.id);
    if (!task) return res.status(404).json({ message: 'Завдання не знайдено' });
    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.completed !== undefined) task.completed = req.body.completed;
    saveData(TASKS_FILE, tasks);
    res.json(task);
});
app.delete('/api/tasks/:id', (req, res) => {
    const tasks = readData(TASKS_FILE);
    const filtered = tasks.filter(t => !(t.id === req.params.id && t.userId === req.session.user.id));
    if (filtered.length === tasks.length) return res.status(404).json({ message: 'Завдання не знайдено' });
    saveData(TASKS_FILE, filtered);
    res.json({ message: 'Завдання успішно видалено' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
});
app.listen(PORT, () => console.log(`Todo App запущено: http://localhost:${PORT}`));
