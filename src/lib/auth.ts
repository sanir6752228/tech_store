import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "techstore_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET не найден в .env.local");
  }

  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

export async function createSession(user: {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}) {
  const token = await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(
      token,
      getSecretKey()
    );

    if (
      typeof payload.id !== "number" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "USER" && payload.role !== "ADMIN")
    ) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: sessionUser.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}