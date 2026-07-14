import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "./db";
import { AdminModel, StudentModel, TeacherModel } from "./models";

const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();

if (!nextAuthSecret) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable.");
}

type SessionRole = "student" | "teacher" | "admin";

type AuthorizedUser = {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  username?: string;
};

declare module "next-auth" {
  interface User {
    id: string;
    _id?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    studentId?: string;
    username?: string;
  }

  interface Session {
    user: {
      id: string;
      _id?: string;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      firstName?: string;
      lastName?: string;
      studentId?: string;
      username?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    _id?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    studentId?: string;
    username?: string;
  }
}

async function authorizeStudent(
  email: string,
  password: string,
): Promise<AuthorizedUser | null> {
  const student = await StudentModel.findOne({ email: email.toLowerCase() });
  if (!student) {
    return null;
  }

  const isValid = await bcrypt.compare(password, student.password);
  if (!isValid) {
    return null;
  }

  return {
    id: student._id.toString(),
    email: student.email,
    name: `${student.firstName} ${student.lastName}`,
    firstName: student.firstName,
    lastName: student.lastName,
    role: "student",
    studentId: student.studentId,
  };
}

async function authorizeTeacher(
  email: string,
  password: string,
): Promise<AuthorizedUser | null> {
  const teacher = await TeacherModel.findOne({ email: email.toLowerCase() });
  if (!teacher) {
    return null;
  }

  const isValid = await bcrypt.compare(password, teacher.password);
  if (!isValid) {
    return null;
  }

  return {
    id: teacher._id.toString(),
    email: teacher.email,
    name: `${teacher.firstName} ${teacher.lastName}`,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    role: "teacher",
  };
}

async function authorizeAdmin(
  emailOrUsername: string,
  password: string,
): Promise<AuthorizedUser | null> {
  const normalized = emailOrUsername.toLowerCase();
  const admin = await AdminModel.findOne({
    $or: [
      { email: normalized },
      { username: { $regex: `^${emailOrUsername.trim()}$`, $options: "i" } },
    ],
  });

  if (!admin) {
    return null;
  }

  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) {
    return null;
  }

  return {
    id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: "admin",
    username: admin.username,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          return null;
        }

        await connectToDatabase();

        if (credentials.role === "student") {
          return authorizeStudent(credentials.email, credentials.password);
        }

        if (credentials.role === "teacher") {
          return authorizeTeacher(credentials.email, credentials.password);
        }

        if (credentials.role === "admin") {
          return authorizeAdmin(credentials.email, credentials.password);
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token._id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.studentId = user.studentId;
        token.username = user.username;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user._id = token.id;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.studentId = token.studentId;
        session.user.username = token.username;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: nextAuthSecret,
};
