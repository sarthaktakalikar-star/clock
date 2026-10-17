# Clock

A polished little world clock app that keeps track of time across the globe in a clean, modern interface. Built for quick access, easy customization, and a nice visual rhythm that feels useful whether you are coordinating with friends across continents or simply curious about another time zone.

## Why this app?

Time zones can be surprisingly chaotic. A meeting in New York, a friend in Tokyo, a family member in London — all of them are moving through the day at different moments. This app makes that difference visible at a glance.

Instead of opening a dozen tabs or looking up conversions manually, you can keep a curated list of cities and watch their clocks tick in real time. The interface is intentionally lightweight, fast, and friendly for everyday use.

## Features

- Live-updating world clocks for multiple cities and regions
- Search by city name or timezone name
- Add your local timezone in one click
- Remove individual clocks or clear everything instantly
- Browser-based persistence using localStorage
- Clean, responsive layout built for desktop and mobile
- Lightweight static implementation with no setup burden

## What it looks like

The app presents each selected city in a card with:

- the city name
- the timezone label
- a live digital time readout
- the current date
- the timezone offset relative to UTC

This gives you a quick mental map of the world, without needing to open a separate utility or search engine.

## Live demo

You can connect it to GitHub Pages or host it anywhere static files are served. Once published, the app becomes a lightweight utility you can bookmark and reuse anytime.

## Project structure

```text
clock/
├── index.html
├── styles.css
├── app.js
├── README.md
└── .github/
```

## How to use it

1. Open `index.html` in a browser.
2. Type a city or timezone into the search field.
3. Choose a location from the result list.
4. Add as many cities as you want.
5. Remove or clear entries as needed.
6. The app remembers your selected clocks in the browser.

## Local development

Because this is a static app, there is almost no setup involved.

### Run it locally

Open `index.html` directly in your browser, or serve the folder with a local static server if you prefer.

For example with Python:

```bash
cd clock
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages deployment

This project is a good fit for GitHub Pages because it is static and self-contained.

To publish it:

1. Go to your repository settings.
2. Open the Pages section.
3. Choose the main branch as the source.
4. Save the settings.
5. GitHub will provide a live URL for the project.

## Why it works well

This project balances simplicity and usefulness:

- no backend required
- no database required
- minimal dependencies
- instant load time
- easy to customize visually

It is ideal for prototypes, personal utilities, or learning projects focused on frontend behavior and user interaction.

## Future enhancements

This app is already useful in its current form, but there are several interesting upgrades that could make it even stronger:

- analog clock styles for each timezone
- a dark/light theme toggle
- a searchable world map view
- drag-and-drop card ordering
- support for favorite locations
- localization for different date/time formats
- mobile-first compact mode

## License

This project is ready to use and extend for personal or educational purposes.

## Final note

A world clock app may sound simple, but it is one of those tiny utilities that quietly becomes essential. It sits in the background and solves real scheduling problems without fuss. If you are building a portfolio or learning frontend fundamentals, this is a great example of a practical, polished app that is easy to understand and easy to improve.
