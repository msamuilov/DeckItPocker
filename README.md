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
2. In the repo: **Settings → Pages → Source**: choose **GitHub Actions**.
3. On each push to `main`, the workflow builds the app and publishes to Pages.

Live app: `https://YOUR_USERNAME.github.io/DeckItPocker/`

## How it works

- **Create session** generates a room ID and puts it in the URL (`#/room/xyz`).
- **Invite a teammate**: copy the URL and share it; everyone in the same room sees the same session and votes.
- State (session, players, votes, stories) is synced peer-to-peer with [Trystero](https://github.com/dmotz/trystero) (Nostr signaling). No server or database.

## Tech

- Vite + React
- React Router (hash mode for GitHub Pages)
- Trystero (WebRTC P2P, Nostr signaling)
