// Minimal world clock app (vanilla JS). Persistent via localStorage.
// Features: add by search, add local timezone, remove, live update.

const DEFAULT_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const STORAGE_KEY = "world_clock_tzs_v1";

// A curated list of common timezones with friendly names (keeps bundle small).
const TZ_LIST = [
  {tz:"UTC", label:"UTC"},
  {tz:"Europe/London", label:"London"},
  {tz:"Europe/Paris", label:"Paris"},
  {tz:"Europe/Berlin", label:"Berlin"},
  {tz:"America/New_York", label:"New York"},
  {tz:"America/Chicago", label:"Chicago"},
  {tz:"America/Denver", label:"Denver"},
  {tz:"America/Los_Angeles", label:"Los Angeles"},
  {tz:"America/Sao_Paulo", label:"São Paulo"},
  {tz:"America/Toronto", label:"Toronto"},
  {tz:"Asia/Tokyo", label:"Tokyo"},
  {tz:"Asia/Shanghai", label:"Shanghai"},
  {tz:"Asia/Hong_Kong", label:"Hong Kong"},
  {tz:"Asia/Singapore", label:"Singapore"},
  {tz:"Asia/Dubai", label:"Dubai"},
  {tz:"Asia/Kolkata", label:"Kolkata"},
  {tz:"Asia/Kathmandu", label:"Kathmandu"},
  {tz:"Australia/Sydney", label:"Sydney"},
  {tz:"Pacific/Auckland", label:"Auckland"},
  {tz:"Africa/Johannesburg", label:"Johannesburg"},
  {tz:"Europe/Moscow", label:"Moscow"},
  // add more as needed
];

const el = {
  clocks: document.getElementById("clocks"),
  tzSearch: document.getElementById("tz-search"),
  results: document.getElementById("search-results"),
  addCurrent: document.getElementById("add-current"),
  clearAll: document.getElementById("clear-all"),
};

let tzs = loadTzs();

function loadTzs(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  // default: show local timezone and UTC
  return [DEFAULT_TZ, "UTC"].filter((v,i,arr)=>arr.indexOf(v)===i);
}

function saveTzs(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tzs));
}

function formatTimeForTZ(tz){
  const now = new Date();
  const time = new Intl.DateTimeFormat(undefined, {
    hour:"numeric", minute:"2-digit", second:"2-digit", hour12:false, timeZone:tz
  }).format(now);
  const date = new Intl.DateTimeFormat(undefined, {
    weekday:"short", month:"short", day:"numeric", year:"numeric", timeZone:tz
  }).format(now);
  const offsetMinutes = - (new Date().getTimezoneOffset()) + getTZOffsetMinutes(now, tz);
  const offsetHours = Math.floor(offsetMinutes/60);
  const offsetSign = offsetMinutes >=0 ? "+" : "-";
  const offsetStr = `UTC${offsetSign}${Math.abs(offsetHours)}`;
  return {time, date, offsetStr};
}

// Rough offset calculation using Intl; obtains the difference between given tz and local timezone in minutes.
// It gets the formatted hour/minute for both and computes difference.
function getTZOffsetMinutes(date, tz){
  try{
    const local = new Intl.DateTimeFormat("en-US", {hour12:false, hour:"2-digit", minute:"2-digit", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone}).format(date);
    const remote = new Intl.DateTimeFormat("en-US", {hour12:false, hour:"2-digit", minute:"2-digit", timeZone: tz}).format(date);
    const [lh, lm] = local.split(":").map(Number);
    const [rh, rm] = remote.split(":").map(Number);
    const localMin = lh*60 + lm;
    const remoteMin = rh*60 + rm;
    let diff = remoteMin - localMin;
    // normalize to -720..+720
    if(diff > 720) diff -= 1440;
    if(diff < -720) diff += 1440;
    return diff;
  }catch(e){
    return 0;
  }
}

function renderClocks(){
  el.clocks.innerHTML = "";
  tzs.forEach(tz => {
    const {time, date, offsetStr} = formatTimeForTZ(tz);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-head">
        <div>
          <div class="city">${friendlyName(tz)}</div>
          <div class="tz">${tz} · <span class="date">${date}</span></div>
        </div>
        <div class="card-actions">
          <button class="icon-btn remove" data-tz="${tz}" title="Remove">✕</button>
        </div>
      </div>
      <div>
        <div class="time">${time}</div>
        <div class="date">${offsetStr}</div>
      </div>
    `;
    el.clocks.appendChild(card);
    card.querySelector(".remove").addEventListener("click", ()=> {
      removeTz(tz);
    });
  });
}

function friendlyName(tz){
  const found = TZ_LIST.find(x=>x.tz===tz);
  if(found) return found.label;
  // fallback: show last part of tz
  const parts = tz.split("/");
  return parts[parts.length-1].replace(/_/g," ");
}

function addTz(tz){
  if(!tz) return;
  if(!tzs.includes(tz)){
    tzs.push(tz);
    saveTzs();
    renderClocks();
  }
}

function removeTz(tz){
  tzs = tzs.filter(t=>t!==tz);
  saveTzs();
  renderClocks();
}

function clearAll(){
  tzs = [];
  saveTzs();
  renderClocks();
}

function updateTimes(){
  // re-render times only: update each card's time text for performance.
  const cards = el.clocks.querySelectorAll(".card");
  tzs.forEach((tz, i) => {
    const card = cards[i];
    if(!card) return;
    const {time, date, offsetStr} = formatTimeForTZ(tz);
    const timeEl = card.querySelector(".time");
    const dateEl = card.querySelectorAll(".date")[0] || card.querySelector(".tz .date");
    const offsetEl = card.querySelectorAll(".date")[1];
    if(timeEl) timeEl.textContent = time;
    if(dateEl) dateEl.textContent = date;
    if(offsetEl) offsetEl.textContent = offsetStr;
    // update tz header if not found
    const cityEl = card.querySelector(".city");
    if(cityEl) cityEl.textContent = friendlyName(tz);
  });
}

function setupSearch(){
  el.tzSearch.addEventListener("input", e=>{
    const q = (e.target.value || "").toLowerCase().trim();
    if(!q){ el.results.innerHTML = ""; return; }
    const results = TZ_LIST.filter(item => item.label.toLowerCase().includes(q) || item.tz.toLowerCase().includes(q));
    el.results.innerHTML = results.map(r=>`<div class="result-item" data-tz="${r.tz}">${r.label} · <span class="muted">${r.tz}</span></div>`).join("");
    el.results.querySelectorAll(".result-item").forEach(node=>{
      node.addEventListener("click", ()=>{
        addTz(node.dataset.tz);
        el.tzSearch.value = "";
        el.results.innerHTML = "";
      });
    });
  });

  // add keyboard support: Enter adds first result
  el.tzSearch.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
      const first = el.results.querySelector(".result-item");
      if(first) {
        addTz(first.dataset.tz);
        el.tzSearch.value = "";
        el.results.innerHTML = "";
      }
    }
  });
}

el.addCurrent.addEventListener("click", ()=> addTz(DEFAULT_TZ));
el.clearAll.addEventListener("click", ()=> { if(confirm("Clear all clocks?")) clearAll(); });

setupSearch();
renderClocks();
setInterval(updateTimes, 1000);