/*==================================================
  WEATHER HUB CONFIGURATION
==================================================*/

let selectedLocation = 0;
let viewMode = localStorage.getItem('viewMode') || 'cards';

/*==================================================
  HOME LOCATION CONSTANTS
==================================================*/

const HOME_LAT = 37.317389;
const HOME_LON = -96.898306;
const HOME_ZOOM = 10;

/*==================================================
  SAVED LOCATIONS
==================================================*/

const LOCATIONS = [
    { label: '🏠 Home', lat: HOME_LAT, lon: HOME_LON },
    { label: '🌆 Wichita', lat: 37.6872, lon: -97.3301 },
    { label: '🚗 Ponca City', lat: 36.7069, lon: -97.0856 }
];

/*==================================================
  WEATHER ICONS & FORMATTERS
==================================================*/

function weatherIcon(code) {
    if (code === 0) return '☀️';
    if (code === 1) return '🌤';
    if (code === 2) return '⛅';
    if (code === 3) return '☁️';
    if (code >= 61 && code <= 82) return '🌧';
    if (code >= 95) return '⛈';
    return '🌤';
}

function weatherDescription(code) {

    const map = {
        0: "☀ Clear Sky",
        1: "🌤 Mostly Clear",
        2: "⛅ Partly Cloudy",
        3: "☁ Overcast",
        45: "🌫 Fog",
        61: "🌧 Rain",
        63: "🌧 Moderate Rain",
        65: "🌧 Heavy Rain",
        95: "⛈ Thunderstorm"
    };

    return map[code] || "Unknown";
}

function formatHour(timeString) {

    return new Date(timeString).toLocaleTimeString(
        [],
        {
            hour: 'numeric',
            hour12: true
        }
    );
}

function formatDay(dateString, index) {

    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";

    return new Date(dateString).toLocaleDateString(
        [],
        { weekday: 'long' }
    );
}

/*==================================================
  API FUNCTIONS
==================================================*/

async function fetchWeather(lat, lon) {

    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Weather API error');
    }

    return await response.json();
}

/*==================================================
  DASHBOARD RENDERING
==================================================*/

async function loadWeather() {

    const dash = document.getElementById('dashboard');

    dash.innerHTML = '';

    document.getElementById('status').textContent =
        'Loading weather...';

    try {

        for (const loc of LOCATIONS) {

            const data =
                await fetchWeather(loc.lat, loc.lon);

            const current =
                data.current;

            if (viewMode === 'compact') {

                dash.innerHTML += `
                    <div class="compact"
                         onclick="openForecast(${LOCATIONS.indexOf(loc)})">

                        <div>${loc.label}</div>

                        <div>
                            ${weatherIcon(current.weather_code)}
                            <b>${Math.round(current.temperature_2m)}°F</b>
                        </div>

                    </div>
                `;

            } else {

                dash.innerHTML += `
                    <div class="card"
                         onclick="openForecast(${LOCATIONS.indexOf(loc)})">

                        <div>${loc.label}</div>

                        <div class="temp">
                            ${Math.round(current.temperature_2m)}°F
                        </div>

                        <div>
                            ${weatherDescription(current.weather_code)}
                        </div>

                        <div>
                            Feels Like ${Math.round(current.apparent_temperature)}°F
                        </div>

                        <div>
                            Humidity ${current.relative_humidity_2m}%
                        </div>

                        <div>
                            Wind ${Math.round(current.wind_speed_10m)} mph
                        </div>

                    </div>
                `;
            }
        }

        document.getElementById('status').textContent = '';

        document.getElementById('lastUpdated').textContent =
            '🕒 Last Updated: ' +
            new Date().toLocaleTimeString(
                [],
                {
                    hour: 'numeric',
                    minute: '2-digit'
                }
            );

    } catch (err) {

        console.error(err);

        document.getElementById('status').textContent =
            'Unable to load weather data.';
    }
}

/*==================================================
  NAVIGATION
==================================================*/

function hideAllViews() {

    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('forecastView').style.display = 'none';
    document.getElementById('radarView').style.display = 'none';
}

function setActiveNav(id) {

    document
        .querySelectorAll('.bottom-nav button')
        .forEach(btn => btn.classList.remove('active'));

    document
        .getElementById(id)
        ?.classList.add('active');

}

function showDashboard() {

    hideAllViews();

    document.getElementById(
        'dashboardToolbar'
    ).style.display = 'flex';

    document.getElementById(
        'dashboardView'
    ).style.display = 'block';

    setActiveNav('navDashboard');

}

function showForecast() {

    hideAllViews();

    document.getElementById(
        'dashboardToolbar'
    ).style.display = 'none';

    document.getElementById(
        'forecastView'
    ).style.display = 'block';

    setActiveNav('navForecast');

}

/*==================================================
  FORECAST VIEW
==================================================*/

async function openForecast(index) {

    selectedLocation = index;

    const loc = LOCATIONS[index];

    showForecast();

    document.getElementById('forecastTitle').textContent =
        `${loc.label} Forecast`;

    const data =
        await fetchWeather(loc.lat, loc.lon);

    const current =
        data.current;

    document.getElementById('currentConditions').innerHTML = `
        <div class="card">

            <div class="temp">
                ${Math.round(current.temperature_2m)}°F
            </div>

            <div>
                ${weatherDescription(current.weather_code)}
            </div>

            <div>
                Feels Like ${Math.round(current.apparent_temperature)}°F
            </div>

            <div>
                Humidity ${current.relative_humidity_2m}%
            </div>

            <div>
                Wind ${Math.round(current.wind_speed_10m)} mph
            </div>

        </div>
    `;

    /* Hourly Forecast */

    let hourlyHtml = '<div class="hourly-scroll">';

    const now = new Date();

    const currentHourIndex =
        data.hourly.time.findIndex(time => {

            const forecastTime =
                new Date(time);

            return (
                forecastTime.getHours() === now.getHours() &&
                forecastTime.getDate() === now.getDate()
            );
        });

    for (let offset = 0; offset < 24; offset++) {

        const i = currentHourIndex + offset;

        if (i >= data.hourly.time.length) break;

        hourlyHtml += `
            <div class="hour-card">

                <div>
                    ${offset === 0 ? 'Now' : formatHour(data.hourly.time[i])}
                </div>

                <div class="weather-icon">
                    ${weatherIcon(data.hourly.weather_code[i])}
                </div>

                <div class="temp">
                    ${Math.round(data.hourly.temperature_2m[i])}°
                </div>

            </div>
        `;
    }

    hourlyHtml += '</div>';

    document.getElementById('hourlyForecast').innerHTML =
        hourlyHtml;

    /* Daily Forecast */

    let dailyHtml = '<div class="daily-scroll">';

    for (let i = 0; i < data.daily.time.length; i++) {

        dailyHtml += `
            <div class="day-card">

                <div>
                    ${formatDay(data.daily.time[i], i)}
                </div>

                <div class="weather-icon">
                    ${weatherIcon(data.daily.weather_code[i])}
                </div>

                <div>
                    H: ${Math.round(data.daily.temperature_2m_max[i])}°
                </div>

                <div>
                    L: ${Math.round(data.daily.temperature_2m_min[i])}°
                </div>

            </div>
        `;
    }

    dailyHtml += '</div>';

    document.getElementById('dailyForecast').innerHTML =
        dailyHtml;
}

/*==================================================
  RADAR VIEW
==================================================*/

let radarMap;

let radarFrames = [];
let leafletLayers = {};

let currentFrameIndex = 0;

let animationInterval = null;

function showRadar() {

    hideAllViews();

    document.getElementById(
        'dashboardToolbar'
    ).style.display = 'none';

    document.getElementById(
        'radarView'
    ).style.display = 'block';

    setActiveNav('navRadar');

    initializeRadar();

}

async function initializeRadar() {

    if (radarMap) return;

    radarMap = L.map('radarMap').setView(
        [HOME_LAT, HOME_LON],
        HOME_ZOOM
    );

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution: '© OpenStreetMap contributors'
        }
    ).addTo(radarMap);

    try {

        const response = await fetch(
            'https://api.rainviewer.com/public/weather-maps.json'
        );

        const data = await response.json();

        const host = data.host;

        radarFrames = data.radar.past;

        radarFrames.forEach(frame => {

            const tileUrl =
                `${host}${frame.path}/512/{z}/{x}/{y}/1/1_1.png`;

            leafletLayers[frame.path] =
                L.tileLayer(tileUrl, {
                    opacity: 0,
                    tileSize: 512,
                    zoomOffset: -1,
                    maxZoom: 7,
                    attribution:
                        'Weather data © RainViewer'
                });

            leafletLayers[frame.path]
                .addTo(radarMap);

        });

        showRadarFrame(
            radarFrames.length - 1
        );

    } catch (err) {

        console.error(err);

        document.getElementById(
            'radarTimestamp'
        ).textContent =
            'Unable to load radar.';
    }

    L.marker([HOME_LAT, HOME_LON])
        .addTo(radarMap)
        .bindPopup('🏠 New Salem');

    setTimeout(
        () => radarMap.invalidateSize(),
        100
    );
}

function showRadarFrame(index) {

    const previousPath =
        radarFrames[currentFrameIndex]?.path;

    if (previousPath) {

        leafletLayers[previousPath]
            ?.setOpacity(0);

    }

    currentFrameIndex = index;

    const currentPath =
        radarFrames[currentFrameIndex]?.path;

    if (currentPath) {

        const opacity =
            document.getElementById(
                'opacitySlider'
            ).value / 100;

        leafletLayers[currentPath]
            ?.setOpacity(opacity);

        const timestamp =
            new Date(
                radarFrames[currentFrameIndex].time * 1000
            );

        document.getElementById(
            'radarTimestamp'
        ).textContent =
            timestamp.toLocaleTimeString(
                [],
                {
                    hour: 'numeric',
                    minute: '2-digit'
                }
            );
    }
}

function playRadar() {

    if (animationInterval) return;

    animationInterval = setInterval(() => {

        let next =
            currentFrameIndex + 1;

        if (next >= radarFrames.length) {

            next = 0;

        }

        showRadarFrame(next);

    }, 800);
}

function stopRadar() {

    clearInterval(animationInterval);

    animationInterval = null;
}
/*==================================================
  EVENT LISTENERS
==================================================*/

document.getElementById('cardBtn').onclick = () => {

    viewMode = 'cards';

    localStorage.setItem('viewMode', viewMode);

    loadWeather();
};

document.getElementById('compactBtn').onclick = () => {

    viewMode = 'compact';

    localStorage.setItem('viewMode', viewMode);

    loadWeather();
};

document.getElementById('navDashboard')
    ?.addEventListener('click', showDashboard);

document.getElementById('navForecast')
    ?.addEventListener(
        'click',
        () => openForecast(selectedLocation)
    );

document.getElementById('navRadar')
    ?.addEventListener('click', showRadar);

document.getElementById('backBtn')
    ?.addEventListener('click', showDashboard);

document.getElementById('radarHomeBtn')
    ?.addEventListener(
        'click',
        () => {

            radarMap?.setView(
                [HOME_LAT, HOME_LON],
                HOME_ZOOM
            );
        }
    );

document.getElementById('opacitySlider')
?.addEventListener(
    'input',
    e => {

        const currentPath =
            radarFrames[currentFrameIndex]?.path;

        if (currentPath) {

            leafletLayers[currentPath]
                ?.setOpacity(
                    e.target.value / 100
                );

        }

    }
);

document.getElementById('radarPrevBtn')
?.addEventListener(
    'click',
    () => {

        let prev =
            currentFrameIndex - 1;

        if (prev < 0) {

            prev = radarFrames.length - 1;

        }

        showRadarFrame(prev);

    }
);

document.getElementById('radarNextBtn')
?.addEventListener(
    'click',
    () => {

        let next =
            currentFrameIndex + 1;

        if (next >= radarFrames.length) {

            next = 0;

        }

        showRadarFrame(next);

    }
);

document.getElementById('radarPlayBtn')
?.addEventListener(
    'click',
    e => {

        if (animationInterval) {

            stopRadar();

            e.target.textContent =
                '▶ Play';

        } else {

            playRadar();

            e.target.textContent =
                '⏸ Pause';

        }

    }
);


/*==================================================
  FUTURE: ALERTS
==================================================*/

// NWS Alerts integration goes here.

/*==================================================
  FUTURE: SETTINGS
==================================================*/

// Units, radar source, notifications.

/*==================================================
  SERVICE WORKER
==================================================*/

if ('serviceWorker' in navigator) {

    navigator.serviceWorker
        .register('./service-worker.js')
        .catch(console.error);
}

/*==================================================
  APP INITIALIZATION
==================================================*/

loadWeather();
showDashboard();
