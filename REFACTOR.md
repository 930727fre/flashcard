# Future Refactor: Self-Hosted Backend on Raspberry Pi

Replace the Google Apps Script + Google Sheets backend with a proper self-hosted stack running on a Raspberry Pi, exposed via Cloudflare Tunnel (no port forwarding required).

## Motivation

- GAS cold-starts cause slow syncs (tens of seconds after inactivity)
- Writes are fire-and-forget (`no-cors`) — no confirmation of success
- No real error handling possible on write responses
- GAS execution limits and quota constraints

## Target Stack

| Layer | Choice | Reason |
|---|---|---|
| API | FastAPI (Python) | Lightweight, fast, minimal boilerplate |
| DB | SQLite | Zero setup, sufficient for personal scale |
| Container | Docker Compose | Clean separation, easy to restart/update |
| Tunnel | Cloudflare Tunnel (`cloudflared`) | No port forwarding, free, hides origin IP |

## Architecture

```
[Browser / PWA]
      |
      | HTTPS
      v
[Cloudflare Tunnel]
      |
      v
[Raspberry Pi]
  └── cloudflared (container)
  └── FastAPI app (container)
  └── SQLite DB (volume mount)
```

## API Design (replacing GAS)

| Endpoint | Method | Replaces |
|---|---|---|
| `/cards` | GET | `gasApi.getAll()` |
| `/cards` | POST | `gasPost({ action: 'batchAdd' })` |
| `/cards/:id` | PATCH | `gasPost({ action: 'updateCard' })` |
| `/settings` | GET | settings fetch in `getAll` |
| `/settings` | PATCH | `gasPost({ action: 'updateSettings' })` |

## Frontend Changes Required

- `src/api.ts` — replace `gasApi.*` and `gasPost()` with normal `fetch()` calls; remove `no-cors` workaround
- `src/store.ts` — swap `gasUrl` (GAS deployment URL) for a generic `apiUrl`; real error handling becomes possible
- `src/pages/SettingsPage.tsx` — update URL input label/hint

## Pi Reliability Considerations

- Use USB SSD instead of SD card to avoid corruption
- Set up Docker restart policies (`restart: unless-stopped`)
- Simple health check endpoint (`GET /health`) for monitoring
- Periodic SQLite backups (cron job copying DB file to cloud storage)

## Migration Plan

1. Build and test FastAPI app locally
2. Set up Docker Compose on Pi
3. Configure Cloudflare Tunnel
4. Run new backend in parallel with GAS temporarily
5. Switch `apiUrl` in frontend, verify all operations
6. Decommission GAS deployment
