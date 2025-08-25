# gambino-users

Next.js app for **Gambino** user onboarding, dashboards, and leaderboard.

## Quick Start

```bash
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_BACKEND_URL if your API is not on http://localhost:3001

npm i
npm run dev
```

Open http://localhost:3000

## Pages
- `/` Landing
- `/onboard` Create account → calls `POST /api/users/create`
- `/login` Login via email only → calls `POST /api/users/login`
- `/dashboard` Protected; calls `GET /api/users/profile`
- `/leaderboard` Public; calls `GET /api/leaderboard`
- `/account` Protected; profile/settings

## Notes
- Auth uses a simple JWT stored in `localStorage` (starter only).
- API base URL comes from `NEXT_PUBLIC_BACKEND_URL`.
- Tailwind preconfigured; minimal design tokens set.
# gambino-users
# gambino-users
# gambino-users
