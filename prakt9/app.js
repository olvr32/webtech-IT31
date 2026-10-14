const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const flash = require('connect-flash');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Налаштування middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'super-secret-key-matviy-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // true для HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 години
    }
}));

app.use(flash());

// Допоміжні функції для роботи з JSON-файлом користувачів
function readUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) return [];
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Помилка читання users.json:', error);
        return [];
    }
}

function writeUsers(users) {
    try {
        const dir = path.dirname(USERS_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('Помилка запису users.json:', error);
    }
}

// Middleware захисту маршрутів
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

const isNotAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    res.redirect('/dashboard');
};

// --- МАРШРУТИ ---

// GET / -> Редірект залежно від статусу авторизації
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// GET /register -> форма реєстрації
app.get('/register', isNotAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// POST /register -> валідація, хеш пароля, збереження
app.post('/register', isNotAuthenticated, [
    body('name')
        .trim()
        .isLength({ min: 3, max: 30 }).withMessage('ПІБ має містити від 3 до 30 символів'),
    body('email')
        .isEmail().withMessage('Невірний формат email')
        .custom(async (value) => {
            const users = readUsers();
            if (users.find(u => u.email === value)) {
                throw new Error('Цей email вже зареєстровано');
            }
            return true;
        }),
    body('password')
        .isLength({ min: 6 }).withMessage('Пароль має бути не менше 6 символів'),
    body('passwordConfirm')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Паролі не збігаються')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    
    // Хешування пароля через bcrypt (saltRounds = 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    const users = readUsers();
    const newUser = {
        id: Date.now(),
        name,
        email,
        password: hashedPassword
    };

    users.push(newUser);
    writeUsers(users);

    // Автоматичний вхід після реєстрації (створення сесії)
    req.session.user = { id: newUser.id, name: newUser.name, email: newUser.email };

    res.status(201).json({ redirect: '/dashboard' });
});

// GET /login -> форма входу
app.get('/login', isNotAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// POST /login -> перевірка користувача та порівняння паролів
app.post('/login', isNotAuthenticated, async (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ msg: 'Невірний email або пароль' });
    }

    // Створення сесії
    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.json({ redirect: '/dashboard' });
});

// GET /dashboard -> захищена сторінка
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Допоміжний API-ендпоінт для передачі ПІБ у клієнтський шаблон dashboard
app.get('/api/current-user', isAuthenticated, (req, res) => {
    res.json({ name: req.session.user.name });
});

// GET /logout -> знищення сесії
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Помилка знищення сесії:', err);
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер аутентифікації працює на http://localhost:${PORT}`);
});