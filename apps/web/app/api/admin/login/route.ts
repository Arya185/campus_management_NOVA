import { NextResponse } from "next/server"

const adminUsers = [
  {
    username: "ADMIN1",
    password: "Admin@123",
    id: "admin1",
    name: "Campus Admin",
    role: "admin",
  },
]

export async function POST(req: Request) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 })
  }

  const admin = adminUsers.find(
    (user) =>
      user.username.toLowerCase() === String(username).toLowerCase() &&
      user.password === password,
  )

  if (!admin) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 })
  }

  return NextResponse.json({
    id: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
  })
}
