const form = document.getElementById('course-form');
const courseList = document.getElementById('course-list');
const nameInput = document.getElementById('name');
const hoursInput = document.getElementById('hours');
const courseIdInput = document.getElementById('course-id');
const submitBtn = document.getElementById('submit-btn');
const searchInput = document.getElementById('search-input');

// Завантаження та відображення всіх курсів
async function fetchCourses(query = '') {
    try {
        const response = await fetch(`/api/courses${query}`);
        const courses = await response.json();
        renderCourses(courses);
    } catch (error) {
        console.error('Помилка завантаження:', error);
    }
}

// Рендеринг списку на сторінці
function renderCourses(courses) {
    courseList.innerHTML = '';
    if (courses.length === 0) {
        courseList.innerHTML = '<p style="text-align:center; color:#777;">Курсів не знайдено</p>';
        return;
    }

    courses.forEach(course => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="course-info">
                <strong>${course.name}</strong>
                <span>Години: ${course.hours}</span>
            </div>
            <div class="course-actions">
                <button class="btn-edit" onclick="prepareEdit(${course.id}, '${course.name}', ${course.hours})">Змінити</button>
                <button class="btn-delete" onclick="deleteCourse(${course.id})">Видалити</button>
            </div>
        `;
        courseList.appendChild(li);
    });
}

// Додавання або оновлення курсу (POST / PUT)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = courseIdInput.value;
    const name = nameInput.value.trim();
    const hours = hoursInput.value.trim();

    if (!name || !hours) return;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/courses/${id}` : '/api/courses';

    try {
        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, hours })
        });

        resetForm();
        fetchCourses();
    } catch (error) {
        console.error('Помилка збереження:', error);
    }
});

// Видалення курсу (DELETE)
async function deleteCourse(id) {
    try {
        await fetch(`/api/courses/${id}`, { method: 'DELETE' });
        fetchCourses();
    } catch (error) {
        console.error('Помилка видалення:', error);
    }
}

// Підготовка форми для редагування
function prepareEdit(id, name, hours) {
    courseIdInput.value = id;
    nameInput.value = name;
    hoursInput.value = hours;
    submitBtn.textContent = 'Оновити курс';
    submitBtn.style.backgroundColor = '#ffc107';
}

// Скидання форми
function resetForm() {
    courseIdInput.value = '';
    nameInput.value = '';
    hoursInput.value = '';
    submitBtn.textContent = 'Додати курс';
    submitBtn.style.backgroundColor = '#007bff';
}

// Фільтрація в реальному часі за пошуком
function filterCourses() {
    const query = searchInput.value.trim();
    if (query) {
        fetchCourses(`?search=${encodeURIComponent(query)}`);
    } else {
        fetchCourses();
    }
}

// Початкове завантаження
fetchCourses();