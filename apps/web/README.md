# ARC - Agentic AI Learning & Academic Success Platform

ARC gives every student a personal **Academic Success Agent** that reads their real timetable, attendance, assignments, and workload; creates an adaptive plan; asks for approval before changing anything; and learns from completed or missed sessions to improve the next plan.

---

## 🎯 Overview

ARC has evolved into a focused educational AI platform centered on the flagship **Academic Success Agent**. Instead of disconnected tools for campus management, ARC provides an intelligent, grounded agent that reasons over real academic data and helps students succeed through structured planning, reflection, and adaptation.

---

## 🤖 Explanation of the AI Agent

The Academic Success Agent demonstrates a complete, grounded, agentic loop:

1. **Understand Goal**: The student provides a natural language goal (e.g., "Plan my exam week").
2. **Read Real App State**: The agent uses deterministic **Read Tools** to pull the student's live timetable, attendance risk, and upcoming assignment deadlines from the database. It does NOT hallucinate classes or deadlines.
3. **Plan**: The agent reasons over the data (e.g., identifying at-risk subjects) to formulate a structured study plan with specific sessions.
4. **Propose Action**: The agent calls a **Write Tool** (`proposeStudyPlan`) which persists the plan and creates an `AgentAction` record.
5. **Ask Approval**: Crucially, the agent **does not automatically activate changes**. The plan is presented to the user in a `pending_approval` state.
6. **Act**: The user reviews the plan and clicks "Approve". Only then does the backend apply the mutation, syncing the study sessions to the active schedule.
7. **Observe & Adapt (Reflection Loop)**: The student marks sessions as "Completed" or "Skipped". If a session is skipped, the agent detects this, finds the next available timetable window, and proposes a rescheduled session—asking for approval again.

_All agent activity is transparently logged in an "Agent Activity" trace, but raw JSON and hidden reasoning are kept out of the user's view._

---

## 📹 Demo Flow

1. **Dashboard**: The student lands on their dashboard and opens the Agent Workspace.
2. **Goal**: The student says, "Plan my exam week, prioritize Data Structures because I am at-risk."
3. **Observation**: The UI shows the agent calling tools: `Checking timetable`, `Checking attendance`, `Checking upcoming assignments`.
4. **Proposal**: A structured study plan appears, explicitly marked **Pending approval**.
5. **Approval**: The student approves it. The plan is now active.
6. **Reflection**: The student marks a session as **Skipped**. The agent proposes a rescheduled session, again requiring approval.

---

## 🏗️ Architecture & Tech Stack

**Frontend:**

- **Framework**: Next.js 15 (App Router)
- **UI & Styling**: React 19, Tailwind CSS, Radix UI primitives, shadcn/ui
- **Language**: TypeScript

**Backend & Services:**

- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js v4 (Role-based: Student, Teacher, Admin)
- **AI Integration**: OpenRouter / OpenAI API for tool-calling LLM orchestration

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v9 or higher

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/ansh-10-p/CODEKNIGHT_ARC.git
   cd CODEKNIGHT_ARC
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Set Up Environment Variables**

   ```bash
   cp .env.example .env.local
   ```

   _Note: Fill in the required placeholder variables in `.env.local`._

4. **Seed the Database**

   ```bash
   npm run seed:demo
   ```

   _This populates the required demo student, mock timetable, and assignments._

5. **Start the Development Server**
   ```bash
   pnpm dev
   ```
   The application will be available at `http://localhost:3000`.

---
