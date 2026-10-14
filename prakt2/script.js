function getUkraineData() {
    const ukraineDiv = document.getElementById("ukraine-info");

    fetch("https://restcountries.com/v3.1/name/ukraine")
        .then(response => {
            if (!response.ok) {
                throw new Error("Помилка сервера");
            }
            return response.json();
        })
        .then(data => {
            const country = data[0];
            ukraineDiv.innerHTML = `
                <p><strong>Країна:</strong> ${country.name.common}</p>
                <p><strong>Столиця:</strong> ${country.capital ? country.capital[0] : "Немає"}</p>
                <p><strong>Регіон:</strong> ${country.region}</p>
                <p><strong>Населення:</strong> ${country.population.toLocaleString()} осіб</p>
            `;
        })
        .catch(error => {
            console.error("Помилка fetch:", error);
            ukraineDiv.innerHTML = "Не вдалося завантажити дані про Україну.";
        });
}

function getAllCountries() {
    const listElement = document.getElementById("countries-list");
    listElement.innerHTML = "<li>Завантаження списку...</li>";

    axios.get("https://restcountries.com/v3.1/all")
        .then(response => {
            listElement.innerHTML = "";
            const countries = response.data.slice(0, 15);

            countries.forEach(country => {
                const li = document.createElement("li");
                li.textContent = `${country.name.common} — Столиця: ${country.capital ? country.capital[0] : "відсутня"}`;
                listElement.appendChild(li);
            });
        })
        .catch(error => {
            console.error("Помилка axios:", error);
            listElement.innerHTML = "<li>Помилка при завантаженні списку країн.</li>";
        });
}

getUkraineData();

document.getElementById("load-countries").addEventListener("click", getAllCountries);