const form = document.getElementById('shopping-form');
const shoppingList = document.getElementById('shopping-list');
const errorContainer = document.getElementById('error-container');

// Функція завантаження списку покупок
async function fetchItems() {
    try {
        const response = await fetch('/api/shopping');
        const items = await response.json();
        renderItems(items);
    } catch (error) {
        console.error('Помилка завантаження даних:', error);
    }
}

// Рендеринг списку
function renderItems(items) {
    shoppingList.innerHTML = '';
    if (items.length === 0) {
        shoppingList.innerHTML = '<p style="text-align:center; color:#777;">Список покупок порожній</p>';
        return;
    }

    items.forEach(el => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${el.item}</strong> (${el.category})<br>
                <span>Кількість: ${el.quantity} шт. | Ціна: ${el.price} грн</span>
            </div>
        `;
        shoppingList.appendChild(li);
    });
}

// Обробка надсилання форми через AJAX (щоб бачити помилки валідації без перезавантаження)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorContainer.style.display = 'none';
    errorContainer.innerHTML = '';

    const formData = {
        item: document.getElementById('item').value,
        quantity: document.getElementById('quantity').value,
        category: document.getElementById('category').value,
        price: document.getElementById('price').value
    };

    try {
        const response = await fetch('/api/shopping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            // Якщо є помилки валідації від express-validator
            if (result.errors) {
                let html = '<strong>Помилки валідації:</strong><ul>';
                result.errors.forEach(err => {
                    html += `<li>${err.msg}</li>`;
                });
                html += '</ul>';
                errorContainer.innerHTML = html;
                errorContainer.style.display = 'block';
            }
            return;
        }

        // Успіх — очищуємо форму та оновлюємо список
        form.reset();
        fetchItems();
    } catch (error) {
        console.error('Помилка відправки форми:', error);
    }
});

// Початкове завантаження
fetchItems();