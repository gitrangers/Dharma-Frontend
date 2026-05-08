# Dharma Next Latest (`DharmaNextLatest`)

Next.js **16** (App Router, React 19) frontend that mirrors the **Dharma Productions** marketing site styling with a Strapi-backed data layer.

## Prerequisites

- Node 20+
- Running Strapi API with the content types used by this app.

## Setup

```bash
cd DharmaNextLatest
npm install
cp .env.example .env.local
# Edit STRAPI_URL / STRAPI_API_TOKEN for your environment
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What’s included

- **Shared look & feel:** Orange header strip (`head-bg`), curved divider (`head-curve`), Hammersmith One / Karla fonts, footer chrome — styled with Bootstrap 5 + SCSS (`src/styles/_dharma.scss`) and Font Awesome.
- **Assets:** `public/frontend/img/` copied from the legacy `frontend/img/` tree (run Robocopy again if you add art).
- **Data:** Server-side fetch helpers load home, movies, and videos from Strapi.

## Routes (starter parity)

| Path | Notes |
|------|--------|
| `/` | Home hero + upcoming/released grids |
| `/movies` | Movie grid from API |
| `/videos` | Dharmatv rows grouped by movie |
| `/overview`, `/social`, `/news-events`, `/contact-us`, … | Placeholders — paste HTML from legacy views |
| `/movie/[slug]` | Detail stub — wire `Movie/getOneMovie` |

## npm package name

The npm package name is lowercase (`dharmanextlatest`) per npm rules; the folder is **`DharmaNextLatest`**.
