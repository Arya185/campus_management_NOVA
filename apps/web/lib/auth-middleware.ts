// Helper function to get current user from localStorage (client-side)
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
 
type AuthUser = {
  id: string
  email: string
  password?: string
  role: "student" | "teacher" | "admin"
  name: string
  firstName?: string
  lastName?: string
  studentId?: string
}
 
const authUsers: AuthUser[] = [
  {
    id: "student1",
    email: "rahul.sharma@student.edu",
    password: "Password@123",
    role: "student",
    name: "Rahul Sharma",
  },
  {
    id: "teacher1",
    email: "jane.doe@teacher.edu",
    password: "Password@123",
    role: "teacher",
    name: "Jane Doe",
  },
  {
    id: "admin1",
    email: "admin@campus.edu",
    password: "Password@123",
    role: "admin",
    name: "Campus Admin",
  },
]
 
export function findUserByCredentials(
  email: string,
  password: string,
  role: string,
) {
  return authUsers.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password &&
      user.role === role,
  )
}
 
// ── Extend next-auth types ────────────────────────────────────────────────────
// (If you have a types/next-auth.d.ts file, you can move these there instead)
declare module "next-auth" {
  interface User {
    id: string
    role?: string
    firstName?: string
    lastName?: string
    studentId?: string
  }
  interface Session {
    user: {
      id: string
      role?: string
      name?: string | null
      email?: string | null
      image?: string | null
      firstName?: string
      lastName?: string
      studentId?: string
    }
  }
}
 
declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
    firstName?: string
    lastName?: string
    studentId?: string
  }
}
 
// ─── authOptions ──────────────────────────────────────────────────────────────
import { connectToDatabase } from "./db"
import { StudentModel, TeacherModel } from "./models"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
        role:     { label: "Role",     type: "text"     },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          return null
        }

        await connectToDatabase()

        if (credentials.role === "student") {
          const student = await StudentModel.findOne({ email: credentials.email.toLowerCase() })
          if (!student || student.password !== credentials.password) {
            return null
          }
          return {
            id: student._id.toString(),
            email: student.email,
            name: `${student.firstName} ${student.lastName}`,
            firstName: student.firstName,
            lastName: student.lastName,
            role: "student",
            studentId: student.studentId
          }
        } else if (credentials.role === "teacher") {
          const teacher = await TeacherModel.findOne({ email: credentials.email.toLowerCase() })
          if (!teacher || teacher.password !== credentials.password) {
            // fallback to mock for demo purposes if teacher not in DB
            return findUserByCredentials(credentials.email, credentials.password, credentials.role) ?? null
          }
          return {
            id: teacher._id.toString(),
            email: teacher.email,
            name: `${teacher.firstName} ${teacher.lastName}`,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            role: "teacher"
          }
        }

        return findUserByCredentials(
          credentials.email,
          credentials.password,
          credentials.role,
        ) ?? null
      },
    }),
  ],
 
  session: { strategy: "jwt" },
 
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as { role?: string }).role
        token.firstName = (user as { firstName?: string }).firstName
        token.lastName = (user as { lastName?: string }).lastName
        token.studentId = (user as { studentId?: string }).studentId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id   as string
        session.user.role = token.role as string | undefined
        session.user.firstName = token.firstName as string | undefined
        session.user.lastName = token.lastName as string | undefined
        session.user.studentId = token.studentId as string | undefined
      }
      return session
    },
  },
 
  pages: {
    signIn: "/login",
  },
 
  secret: process.env.NEXTAUTH_SECRET || "dev-secret",
}