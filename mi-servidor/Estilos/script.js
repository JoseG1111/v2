class WeatherService {
    constructor(backendUrl) {
        this.backendUrl = backendUrl;
    }

    async fetchFromDatabase(city) {
        const response = await fetch(`${this.backendUrl}/weather/${city}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    }
}

class WeatherUI {
    constructor() {
        this.cityInput = document.getElementById("cityInput");
        this.searchButton = document.getElementById("searchButton");
        this.errorMessage = document.getElementById("errorMessage");
        this.weatherInfo = document.getElementById("weatherInfo");
        this.weatherIcon = document.getElementById("weatherIcon");
        this.temperature = document.getElementById("temperature");
        this.cityName = document.getElementById("cityName");
        this.humidity = document.getElementById("humidity");
        this.windSpeed = document.getElementById("windSpeed");
    }

    showError() {
        this.errorMessage.style.display = "block";
        this.weatherInfo.style.display = "none";
    }

    showWeather(data) {
        this.cityName.innerText = data.city_name;
        this.temperature.innerText = `${Math.round(data.temperature)}°C`;
        this.humidity.innerText = `${data.humidity}%`;
        this.windSpeed.innerText = `${data.wind_speed} km/h`;

      // Definir el mapeo de descripciones a íconos
const iconMap = {
    clouds: "/VC/clouds.png",
    clear: "/VC/clear.png",
    rain: "/VC/rain.png",
    drizzle: "/VC/drizzle.png",
    mist: "/VC/mist.png",
    snow: "/VC/snow.png",
};

// Normalizar la descripción recibida y convertirla a minúsculas
const desc = (data.description || "").toLowerCase();

// Buscar si alguna de las claves está incluida en la descripción
let iconFile = "/VC/clear.png"; // Valor por defecto
for (const key in iconMap) {
    if (desc.includes(key)) {
        iconFile = iconMap[key];
        break;
    }
}

// Asignar el ícono correspondiente
this.weatherIcon.src = iconFile;
this.weatherInfo.style.display = "block";
this.errorMessage.style.display = "none";

}
}
class WeatherApp {
    constructor(weatherService, weatherUI) {
        this.weatherService = weatherService;
        this.weatherUI = weatherUI;
    }

    async checkWeather(city) {
        try {
            let data = await this.weatherService.fetchFromDatabase(city);
            if (!data) {
                // Si no se encuentra la ciudad en la base de datos, muestra el error.
                this.weatherUI.showError();
            } else {
                this.weatherUI.showWeather(data);
            }
        } catch (error) {
            this.weatherUI.showError();
            console.error("Error:", error.message);
        }
    }

    init() {
        this.weatherUI.searchButton.addEventListener("click", () => {
            this.checkWeather(this.weatherUI.cityInput.value);
        });
    }
}

// Solo se requiere la URL del backend, ya que la aplicación consultará únicamente la base de datos.
const backendUrl = 'http://localhost:3000'; // Ajusta según la URL de tu servidor

const weatherService = new WeatherService(backendUrl);
const weatherUI = new WeatherUI();
const weatherApp = new WeatherApp(weatherService, weatherUI);

weatherApp.init();

//comentario para testear git hub
