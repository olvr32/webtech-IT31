const http = require('http');
const fs = require('fs');

// Дані студента для виконання індивідуального завдання
const studentData = {
    "name": "Запорожцев Матвій",
    "group": "ІТ-31",
    "message": "Я вчуся працювати з Node.js..."
};

// Записуємо дані у файл student.json при запуску сервера
fs.writeFile('student.json', JSON.stringify(studentData, null, 2), 'utf8', (err) => {
    if (err) {
        console.error("Помилка запису student.json:", err);
    } else {
        console.log('Файл student.json успішно створено!');
    }
});

// Створюємо HTTP-сервер
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Головна сторінка</h1>');
    } 
    else if (req.url === '/about') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Про нас</h1><p>Це приклад сервера на Node.js</p>');
    } 
    else if (req.url === '/student') {
        // Вивід даних студента у форматі JSON
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(studentData, null, 2));
    } 
    else if (req.url === '/student/html') {
        // Вивід даних студента у вигляді відформатованої HTML-сторінки
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <!DOCTYPE html>
            <html lang="uk">
            <head>
                <meta charset="UTF-8">
                <title>Інформація про студента</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { border-collapse: collapse; width: 300px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>Інформація про студента</h1>
                <table>
                    <tr><th>Поле</th><th>Значення</th></tr>
                    <tr><td>Ім'я</td><td>${studentData.name}</td></tr>
                    <tr><td>Група</td><td>${studentData.group}</td></tr>
                    <tr><td>Повідомлення</td><td>${studentData.message}</td></tr>
                </table>
            </body>
            </html>
        `);
    } 
    else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Сторінку не знайдено</h1>');
    }
});

// Запускаємо сервер на порту 3000
server.listen(3000, () => {
    console.log('Сервер працює на http://localhost:3000');
});