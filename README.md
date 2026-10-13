# SwasthyaSetu — Landing + Secure Role Access

## Tech stack

- React + TypeScript
- Vite
- Lucide React
- Responsive CSS

## Current flow

```text
Landing Page
    ↓
Get Started / Sign In
    ↓
Role Selection
    ├── Patient
    ├── Health Worker (ASHA / ANM / CHO)
    ├── Doctor
    └── Administrator
    ↓
Role-specific Login
    ↓
Demo Login
```

## Important

The existing landing-page design has been preserved visually. The second step has been added as separate reusable pages/components.

### Role selection

Each role has a clear responsibility:

- **Patient:** own records, referrals, appointments and follow-ups.
- **Health Worker:** registration, assessment, referrals, emergency action and follow-up.
- **Doctor:** referrals, patient history, diagnostics and consultations.
- **Administrator:** facilities, referrals, care gaps, resources and analytics.

### Login

The login screen is role-aware and ready for the next backend/security phase. The current buttons use demo behavior only; no real authentication is claimed yet.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Next step

Connect the four role logins to the real dashboard routes and a shared patient/referral data model so all dashboards reflect the same healthcare journey.

## SIH26133 Live Demo

The current prototype is structured around one closed-loop care path: Health Worker -> shared referral -> Doctor -> Admin -> Patient.

### Offline-first prototype

- Care state is persisted in IndexedDB.
- Offline mutations are kept in an outbox queue.
- Reconnect / Sync now posts the current snapshot to the local `/api/sync` demo endpoint.

### Real AI triage

- Worker assessment includes a **Run AI Review** action.
- The Vite server exposes `/api/ai/triage` and keeps the Qwen API key server-side.
- Configure Qwen with the variables in `.env.example`, stored in `.env.local`.

### OpenRouter chat assistant

- The floating SwasthyaSetu Assistant uses the server-side `/api/chat` endpoint; the API key is never sent to the browser.
- Copy the OpenRouter variables from `.env.example` into `.env.local`, set `OPENROUTER_API_KEY`, and restart `npm run dev`.
- Do not add a `VITE_` prefix to secret values. Configure an equivalent private `/api/chat` endpoint when deploying outside Vite dev or preview.
- The assistant provides general service-navigation information only. It does not diagnose, triage emergencies, or prescribe medication.

### Shared facility catalogue

- Worker recommendations, Admin facility metrics and Doctor onward-referral options read from `src/data/facilityData.ts`.

### Jury demo

See `DEMO_SCRIPT.md` for the exact three-minute demonstration sequence.
