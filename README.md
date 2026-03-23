# Calendar Stats Viewer

A web app that connects to your Google Calendar and generates statistics about your events. Search for events by name, see how many you have and how much total time you've spent on them.

## Features

- Google OAuth2 authentication with session persistence
- Search calendar events by name or query
- Toggle between searching event titles only or including descriptions
- View stats: total event count, total time spent (hours & minutes)
- Click events to expand and view descriptions
- Direct links to events in Google Calendar

## Tech Stack

- React 19 + TypeScript
- Vite
- Google Calendar API v3
- lucide-react (icons)

## Setup

### Prerequisites

You need a Google Cloud project with the Calendar API enabled and OAuth2 credentials configured.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Enable the **Google Calendar API**
4. Create an **API Key** and an **OAuth 2.0 Client ID** (Web application type)
5. Add your development URL (e.g. `http://localhost:5173`) to the OAuth client's authorized origins

### Environment Variables

Create a `.env` file in the project root:

```bash
VITE_GOOGLE_API_KEY=your_api_key
VITE_GOOGLE_CLIENT_ID=your_client_id
```

### Install & Run

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview  # preview the production build locally
```

## Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start Vite dev server                |
| `npm run build`   | TypeScript check + production build  |
| `npm run preview` | Serve production build locally       |
| `npm run lint`    | Run ESLint                           |
