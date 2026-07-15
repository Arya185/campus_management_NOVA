# TODO — NOVA/ARC Phase 3.9 tail → Phase 4.13 + docs/seed

## Planned sequence (Option B: implement missing backends in current repo)

1. [x] Add `AgentAuditLogSchema` to `apps/web/lib/models.ts` and export `AgentAuditLogModel`.
2. [x] Wire existing student agent lifecycle writes into `AgentAuditLogModel` (pending propose, approve/reject, complete/skip, errors) by updating:
   - `apps/web/lib/academic-agent.ts`
   - `apps/web/lib/agent-tools.ts`

3. [ ] Implement Phase 3.9 backend teacher copilot:
   - Create `apps/web/app/api/teacher/copilot/route.ts` with `getServerSession(authOptions)`, `role === "teacher"`, and classroom ownership checks.
   - Implement pending → explicit-approval flow for teacher-created class announcements.
4. [ ] Implement Phase 3.9 teacher copilot page:
   - Create `apps/web/app/teacher/copilot/page.tsx` mirroring UI/approval-card structure from `apps/web/app/student/agent/page.tsx`.
   - Render draft marked “AI-drafted — pending your approval” before it can be posted.
   - Teacher class picker constrained to classrooms in teacher’s profile.
5. [ ] After Phase 3.9 works, implement remaining phases:
   - Phase 3.10 teacher analytics route + page
   - Phase 3.11 institution analytics route + admin page
   - Phase 3.12 AI governance dashboard (read-only) + error surfacing
   - Phase 4.13 student orchestrator route + wiring to underlying agents
6. [ ] Documentation pass in `README.md` with judge-facing “Explanation of the AI Agent” style sections.
7. [ ] Seed/demo pass by extending `apps/web/scripts/seed-demo.ts` so new dashboards show non-empty data.
8. [ ] Verification: run seed + visit new pages; run `pnpm -C apps/web lint` and `pnpm -C apps/web build`.
