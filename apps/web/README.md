# NOVA - Agentic AI Learning & Academic Success Platform

NOVA gives every student a personal **Academic Success Agent** that reads their real timetable, attendance, assignments, and workload; creates an adaptive plan; asks for approval before changing anything; and learns from completed or missed sessions to improve the next plan.

The platform has evolved into a comprehensive multi-agent system with specialized AI agents for various academic and career needs.

---

## 🎯 Overview

NOVA is an intelligent educational AI platform centered on multiple specialized AI agents that reason over real academic data and help students succeed through structured planning, reflection, and adaptation.

**Key Features:**
- **Academic Success Agent**: Personalized study planning with approval workflow
- **Career Roadmap Agent**: Career guidance and milestone planning
- **Interview Practice Agent**: AI-powered interview preparation
- **Research Assistant**: Research source discovery and note management
- **Project Mentor Agent**: Project planning and milestone tracking
- **Note Summarization**: AI-powered note summarization
- **Flashcard & Quiz System**: Automated flashcard generation and quiz tracking
- **Teacher Copilot**: Classroom insights and student analytics
- **Multi-Agent Orchestrator**: Intelligent routing to appropriate agents
- **AI Governance Dashboard**: Comprehensive audit logging and monitoring

---

## 🤖 AI Agents

### Academic Success Agent
The flagship agent that demonstrates a complete, grounded, agentic loop:

1. **Understand Goal**: The student provides a natural language goal (e.g., "Plan my exam week").
2. **Read Real App State**: The agent uses deterministic **Read Tools** to pull the student's live timetable, attendance risk, and upcoming assignment deadlines from the database.
3. **Plan**: The agent reasons over the data to formulate a structured study plan with specific sessions.
4. **Propose Action**: The agent calls a **Write Tool** (`proposeStudyPlan`) which persists the plan and creates an `AgentAction` record.
5. **Ask Approval**: The agent **does not automatically activate changes**. The plan is presented in a `pending_approval` state.
6. **Act**: The user reviews the plan and clicks "Approve". Only then does the backend apply the mutation.
7. **Observe & Adapt**: The student marks sessions as "Completed" or "Skipped". If a session is skipped, the agent proposes a rescheduled session.

### Career Roadmap Agent
Helps students plan their career paths with actionable milestones:
- Analyzes student profile and academic history
- Proposes career roadmaps with specific milestones
- Tracks progress on career goals
- Provides rationale for career recommendations

### Interview Practice Agent
AI-powered interview preparation system:
- Generates interview questions for specific roles
- Provides AI feedback on answers
- Tracks interview session history
- Supports multiple interview rounds

### Research Assistant
Helps students research topics and organize findings:
- Suggests research sources for given topics
- Saves research notes with sources and tags
- Organizes research by topic
- Supports note summarization

### Project Mentor Agent
Guides students through project development:
- Creates project plans with milestones
- Tracks project progress
- Provides milestone updates
- Supports technology stack recommendations

### Teacher Copilot
Provides teachers with classroom insights:
- Lists students in their class
- Provides attendance summaries
- Shows performance analytics
- Offers individual student details

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
- **ML Integration**: Flask-based performance prediction service

**Key Libraries:**
- **Agent Orchestration**: Custom multi-agent routing system
- **Audit Logging**: Comprehensive agent activity tracking
- **Analytics**: Aggregation queries for teacher and institution insights

---

## 📊 Data Models

### Core Models
- **Student**: Student profile with academic details
- **Teacher**: Teacher profile with department info
- **Admin**: Admin user management
- **Timetable**: Class scheduling
- **Attendance**: Attendance tracking
- **Assignment**: Assignment management
- **ExamResult**: Academic performance records

### Agent-Specific Models
- **StudyPlan**: Study session planning
- **AgentAction**: Agent approval workflow
- **AgentAuditLog**: Comprehensive audit logging
- **CareerRoadmap**: Career milestone tracking
- **ResearchNote**: Research note management
- **Project**: Project planning and tracking
- **Note**: General note taking with summarization
- **FlashcardDeck**: Flashcard collections
- **QuizAttempt**: Quiz performance tracking
- **InterviewSession**: Interview practice sessions

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18 or higher
- **pnpm**: v9 or higher
- **MongoDB**: Running instance
- **OpenRouter API Key**: For AI agent functionality

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ansh-10-p/CODEKNIGHT_NOVA.git
   cd CODEKNIGHT_NOVA
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   Required variables:
   - `MONGODB_URI`: MongoDB connection string
   - `OPENROUTER_API_KEY`: OpenRouter API key for AI agents
   - `OPENROUTER_API_BASE`: OpenRouter API base URL (default: https://openrouter.ai/api/v1)
   - `OPENROUTER_MODEL`: Model to use (default: openai/gpt-4o-mini)
   - `NEXTAUTH_SECRET`: NextAuth secret key
   - `NEXTAUTH_URL`: NextAuth URL

4. **Seed the Database**
   ```bash
   npm run seed:demo
   ```

5. **Start the Development Server**
   ```bash
   pnpm dev
   ```
   The application will be available at `http://localhost:3000`.

---

## 📁 Project Structure

```
apps/web/
├── app/
│   ├── api/
│   │   ├── student/
│   │   │   ├── agent/           # Academic Success Agent API
│   │   │   ├── career-agent/     # Career Roadmap Agent API
│   │   │   ├── interview-agent/  # Interview Practice Agent API
│   │   │   ├── research-agent/   # Research Assistant API
│   │   │   ├── project-agent/    # Project Mentor Agent API
│   │   │   ├── notes/            # Note CRUD API
│   │   │   └── orchestrator/     # Multi-Agent Orchestrator API
│   │   ├── teacher/
│   │   │   ├── copilot/          # Teacher Copilot API
│   │   │   └── analytics/        # Teacher Analytics API
│   │   └── admin/
│   │       ├── analytics/        # Institution Analytics API
│   │       └── audit-logs/       # AI Governance API
│   ├── student/
│   │   ├── agent/               # Academic Success Agent UI
│   │   ├── career/              # Career Roadmap Agent UI
│   │   ├── interview-practice/  # Interview Practice Agent UI
│   │   ├── project-mentor/      # Project Mentor Agent UI
│   │   └── dashboard/           # Student Dashboard
│   ├── teacher/
│   │   ├── copilot/             # Teacher Copilot UI
│   │   └── dashboard/           # Teacher Dashboard
│   └── admin/
│       ├── ai-governance/       # AI Governance Dashboard
│       └── dashboard/           # Admin Dashboard
├── lib/
│   ├── academic-agent.ts        # Academic Success Agent orchestration
│   ├── career-agent.ts          # Career Roadmap Agent orchestration
│   ├── research-agent.ts        # Research Assistant orchestration
│   ├── project-agent.ts         # Project Mentor Agent orchestration
│   ├── orchestrator.ts          # Multi-Agent Orchestrator
│   ├── agent-tools.ts           # Agent tool functions
│   ├── agent-memory.ts          # Agent memory management
│   ├── teacher-analytics.ts     # Teacher analytics queries
│   ├── admin-analytics.ts       # Institution analytics queries
│   └── models.ts               # Mongoose schemas
└── ml-api/                      # Flask ML service
    └── api/
        └── routes.py            # Performance prediction endpoints
```

---

## 🔐 Authentication & Authorization

The platform uses NextAuth.js v4 with role-based access control:

- **Students**: Access to student-specific agents and features
- **Teachers**: Access to classroom insights and student analytics
- **Admins**: Access to institution-wide analytics and AI governance

All API routes are protected with session-based authentication and role checks.

---

## 📈 Analytics & Insights

### Teacher Analytics
- Class attendance summaries
- Student performance tracking
- Assignment completion rates
- Monthly trends and patterns

### Institution Analytics
- Student enrollment by branch/year
- Teacher distribution
- Overall attendance and performance metrics
- Branch-specific analytics

### AI Governance
- Comprehensive agent activity logging
- Tool call tracking
- Error monitoring
- Agent performance metrics

---

## 🧪 Testing

Run the test suite:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm test:watch
```

---

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI agents | Yes |
| `OPENROUTER_API_BASE` | OpenRouter API base URL | No |
| `OPENROUTER_MODEL` | Model to use for AI agents | No |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `NEXTAUTH_URL` | NextAuth URL | Yes |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

Built with modern web technologies and AI capabilities to enhance educational experiences.
