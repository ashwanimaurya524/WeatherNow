// Weather App
// This project uses Open-Meteo because it does not require an API key.

// Getting HTML elements
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const locationBtn = document.getElementById("locationBtn");

const message = document.getElementById("message");
const weatherBox = document.getElementById("weatherBox");
const forecastSection = document.getElementById("forecastSection");
const welcome = document.getElementById("welcome");

// Weather code and its matching icon
const weatherData = {
    0: ["Clear Sky", "☀️"],
    1: ["Mainly Clear", "🌤️"],
    2: ["Partly Cloudy", "⛅"],
    3: ["Cloudy", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Fog", "🌫️"],
    51: ["Light Drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy Drizzle", "🌧️"],
    61: ["Light Rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy Rain", "🌧️"],
    71: ["Light Snow", "🌨️"],
    73: ["Snow", "🌨️"],
    75: ["Heavy Snow", "❄️"],
    80: ["Rain Showers", "🌦️"],
    81: ["Rain Showers", "🌧️"],
    82: ["Heavy Rain Showers", "⛈️"],
    85: ["Snow Showers", "🌨️"],
    86: ["Heavy Snow Showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm", "⛈️"],
    99: ["Thunderstorm", "⛈️"]
};

// Show message on screen
function showMessage(text, error = false) {
    message.textContent = text;
    message.className = error ? "error" : "";
}

// Get city latitude and longitude
async function findCity(city) {
    const url =
        "https://geocoding-api.open-meteo.com/v1/search" +
        `?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Please check the city name.");
    }

    return data.results[0];
}

// Get weather from Open-Meteo
async function getWeather(latitude, longitude) {
    const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,visibility" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
        "&timezone=auto" +
        "&forecast_days=7";

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to get weather data.");
    }

    return await response.json();
}

// Get description and icon from weather code
function getWeatherInfo(code) {
    return weatherData[code] || ["Unknown", "🌤️"];
}

// Display weather information
function displayWeather(place, data) {
    const current = data.current;
    const info = getWeatherInfo(current.weather_code);

    document.getElementById("cityName").textContent =
        place.name + (place.country ? ", " + place.country : "");

    const today = new Date(current.time);

    document.getElementById("date").textContent =
        today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    document.getElementById("weatherIcon").textContent = info[1];
    document.getElementById("temperature").textContent =
        Math.round(current.temperature_2m);

    document.getElementById("weatherDescription").textContent = info[0];

    document.getElementById("feelsLike").textContent =
        Math.round(current.apparent_temperature);

    document.getElementById("humidity").textContent =
        current.relative_humidity_2m + "%";

    document.getElementById("wind").textContent =
        Math.round(current.wind_speed_10m) + " km/h";

    document.getElementById("pressure").textContent =
        Math.round(current.surface_pressure) + " hPa";

    document.getElementById("visibility").textContent =
        (current.visibility / 1000).toFixed(1) + " km";

    displayForecast(data.daily);

    weatherBox.classList.remove("hidden");
    forecastSection.classList.remove("hidden");
    welcome.classList.add("hidden");
}

// Display 7 day forecast
function displayForecast(daily) {
    const forecast = document.getElementById("forecast");

    forecast.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {

        const info = getWeatherInfo(daily.weather_code[i]);

        const date = new Date(daily.time[i] + "T12:00:00");

        let dayName;

        if (i === 0) {
            dayName = "Today";
        } else {
            dayName = date.toLocaleDateString("en-IN", {
                weekday: "short"
            });
        }

        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <div class="day">${dayName}</div>
            <div class="icon">${info[1]}</div>
            <div>
                <span class="max">${Math.round(daily.temperature_2m_max[i])}°</span>
                <span class="min">${Math.round(daily.temperature_2m_min[i])}°</span>
            </div>
        `;

        forecast.appendChild(card);
    }
}

// Search button
searchForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (city === "") {
        showMessage("Please enter a city name.", true);
        return;
    }

    try {
        showMessage("Searching for weather...");

        const place = await findCity(city);
        const weather = await getWeather(place.latitude, place.longitude);

        displayWeather(place, weather);

        showMessage("Weather updated successfully.");
    } catch (error) {
        showMessage(error.message, true);
    }
});

// Current location button
locationBtn.addEventListener("click", function() {

    if (!navigator.geolocation) {
        showMessage("Your browser does not support location.", true);
        return;
    }

    showMessage("Getting your location...");

    navigator.geolocation.getCurrentPosition(
        async function(position) {

            try {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                const weather = await getWeather(latitude, longitude);

                // We don't need a city name for the weather API.
                // Browser gives coordinates, so we show "My Location".
                const place = {
                    name: "My Location",
                    country: "",
                    latitude: latitude,
                    longitude: longitude
                };

                displayWeather(place, weather);
                showMessage("Weather updated for your location.");

            } catch (error) {
                showMessage("Could not load weather.", true);
            }
        },
        function() {
            showMessage(
                "Location permission was denied or unavailable.",
                true
            );
        }
    );
});
