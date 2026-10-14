const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'shopping.json');

// Middleware для парсингу даних з форми та JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Власне middleware для логування запитів
app.use((req, res, next) => {
    console.log(`[LOG] ${new Date().toISOString()} | Метод: ${req.method} | Шлях: ${req.url}`);
    next();
});

// Віддача статичних файлів із папки public
app.use(express.static(path.join(__dirname, 'public')));

// Допоміжні функції для читання/запису JSON-бази
function getItems() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Помилка читання файлу:', error);
        return [];
    }
}

function saveItems(items) {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
    } catch (error) {
        console.error('Помилка запису файлу:', error);
    }
}

// Правила валідації для варіанта 3 (Список покупок)
const validateShoppingItem = [
    body('item')
        .trim()
        .notEmpty().withMessage('Назва товару обов’язкова')
        .isLength({ min: 2, max: 50 }).withMessage('Назва має бути від 2 до 50 символів'),
    
    body('quantity')
        .isInt({ min: 1 }).withMessage('Кількість має бути цілим числом і не менше 1'),
    
    body('category')
        .trim()
        .notEmpty().withMessage('Категорія є обов’язковою'),
    
    body('price')
        .isFloat({ min: 0.01 }).withMessage('Ціна має бути числом і не менше 0.01'),

    // Перевірка результатів валідації
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Повертаємо помилки та введені користувачем дані (щоб форма не стиралась)
            return res.status(400).json({
                success: false,
                errors: errors.array(),
                oldData: req.body
            });
        }
        next();
    }
];

// Маршрут для додавання товару з валідацією
app.post('/api/shopping', validateShoppingItem, (req, res) => {
    const { item, quantity, category, price } = req.body;

    const items = getItems();
    const newItem = {
        id: Date.now(),
        item,
        quantity: parseInt(quantity),
        category,
        price: parseFloat(price)
    };

    items.push(newItem);
    saveItems(items);

    res.status(201).json({
        success: true,
        message: 'Товар успішно додано до списку покупок!',
        data: newItem
    });
});

// Маршрут для отримання всіх покупок
app.get('/api/shopping', (req, res) => {
    const items = getItems();
    res.json(items);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер працює на http://localhost:${PORT}`);
});