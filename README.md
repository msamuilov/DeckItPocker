# DeckItPocker

Planning poker for teams — no database, runs directly from GitHub.

- **No backend**: Session and votes live in memory and sync in real time between peers via WebRTC (Trystero).
- **Run from GitHub**: Clone and run locally, or use GitHub Pages.

## Run locally

```bash
git clone https://github.com/YOUR_USERNAME/DeckItPocker.git
cd DeckItPocker
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Create a session to get a room URL; share it so others can join.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In the repo go to **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions** (not "Deploy from a branch"). If you leave it on "Deploy from a branch", the site will serve the raw source and you will get **404 for main.jsx**.
3. On each push to `main`, the workflow builds the app and publishes to Pages.
4. Open the app at the **full URL** (include the repo name): **`https://YOUR_USERNAME.github.io/DeckItPocker/`** (e.g. `https://msamuilov.github.io/DeckItPocker/`). The trailing slash is optional.

**If you see "Failed to load resource: 404" for main.jsx:** Your site is serving the repo source instead of the built app. Fix: **Settings → Pages → Source** must be **GitHub Actions**. Then trigger a new deploy (push a commit or re-run the "Deploy to GitHub Pages" workflow in the Actions tab) and wait for it to finish. Use the URL above, not the root `https://YOUR_USERNAME.github.io/`.

## How it works

- **Create session** generates a room ID and puts it in the URL (`#/room/xyz`).
- **Invite a teammate**: copy the URL and share it; everyone in the same room sees the same session and votes.
- State (session, players, votes, stories) is synced peer-to-peer with [Trystero](https://github.com/dmotz/trystero) (Nostr signaling). No server or database.

## Tech

- Vite + React
- React Router (hash mode for GitHub Pages)
- Trystero (WebRTC P2P, Nostr signaling)
