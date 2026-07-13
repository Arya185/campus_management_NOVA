# ARC Restructuring --- Rules

**Context:** Solo developer, existing Next.js 15 + TypeScript +
MongoDB/Mongoose + NextAuth + OpenAI + optional Vapi codebase, with a
standalone Student Performance Predictor. The submission deadline is
treated as **July 15, 2026 at 5:00 PM IST**, so this is an emergency MVP
cycle.

These rules prevent the project from becoming an unfinished feature
collection.

## 1. Scope discipline

-   **One flagship agent only.** Build the Academic Success Agent
    end-to-end.
-   **One complete agentic loop beats ten shallow AI features.**
-   The hackathon MVP must demonstrate: **read real state → plan → use
    tools → propose action → ask approval → act → persist**.
-   If time permits, add one minimal **observe → reflect → adapt** loop
    using completed/skipped study sessions.
-   **Reuse before building.** Existing timetable, attendance,
    classroom, resources, auth, dashboards, and AI integration should be
    extended rather than rewritten.
-   The Student Performance Predictor is optional. Integrate it only
    after the core agent flow works.
-   **Delete distractions completely.** Canteen, food ordering, parking,
    and campus map must be removed from routes, navigation, role
    handling, APIs, and models.
-   New roadmap features are not hackathon tasks unless the flagship
    flow and submission assets are already finished.

## 2. Definition of "agentic" for this MVP

The Academic Success Agent must:

1.  **Read real application state** through defined tools:
    -   timetable
    -   attendance
    -   upcoming assignments
2.  **Create a visible multi-step plan**, not just return advice in
    prose.
3.  **Use tools** for both reading and at least one state-changing
    workflow.
4.  **Require human approval** before activating a proposed plan or
    reschedule.
5.  **Persist state** so plans and decisions survive page reloads.
6.  **Expose observable activity**, such as which tools were used and
    concise results.
7.  **Never expose hidden chain-of-thought.** Show only an Agent
    Activity/Execution Trace and concise rationale summary.
8.  **Prefer one small reflection loop** if time allows:
    -   student marks a session completed or skipped
    -   agent observes the result
    -   agent proposes an adapted plan
    -   user approves or rejects the adaptation

## 3. Non-negotiables

-   **Exactly three roles:** Student, Teacher, Institution/Admin.
-   Remove the Canteen role everywhere.
-   **No new major external dependency.**
-   Use the existing stack wherever possible.
-   **No new vector database, auth provider, payment system, or agent
    framework** during this cycle.
-   Every removed feature must be removed completely:
    -   routes
    -   API endpoints
    -   sidebar/navigation links
    -   role checks
    -   app-facing models
    -   signup options
-   Every retained module must stay functional.
-   Do not rebuild a working module merely to make it look newer.
-   The demo-critical path must remain runnable: **login → student
    dashboard → agent → plan → approval → visible result**.
-   Never merge a change that breaks that path once it exists.
-   Never commit real secrets. Rotate any exposed credentials and
    maintain a clean `.env.example`.

## 4. MVP priority order

Work in this exact order:

1.  Safety and working local baseline
2.  Remove Canteen role and distracting modules
3.  Seed realistic demo data
4.  Create agent models and read tools
5.  Build agent orchestration
6.  Build pending approval flow
7.  Show approved plan in the UI
8.  Add completed/skipped session state
9.  Add adaptation/reschedule loop if time remains
10. Record demo and prepare submission
11. Only then consider optional polish

If a lower-priority item threatens the submission deadline, cut it.

## 5. Working method

-   Work on one restructuring branch or small focused branches only if
    branch management will not slow development.
-   Commit in small, working increments.
-   Test the app after every destructive removal pass.
-   Seed data before testing agent quality.
-   Use a single, repeatable demo account and dataset.
-   Use a single, repeatable demo prompt: **"Plan my exam week."**
-   Keep a tested fallback response path only for demo resilience; do
    not fake tool use or claim actions that did not occur.
-   Time-box tasks aggressively. If a non-critical task runs long, cut
    it.
-   Stop feature development early enough to record the video, capture
    screenshots, update the README, and submit.

## 6. Data and AI safety rules

-   State-changing actions require explicit user approval.
-   The agent may propose a plan before approval, but it may not
    silently activate it.
-   Store:
    -   tool names used
    -   concise input/output summaries
    -   timestamps
    -   action status
    -   concise user-facing rationale
-   Do **not** store or display hidden chain-of-thought.
-   Avoid raw exception messages and secrets in the UI.
-   Agent memory must be minimal and relevant:
    -   academic goals
    -   study-time preference
    -   approved plans
-   Users should be able to change their preferences.
-   Do not claim the system "predicts" academic outcomes unless an
    actual model or defined scoring method is used.

## 7. Explicitly out of scope

Do not build these during the emergency MVP cycle:

-   Multi-Agent Orchestrator
-   Teacher Copilot
-   Career Roadmap Agent
-   Interview Practice Agent
-   Research Assistant
-   Project Mentor Agent
-   Coding Lab/Judge0 integration
-   New AI Notes system
-   New quiz/flashcard system
-   Major Teacher analytics
-   Major Institution analytics
-   Full AI Governance dashboard
-   Major UI redesign
-   Theme customization
-   New payment flows
-   New external infrastructure

These belong in **Future Work**.

## 8. Definition of done

The project is ready to submit when:

-   It builds and runs.
-   Student login works.
-   Canteen/parking/food/map features are no longer reachable.
-   A seeded student has timetable, attendance, and assignment data.
-   The agent reads that data through tools.
-   The agent proposes a structured study plan.
-   The proposal is persisted and shown as pending approval.
-   Approve and Reject work.
-   Approval causes a visible state change.
-   The plan survives refresh.
-   The demo can be repeated reliably.
-   README, screenshots, demo video, repository, and agent explanation
    are ready.

Everything beyond this is optional.
