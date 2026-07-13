import { NextResponse } from "next/server"
import { findUserByCredentials } from "@/lib/auth-middleware"

export async function POST(req: Request) {
  const { email, password, role } = await req.json()

  if (!email || !password || !role) {
    return NextResponse.json({ error: "Email, password and role are required." }, { status: 400 })
  }

  const user = findUserByCredentials(email, password, role)

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
}
