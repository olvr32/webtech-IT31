// Посилання на API для отримання 5 питань з категорії "Комп'ютерні науки"
const apiUrl = "https://opentdb.com/api.php?amount=5&category=18";

const resultDiv = document.getElementById("result");

// 1. Отримання даних через fetch
document.getElementById("btnFetch").addEventListener("click", async () => {
  resultDiv.innerHTML = "<p>Завантаження питань через Fetch...</p>";
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Помилка мережі: ${response.status}`);
    }
    const data = await response.json();
    displayQuestions(data.results, "Fetch");
  } catch (error) {
    console.error("Помилка fetch:", error);
    resultDiv.innerHTML = `<p style="color: #e74c3c;">Не вдалося завантажити дані: ${error.message}</p>`;
  }
});

// 2. Отримання даних через axios
document.getElementById("btnAxios").addEventListener("click", async () => {
  resultDiv.innerHTML = "<p>Завантаження питань через Axios...</p>";
  try {
    const response = await axios.get(apiUrl);
    displayQuestions(response.data.results, "Axios");
  } catch (error) {
    console.error("Помилка axios:", error);
    resultDiv.innerHTML = `<p style="color: #e74c3c;">Не вдалося завантажити дані: ${error.message}</p>`;
  }
});

// Функція для відображення питань та відповідей
function displayQuestions(questions, method) {
  let html = `<h2>Запитання отримані через ${method}</h2>`;

  questions.forEach((q, index) => {
    // Декодування HTML-сутностей (&quot;, &#039; тощо)
    const questionText = decodeHTML(q.question);
    const correctAnswer = decodeHTML(q.correct_answer);

    // Об'єднуємо правильні та неправильні відповіді й перемішуємо їх
    const answers = [...q.incorrect_answers.map(decodeHTML), correctAnswer];
    answers.sort(() => Math.random() - 0.5);

    html += `
      <div class="question-card">
        <div class="question-title">${index + 1}. ${questionText}</div>
        <ul class="answers-list">
          ${answers.map(ans => `
            <li class="${ans === correctAnswer ? 'correct' : ''}">
              ${ans}${ans === correctAnswer ? '✓ (Правильна)' : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  });

  resultDiv.innerHTML = html;
}

// Допоміжна функція для декодування спеціальних символів у текстах API
function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}