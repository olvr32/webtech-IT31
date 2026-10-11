const fs = require('fs');

// зчитування
fs.readFile('mydata.txt', 'utf8', (err, data) => {
    if (err) {
        console.error("Помилка читання файлу:", err);
        return;
    }

    // додавання свого тексту
    const textToAdd = "\nНепарний варіант - додано студентом Запорожцев Матвій";
    const resultData = data.trim() + textToAdd;

    // збереження у вигляді новостворенного файлу
    fs.writeFile('result.txt', resultData, 'utf8', (err) => {
        if (err) {
            console.error("Помилка запису файлу:", err);
            return;
        }
        console.log('Файл успішно оновлено та збережено у result.txt!');
    });
});