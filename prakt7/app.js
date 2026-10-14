const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'courses.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Допоміжні функції читання/запису
function getCourses() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error("Помилка читання бази даних:", error);
        return [];
    }
}

function saveCourses(courses) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(courses, null, 2), 'utf8');
    } catch (error) {
        console.error("Помилка запису бази даних:", error);
    }
}

// --- REST API МАРШРУТИ ---

// GET: Отримати всі курси або відфільтрувати за назвою / кількістю годин
app.get('/api/courses', (req, res) => {
    let courses = getCourses();
    const { search, hours } = req.query;

    if (search) {
        courses = courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (hours) {
        courses = courses.filter(c => c.hours == hours);
    }

    res.json(courses);
});

// GET: Отримати курс за ID
app.get('/api/courses/:id', (req, res) => {
    const courses = getCourses();
    const course = courses.find(c => c.id == req.params.id);
    if (!course) {
        return res.status(404).json({ message: 'Курс не знайдено' });
    }
    res.json(course);
});

// POST: Додати новий курс
app.post('/api/courses', (req, res) => {
    const { name, hours } = req.body;
    if (!name || !hours) {
        return res.status(400).json({ message: 'Поля name та hours є обов’язковими' });
    }

    const courses = getCourses();
    const newCourse = {
        id: Date.now(),
        name,
        hours: Number(hours)
    };

    courses.push(newCourse);
    saveCourses(courses);
    res.status(201).json(newCourse);
});

// PUT: Оновити існуючий курс
app.put('/api/courses/:id', (req, res) => {
    const courses = getCourses();
    const index = courses.findIndex(c => c.id == req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: 'Курс не знайдено' });
    }

    const { name, hours } = req.body;
    if (name !== undefined) courses[index].name = name;
    if (hours !== undefined) courses[index].hours = Number(hours);

    saveCourses(courses);
    res.json(courses[index]);
});

// DELETE: Видалити курс
app.delete('/api/courses/:id', (req, res) => {
    let courses = getCourses();
    const filteredCourses = courses.filter(c => c.id != req.params.id);

    if (courses.length === filteredCourses.length) {
        return res.status(404).json({ message: 'Курс не знайдено' });
    }

    saveCourses(filteredCourses);
    res.json({ message: 'Курс успішно видалено' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер працює на http://localhost:${PORT}`);
});