import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    await deleteSession();

    return NextResponse.json({
      success: true,
      message: "Вы вышли из аккаунта.",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Не удалось выйти из аккаунта.",
      },
      { status: 500 }
    );
  }
}