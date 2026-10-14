const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'student.json');

let studentData = {
    "name": "Матвій Запорожцев",
    "group": "ІТ-31",
    "message": "Вивчаю Express.js і це чудово!"
};

// запис даних у файл student.json при першому запуску, якщо його немає
if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(studentData, null, 2), 'utf8');
} else {
    // якщо файл є — зчитуємо актуальні дані з нього
    const fileContent = fs.readFileSync(FILE_PATH, 'utf8');
    studentData = JSON.parse(fileContent);
}

// Middleware для обробки JSON та формату URL-encoded (для форм)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// роздача статичних файлів із папки public
app.use(express.static(path.join(__dirname, 'public')));

// головна сторінка
app.get('/', (req, res) => {
    res.send('<h1>Вітаю на головній сторінці Express-сервера!</h1><p>Перейдіть на <a href="/student">/student</a> або скористайтеся <a href="/index.html">формою</a>.</p>');
});

// маршрут /student (HTML-сторінка з даними)
app.get('/student', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="uk">
        <head>
            <meta charset="UTF-8">
            <title>Студент</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container">
                <h1>Інформація про студента</h1>
                <p><strong>Ім'я:</strong> ${studentData.name}</p>
                <p><strong>Група:</strong> ${studentData.group}</p>
                <p><strong>Повідомлення:</strong> ${studentData.message}</p>
                <br>
                <a href="/index.html">Редагувати дані</a> | <a href="/json">Переглянути JSON</a>
            </div>
        </body>
        </html>
    `);
});

// маршрут /json (повертає JSON)
app.get('/json', (req, res) => {
    res.json(studentData);
});

// маршрут /update (змінює дані через запит від форми)
app.post('/update', (req, res) => {
    if (req.body.name) studentData.name = req.body.name;
    if (req.body.group) studentData.group = req.body.group;
    if (req.body.message) studentData.message = req.body.message;

    // зберігаємо оновлені дані у файл student.json
    fs.writeFile(FILE_PATH, JSON.stringify(studentData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error("Помилка збереження файлу:", err);
        }
    });

    // перенаправляємо назад на сторінку студента
    res.redirect('/student');
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});