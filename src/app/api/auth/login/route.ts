import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Введите email и пароль.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Неверный email или пароль.",
        },
        { status: 401 }
      );
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          success: false,
          error: "Неверный email или пароль.",
        },
        { status: 401 }
      );
    }

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      message: "Вход выполнен.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Не удалось выполнить вход.",
      },
      { status: 500 }
    );
  }
}