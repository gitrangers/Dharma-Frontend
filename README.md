# Dharma Next Latest (`DharmaNextLatest`)

Next.js **16** (App Router, React 19) frontend that mirrors the **Dharma Productions** marketing site styling while leaving the original **`dharmanodeRun`** Sails project untouched.

## Prerequisites

- Node 20+
- Running API from `dharmanodeRun` (default `http://localhost:1337/api/`) **or** Strapi / another backend that exposes the same JSON POST endpoints.

## Setup

```bash
cd DharmaNextLatest
npm install
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL if your API host differs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What’s included

- **Shared look & feel:** Orange header strip (`head-bg`), curved divider (`head-curve`), Hammersmith One / Karla fonts, footer chrome — styled with Bootstrap 5 + SCSS (`src/styles/_dharma.scss`) and Font Awesome.
- **Assets:** `public/frontend/img/` copied from the legacy `frontend/img/` tree (run Robocopy again if you add art).
- **Data:** Server-side `fetch` helpers (`src/lib/api.ts`) POST to the same endpoints the Angular app used (`homeslider/getAllHomeSlider`, `Movie/getAllUpcomingMovies`, `Movie/getAllRecentMovies`, `Dharmatv/getAll`, `movie/getMovieDetails`, …).

## Routes (starter parity)

| Path | Notes |
|------|--------|
| `/` | Home hero + upcoming/released grids |
| `/movies` | Movie grid from API |
| `/videos` | Dharmatv rows grouped by movie |
| `/overview`, `/social`, `/news-events`, `/contact-us`, … | Placeholders — paste HTML from legacy views |
| `/movie/[slug]` | Detail stub — wire `Movie/getOneMovie` |

## CORS

If the browser calls the API from another origin, enable CORS on the Sails side for `http://localhost:3000`. Server Components call the API from Node without CORS.

## npm package name

The npm package name is lowercase (`dharmanextlatest`) per npm rules; the folder is **`DharmaNextLatest`**.
