let selectedLocation = 0;

function weatherDescription(code){

    const map = {
        0:"☀ Clear Sky",
        1:"🌤 Mostly Clear",
        2:"⛅ Partly Cloudy",
        3:"☁ Overcast",
        45:"🌫 Fog",
        61:"🌧 Rain",
        63:"🌧 Moderate Rain",
        65:"🌧 Heavy Rain",
        95:"⛈ Thunderstorm"
    };

    return map[code] || "Unknown";
}

const LOCATIONS=[
 {label:'🏠 Home',lat:37.19,lon:-97.04},
 {label:'🌆 Wichita',lat:37.6872,lon:-97.3301},
 {label:'🚗 Ponca City',lat:36.7069,lon:-97.0856}
];

let viewMode=localStorage.getItem('viewMode')||'cards';

document.getElementById('cardBtn').onclick=()=>{
 viewMode='cards';
 localStorage.setItem('viewMode',viewMode);
 loadWeather();
};

document.getElementById('compactBtn').onclick=()=>{
 viewMode='compact';
 localStorage.setItem('viewMode',viewMode);
 loadWeather();
};

async function fetchWeather(lat,lon){
 const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
 const r=await fetch(url);
 if(!r.ok) throw new Error('Weather API error');
 return await r.json();
}

async function loadWeather(){
 const dash=document.getElementById('dashboard');
 dash.innerHTML='';
 document.getElementById('status').textContent='Loading weather...';

 try{
   for(const loc of LOCATIONS){
     const data=await fetchWeather(loc.lat,loc.lon);
     const c=data.current;

     if(viewMode==='compact'){
       dash.innerHTML += `
       <div class="compact" onclick="openForecast(${LOCATIONS.indexOf(loc)})">
         <div>${loc.label}</div>
         <div><b>${Math.round(c.temperature_2m)}°F</b></div>
       </div>`;
     }else{
       dash.innerHTML += `
       <div class="card" onclick="openForecast(${LOCATIONS.indexOf(loc)})">
         <div>${loc.label}</div>
         <div class="temp">${Math.round(c.temperature_2m)}°F</div>
         <div>${weatherDescription(c.weather_code)}</div>
         <div>Feels Like ${Math.round(c.apparent_temperature)}°F</div>
         <div>Humidity ${c.relative_humidity_2m}%</div>
         <div>Wind ${Math.round(c.wind_speed_10m)} mph</div>
         <div class="small">Updated ${new Date().toLocaleTimeString()}</div>
       </div>`;
     }
   }
   document.getElementById('status').textContent='';
 }catch(err){
   console.error(err);
   document.getElementById('status').textContent='Unable to load weather data.';
 }
}

function showDashboard(){

    document.getElementById('dashboardView').style.display='block';
    document.getElementById('forecastView').style.display='none';

}

function showForecast(){

    document.getElementById('dashboardView').style.display='none';
    document.getElementById('forecastView').style.display='block';

}

async function openForecast(index){

    selectedLocation=index;

    const loc=LOCATIONS[index];

    showForecast();

    document.getElementById('forecastTitle').textContent=
    `${loc.label} Forecast`;

    const data=await fetchWeather(loc.lat,loc.lon);

    const current=data.current;

    document.getElementById('currentConditions').innerHTML=`
        <div class="card">
            <div class="temp">${Math.round(current.temperature_2m)}°F</div>
            <div>${weatherDescription(current.weather_code)}</div>
            <div>Feels Like ${Math.round(current.apparent_temperature)}°F</div>
            <div>Humidity ${current.relative_humidity_2m}%</div>
            <div>Wind ${Math.round(current.wind_speed_10m)} mph</div>
        </div>
    `;

    let hourlyHtml='';

    for(let i=0;i<24;i++){

        hourlyHtml+=`
            <div class="hour-row">
                ${data.hourly.time[i].split('T')[1]}
                -
                ${Math.round(data.hourly.temperature_2m[i])}°F
            </div>
        `;
    }

    document.getElementById('hourlyForecast').innerHTML=
    hourlyHtml;

    let dailyHtml='';

    for(let i=0;i<data.daily.time.length;i++){

        dailyHtml+=`
            <div class="day-row">
                ${data.daily.time[i]}
                :
                ${Math.round(data.daily.temperature_2m_max[i])}°
                /
                ${Math.round(data.daily.temperature_2m_min[i])}°
            </div>
        `;
    }

    document.getElementById('dailyForecast').innerHTML=
    dailyHtml;

}
document.getElementById('navDashboard')
?.addEventListener('click',showDashboard);

document.getElementById('navForecast')
?.addEventListener('click',()=>openForecast(selectedLocation));

document.getElementById('backBtn')
?.addEventListener('click',showDashboard);

if('serviceWorker' in navigator){
 navigator.serviceWorker.register('./service-worker.js').catch(console.error);
}

loadWeather();
