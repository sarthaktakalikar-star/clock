const STORAGE_KEY = 'world-clock-app-v1';
const TIMEZONES = [
  { city: 'UTC', tz: 'UTC' },
  { city: 'London', tz: 'Europe/London' },
  { city: 'Paris', tz: 'Europe/Paris' },
  { city: 'Berlin', tz: 'Europe/Berlin' },
  { city: 'New York', tz: 'America/New_York' },
  { city: 'Chicago', tz: 'America/Chicago' },
  { city: 'Los Angeles', tz: 'America/Los_Angeles' },
  { city: 'Toronto', tz: 'America/Toronto' },
  { city: 'São Paulo', tz: 'America/Sao_Paulo' },
  { city: 'Dubai', tz: 'Asia/Dubai' },
  { city: 'Mumbai', tz: 'Asia/Kolkata' },
  { city: 'Singapore', tz: 'Asia/Singapore' },
  { city: 'Tokyo', tz: 'Asia/Tokyo' },
  { city: 'Seoul', tz: 'Asia/Seoul' },
  { city: 'Shanghai', tz: 'Asia/Shanghai' },
  { city: 'Sydney', tz: 'Australia/Sydney' },
  { city: 'Auckland', tz: 'Pacific/Auckland' },
  { city: 'Johannesburg', tz: 'Africa/Johannesburg' },
  { city: 'Cairo', tz: 'Africa/Cairo' }
];

const state = {
  timezones: loadTimezones(),
};

const els = {
  search: document.getElementById('timezone-search'),
  results: document.getElementById('search-results'),
  clocks: document.getElementById('clocks'),
  addLocal: document.getElementById('add-local-timezone'),
  clearAll: document.getElementById('clear-all'),
};

function loadTimezones() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    return [localZone, 'UTC', 'Europe/London', 'Asia/Tokyo'].filter(unique);
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed.filter(Boolean) : ['UTC'];
  } catch {
    return ['UTC'];
  }
}

function saveTimezones() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.timezones));
}

function unique(value, index, arr) {
  return arr.indexOf(value) === index;
}

function getTimezoneMeta(tz) {
  const found = TIMEZONES.find((item) => item.tz === tz);
  if (found) return found;

  const city = tz.split('/').pop().replace(/_/g, ' ');
  return { city: city || tz, tz };
}

function getOffsetString(tz) {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const diffMinutes = Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
  const sign = diffMinutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(diffMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;

  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatClockParts(tz) {
  const date = new Date();
  const formatOptions = {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  const formatter = new Intl.DateTimeFormat('en-US', formatOptions);
  const formatted = formatter.formatToParts(date);

  const lookup = Object.fromEntries(formatted.map((part) => [part.type, part.value]));

  const time = `${lookup.hour}:${lookup.minute}:${lookup.second}`;
  const dateText = `${lookup.weekday}, ${lookup.month} ${lookup.day}, ${lookup.year}`;

  return { time, dateText, offset: getOffsetString(tz) };
}

function renderResults(query) {
  const cleaned = query.trim().toLowerCase();

  if (!cleaned) {
    els.results.innerHTML = '';
    return;
  }

  const matches = TIMEZONES.filter(({ city, tz }) => {
    return city.toLowerCase().includes(cleaned) || tz.toLowerCase().includes(cleaned);
  }).slice(0, 8);

  if (!matches.length) {
    els.results.innerHTML = '<div class="search-result" tabindex="0">No matching city found.</div>';
    return;
  }

  els.results.innerHTML = matches
    .map(
      ({ city, tz }) => `
        <button type="button" class="search-result" data-tz="${tz}">
          ${city} <small>(${tz})</small>
        </button>
      `
    )
    .join('');

  els.results.querySelectorAll('.search-result').forEach((button) => {
    button.addEventListener('click', () => {
      addTimezone(button.dataset.tz);
      els.search.value = '';
      els.results.innerHTML = '';
    });
  });
}

function renderClockCards() {
  if (!state.timezones.length) {
    els.clocks.innerHTML = '<div class="empty-state">No clocks added yet. Search for a city to begin.</div>';
    return;
  }

  els.clocks.innerHTML = state.timezones
    .map((tz) => {
      const { city } = getTimezoneMeta(tz);
      return `
        <article class="clock-card" data-tz="${tz}">
          <div class="card-top">
            <div>
              <p class="city-label">${city}</p>
              <div class="timezone-label">${tz}</div>
            </div>
            <button class="remove-btn" type="button" data-remove="${tz}" aria-label="Remove ${city}">✕</button>
          </div>
          <p class="time-display" data-time="${tz}">--:--:--</p>
          <p class="date-display" data-date="${tz}">Loading...</p>
          <p class="offset-display" data-offset="${tz}">UTC+00:00</p>
        </article>
      `;
    })
    .join('');

  els.clocks.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const tz = button.dataset.remove;
      state.timezones = state.timezones.filter((item) => item !== tz);
      saveTimezones();
      renderClockCards();
      renderTimes();
    });
  });
}

function renderTimes() {
  if (!state.timezones.length) return;

  state.timezones.forEach((tz) => {
    const parts = formatClockParts(tz);
    const timeEl = document.querySelector(`[data-time="${tz}"]`);
    const dateEl = document.querySelector(`[data-date="${tz}"]`);
    const offsetEl = document.querySelector(`[data-offset="${tz}"]`);

    if (timeEl) timeEl.textContent = parts.time;
    if (dateEl) dateEl.textContent = parts.dateText;
    if (offsetEl) offsetEl.textContent = parts.offset;
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
  saveTimezones();
  renderClockCards();
}

els.search.addEventListener('input', (event) => {
  renderResults(event.target.value);
});

els.addLocal.addEventListener('click', () => {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  addTimezone(localZone);
});

els.clearAll.addEventListener('click', () => {
  clearAllClocks();
});

renderClockCards();
renderTimes();
setInterval(renderTimes, 1000);
