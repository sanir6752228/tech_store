import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    const phone = String(body.phone ?? "").trim();

    const password = String(body.password ?? "");

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Введите имя.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Введите email.",
        },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          error: "Введите корректный email.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Пароль должен содержать минимум 6 символов.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Пользователь с таким email уже зарегистрирован.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "USER",
      },
    });

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Регистрация прошла успешно.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Не удалось зарегистрировать пользователя.",
      },
      { status: 500 }
    );
  }
}