const STORAGE_KEY = 'world-clock-app-v2';
const TIMEZONES = [
  { city: 'UTC', tz: 'UTC', region: 'utc' },
  { city: 'London', tz: 'Europe/London', region: 'europe' },
  { city: 'Paris', tz: 'Europe/Paris', region: 'europe' },
  { city: 'Berlin', tz: 'Europe/Berlin', region: 'europe' },
  { city: 'New York', tz: 'America/New_York', region: 'america' },
  { city: 'Chicago', tz: 'America/Chicago', region: 'america' },
  { city: 'Los Angeles', tz: 'America/Los_Angeles', region: 'america' },
  { city: 'Toronto', tz: 'America/Toronto', region: 'america' },
  { city: 'São Paulo', tz: 'America/Sao_Paulo', region: 'america' },
  { city: 'Dubai', tz: 'Asia/Dubai', region: 'asia' },
  { city: 'Mumbai', tz: 'Asia/Kolkata', region: 'asia' },
  { city: 'Singapore', tz: 'Asia/Singapore', region: 'asia' },
  { city: 'Tokyo', tz: 'Asia/Tokyo', region: 'asia' },
  { city: 'Seoul', tz: 'Asia/Seoul', region: 'asia' },
  { city: 'Shanghai', tz: 'Asia/Shanghai', region: 'asia' },
  { city: 'Sydney', tz: 'Australia/Sydney', region: 'oceania' },
  { city: 'Auckland', tz: 'Pacific/Auckland', region: 'oceania' },
  { city: 'Johannesburg', tz: 'Africa/Johannesburg', region: 'africa' },
  { city: 'Cairo', tz: 'Africa/Cairo', region: 'africa' }
];

const state = {
  timezones: loadTimezones(),
  favorites: loadFavorites(),
  theme: loadTheme(),
  compact: loadCompact(),
  showFavoritesOnly: false
};

const els = {
  search: document.getElementById('timezone-search'),
  results: document.getElementById('search-results'),
  clocks: document.getElementById('clocks'),
  addLocal: document.getElementById('add-local-timezone'),
  clearAll: document.getElementById('clear-all'),
  themeToggle: document.getElementById('theme-toggle'),
  compactToggle: document.getElementById('compact-toggle'),
  showFavorites: document.getElementById('show-favorites')
};

function loadTimezones() {
  const saved = localStorage.getItem(`${STORAGE_KEY}:timezones`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) return parsed.filter(Boolean);
    } catch {}
  }
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return [localZone, 'UTC', 'Europe/London', 'Asia/Tokyo'].filter(unique);
}

function loadFavorites() {
  const saved = localStorage.getItem(`${STORAGE_KEY}:favorites`);
  try {
    return new Set(saved ? JSON.parse(saved) : []);
  } catch {
    return new Set();
  }
}

function loadTheme() {
  const saved = localStorage.getItem(`${STORAGE_KEY}:theme`);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function loadCompact() {
  const saved = localStorage.getItem(`${STORAGE_KEY}:compact`);
  return saved === 'true';
}

function saveTimezones() {
  localStorage.setItem(`${STORAGE_KEY}:timezones`, JSON.stringify(state.timezones));
}

function saveFavorites() {
  localStorage.setItem(`${STORAGE_KEY}:favorites`, JSON.stringify([...state.favorites]));
}

function saveTheme() {
  localStorage.setItem(`${STORAGE_KEY}:theme`, state.theme);
}

function saveCompact() {
  localStorage.setItem(`${STORAGE_KEY}:compact`, String(state.compact));
}

function unique(value, index, arr) {
  return arr.indexOf(value) === index;
}

function getTimezoneMeta(tz) {
  const found = TIMEZONES.find(item => item.tz === tz);
  if (found) return found;
  return {
    city: tz.split('/').pop().replace(/_/g, ' ') || tz,
    tz,
    region: 'utc'
  };
}

function getTimezoneStyle(tz) {
  const meta = getTimezoneMeta(tz);
  return meta.region || 'utc';
}

function getOffsetString(tz) {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const diffMinutes = Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
  const sign = diffMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(diffMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;

  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatClockParts(tz) {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return {
    time: `${values.hour}:${values.minute}:${values.second}`,
    dateText: `${values.weekday}, ${values.month} ${values.day}, ${values.year}`,
    offset: getOffsetString(tz)
  };
}

function applyTheme() {
  document.body.classList.toggle('light', state.theme === 'light');
  document.body.classList.toggle('dark', state.theme === 'dark');
  els.themeToggle.querySelector('.theme-label').textContent = state.theme === 'light' ? 'Dark' : 'Light';
}

function applyCompactMode() {
  document.body.classList.toggle('compact', state.compact);
  els.compactToggle.classList.toggle('active', state.compact);
  els.compactToggle.textContent = state.compact ? 'Expanded' : 'Compact';
}

function renderResults(query) {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    els.results.innerHTML = '';
    return;
  }

  const matches = TIMEZONES.filter(({ city, tz }) => {
    return city.toLowerCase().includes(clean) || tz.toLowerCase().includes(clean);
  }).slice(0, 8);

  if (!matches.length) {
    els.results.innerHTML = '<div class=\"search-result empty-search\">No matching city found.</div>';
    return;
  }

  els.results.innerHTML = matches
    .map(({ city, tz }) => `
      <button type="button" class="search-result" data-tz="${tz}">
        ${city} <small>(${tz})</small>
      </button>
    `)
    .join('');

  els.results.querySelectorAll('.search-result').forEach(button => {
    button.addEventListener('click', () => {
      addTimezone(button.dataset.tz);
      els.search.value = '';
      els.results.innerHTML = '';
    });
  });
}

function createAnalogClock(tz) {
  const style = getTimezoneStyle(tz);
  const meta = getTimezoneMeta(tz);
  const time = formatClockParts(tz);
  const hour = Number(time.time.split(':')[0]) % 12;
  const minute = Number(time.time.split(':')[1]);
  const second = Number(time.time.split(':')[2]);
  const hourDeg = (hour + minute / 60) * 30 - 90;
  const minuteDeg = (minute + second / 60) * 6 - 90;
  const secondDeg = second * 6 - 90;

  const accentMap = {
    europe: '#a78bfa',
    america: '#5eead4',
    asia: '#fbbf24',
    oceania: '#4ade80',
    africa: '#fca5a5',
    utc: '#cbd5e1'
  };

  const accent = accentMap[style] || '#5eead4';

  return `
    <div class="analog-wrap">
      <div class="analog-clock" style="--watch-accent:${accent};">
        <div class="face-ring"></div>
        <div class="hand hour" style="transform: rotate(${hourDeg}deg);"></div>
        <div class="hand minute" style="transform: rotate(${minuteDeg}deg);"></div>
        <div class="hand second" style="transform: rotate(${secondDeg}deg);"></div>
        <div class="center-dot"></div>
      </div>
    </div>
  `;
}

function renderClockCards() {
  const visible = state.showFavoritesOnly
    ? state.timezones.filter(tz => state.favorites.has(tz))
    : state.timezones;

  if (!visible.length) {
    els.clocks.innerHTML = `
      <div class="empty-state">
        ${state.showFavoritesOnly ? 'No favorite clocks yet.' : 'No clocks added yet. Search for a city to begin.'}
      </div>
    `;
    return;
  }

  els.clocks.innerHTML = visible
    .map(tz => {
      const meta = getTimezoneMeta(tz);
      const favorite = state.favorites.has(tz);
      const style = getTimezoneStyle(tz);

      return `
        <article class="clock-card" data-style="${style}" data-tz="${tz}">
          <div class="card-top">
            <div>
              <p class="city-label">${meta.city}</p>
              <div class="timezone-label">${tz}</div>
            </div>

            <div class="card-actions">
              <button
                type="button"
                class="favorite-btn ${favorite ? 'active' : ''}"
                data-favorite="${tz}"
                aria-label="${favorite ? 'Remove favorite' : 'Add favorite'}"
              >
                ${favorite ? '★' : '☆'}
              </button>
              <button
                type="button"
                class="remove-btn"
                data-remove="${tz}"
                aria-label="Remove ${meta.city}"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="card-body">
            ${createAnalogClock(tz)}
            <div class="digital-block">
              <p class="time-display" data-time="${tz}">--:--:--</p>
              <p class="date-display" data-date="${tz}">Loading...</p>
              <p class="offset-display" data-offset="${tz}">UTC+00:00</p>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  els.clocks.querySelectorAll('[data-remove]').forEach(button => {
    button.addEventListener('click', () => {
      const tz = button.dataset.remove;
      state.timezones = state.timezones.filter(item => item !== tz);
      state.favorites.delete(tz);
      saveTimezones();
      saveFavorites();
      renderClockCards();
      renderTimes();
    });
  });

  els.clocks.querySelectorAll('[data-favorite]').forEach(button => {
    button.addEventListener('click', () => {
      const tz = button.dataset.favorite;
      if (state.favorites.has(tz)) {
        state.favorites.delete(tz);
      } else {
        state.favorites.add(tz);
      }
      saveFavorites();
      renderClockCards();
      renderTimes();
    });
  });
}

function renderTimes() {
  const visible = state.showFavoritesOnly
    ? state.timezones.filter(tz => state.favorites.has(tz))
    : state.timezones;

  visible.forEach(tz => {
    const parts = formatClockParts(tz);
    const timeEl = document.querySelector(`[data-time="${tz}"]`);
    const dateEl = document.querySelector(`[data-date="${tz}"]`);
    const offsetEl = document.querySelector(`[data-offset="${tz}"]`);

    if (timeEl) timeEl.textContent = parts.time;
    if (dateEl) dateEl.textContent = parts.dateText;
    if (offsetEl) offsetEl.textContent = parts.offset;

    const cardEl = document.querySelector(`.clock-card[data-tz="${tz}"]`);
    if (cardEl) {
      const style = getTimezoneStyle(tz);
      cardEl.setAttribute('data-style', style);
    }
  });
}

function addTimezone(tz) {
  if (!tz || state.timezones.includes(tz)) return;
  state.timezones.push(tz);
  saveTimezones();
  renderClockCards();
  renderTimes();
}

function clearAllClocks() {
  state.timezones = [];
  state.favorites.clear();
  saveTimezones();
  saveFavorites();
  renderClockCards();
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  saveTheme();
  applyTheme();
}

function toggleCompactMode() {
  state.compact = !state.compact;
  saveCompact();
  applyCompactMode();
}

function toggleFavoritesView() {
  state.showFavoritesOnly = !state.showFavoritesOnly;
  els.showFavorites.classList.toggle('active', state.showFavoritesOnly);
  els.showFavorites.textContent = state.showFavoritesOnly ? 'All' : 'Favorites';
  renderClockCards();
  renderTimes();
}

els.search.addEventListener('input', event => {
  renderResults(event.target.value);
});

els.addLocal.addEventListener('click', () => {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  addTimezone(localZone);
});

els.clearAll.addEventListener('click', () => {
  clearAllClocks();
});

els.themeToggle.addEventListener('click', toggleTheme);
els.compactToggle.addEventListener('click', toggleCompactMode);
els.showFavorites.addEventListener('click', toggleFavoritesView);

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  applyCompactMode();
  els.showFavorites.textContent = state.showFavoritesOnly ? 'All' : 'Favorites';
  renderClockCards();
  renderTimes();
  setInterval(renderTimes, 1000);
});