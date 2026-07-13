# ARC Restructuring --- Design

## 1. Product framing

**Before:** ARC --- a broad campus management system covering academics,
canteen, parking, payments, and campus operations.

**After:** ARC --- an **Agentic AI Learning & Academic Success
Platform** for Students, Teachers, and Institution/Admin, centered on
one flagship agent: the **Academic Success Agent**.

**Primary hackathon theme:** Education AI.

**One-line pitch:**\
*ARC gives every student a personal academic agent that reads their real
timetable, attendance, assignments, and workload; creates an adaptive
plan; asks for approval before changing anything; and learns from
completed or missed sessions to improve the next plan.*

### MVP promise

For the hackathon, ARC must prove one complete agentic loop:

**Understand goal → Read real app state → Plan → Propose action → Ask
approval → Act → Observe outcome → Adapt**

The hackathon MVP is **not** a multi-agent platform. Additional agents
remain future work.

------------------------------------------------------------------------

## 2. Information architecture

``` text
/login, /signup
  Student, Teacher, Institution/Admin only

/student
  /dashboard        — priorities + unified agent command bar
  /agent            — agent conversation, plan, activity, approvals
  /timetable        — existing timetable + approved study sessions
  /attendance       — existing attendance + risk flag
  /classroom        — existing academic classroom
  /resources        — existing resources
  /internships      — existing opportunity hub, lightly reframed
  /events           — academic/career events only
  /fees             — keep only if already working; not demo-critical
  /examination      — keep only if already working; not demo-critical
  /profile

/teacher
  /dashboard        — existing dashboard, lightly reframed
  /classroom
  /resources

/admin
  /dashboard        — institution/academic framing
  /events
  /internships
  /resources
```

### Remove completely

``` text
/canteen/**
/student/food/**
/teacher/food/**
/student/parking/**
/teacher/parking/**
/admin/parking/**
/student/map/**
/signup/canteen/**
```

Also remove related API routes, models, role checks, sidebar links,
homepage copy, and seed data.

### Not required for the submission demo

-   Teacher analytics
-   Admin AI governance UI
-   Multi-agent orchestration
-   Career, interview, research, project, or coding agents
-   Major visual redesign

These belong in the roadmap unless the flagship flow is already complete
and the submission assets are finished.

------------------------------------------------------------------------

## 3. Minimal data model additions

Use `lib/agent-models.ts` or extend the existing models cleanly.

``` ts
// StudyPlan — structured output proposed by the agent
{
  studentId: ObjectId,
  goal: string,
  sessions: [{
    id: string,
    subject: string,
    day: string,
    startTime: string,
    endTime: string,
    reason: string,
    status: "planned" | "completed" | "skipped"
  }],
  status: "pending_approval" | "approved" | "rejected" | "completed",
  createdAt: Date,
  updatedAt: Date
}

// AgentAction — approval queue + audit/activity log
{
  studentId: ObjectId,
  type: "create_study_plan" | "reschedule_study_session",
  summary: string,
  activity: [{
    tool: string,
    inputSummary: string,
    outputSummary: string,
    timestamp: Date
  }],
  rationaleSummary: string,
  status: "pending_approval" | "approved" | "rejected",
  createdAt: Date,
  decidedAt?: Date
}

// AgentMemory — minimal persistent user context
{
  studentId: ObjectId,
  goals: [string],
  preferences: {
    preferredStudyTime?: string
  },
  updatedAt: Date
}
```

### Important terminology

Do **not** store or expose hidden chain-of-thought or call the activity
log a "reasoning trace."

Use:

-   **Agent Activity**
-   **Execution Trace**
-   **Decision Summary**
-   **Rationale Summary**

Store observable tool usage, concise results, decisions, and user-facing
rationale.

`User` role enum becomes:

``` ts
"student" | "teacher" | "admin"
```

------------------------------------------------------------------------

## 4. Flagship agent architecture

``` text
User goal
"Plan my exam week"
        │
        ▼
Agent orchestration route
        │
        ├─ Read persistent student goal/preferences
        │
        ├─ Call READ tools:
        │    getStudentTimetable(studentId)
        │    getAttendanceSummary(studentId)
        │    getUpcomingAssignments(studentId)
        │
        ├─ Generate a structured multi-session plan
        │
        ├─ Call WRITE tool:
        │    proposeStudyPlan(studentId, plan)
        │
        │    Creates:
        │    - StudyPlan(status = pending_approval)
        │    - AgentAction(status = pending_approval)
        │
        ▼
Approval UI
        │
        ├─ Approve
        │    → StudyPlan.status = approved
        │    → sessions become active
        │    → dashboard/timetable displays them
        │
        └─ Reject
             → StudyPlan.status = rejected
             → user can request a revision
```

### Reflection and adaptation loop

After approval, the student can mark a session:

``` text
Completed
or
Skipped
```

If a session is skipped:

``` text
Observe skipped session
        │
        ▼
Read next available timetable window
        │
        ▼
Propose a rescheduled session
        │
        ▼
Ask for approval again
```

Example:

> "You skipped Tuesday's DBMS session. I found a free slot on Thursday
> at 7:00 PM. Would you like me to reschedule it?"

This demonstrates:

**Reason → Plan → Tool Use → Act → Observe → Reflect → Adapt**

------------------------------------------------------------------------

## 5. Tool contract

Keep the tool layer small, typed, and easy to explain.

``` ts
type AgentTool = {
  name: string;
  description: string;
  parameters: JSONSchema;
  handler: (
    input: unknown,
    context: { studentId: string }
  ) => Promise<unknown>;
};
```

### MVP tools

**Read tools** 1. `getStudentTimetable` 2. `getAttendanceSummary` 3.
`getUpcomingAssignments`

**Write tools** 4. `proposeStudyPlan` 5. `proposeReschedule` --- only if
the reflection loop is implemented

Do not add more tools until the core flow works end-to-end.

------------------------------------------------------------------------

## 6. Student UX flow --- primary demo

1.  Student lands on `/student/dashboard`.
2.  Dashboard shows a **Priorities** panel and **Ask your Academic
    Agent** command bar.
3.  Student enters: **"Plan my exam week."**
4.  Agent Activity shows concise observable progress:
    -   Checking timetable
    -   Checking attendance
    -   Checking upcoming assignments
5.  Agent displays a structured study plan with:
    -   subject
    -   date/day
    -   time
    -   reason
6.  Plan is clearly marked **Pending approval**.
7.  Student approves it.
8.  Approved sessions appear on the dashboard and/or timetable.
9.  Student marks one session **Skipped**.
10. Agent proposes a new available slot and asks for approval.

This is the complete flagship demo.

------------------------------------------------------------------------

## 7. Teacher and Institution/Admin roles

These roles remain in the product but are **supporting roles for this
hackathon submission**.

### Teacher

Keep the existing working functionality and make only small framing
changes:

-   Dashboard copy focused on teaching and student progress
-   Classroom
-   Attendance
-   Resources
-   Timetable

Do not build a new Teacher Copilot or analytics system before the
flagship student agent is complete.

### Institution/Admin

Keep:

-   User/institution management
-   Events
-   Internships
-   Resources
-   Existing academic administration that already works

Remove canteen and parking references.

A governance screen is **future work** unless the flagship flow and
submission are already complete.

------------------------------------------------------------------------

## 8. Visual and UX principles

-   Keep the existing Radix/shadcn + Tailwind design system.
-   Do not spend hackathon time redesigning working pages.
-   Focus visual effort on:
    -   unified agent command bar
    -   Agent Activity
    -   structured plan cards
    -   approval/rejection states
    -   completed/skipped session states
-   Use clear visual distinction for:
    -   pending
    -   approved
    -   rejected
    -   completed
    -   skipped
-   Never display raw tool JSON or hidden model reasoning.
-   Keep user control obvious: no state-changing action is applied
    without approval.

------------------------------------------------------------------------

## 9. Demo script --- 3 to 4 minutes

1.  **Problem --- 20 seconds**\
    Students juggle attendance, timetables, assignments, and study
    planning across disconnected systems.

2.  **Product --- 10 seconds**\
    ARC is an Agentic AI Learning & Academic Success Platform centered
    on a personal Academic Success Agent.

3.  **Primary agent flow --- 90 seconds**\
    Ask: "Plan my exam week."\
    Show Agent Activity reading real timetable, attendance, and
    assignments.\
    Show the structured plan waiting for approval.

4.  **Action --- 20 seconds**\
    Approve the plan and show it appearing in the student's active
    schedule.

5.  **Reflection --- 30 seconds**\
    Mark one session skipped. Show the agent proposing a rescheduled
    slot and asking for approval.

6.  **Platform breadth --- 20 seconds**\
    Briefly show existing Teacher and Institution/Admin views without
    deep-diving into unfinished features.

7.  **Close --- 20 seconds**\
    Mention Next.js, TypeScript, MongoDB/Mongoose, NextAuth, OpenAI
    tool/function calling, and the roadmap.

------------------------------------------------------------------------

## 10. Success criteria

The submission is demo-ready when all of the following work reliably:

-   Student can enter a natural-language academic goal.
-   Agent reads real seeded app data through tools.
-   Agent creates a structured multi-step plan.
-   Agent shows an observable activity/execution summary.
-   Plan is persisted as pending approval.
-   Student can approve or reject it.
-   Approved plan changes visible app state.
-   At least one completed/skipped outcome can be recorded.
-   A skipped session can trigger a proposed adaptation, if implemented.
-   Refreshing the page does not lose the plan.
-   No canteen, parking, food-ordering, or campus-map routes remain
    reachable.
