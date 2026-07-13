# ARC Restructuring --- Emergency MVP Phases

**Working window:** July 13 → July 15, 2026\
**Submission target:** July 15, 2026 at 5:00 PM IST\
**Rule:** stop adding features early enough to record, upload, and
submit safely.

This plan replaces the previous July 31 timeline.

------------------------------------------------------------------------

## Phase 0 --- Safety + Baseline

**Time box:** 1--2 hours

### Tasks

-   [ ] Confirm the current project runs locally.
-   [ ] Confirm Student, Teacher, Admin, and current Canteen login
    behavior before removal.
-   [ ] Create a safe restructuring branch,
    e.g. `restructure/agentic-mvp`.
-   [ ] Confirm the Git remote and push the current baseline.
-   [ ] Rotate any secrets that were exposed in shared archives or
    repositories.
-   [ ] Ensure `.env.local` is ignored.
-   [ ] Create/update `.env.example` with placeholder values only.
-   [ ] Identify the exact files for:
    -   user roles/auth
    -   student dashboard
    -   timetable
    -   attendance
    -   assignments/classroom
    -   current AI Mentor / AI route

### Done when

-   App runs.
-   Current state is backed up.
-   No real secret is intentionally committed.
-   You know the files on the demo-critical path.

------------------------------------------------------------------------

## Phase 1 --- Strip Distracting Modules

**Time box:** 2--3 hours

### Remove

-   [ ] `app/canteen/**`
-   [ ] `app/student/food/**`
-   [ ] `app/teacher/food/**`
-   [ ] `app/student/parking/**`
-   [ ] `app/teacher/parking/**`
-   [ ] `app/admin/parking/**`
-   [ ] `app/student/map/**`
-   [ ] `app/signup/canteen/**`

### Clean up

-   [ ] Remove Canteen from the User role enum.
-   [ ] Remove Canteen from signup.
-   [ ] Remove Canteen role checks from middleware/auth callbacks.
-   [ ] Remove Food/Parking/Map/Canteen links from all sidebars.
-   [ ] Remove related API routes.
-   [ ] Remove related model imports and app-facing dead code.
-   [ ] Remove homepage copy advertising removed modules.

### Verify

``` bash
grep -rEi "canteen|parking|campus.?map|food.?order" app components lib
```

Review remaining hits manually.

### Done when

-   Student, Teacher, and Admin still log in.
-   No sidebar points to removed pages.
-   App builds.
-   Removed features are not reachable.

------------------------------------------------------------------------

## Phase 2 --- Seed the Demo + Agent Data Models

**Time box:** 2--3 hours

### Seed one reliable demo student

Create enough realistic data for:

-   [ ] timetable
-   [ ] attendance, including at least one risk or weak area
-   [ ] 2--4 upcoming assignments/deadlines
-   [ ] subjects/courses

Use one repeatable demo account.

### Add minimal models

-   [ ] `StudyPlan`
-   [ ] `AgentAction`
-   [ ] `AgentMemory` only if it is quick and clean

### StudyPlan requirements

-   [ ] goal
-   [ ] structured sessions
-   [ ] pending/approved/rejected/completed status
-   [ ] per-session planned/completed/skipped state

### AgentAction requirements

-   [ ] action type
-   [ ] concise summary
-   [ ] Agent Activity / tool usage summaries
-   [ ] concise rationale summary
-   [ ] pending/approved/rejected status

### Done when

-   Seed data is visible in the existing app.
-   Models can save and reload test documents.

------------------------------------------------------------------------

## Phase 3 --- Build the Core Agent Tools

**Time box:** 2--3 hours

Create clean server-side functions:

-   [ ] `getStudentTimetable(studentId)`
-   [ ] `getAttendanceSummary(studentId)`
-   [ ] `getUpcomingAssignments(studentId)`
-   [ ] `proposeStudyPlan(studentId, plan)`

Optional only after these work:

-   [ ] `proposeReschedule(studentId, session)`

### Rules

-   Read tools return concise structured data.
-   The write tool creates a **pending approval** proposal.
-   No proposed plan becomes active automatically.
-   Log observable tool activity, not hidden chain-of-thought.

### Done when

Each tool can be tested independently against the seeded student.

------------------------------------------------------------------------

## Phase 4 --- Academic Success Agent End-to-End

**Time box:** 4--6 hours

This is the highest-priority phase.

### Build

-   [ ] Add/extend an agent API route.
-   [ ] Accept a natural-language goal.
-   [ ] Give the model access to the defined tools.
-   [ ] Read real student state.
-   [ ] Generate a structured multi-session plan.
-   [ ] Save the proposal with `pending_approval`.
-   [ ] Return:
    -   concise response
    -   structured plan
    -   Agent Activity summary
    -   action ID/status

### Primary test prompt

> Plan my exam week.

### Required behavior

1.  Read timetable.
2.  Read attendance.
3.  Read upcoming assignments.
4.  Create a sensible structured plan.
5.  Persist it as pending approval.
6.  Do not activate it yet.

### Done when

The same demo prompt reliably creates a useful persisted proposal.

------------------------------------------------------------------------

## Phase 5 --- Approval + Visible Action

**Time box:** 3--4 hours

### Student UI

On the student dashboard or `/student/agent`:

-   [ ] Unified "Ask your Academic Agent" input.
-   [ ] Agent Activity list:
    -   Checking timetable
    -   Checking attendance
    -   Checking upcoming assignments
-   [ ] Structured study-plan cards.
-   [ ] Pending approval state.
-   [ ] Approve button.
-   [ ] Reject button.

### On approval

-   [ ] Update `AgentAction`.
-   [ ] Update `StudyPlan`.
-   [ ] Show approved sessions on the dashboard and/or timetable.

### On rejection

-   [ ] Mark the proposal rejected.
-   [ ] Allow the user to submit a revised request.

### Done when

This exact flow works:

**Login → Ask agent → See plan → Approve → See visible active plan →
Refresh → Plan remains**

This is the minimum submission-worthy demo.

------------------------------------------------------------------------

## Phase 6 --- Minimal Reflection Loop

**Time box:** 1--2 hours maximum\
**Cut this phase if it threatens submission preparation.**

### Add

-   [ ] Completed button for a study session.
-   [ ] Skipped button for a study session.

If a session is skipped:

-   [ ] Find a future available slot using timetable data.
-   [ ] Propose a reschedule.
-   [ ] Require approval before changing the active plan.

### Demo line

> "The agent does not stop after generating a plan. It observes what
> happened and adapts the next action, while keeping the student in
> control."

### Done when

One skipped session can produce one approval-gated adaptation.

------------------------------------------------------------------------

## Phase 7 --- Submission Preparation

**Start no later than:** several hours before the deadline.\
Do not wait for every optional feature.

### Required work

-   [ ] Run a clean build.
-   [ ] Test the full demo flow at least 3 times.
-   [ ] Rewrite README around the new product framing.
-   [ ] Add an **Explanation of the AI Agent** section covering:
    -   real state/data
    -   planning
    -   tool use
    -   approval
    -   persistence
    -   adaptation, if implemented
-   [ ] Capture screenshots:
    -   student dashboard
    -   agent activity
    -   proposed plan
    -   approval state
    -   approved plan
-   [ ] Record the 3--4 minute demo video.
-   [ ] Confirm repository access is correct.
-   [ ] Confirm `.env.example` is safe.
-   [ ] Submit with buffer.

### Demo order

1.  Problem
2.  Student dashboard
3.  "Plan my exam week"
4.  Agent Activity
5.  Structured pending plan
6.  Approve
7.  Visible active plan
8.  Optional skipped-session adaptation
9.  Brief Teacher/Admin view
10. Architecture + future work

### Done when

The submission is fully uploaded and confirmed.

------------------------------------------------------------------------

# Cut order if time slips

Cut in this order:

1.  Student Performance Predictor integration
2.  Vapi/voice improvements
3.  Reflection/reschedule loop
4.  Teacher dashboard changes beyond copy
5.  Admin dashboard changes beyond removing old modules
6.  Any new analytics
7.  Any visual polish not used in the demo

**Never cut:**

-   real data tools
-   structured planning
-   pending approval
-   visible state change
-   persistence
-   submission assets

------------------------------------------------------------------------

# Final MVP checklist

-   [ ] Exactly three roles remain.
-   [ ] Canteen/food/parking/map removed.
-   [ ] Seeded demo student has real academic data.
-   [ ] Agent reads timetable.
-   [ ] Agent reads attendance.
-   [ ] Agent reads upcoming assignments.
-   [ ] Agent proposes a structured plan.
-   [ ] Proposal is persisted.
-   [ ] Proposal requires approval.
-   [ ] Approval creates a visible active result.
-   [ ] Refresh preserves the result.
-   [ ] No hidden chain-of-thought is exposed.
-   [ ] Demo is repeatable.
-   [ ] README, screenshots, video, repo, and submission are ready.
