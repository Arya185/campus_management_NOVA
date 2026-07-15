import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import { 
  StudentModel, 
  CareerRoadmapModel, 
  ResearchNoteModel, 
  ProjectModel,
  NoteModel,
  FlashcardDeckModel,
  QuizAttemptModel
} from "../lib/models";

async function seedAgentData() {
  await connectToDatabase();

  console.log("Starting agent data seeding...");

  // Get a sample student
  const student = await StudentModel.findOne();
  if (!student) {
    console.log("No student found. Please seed base data first.");
    return;
  }

  const studentId = student._id;

  // Clear existing agent data
  await CareerRoadmapModel.deleteMany({ studentId });
  await ResearchNoteModel.deleteMany({ studentId });
  await ProjectModel.deleteMany({ studentId });
  await NoteModel.deleteMany({ studentId });
  await FlashcardDeckModel.deleteMany({ studentId });
  await QuizAttemptModel.deleteMany({ studentId });

  console.log("Cleared existing agent data");

  // Seed Career Roadmap
  const careerRoadmap = await CareerRoadmapModel.create({
    studentId,
    targetRole: "Full Stack Developer",
    milestones: [
      {
        title: "Learn React and TypeScript",
        description: "Complete React and TypeScript courses",
        targetDate: "2024-03-01",
        status: "planned"
      },
      {
        title: "Build Portfolio Projects",
        description: "Create 3-4 portfolio projects",
        targetDate: "2024-06-01",
        status: "planned"
      },
      {
        title: "Apply for Internships",
        description: "Apply to 10+ companies",
        targetDate: "2024-08-01",
        status: "planned"
      }
    ],
    rationale: "Based on student's interest in web development and current skill set",
    status: "pending"
  });
  console.log("Created career roadmap");

  // Seed Research Notes
  const researchNote = await ResearchNoteModel.create({
    studentId,
    topic: "Machine Learning Fundamentals",
    content: "Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data. Key concepts include supervised learning, unsupervised learning, and reinforcement learning.",
    sources: [
      { title: "Introduction to ML", url: "https://example.com/ml-intro", summary: "Comprehensive ML overview" },
      { title: "ML Algorithms Guide", url: "https://example.com/ml-algorithms", summary: "Common ML algorithms explained" }
    ],
    tags: ["machine learning", "AI", "data science"]
  });
  console.log("Created research note");

  // Seed Project
  const project = await ProjectModel.create({
    studentId,
    title: "E-Commerce Platform",
    description: "A full-stack e-commerce platform with user authentication, product catalog, and payment integration",
    domain: "Web Development",
    status: "in_progress",
    technologies: ["React", "Node.js", "MongoDB", "Stripe"],
    milestones: [
      {
        title: "Design Database Schema",
        description: "Create MongoDB schemas for users, products, and orders",
        targetDate: "2024-02-15",
        status: "done"
      },
      {
        title: "Build User Authentication",
        description: "Implement login, registration, and password reset",
        targetDate: "2024-03-01",
        status: "in_progress"
      },
      {
        title: "Develop Product Catalog",
        description: "Create product listing and detail pages",
        targetDate: "2024-04-01",
        status: "planned"
      }
    ],
    mentorFeedback: ["Good progress on database design", "Focus on security for authentication"]
  });
  console.log("Created project");

  // Seed Note
  const note = await NoteModel.create({
    studentId,
    title: "Data Structures Study Notes",
    content: "Arrays, linked lists, stacks, queues, trees, and graphs are fundamental data structures. Understanding their time complexity is crucial for efficient algorithm design.",
    category: "lecture",
    tags: ["data structures", "algorithms", "CS"]
  });
  console.log("Created note");

  // Seed Flashcard Deck
  const flashcardDeck = await FlashcardDeckModel.create({
    studentId,
    title: "JavaScript Basics",
    subject: "Programming",
    cards: [
      { front: "What is a closure in JavaScript?", back: "A closure is a function that has access to variables from its outer scope even after the outer function has returned." },
      { front: "What is the difference between == and ===?", back: "== checks for value equality with type coercion, while === checks for both value and type equality." },
      { front: "What is the purpose of the 'this' keyword?", back: "'this' refers to the object that is currently executing the function. Its value depends on how the function is called." }
    ]
  });
  console.log("Created flashcard deck");

  // Seed Quiz Attempt
  const quizAttempt = await QuizAttemptModel.create({
    studentId,
    deckId: flashcardDeck._id,
    score: 80,
    totalQuestions: 3,
    correctAnswers: 2
  });
  console.log("Created quiz attempt");

  console.log("Agent data seeding completed successfully!");
  console.log(`\nSummary:
- Career Roadmaps: 1
- Research Notes: 1
- Projects: 1
- Notes: 1
- Flashcard Decks: 1
- Quiz Attempts: 1`);
}

seedAgentData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
