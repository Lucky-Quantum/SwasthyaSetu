# SwasthyaSetu

### Integrated Rural Care Continuity & Referral Coordination Platform

**Smart India Hackathon 2026 · Problem Statement SIH26133 · Team QuantumShift_IITP**

SwasthyaSetu is a healthcare-workflow prototype focused on a critical gap in rural and underserved communities: care can become fragmented as a patient moves between frontline workers, primary-care facilities, specialists, diagnostics, treatment, and follow-up.

Its central principle is:

> **A referral created ≠ care completed.**

SwasthyaSetu aims to make referral progress and the next required care action visible to the relevant people throughout a patient's care journey. It is designed to complement existing public-health services, not replace them.

> **Project status:** Hackathon prototype using synthetic/demo data. This repository is not a production clinical system and must not be used to make real-world medical decisions.

---

## Table of contents

- [Problem](#problem)
- [Solution overview](#solution-overview)
- [Core workflows](#core-workflows)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Optional AI API configuration](#optional-ai-api-configuration)
- [Tests and production build](#tests-and-production-build)
- [Deployment](#deployment)
- [Offline behavior and data persistence](#offline-behavior-and-data-persistence)
- [Clinical safety, privacy, and limitations](#clinical-safety-privacy-and-limitations)
- [Repository structure](#repository-structure)
- [Team and problem statement](#team-and-problem-statement)

## Problem

Rural healthcare journeys can break between stages of care. Common challenges include:

- Patient information spread across different healthcare touchpoints.
- Referrals made without clear visibility into whether the next facility received or completed them.
- Uncertainty about specialist, diagnostic, or medicine availability before travel.
- Missed follow-ups for maternal, child, and chronic-care needs.
- Limited connectivity and digital-literacy or language barriers for frontline workers.

## Solution overview

SwasthyaSetu brings these steps into one role-oriented workflow:

**Patient registration → Assessment → Rule-based triage → Referral → Facility review → Consultation and care → Follow-up → Referral closure**

The prototype includes the following role views:

- **Patient / Family:** View relevant patient and referral information in the demo journey.
- **Frontline Health Worker:** Register/select a demo patient, record symptoms and vital signs, run a guided triage review, and initiate or track referrals.
- **Doctor / Specialist:** Review incoming referrals, update referral status, record demo clinical actions, manage appointment details, and prepare a demo prescription.
- **Facility / District Administrator:** Review referral activity, care gaps, and facility-level operational summaries from the shared demo state.

The application uses seeded synthetic records so the main journey can be demonstrated without real patient data.

## Core workflows

### Closed-loop referral tracking

The referral status and journey stages make the next care step visible. The demo can be used to show a referral moving from a frontline-worker workflow to the doctor, administrator, and patient views.

### Guided triage support

The local rules-based triage engine provides a prototype screening result from entered symptoms and vital signs. It is decision support only; it does not diagnose, prescribe, or replace a qualified clinician. Results require clinician review.

### Resource-aware referral concept

The interface supports referral workflows using the prototype's facility data and reported availability information. Live hospital capacity, specialist schedules, diagnostics, or medicine inventory feeds are not connected by this repository's demo API routes.

### Multilingual interface

The interface includes English, Hindi, and Marathi translation resources. Exact language coverage may vary by screen.

### Offline-first foundations

The application includes IndexedDB-based browser persistence/outbox behavior and service-worker caching for the application shell and static resources on supported HTTPS deployments. Cloud AI requires network access.

## Technology stack

- **Frontend:** React 18, TypeScript, Vite
- **UI icons:** Lucide React
- **Internationalization:** i18next and react-i18next
- **Local data:** IndexedDB/browser-local care state and outbox
- **App caching:** Service Worker and web app manifest
- **Optional AI integrations:** Qwen-compatible Model Studio endpoint for triage summaries and OpenRouter for navigation chat
- **API layer:** Shared Node.js handlers, Vite development/preview middleware, and Vercel serverless function adapters
- **Testing:** Node.js built-in test runner

## Architecture

```text
React role dashboards
        │
        ├── Shared in-browser care store
        │      └── Seeded synthetic patient and referral data
        │
        ├── Local triage service
        │      └── Rules-based fallback when cloud AI is unavailable
        │
        └── Same-origin API routes
               ├── /api/ai/triage  → optional Qwen-compatible provider
               ├── /api/chat       → optional OpenRouter provider
               └── /api/sync       → demo receipt only (not cloud persistence)
```

The role views share care state within the same browser session/application storage. This is sufficient for a single-browser hackathon demonstration; it is not a secure multi-user, cross-device data architecture.

## Getting started

### Prerequisites

- Node.js compatible with the installed Vite version (Node.js 20 LTS is a suitable starting point).
- npm.
- Optional: API keys for the cloud AI features. The basic local prototype can run without them.

### Install and run locally

From your cloned repository's project root, run:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. If you already have the project files, you do not need to clone the repository again.

### Available scripts

```bash
npm run dev        # Start Vite development server
npm run build      # Type-check and build the production frontend
npm run preview    # Preview the built frontend locally
npm run test:api   # Run API-handler tests
```

## Optional AI API configuration

Copy `.env.example` to `.env.local` and add only the credentials for providers you intend to use. Restart the development server after changing environment variables.

```dotenv
# Qwen-compatible provider (optional)
QWEN_API_KEY=
QWEN_BASE_URL=
QWEN_MODEL=qwen-plus

# OpenRouter (optional)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_SITE_URL=http://localhost:5173
```

- `QWEN_BASE_URL` must be the OpenAI-compatible API base URL supplied by your provider workspace. Do not append the chat-completions path unless your provider specifically requires it.
- Use a model identifier enabled for your own provider account.
- Keep all API secrets server-side. **Never prefix secret variables with `VITE_`, commit `.env.local`, or expose keys in client-side code.**
- Without provider credentials, triage uses the local rules-based fallback and the chat widget uses its built-in navigation responder.
- A local fallback response does not indicate that a cloud model was called; check the model/status label in the UI.

Additional setup notes are available in [`API_SETUP.md`](API_SETUP.md).

## Tests and production build

Run:

```bash
npm run test:api
npm run build
```

The API tests use Node's built-in test runner and mock provider responses; they do not validate real provider credentials or live upstream service availability. Always run the production build in the same environment used for deployment.

## Deployment

### Vercel

1. Import the repository into Vercel and deploy the project root.
2. Confirm the project uses `npm run build` and `dist` as the output directory.
3. Add the required provider environment variables in **Project Settings → Environment Variables** if cloud AI is enabled.
4. Redeploy after changing environment variables.
5. Verify `POST /api/ai/triage`, `POST /api/chat`, and `POST /api/sync` in the deployed environment.

The `api/` directory contains serverless adapters and `vercel.json` configures the Vite build output. For a different static host, equivalent server-side functions are required for cloud AI calls; uploading only the `dist/` folder does not provide those API routes.

## Offline behavior and data persistence

- The Service Worker can cache the app shell and static assets on supported HTTPS deployments.
- IndexedDB is used for browser-local state/outbox behavior.
- Browser-local state does not automatically synchronize between different users, browsers, or devices.
- `POST /api/sync` currently returns a demo receipt and explicitly reports `persisted: false`. It does **not** write to a durable cloud database.
- The application does not connect to live facility systems, live queue feeds, live diagnostic systems, or live medicine inventory feeds in this prototype.

## Clinical safety, privacy, and limitations

SwasthyaSetu is a demonstration prototype. It is not approved for clinical use.

- Demo login and role selection are not production authentication or authorization.
- The triage engine uses prototype heuristics and is not a validated medical device or diagnostic model.
- AI-generated summaries, when configured, are optional decision-support aids and must not be treated as a diagnosis or prescription.
- Use synthetic or de-identified data only in public demos and development environments.
- No live ABDM or FHIR integration is claimed. Standards-based interoperability and ABDM integration are future work, subject to technical access, approvals, consent requirements, and applicable policies.
- Production readiness would require verified identity and access control, secure persistent storage, consent and audit workflows, threat modelling, clinical validation, retention controls, incident handling, and appropriate legal/security review.

If a real emergency may be occurring, users must follow local emergency procedures and seek qualified medical care rather than wait for an application or AI response.

## Repository structure

```text
.
├── api/                      # Vercel serverless API adapters
├── components/               # Shared React UI components
├── pages/                    # Landing, login, and role dashboards
├── public/
│   ├── assets/               # Logo and visual assets
│   ├── manifest.webmanifest  # PWA manifest
│   └── sw.js                 # Service Worker
├── server/                   # Shared API handler implementation
├── shared/                   # Shared triage engine
├── src/
│   ├── data/                 # Seed data and facility data
│   ├── locales/              # English, Hindi, and Marathi resources
│   ├── services/             # Triage and offline sync services
│   ├── store/                # Shared care store
│   ├── App.tsx               # Application root
│   ├── i18n.ts                # Internationalization setup
│   ├── main.tsx               # Frontend entry point
│   └── styles.css             # Global and role-dashboard styling
├── tests/                    # API handler tests
├── .env.example              # Example server-side environment variables
├── package.json
├── vite.config.ts
└── vercel.json
```

## Team and problem statement

- **Project:** SwasthyaSetu — Integrated Rural Care Continuity & Referral Coordination Platform
- **Hackathon:** Smart India Hackathon 2026
- **Problem Statement:** SIH26133 — Accessibility and Quality of Public Healthcare Services, particularly in rural and underserved areas
- **Team:** QuantumShift_IITP
- **Team ID:** 169345

---

**SwasthyaSetu — Connect. Coordinate. Continue.**
