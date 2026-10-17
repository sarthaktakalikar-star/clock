import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'world-clock-v2';
const BASE_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Africa/Johannesburg',
  'Africa/Cairo'
];

function getInitialTimezones() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.filter((tz) => typeof tz === 'string' && tz);
      }
    } catch {
      // ignore invalid local storage
    }
  }

  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return [localZone, 'UTC', 'Europe/London', 'Asia/Tokyo'].filter(unique);
}

function unique(value, index, array) {
  return array.indexOf(value) === index;
}

function getTimezoneName(tz) {
  const parts = tz.split('/');
  if (!parts.length) return tz;
  const last = parts[parts.length - 1].replace(/_/g, ' ');
  return last === 'UTC' ? 'UTC' : last;
}

function getTimezoneOffset(tz) {
  const now = new Date();
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const zone = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const difference = (zone.getTime() - utc.getTime()) / 60000;

  const sign = difference >= 0 ? '+' : '-';
  const absolute = Math.abs(difference);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;

  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getLocalTimeForZone(tz) {
  const now = new Date();
  const zoneDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));

  const weekday = zoneDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: tz });
  const month = zoneDate.toLocaleDateString('en-US', { month: 'short', timeZone: tz });
  const day = zoneDate.toLocaleDateString('en-US', { day: 'numeric', timeZone: tz });
  const year = zoneDate.toLocaleDateString('en-US', { year: 'numeric', timeZone: tz });

  return {
    time: zoneDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: tz,
    }),
    date: `${weekday}, ${month} ${day}, ${year}`,
    offset: getTimezoneOffset(tz),
    hour: zoneDate.getHours() % 12,
    minute: zoneDate.getMinutes(),
    second: zoneDate.getSeconds(),
  };
}

function SearchResults({ query, onSelect }) {
  const results = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    return BASE_TIMEZONES.filter((tz) => {
      const city = getTimezoneName(tz).toLowerCase();
      return city.includes(clean) || tz.toLowerCase().includes(clean);
    }).slice(0, 8);
  }, [query]);

  if (!query.trim()) return null;

  return (
    <div className="search-results" aria-live="polite">
      {results.length ? (
        results.map((tz) => (
          <button key={tz} type="button" className="search-result" onClick={() => onSelect(tz)}>
            {getTimezoneName(tz)} <small>({tz})</small>
          </button>
        ))
      ) : (
        <div className="search-result empty-search">No matching timezone found.</div>
      )}
    </div>
  );
}

function AnalogClock({ tz, time }) {
  const hourDeg = (time.hour + time.minute / 60) * 30 - 90;
  const minuteDeg = (time.minute + time.second / 60) * 6 - 90;
  const secondDeg = time.second * 6 - 90;

  return (
    <div className="analog-clock" aria-hidden="true">
      <div className="clock-face">
        <div className="center-dot" />
        <div className="hand hour" style={{ transform: `rotate(${hourDeg}deg)` }} />
        <div className="hand minute" style={{ transform: `rotate(${minuteDeg}deg)` }} />
        <div className="hand second" style={{ transform: `rotate(${secondDeg}deg)` }} />
      </div>
      <div className="clock-label">{tz}</div>
    </div>
  );
}

function App() {
  const [timezones, setTimezones] = useState(() => getInitialTimezones());
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timezones));
  }, [timezones]);

  useEffect(() => {
    const ticker = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(ticker);
  }, []);

  const addTimezone = (tz) => {
    if (!tz || timezones.includes(tz)) return;
    setTimezones((current) => [...current, tz]);
    setQuery('');
  };

  const removeTimezone = (tz) => {
    setTimezones((current) => current.filter((entry) => entry !== tz));
  };

  const clearAll = () => setTimezones([]);

  const addLocalTimezone = () => {
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    addTimezone(localZone);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Global time</p>
          <h1>World Clock</h1>
        </div>

        <div className="toolbar">
          <button type="button" className="primary" onClick={addLocalTimezone}>
            Add My Timezone
          </button>
          <button type="button" className="secondary" onClick={clearAll}>
            Clear
          </button>
        </div>
      </header>

      <section className="search-panel">
        <label className="sr-only" htmlFor="timezone-search">
          Search timezone
        </label>
        <input
          id="timezone-search"
          type="text"
          value={query}
          placeholder="Search city or timezone"
          onChange={(event) => setQuery(event.target.value)}
        />
        <SearchResults query={query} onSelect={addTimezone} />
      </section>

      <main>
        {timezones.length ? (
          <section className="clock-grid">
            {timezones.map((tz) => {
              const time = getLocalTimeForZone(tz);
              return (
                <article key={tz} className="clock-card">
                  <div className="card-header">
                    <div>
                      <h2>{getTimezoneName(tz)}</h2>
                      <span>{tz}</span>
                    </div>
                    <button type="button" className="remove" onClick={() => removeTimezone(tz)} aria-label={`Remove ${tz}`}>
                      ×
                    </button>
                  </div>

                  <div className="card-body">
                    <AnalogClock tz={tz} time={time} />
                    <div className="digital-block">
                      <div className="time-text">{time.time}</div>
                      <div className="date-text">{time.date}</div>
                      <div className="offset-text">{time.offset}</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="empty-state">No clocks added yet. Search a city to get started.</div>
        )}
      </main>
    </div>
  );
}

export default App;