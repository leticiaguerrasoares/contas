import { NextRequest, NextResponse } from "next/server"
import { validatePassword, signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 })
    }

    if (!validatePassword(password)) {
      // Delay para evitar timing attacks
      await new Promise((resolve) => setTimeout(resolve, 500))
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
    }

    const token = await signToken({ authenticated: true, iat: Date.now() })

    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
