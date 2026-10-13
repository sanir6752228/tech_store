"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const accessError = searchParams.get("error") === "access";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(
          loginData.message || "Неверный email или пароль"
        );
      }

      // Проверяем, действительно ли пользователь ADMIN
      const meResponse = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const meData = await meResponse.json();

      if (!meResponse.ok || meData.user?.role !== "ADMIN") {
        // Если это обычный пользователь — сразу выходим
        await fetch("/api/auth/logout", {
          method: "POST",
        });

        throw new Error(
          "У этого аккаунта нет прав администратора."
        );
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось выполнить вход"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f5]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* Левая часть */}
        <section className="relative hidden overflow-hidden bg-[#07100b] lg:flex">
          <div className="absolute inset-0">
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-green-500/20 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-green-400/10 blur-3xl" />
          </div>

          <div className="relative flex w-full flex-col justify-between p-12 text-white xl:p-16">
            <Link
              href="/"
              className="w-fit text-2xl font-black tracking-tight"
            >
              TECH<span className="text-green-400">STORE</span>
            </Link>

            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-sm font-bold text-green-300">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                ADMIN PANEL
              </div>

              <h1 className="max-w-xl text-5xl font-black leading-tight xl:text-6xl">
                Управляйте магазином
                <span className="text-green-400"> в одном месте.</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-gray-400">
                Товары, заказы, ремонты, пользователи и
                статистика TECHSTORE.
              </p>
            </div>

            <div className="text-sm text-gray-600">
              TECHSTORE Administration
            </div>
          </div>
        </section>

        {/* Правая часть */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            <div className="mb-10 lg:hidden">
              <Link
                href="/"
                className="text-2xl font-black tracking-tight text-gray-900"
              >
                TECH<span className="text-green-600">STORE</span>
              </Link>
            </div>

            <div className="mb-8">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-2xl shadow-lg">
                🔐
              </div>

              <h2 className="text-4xl font-black tracking-tight text-gray-900">
                Вход в админку
              </h2>

              <p className="mt-3 text-gray-500">
                Войдите с аккаунтом администратора TECHSTORE.
              </p>
            </div>

            {accessError && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                У этого аккаунта нет прав администратора.
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Пароль
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Введите пароль"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-2xl bg-green-500 px-5 py-4 text-base font-black text-black shadow-lg shadow-green-500/20 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Проверяем..." : "Войти в админку →"}
              </button>
            </form>

            <div className="mt-8 border-t border-gray-200 pt-6 text-center">
              <Link
                href="/"
                className="text-sm font-bold text-gray-500 transition hover:text-green-600"
              >
                ← Вернуться в магазин
              </Link>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}