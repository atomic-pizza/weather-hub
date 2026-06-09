
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
 const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
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
       <div class="compact">
         <div>${loc.label}</div>
         <div><b>${Math.round(c.temperature_2m)}°F</b></div>
       </div>`;
     }else{
       dash.innerHTML += `
       <div class="card">
         <div>${loc.label}</div>
         <div class="temp">${Math.round(c.temperature_2m)}°F</div>
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

if('serviceWorker' in navigator){
 navigator.serviceWorker.register('./service-worker.js').catch(console.error);
}

loadWeather();
