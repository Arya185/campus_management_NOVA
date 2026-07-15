# NOVA

Agentic AI learning and academic success platform for students, teachers, and admins.

## What it does

NOVA centers on grounded student-facing AI workflows that read real app data, propose structured outputs, and require approval before mutating state.

Current student agent surfaces:

- `Academic Success Agent` at `/student/agent`
- `Career Roadmap` at `/student/career`
- `Research Assistant` at `/student/research`
- `Project Mentor` at `/student/project-mentor`

## Core agent flows

### Academic Success Agent

Reads timetable, attendance, and assignments. Proposes study plans. Student approves or rejects. Approved plans can be completed or skipped. Skipped sessions can trigger reschedule proposals.

### Career Roadmap

Reads student profile, academic history, and prior roadmap memory. Proposes milestone-based career roadmap. Student approves or rejects pending roadmap.

### Research Assistant

Finds research sources for topic, summarizes response in chat, and lets student save session into `ResearchNote` records.

### Project Mentor

Reads existing projects, proposes milestone plans for new project work, and supports milestone updates. New project plans now enter pending approval flow before becoming active.

## Tech stack

- `Next.js 15` App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `Radix UI` + `shadcn/ui`
- `MongoDB` + `Mongoose`
- `NextAuth.js v4`
- `OpenRouter / OpenAI-compatible tool calling`
- `Flask` ML service in `apps/ml-api`

## Repo layout

```text
apps/
  web/
    app/
      api/
        student/
          agent/
          career-agent/
          research-agent/
          project-mentor/
          orchestrator/
      student/
        agent/
        career/
        research/
        project-mentor/
    lib/
      academic-agent.ts
      career-agent.ts
      research-agent.ts
      project-agent.ts
      agent-tools.ts
      models.ts
  ml-api/
docs/
```

## Setup

### Prerequisites

- `Node.js >= 18`
- `pnpm`
- running MongoDB instance
- OpenRouter-compatible API key for agent flows

### Environment

Copy root example file into web app env file:

```bash
cp .env.example apps/web/.env.local
```

Minimum required values:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `OPENROUTER_API_KEY`

Common optional values:

- `OPENROUTER_API_BASE`
- `OPENROUTER_MODEL`
- `PERFORMANCE_PREDICTOR_API_URL`

## Run locally

Install dependencies:

```bash
pnpm -C apps/web install
```

Seed demo data:

```bash
pnpm -C apps/web seed:demo
```

Start web app:

```bash
pnpm -C apps/web dev
```

Start ML API separately if needed:

```bash
cd apps/ml-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

## Important student API routes

- `POST /api/student/agent`
- `POST /api/student/agent/action`
- `POST /api/student/agent/session`
- `POST /api/student/career-agent`
- `POST /api/student/career-agent/action`
- `POST /api/student/research-agent`
- `POST /api/student/research-agent/save`
- `POST /api/student/project-mentor`
- `POST /api/student/project-mentor/action`

All student mutation routes derive acting student from `getServerSession`. Client does not supply student id.

## Data models used by agent flows

- `StudyPlan`
- `AgentAction`
- `CareerRoadmap`
- `ResearchNote`
- `Project`

## Notes

- `Research Assistant` save path reuses existing persistence logic through `saveResearchNote`.
- `Career Roadmap` and `Project Mentor` now both have dedicated approval routes instead of relying only on orchestrator path.
- Sidebar groups student AI entries under single `AI Agents` section.

## Verification

Latest local verification after agent UI/API updates:

- `pnpm -C apps/web exec tsc --noEmit` passes
- `pnpm -C apps/web lint` does not pass repo-wide because of pre-existing unrelated lint errors, including `apps/web/app/page.tsx`

## Docs

- Product/design direction: [docs/Design.md](docs/Design.md)
- project rules: [docs/Rules.md](docs/Rules.md)
- phase notes: [docs/Phases.md](docs/Phases.md)
